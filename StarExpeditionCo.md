# GDD — Star Expedition Co.

> Documento da **versão 1.0 de lançamento** (Google Play). Os termos canônicos (em inglês) estão no [glossário](contexts/star-expedition-co/CONTEXT.md); a decisão de não ter backend está no [ADR 0001](contexts/star-expedition-co/docs/adr/0001-sem-backend-auto-backup.md). Valores marcados como **valor inicial** são o ponto de partida do balanceamento e devem ser ajustados no teste fechado (§13.7).

**Gênero:** gerenciamento de equipe com resolução idle · **Plataforma:** Android (Google Play) · **Orientação:** retrato · **Idiomas:** Português (Brasil) e Inglês · **Engine:** Unity 6 LTS

## Índice

**Parte 1 — GDD**
1. [Visão Geral](#1-visão-geral)
2. [Loop Principal](#2-loop-principal)
3. [Tripulação](#3-tripulação)
4. [Galaxies, Planets e Expeditions](#4-galaxies-planets-e-expeditions)
5. [Items e Loot](#5-items-e-loot)
6. [Crafting e Equipment](#6-crafting-e-equipment)
7. [Economia](#7-economia)
8. [Cycles (progressão sem fim)](#8-cycles-progressão-sem-fim)
9. [Tutorial](#9-tutorial)
10. [Arte e Apresentação](#10-arte-e-apresentação)
11. [Interface](#11-interface)
12. [Áudio](#12-áudio)
13. [Monetização, Plataforma e Serviços](#13-monetização-plataforma-e-serviços)
14. [Página da Loja e Política de Privacidade](#14-página-da-loja-e-política-de-privacidade)
15. [Escopo da 1.0 e Pós-Lançamento](#15-escopo-da-10-e-pós-lançamento)
16. [Balanceamento v1](#16-balanceamento-v1)
17. [Em aberto](#17-em-aberto)

**Parte 2 — Guia de Implementação Unity**
- [18. Convenções, mapa de sistemas e fases](#18-guia-de-implementação-unity-versão-10)
- Fases 0 a 15 (setup → publicação)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Pitch:** você comanda uma pequena companhia de expedições espaciais. Monte a Squad certa para o Risk certo, mande-a a um Planet e espere o timer real — com o app fechado, se quiser. O Loot vira Equipment na Oficina, ou Credits na Loja, que contratam mais Crew Members. Quando a última Galaxy cai, começa um Cycle novo, mais perigoso e mais rico.
- **Pilar de design:** **toda decisão acontece antes da espera.** Quem mandar, para onde e com qual Equipment. Durante o timer não há interação; o que resta é a expectativa.
- **Fantasia central:** uma operação de garagem que cresce até virar uma potência tecnológica — e que sente cada Crew Member que não volta.
- **Referência:** *RPG Merchant* (escolher configuração → confirmar → esperar resultado).
- **Definido:** nome final **Star Expedition Co.**; package `com.manguebytegames.starexpeditionco` (não pode mudar depois de publicado).
- **Definido:** só **Android** na 1.0, em **retrato**, com **pt-BR e inglês**.
- **Definido:** o jogo é quase todo UI: não há cena jogável em tempo real. A tela principal é o **mapa da Galaxy**, navegável, com os Planets posicionados espacialmente.

## 2. Loop Principal

1. **Montar a Squad:** escolher de 1 a 3 Crew Members livres do Roster.
2. **Escolher o Planet:** entre os já desbloqueados no Cycle atual.
3. **Enviar a Expedition:** a Squad fica ocupada; o timer real começa.
4. **Esperar:** o timer corre também com o app fechado; uma notificação avisa quando termina.
5. **Claim:** o jogador abre a Expedition concluída. O resultado é **Success** (Loot) ou **Failure** (nada, com chance de Member Loss). O Claim libera o próximo Planet.
6. **Usar o Loot:** craftar Equipment na Oficina e equipá-lo, ou vender Items por Credits.
7. **Contratar** novos Crew Members com Credits.
8. Repetir, com Squads maiores e mais equipadas, até o último Planet — e então começar um **Cycle** novo (§8).

- **Definido:** **várias Expeditions simultâneas**, uma por Planet. Nunca duas no mesmo Planet ao mesmo tempo. O limite prático é o tamanho do Roster.
- **Definido:** o resultado é **binário** e é sorteado **no Claim**, com uma semente fixada no envio (fechar o app antes do Claim não muda o resultado).
- **Definido:** o resultado mostra uma **lista seca** de Items obtidos (sem relato narrativo).

## 3. Tripulação

### 3.1 Crew Classes

**Definido:** 6 Crew Classes, cada uma com um bônus próprio (valores na §16.1):

| Crew Class (pt-BR / en) | Bônus |
|---|---|
| Batedor / **Scout** | + chance de Success |
| Engenheiro / **Engineer** | + quantidade de Loot |
| Cientista / **Scientist** | + chance de Rare Item |
| Guarda / **Guard** | − Risk efetivo |
| Médico / **Medic** | − chance de Member Loss |
| Piloto / **Pilot** | − duração da Expedition |

- Bônus de vários membros **se somam**. Bônus de Equipment também.
- **Definido:** uma Squad tem **de 1 a 3** Crew Members. O limite não cresce.

### 3.2 Crew Members

- **Definido:** cada Crew Member tem **nome próprio** (sorteado de uma lista neutra, igual em pt/en), uma de **3 variações visuais** da sua Crew Class e **um slot de Equipment**.
- **Definido:** sem nível ou XP. O Crew Member evolui só pelo Equipment.
- **Definido:** um Crew Member em Expedition não pode trocar de Equipment.

### 3.3 Starter Pick

**Definido:** o jogo começa com o **Starter Pick**: o jogador escolhe **1 Crew Member grátis** entre **Scout, Engineer e Guard** (as três classes que funcionam sozinhas). Começa com **0 Credits**. As outras classes são contratadas depois (§7).

### 3.4 Member Loss

- **Definido:** numa Failure, há chance de **Member Loss**: um Crew Member da Squad, sorteado, **não volta**. O Equipment dele se perde junto.
- A chance cresce com o Risk e cai com Medic e Equipment de sobrevivência (fórmula na §16.2).
- **Definido:** o texto do jogo nunca diz "morreu": diz "**<Nome> não voltou.**"

### 3.5 Emergency Recruit

**Definido:** se o Roster ficar **vazio** e os Credits **não pagarem** nenhuma contratação, o jogo dá um **Scout grátis** (o Emergency Recruit), com um aviso. Isso impede o jogo de travar.

## 4. Galaxies, Planets e Expeditions

### 4.1 Estrutura

- **Definido:** **3 Galaxies × 6 Planets = 18 Planets**, em ordem linear.
- **Definido:** o **Claim** de uma Expedition (Success **ou** Failure) no Planet mais avançado libera o próximo. Liberar o 1º Planet de uma Galaxy libera a Galaxy.
- Cada Planet define: **Risk** (0–100), **duração**, **Loot Table** e posição no mapa (tabelas na §16.3).

### 4.2 Duração

**Definido (valor inicial):**

| Galaxy | Duração dos Planets |
|---|---|
| 1 — Cinturão Mangue | 1 a 15 min |
| 2 — Nebulosa Âmbar | 15 a 60 min |
| 3 — Abismo de Vega | 1 a 4 h |

- O **Pilot** e Equipment reduzem a duração em porcentagem, com teto de redução e piso absoluto (§16.2).
- A 1ª Expedition do jogo (tutorial) dura **30 s**.

### 4.3 Resolução

- **Definido:** um único sorteio decide Success ou Failure, com a chance calculada no envio a partir do **Risk efetivo** (Risk do Planet + Risk do Cycle − redução da Squad) e dos bônus da Squad. A chance é mostrada ao jogador **antes** de enviar.
- **Success:** entrega o Loot (§5). Garante pelo menos 1 Item.
- **Failure:** não entrega nada e sorteia o Member Loss.
- Fórmulas completas: §16.2.

### 4.4 Relógio

- **Definido:** o timer usa o relógio do aparelho (sem servidor, ver ADR 0001).
- **Definido:** se o relógio **voltar** (hora atual menor que a última vista), os timers **congelam** até o relógio alcançar a última hora vista, e o topo da tela mostra um aviso. Avançar o relógio não é punido: o jogo é single-player e sem ranking.

## 5. Items e Loot

- **Definido:** 4 categorias de Item: **Raw Material**, **Component**, **Rare Item** (os três vêm do Loot) e **Equipment** (só sai de Recipe).
- **Definido:** 38 Items na 1.0: 8 Raw Materials, 8 Components, 6 Rare Items e 16 Equipments (§16.4).
- **Definido:** a chance de Rare Item **escala com o Risk do Planet** (inclusive o do Cycle) e sobe com o Scientist. Rare Items vêm sempre 1 por vez.
- **Definido:** **Double Loot** (anúncio ou Ad-Free, §13) dobra as quantidades do Loot de um Success.

## 6. Crafting e Equipment

- **Definido:** 16 Recipes em **4 Tech Tiers**, organizadas em 4 linhas de evolução (Scanner, Armadura, Ferramentas, Sobrevivência). Cada Recipe de Tier 2+ consome o Equipment do Tier anterior da mesma linha (§16.5).
- **Definido:** um Tech Tier é liberado ao **alcançar** um Planet específico e **continua liberado** nos Cycles seguintes: Tier 1 no início, Tier 2 na Galaxy 2, Tier 3 na Galaxy 3, Tier 4 no 4º Planet da Galaxy 3.
- **Definido:** Equipment é atribuído a um **Crew Member específico** (um slot por membro). Trocar devolve o anterior ao inventário.
- **Definido:** Equipment pode ser vendido como qualquer Item.

## 7. Economia

- **Definido:** uma única moeda, **Credits** ("Créditos"), obtida **só vendendo Items**. Sem moeda premium.
- **Definido:** **Hire** sempre disponível para as 6 Crew Classes. O preço **cresce com o tamanho do Roster**: `preço = preço base da classe × 1,25^(tamanho do Roster − 1)`, arredondado para múltiplo de 5 (valor inicial). Perder membros barateia a próxima contratação.
- **Definido:** sem loja rotativa de recrutas.

## 8. Cycles (progressão sem fim)

- **Definido:** o jogo **não tem fim**. Após o Claim do último Planet da Galaxy 3, aparece o botão **"Novo Ciclo"**.
- **Definido:** o jogador escolhe quando entrar. Até lá pode continuar jogando o Cycle atual. O botão só funciona **sem Expedition ativa**. Não há volta para um Cycle anterior.
- **Definido — o que passa e o que zera:**

  | Estado | No Novo Ciclo |
  |---|---|
  | Roster (Crew Members) | Mantém |
  | Equipment de cada membro | Mantém |
  | Inventário | Mantém |
  | Credits | Mantém |
  | Tech Tiers liberados | Mantém |
  | Planets/Galaxies desbloqueados | **Zera** (volta ao Planet 1) |

- **Definido:** cada Cycle soma **Risk** a todos os Planets e aumenta o **Loot** e a chance de Rare Item (valores na §16.2). A UI mostra "Ciclo N" no topo.

## 9. Tutorial

**Definido:** tutorial guiado e curto, com seta e uma frase por passo (sem textos longos):

1. **Starter Pick** (escolha de 1 entre 3).
2. Tocar no **Planet 1** (Kora) → selecionar o Crew Member → **Enviar**. A Expedition dura **30 s**.
3. Pedido de **permissão de notificação** com uma frase de contexto ("Quer ser avisado quando sua equipe voltar?").
4. Esperar os 30 s → **Claim**. Essa Expedition é **Success garantido** com Loot fixo: 8 Minério de Ferro + 5 Areia de Sílica.
5. Aba **Oficina** → craftar o **Kit de Coleta**.
6. Aba **Tripulação** → equipar o Kit no Crew Member.
7. Voltar ao **Mapa**: fim do tutorial. Uma bolinha na aba **Loja** aparece na primeira vez em que os Credits pagarem uma contratação.

- **Definido:** o tutorial não pode ser pulado, mas cada passo se completa sozinho se o jogador já tiver feito a ação.

## 10. Arte e Apresentação

### 10.1 Direção de arte

- **Definido:** **pixel art** em clima **retro-futurista corporativo**: painéis de nave cinza-azulados, detalhes em âmbar/laranja e o logotipo da "Co." carimbado na UI, como numa empresa de mineração espacial dos anos 80. Os **Planets** são o ponto de cor saturada do jogo.
- **Definido — paleta base da UI:**

  | Token | Hex | Uso |
  |---|---|---|
  | Slate 900 | `#1B2030` | Fundo das telas |
  | Slate 700 | `#2E3650` | Painéis |
  | Slate 500 | `#4A5578` | Bordas, divisores |
  | Slate 300 | `#8A96B8` | Texto secundário, ícones inativos |
  | Paper | `#E8ECF5` | Texto principal |
  | Amber 500 | `#F2A33A` | Botões primários, Credits, destaques |
  | Amber 300 | `#FFD27A` | Brilho de destaque, hover/pressed |
  | Signal Green | `#5EC46B` | Success, chance alta |
  | Alert Red | `#E0524A` | Failure, Member Loss, Risk alto |
  | Rare Violet | `#B07CFF` | Rare Items |

- Contorno escuro de 1 px (`#0E1018`) em todo sprite; luz vindo de cima à esquerda.

### 10.2 Resolução e grade

- **Definido:** resolução de referência **360×640**, com a UI escalada por **fator inteiro** (3× em 1080 px de largura, 2× em 720 px, 4× em 1440 px). Em telas mais altas, sobra espaço vertical; nada estica.
- **Definido:** grade **64×64** para retratos, **32×32** para ícones de Item e **64×64** para Planets. Painéis 9-slice com bordas em múltiplos de 8 px.
  - *Por que 64×64 nos retratos:* o SpriteCook desenha bustos numa grade de ~80 px; reduzir para 32×32 apaga o rosto, e em 64×64 o retrato continua legível. Os ícones de Item saem direto em ≤ 32 px.
- **Definido:** fonte pixel **Pixel Operator** (licença CC0, com acentuação completa pt-BR), em tamanho 8 px (corpo) e 16 px (títulos).

### 10.3 Animação

**Definido — mínimo:**
- Retratos dos Crew Members com **idle de 4 quadros**.
- **Planets giram** por shader: a superfície é uma textura plana repetível que desliza dentro de uma esfera sombreada (sem animação quadro a quadro).
- Uma **navezinha** orbita o Planet que tem Expedition ativa.
- Transições de UI curtas (deslizar/aparecer, ≤ 0,2 s).

### 10.4 Produção com o SpriteCook

- **Definido:** toda a arte é gerada no **SpriteCook** (app.spritecook.ai), preferencialmente pelo servidor MCP no Claude Code (`npx spritecook-mcp setup`). Uso comercial liberado pelos termos do SpriteCook.
- **Definido:** os arquivos ficam neste repositório em `Sprites/StarExpeditionCo/{Crew,Planets,Items,UI,Backgrounds,Ships,Store}/`, espelhando `Assets/_Project/Art/`, com o nome final `SPR_<Tipo>_<Nome>.png`. Candidatos rejeitados vão para `_candidatos_descartados/`. Os prompts usados ficam em `Sprites/StarExpeditionCo/PROMPTS.md`.
- **Bloco de estilo** (colar em todo prompt):

  ```
  Retro-futuristic corporate sci-fi pixel art, 1980s space-mining company aesthetic.
  Cool slate blue-grey metal with amber/orange accents. Limited palette, 3-4 tones per
  color, light from top-left, crisp 1px dark outline (#0E1018). Clean readable shapes,
  no anti-aliasing, no gradients. Centered, transparent background.
  ```

- A fonte e o áudio **não** vêm do SpriteCook (§10.2 e §12).

### 10.5 Catálogo de assets

| Grupo | Arquivo | Tamanho | Qtd. | Observação |
|---|---|---|---|---|
| Crew | `SPR_Crew_<Class>_<V>` (ex.: `SPR_Crew_Scout_1`) | folha 256×64 (4 quadros de 64×64) | 18 | 6 classes × 3 variações; busto de frente; idle de 4 quadros (respirar/piscar) |
| Planets | `SPR_Planet_<Id>_Surface` | 128×64, repetível na horizontal | 18 | Mapa plano da superfície (equiretangular); o shader faz a esfera |
| Items | `SPR_Item_<Id>` | 32×32 | 38 | Ícone de inventário; Rare Items com brilho violeta; Equipment com moldura âmbar de 1 px |
| Backgrounds | `SPR_Bg_Galaxy<N>` | 360×960 | 3 | Campo estelar/nebulosa com a cor da Galaxy (1 verde-mangue, 2 âmbar, 3 roxo-escuro); rola na vertical |
| Ships | `SPR_Ship_Scout` | 16×16 | 1 | Navezinha que orbita o Planet ativo |
| UI | `SPR_UI_Panel` | 48×48 (9-slice, borda 16) | 1 | Painel de metal Slate 700 com rebites |
| UI | `SPR_UI_Button_{Primary,Secondary}_{Normal,Pressed,Disabled}` | 48×24 (9-slice, borda 8) | 6 | Âmbar (primário) e Slate (secundário). Só o `Normal` vem do SpriteCook; `Pressed` (1 px abaixo, face 20% mais escura) e `Disabled` (dessaturado rumo ao Slate 500) são derivados por script, para os três estados terem borda 9-slice idêntica |
| UI | `SPR_UI_TabBar`, `SPR_UI_TopBar` | 360×48, 360×32 | 2 | Barras de metal |
| UI | `SPR_UI_Icon_{Map,Crew,Workshop,Shop}` | 24×24 | 4 | Ícones das abas |
| UI | `SPR_UI_Icon_{Credits,Risk,Timer,Lock,Check,Close,Settings,Ad,Cycle,Alert,Success,Loss}` | 16×16 | 12 | Ícones de interface |
| UI | `SPR_UI_Logo` | 256×96 | 1 | "STAR EXPEDITION CO." em letreiro de companhia |
| UI | `SPR_UI_Arrow` | 16×16 | 1 | Seta do tutorial |
| Store | `SPR_Store_Icon` | 64×64 → 512×512 (8×) | 1 | Ícone do app: logo "SE" com um Planet |
| Store | `SPR_Store_Feature` | 256×125 → 1024×500 (4×) | 1 | Feature graphic da Play Store |

- **Retratos:** o prompt de cada Crew Class está na §16.1 (coluna "Visual"). As 3 variações mudam tom de pele, cabelo e acessório, mantendo a cor da classe no uniforme.
- **Superfícies:** o prompt de cada Planet está na §16.3 (coluna "Visual"). Pedir "seamless horizontally tileable planet surface texture map".
- **Items:** o prompt de cada Item está na §16.4 (coluna "Visual").
- Total: **~110 imagens**. No plano grátis (40 créditos/mês), a produção levaria meses; conte com **um mês de plano pago** durante a produção.

## 11. Interface

### 11.1 Navegação

**Definido:** uma **barra de abas fixa embaixo** e uma **barra de topo** fixa:

```
┌──────────────────────────────┐
│ ⚙  Ciclo 2      ◎ 1.250 Créd.│  ← TopBar (Settings, Cycle, Credits, aviso de relógio)
├──────────────────────────────┤
│                              │
│        conteúdo da aba       │
│  (painéis abrem por baixo,   │
│   como "bottom sheets")      │
│                              │
├──────────────────────────────┤
│  Mapa │ Tripul. │ Oficina │ Loja │  ← TabBar
└──────────────────────────────┘
```

- O botão **voltar** do Android fecha o painel aberto; sem painel, volta para a aba Mapa; no Mapa, pergunta se quer sair.

### 11.2 Telas

- **Mapa** (aba padrão): fundo da Galaxy, Planets posicionados, setas para trocar de Galaxy (só as liberadas). Cada Planet mostra nome, cadeado se bloqueado, o timer se houver Expedition, e "!" quando dá para fazer o Claim. Banner "Novo Ciclo" quando disponível.
- **Painel do Planet** (abre ao tocar num Planet):
  - Sem Expedition: Risk, duração, ícones do Loot possível, lista de Crew Members livres para marcar (1 a 3), **chance de Success**, **chance de Member Loss na Failure** e **duração final**, botão **Enviar**.
  - Com Expedition: a Squad e o tempo restante; quando concluída, botão **Claim** ("Abrir resultado").
- **Resultado:** Success → lista de Items com quantidades e botão **"Dobrar (anúncio)"** (ou selo "Dobrado — Ad-Free"). Failure → "A expedição falhou" e, se houver, "**<Nome> não voltou.**"
- **Tripulação:** cartões dos Crew Members (retrato, nome, classe, Equipment, estado "Em expedição: <Planet>"). Tocar abre o painel do membro, com os Equipments do inventário para equipar/desequipar.
- **Oficina:** abas por Tech Tier (bloqueados mostram "Libera em <Planet>"); cartões de Recipe com os Items exigidos (tem/precisa), o Equipment resultante e seu bônus; botão **Craftar**.
- **Loja:** três seções — **Vender** (inventário com preço unitário; vender 1 / vender tudo), **Contratar** (6 cartões com o preço atual), **Ofertas** (Ad-Free, Founder Pack).
- **Settings** (engrenagem do topo): volume de música e efeitos, idioma, notificações on/off, **Opções de privacidade** (formulário do UMP, quando exigido), link da política de privacidade, versão do jogo.
- **Starter Pick:** tela cheia na primeira abertura, com 3 cartões.

## 12. Áudio

- **Definido:** trilha ambiente espacial, calma, que reforça a expectativa da espera.
- **Definido:** eventos sonoros da 1.0: toque de botão, trocar de aba, abrir/fechar painel, enviar Expedition, Expedition concluída (com o app aberto), Claim com Success, Claim com Failure, Member Loss, Rare Item obtido, craftar, equipar, vender, contratar, Novo Ciclo, compra concluída.
- **Em aberto:** fonte das músicas e dos efeitos (o usuário vai pesquisar bibliotecas; o SpriteCook não gera áudio). O código já nasce com um evento por som (Fase 13), e os arquivos entram quando forem escolhidos.

## 13. Monetização, Plataforma e Serviços

### 13.1 Anúncios

- **Definido:** **um único anúncio recompensado: Double Loot**, oferecido na tela de Resultado de um Success. Assistir até o fim dobra o Loot daquele Claim.
- **Definido:** sem anúncios intersticiais nem banners.
- O botão só aparece com anúncio carregado. Se falhar ou for fechado antes do fim, nada acontece.
- **Definido:** provedor **Google AdMob** (plugin Google Mobile Ads para Unity).

### 13.2 Compras no app

**Definido:** duas compras **não consumíveis**, cada uma comprável **uma vez, a qualquer momento**:

| Produto | ID | Preço (valor inicial) | Conteúdo |
|---|---|---|---|
| **Ad-Free** | `ad_free` | R$ 14,90 / US$ 2,99 | Todo Success sai com **Double Loot** automático, sem anúncio |
| **Founder Pack** | `founder_pack` | R$ 9,90 / US$ 1,99 | **600 Credits** + **1 Medic** |

- Sem pacotes de Credits (evita pay-to-win e moeda premium).
- As compras são restauradas automaticamente da Google Play ao reinstalar. O Founder Pack entrega o conteúdo **uma vez por save**.
- **Definido:** **Unity IAP 5** (Google Play Billing).

### 13.3 Privacidade e consentimento

- **Definido:** público-alvo **13+**, fora da Families Policy.
- **Definido:** consentimento GDPR/LGPD pelo **Google UMP** antes de inicializar anúncios e analytics. Settings tem "Opções de privacidade".
- **Definido:** política de privacidade em `https://manguebytegames.com/privacidade/starexpeditionco` (texto na §14.3).

### 13.4 Notificações

- **Definido:** **notificações locais** (sem servidor): uma por Expedition, agendada no envio para a hora de conclusão e cancelada no Claim.
- **Definido:** a permissão (Android 13+) é pedida no **passo 3 do tutorial**. Se negada, o jogo não pergunta de novo sozinho; Settings leva às configurações do sistema.
- Texto: título "**Expedição concluída!**", corpo "**A equipe voltou de <Planet>. Toque para ver o resultado.**"

### 13.5 Save

- **Definido:** save **local** em JSON versionado, gravado a cada ação que muda o estado e ao ir para segundo plano. Gravação atômica com cópia de segurança.
- **Definido:** **Android Auto Backup** ligado (troca de celular). Sem cloud save (ADR 0001).

### 13.6 Analytics e diagnóstico

**Definido:** **Firebase Analytics + Crashlytics**, ativados só depois do consentimento. Eventos: passos do tutorial, envio de Expedition (Planet, Cycle, tamanho da Squad, chance), Claim (resultado, Member Loss, qtd. de Items), craft, hire, venda, Novo Ciclo, anúncio oferecido/assistido, compra. São esses dados que ajustam os valores iniciais.

### 13.7 Lançamento

- **Definido:** só Google Play. A conta de desenvolvedor é **pessoal**: antes da produção, é obrigatório um **teste fechado com pelo menos 12 testadores por 14 dias seguidos**. O teste fechado também é a rodada de balanceamento.
- **Definido:** Android mínimo **8.0 (API 26)**; aparelho-alvo de entrada (~3 GB de RAM); 60 fps na UI.

## 14. Página da Loja e Política de Privacidade

### 14.1 Textos da Play Store

| Campo | pt-BR | en-US |
|---|---|---|
| Nome | Star Expedition Co. | Star Expedition Co. |
| Descrição curta (≤ 80) | Monte sua equipe, explore planetas e transforme loot em tecnologia. | Build your crew, explore planets and turn loot into tech. |

**Descrição completa (pt-BR):**

> Você acaba de fundar a Star Expedition Co., uma pequena companhia de expedições espaciais com uma nave emprestada e um único tripulante.
>
> Escolha quem vai, para onde e com qual equipamento — e espere. As expedições acontecem em tempo real, mesmo com o jogo fechado. Na volta, o que a equipe encontrou vira equipamento na Oficina ou créditos na Loja, e os créditos contratam novos especialistas.
>
> • 6 classes: Batedor, Engenheiro, Cientista, Guarda, Médico e Piloto
> • 18 planetas em 3 galáxias, cada um com seu risco e seus tesouros
> • 16 equipamentos em 4 níveis de tecnologia
> • Risco de verdade: nem todo tripulante volta
> • Ciclos sem fim: quando a última galáxia cair, recomece mais forte, com planetas mais perigosos e mais ricos
> • Pixel art retrô-futurista
> • Jogue offline, sem anúncios forçados

**Full description (en-US):**

> You just founded Star Expedition Co., a tiny space-expedition company with a borrowed ship and a single crew member.
>
> Choose who goes, where, and with what gear — then wait. Expeditions run in real time, even with the game closed. When the crew returns, their haul becomes gear in the Workshop or credits in the Shop, and credits hire new specialists.
>
> • 6 classes: Scout, Engineer, Scientist, Guard, Medic and Pilot
> • 18 planets across 3 galaxies, each with its own risk and treasures
> • 16 pieces of equipment across 4 tech tiers
> • Real stakes: not every crew member comes back
> • Endless Cycles: when the last galaxy falls, start again stronger, on deadlier and richer planets
> • Retro-futuristic pixel art
> • Play offline, no forced ads

- **Categoria:** Simulação. **Tags:** idle, gerenciamento, espaço, pixel art.
- **Screenshots:** 4 a 8 em retrato (1080×1920), com legenda curta: Mapa com timers, Painel do Planet com chances, Resultado com Rare Item, Oficina, Tripulação.
- **Classificação (IARC):** sem violência explícita (Member Loss é só texto), contém anúncios, contém compras no app.

### 14.2 Formulário de Segurança dos Dados (Play Console)

| Pergunta | Resposta |
|---|---|
| Coleta ou compartilha dados? | Sim |
| Dados coletados | **IDs do dispositivo** (ID de publicidade — AdMob), **Diagnóstico** (crashes — Crashlytics), **Atividade no app** (interações — Firebase Analytics), **Histórico de compras** (Google Play Billing) |
| Compartilhados com terceiros | ID de publicidade com o Google para anúncios |
| Finalidade | Publicidade, análise, diagnóstico, funcionalidade do app |
| Criptografado em trânsito | Sim |
| O usuário pode pedir exclusão? | Sim, pelo e-mail de contato (dados do Firebase/AdMob) |
| Dados pessoais identificáveis (nome, e-mail, localização) | Não coletados |

### 14.3 Texto da política de privacidade

Publicar em `https://manguebytegames.com/privacidade/starexpeditionco`, em pt-BR e inglês:

> **Política de Privacidade — Star Expedition Co.**
> Última atualização: <data de publicação>
>
> A MangueByteGames ("nós") desenvolve o jogo Star Expedition Co. Esta política explica quais dados o jogo usa.
>
> **1. Dados do jogo.** Seu progresso fica salvo apenas no seu aparelho. Se o backup do Android estiver ativo, o sistema pode copiar esse arquivo para a sua conta Google, sob as regras do Google. Não temos servidores de jogo e não recebemos o seu save.
>
> **2. Anúncios (Google AdMob).** O jogo mostra anúncios recompensados, só quando você escolhe assistir. O AdMob pode coletar o ID de publicidade do aparelho, endereço IP e dados de interação com o anúncio para exibir e medir anúncios, conforme o seu consentimento. Política do Google: https://policies.google.com/privacy
>
> **3. Análise e falhas (Google Firebase).** Usamos o Firebase Analytics para entender como o jogo é jogado (ex.: quais planetas são visitados) e o Firebase Crashlytics para receber relatórios de falhas. Esses dados não identificam você pessoalmente.
>
> **4. Compras.** Compras são processadas pelo Google Play. Não recebemos dados de pagamento.
>
> **5. Consentimento.** Na primeira abertura, e sempre que exigido pela lei da sua região, o jogo pede o seu consentimento. Você pode mudá-lo a qualquer momento em Configurações → Opções de privacidade.
>
> **6. Crianças.** O jogo não é direcionado a menores de 13 anos.
>
> **7. Seus direitos (LGPD/GDPR).** Você pode pedir acesso ou exclusão dos dados ligados ao seu aparelho pelo e-mail abaixo. Desinstalar o jogo apaga o save local.
>
> **8. Contato.** <e-mail de contato do estúdio>

- **Em aberto:** o e-mail de contato do estúdio (entra no texto acima e na ficha da Play Console).

## 15. Escopo da 1.0 e Pós-Lançamento

**Definido:** a 1.0 contém:
1. Starter Pick, 6 Crew Classes, Hire com preço crescente, nomes e 3 visuais por classe, Emergency Recruit.
2. 3 Galaxies × 6 Planets, mapa navegável, Expeditions simultâneas (uma por Planet), timer real, relógio protegido contra volta.
3. Resolução binária com semente, Member Loss (com perda do Equipment), Loot com Rare Items escalando por Risk.
4. 38 Items, 16 Recipes em 4 Tech Tiers, Equipment por membro.
5. Venda de Items, uma moeda (Credits).
6. Cycles infinitos.
7. Tutorial guiado.
8. Double Loot por anúncio, Ad-Free e Founder Pack.
9. Notificações locais, consentimento UMP, Firebase Analytics/Crashlytics, Auto Backup.
10. pt-BR e inglês, Settings.

**Fora da 1.0 (candidatos a update, a decidir pelo Analytics):**
- Nível/XP de Crew Member.
- Relato narrativo da Expedition.
- Cloud save (Play Games Saved Games).
- Loja rotativa de recrutas.
- Contratos diários.
- Versão iOS.

## 16. Balanceamento v1

> Todos os números desta seção são **valor inicial**. Eles entram no Unity pelo gerador de dados da Fase 2, e dali em diante o ScriptableObject é a fonte da verdade.

### 16.1 Crew Classes

| Id | pt-BR / en | Bônus | Preço base (Credits) | Visual (prompt) |
|---|---|---|---|---|
| `scout` | Batedor / Scout | Success **+12** | 60 | young explorer, green-accented jumpsuit, scanner visor on forehead |
| `engineer` | Engenheiro / Engineer | Loot **+40%** | 60 | mechanic, amber jumpsuit, welding goggles, wrench on shoulder |
| `guard` | Guarda / Guard | Risk **−10** | 60 | security officer, heavy grey-blue armor, helmet with red stripe |
| `scientist` | Cientista / Scientist | Rare Item **+4** p.p. | 120 | scientist, white lab coat over violet suit, round glasses, data pad |
| `medic` | Médico / Medic | Member Loss **−20** p.p. | 120 | field medic, white-and-teal suit, red cross armband |
| `pilot` | Piloto / Pilot | Duração **−25%** | 120 | pilot, orange flight jacket, headset with mic, aviator patches |

### 16.2 Fórmulas e constantes

| Constante | Valor |
|---|---|
| Chance de Success base | 95% |
| Chance de Success mínima / máxima | 5% / 98% |
| Member Loss base (na Failure) | 25% + 0,4 × Risk efetivo |
| Member Loss máxima | 90% |
| Redução de duração máxima | 60% |
| Duração mínima | 30 s |
| Risk por Cycle | +8 por Cycle acima do 1º |
| Loot por Cycle | +25% por Cycle acima do 1º |
| Rare Item por Cycle | +2 p.p. por Cycle acima do 1º |
| Crescimento do preço de Hire | ×1,25 por membro no Roster |

```
Risk do Planet no Cycle  = Risk base + 8 × (Cycle − 1)
Risk efetivo             = max(0, Risk do Planet no Cycle − Σ redução de Risk da Squad)
Chance de Success        = clamp(95 − Risk efetivo + Σ bônus de Success, 5, 98) %
Chance de Member Loss    = clamp(25 + 0,4 × Risk efetivo − Σ redução de Loss, 0, 90) %   (só na Failure)
Duração                  = max(30 s, duração base × (1 − min(60, Σ redução de duração %) / 100))
Quantidade de um Item    = arredonda(sorteio[min, max] × (1 + (Σ bônus de Loot % + 25 × (Cycle − 1)) / 100))
Chance de Rare Item      = chance base × (1 + Risk do Planet no Cycle / 100) + (Σ bônus de Rare + 2 × (Cycle − 1)) p.p.
```

- O Guard reduz o Risk efetivo, mas **não** a chance de Rare Item (que usa o Risk do Planet).
- Rare Items vêm sempre em quantidade 1 (sem multiplicador de Loot). Se nenhum Item sair num Success, o jogo entrega a quantidade mínima do primeiro Item da Loot Table.

### 16.3 Galaxies e Planets

**Galaxies:** 1 — **Cinturão Mangue** / Mangrove Belt (verde) · 2 — **Nebulosa Âmbar** / Amber Nebula (âmbar) · 3 — **Abismo de Vega** / Vega Abyss (roxo-escuro).

| # | Id | Nome | Risk | Duração | Loot Table (chance · quantidade) | Visual (prompt) |
|---|---|---|---|---|---|---|
| 1 | `kora` | Kora | 5 | 1 min | Minério de Ferro 100% · 3–5; Areia de Sílica 70% · 2–3; Relíquia Alienígena 1% | grey rocky moon with craters |
| 2 | `rust9` | Rust-9 | 10 | 2 min | Minério de Ferro 90% · 4–6; Placa de Circuito 35% · 1–2; Relíquia Alienígena 1,5% | rust-red desert with scrap metal fields |
| 3 | `glacia` | Glacia | 14 | 4 min | Cristal de Gelo 100% · 3–5; Areia de Sílica 60% · 2–4; Relíquia Alienígena 2% | pale blue ice world with cracks |
| 4 | `tamarin` | Tamarin | 18 | 6 min | Pó de Carbono 90% · 3–5; Placa de Circuito 45% · 1–2; Pérola Estelar 2% | dark green jungle planet with brown rivers |
| 5 | `duna` | Duna | 24 | 10 min | Areia de Sílica 100% · 5–8; Célula de Energia 35% · 1–2; Relíquia Alienígena 3% | golden dune desert with rock spires |
| 6 | `coral` | Coral Prime | 30 | 15 min | Cristal de Gelo 80% · 4–6; Pó de Carbono 80% · 3–5; Célula de Energia 45% · 1–2; Pérola Estelar 3% | ocean world with pink coral islands |
| 7 | `ember` | Ember | 35 | 15 min | Minério de Titânio 100% · 3–5; Pó de Carbono 70% · 3–5; Pérola Estelar 3% | volcanic black rock with orange lava cracks |
| 8 | `halcyon` | Halcyon | 40 | 20 min | Hélio-3 90% · 2–4; Célula de Energia 50% · 1–2; Cristal Vivo 3% | gas giant with cream and amber bands |
| 9 | `mire` | Mire | 45 | 30 min | Minério de Titânio 90% · 4–6; Placa de Liga 40% · 1–2; Pérola Estelar 4% | murky olive swamp planet with fog |
| 10 | `vitra` | Vitra | 50 | 40 min | Areia de Sílica 90% · 6–9; Lente Óptica 40% · 1–2; Cristal Vivo 4% | glassy turquoise crystal plains |
| 11 | `obsidia` | Obsidia | 55 | 50 min | Minério de Titânio 80% · 5–7; Placa de Liga 50% · 1–3; Cristal Vivo 5% | black obsidian shards with purple glints |
| 12 | `lumen` | Lumen | 60 | 1 h | Hélio-3 90% · 3–5; Lente Óptica 50% · 1–2; Barra de Combustível 30% · 1; Cristal Vivo 6% | bright white-gold glowing world |
| 13 | `vegarift` | Vega Rift | 65 | 1 h | Musgo de Plasma 100% · 3–5; Barra de Combustível 45% · 1–2; Fragmento de Matéria Escura 4% | planet split by a glowing magenta rift |
| 14 | `hollow` | Hollow | 70 | 1 h 30 | Pó do Vazio 90% · 2–4; Nanogel 40% · 1–2; Núcleo Ancestral 4% | hollow cratered sphere with dark caverns |
| 15 | `nyx` | Nyx | 75 | 2 h | Musgo de Plasma 90% · 4–6; Chip Quântico 35% · 1; Fragmento de Matéria Escura 5% | dark navy night planet with bioluminescent cyan dots |
| 16 | `cinder` | Cinder Crown | 80 | 2 h 30 | Minério de Titânio 90% · 6–9; Bobina de Gráviton 35% · 1; Núcleo Ancestral 5% | charred planet ringed by burning debris |
| 17 | `echo` | Echo | 85 | 3 h | Pó do Vazio 90% · 4–6; Chip Quântico 45% · 1–2; Nanogel 45% · 1–2; Fragmento de Matéria Escura 6% | pale lavender world with ghostly ripple patterns |
| 18 | `gate` | Singularity Gate | 90 | 4 h | Pó do Vazio 100% · 5–8; Bobina de Gráviton 50% · 1–2; Semente da Singularidade 5%; Núcleo Ancestral 6% | fractured planet around a tiny black hole |

### 16.4 Items

| Id | pt-BR / en | Categoria | Venda (Credits) | Visual (prompt) |
|---|---|---|---|---|
| `iron_ore` | Minério de Ferro / Iron Ore | Raw Material | 2 | chunk of grey iron ore |
| `silica_sand` | Areia de Sílica / Silica Sand | Raw Material | 2 | small pile of pale sand |
| `ice_crystal` | Cristal de Gelo / Ice Crystal | Raw Material | 3 | light blue ice crystal cluster |
| `carbon_dust` | Pó de Carbono / Carbon Dust | Raw Material | 4 | black powder in a small pouch |
| `titanium_ore` | Minério de Titânio / Titanium Ore | Raw Material | 6 | silvery-blue metallic ore chunk |
| `helium3` | Hélio-3 / Helium-3 | Raw Material | 8 | glass canister with glowing yellow gas |
| `plasma_moss` | Musgo de Plasma / Plasma Moss | Raw Material | 10 | clump of glowing magenta moss |
| `void_dust` | Pó do Vazio / Void Dust | Raw Material | 14 | vial of swirling dark purple dust |
| `circuit_board` | Placa de Circuito / Circuit Board | Component | 10 | green circuit board with chips |
| `power_cell` | Célula de Energia / Power Cell | Component | 14 | cylindrical battery with amber glow |
| `alloy_plate` | Placa de Liga / Alloy Plate | Component | 22 | riveted metal plate |
| `optical_lens` | Lente Óptica / Optical Lens | Component | 26 | round cyan lens in metal ring |
| `fuel_rod` | Barra de Combustível / Fuel Rod | Component | 34 | glowing green fuel rod |
| `nano_gel` | Nanogel / Nano Gel | Component | 45 | sealed pouch of silver gel |
| `quantum_chip` | Chip Quântico / Quantum Chip | Component | 60 | small chip with violet core |
| `graviton_coil` | Bobina de Gráviton / Graviton Coil | Component | 80 | copper coil around a dark sphere |
| `alien_relic` | Relíquia Alienígena / Alien Relic | Rare Item | 80 | carved stone idol with glowing runes |
| `star_pearl` | Pérola Estelar / Star Pearl | Rare Item | 120 | iridescent pearl with a star inside |
| `living_crystal` | Cristal Vivo / Living Crystal | Rare Item | 200 | pulsing teal crystal with veins |
| `dark_matter` | Fragmento de Matéria Escura / Dark Matter Shard | Rare Item | 350 | black shard with violet aura |
| `ancient_core` | Núcleo Ancestral / Ancient Core | Rare Item | 450 | golden mechanical orb with ancient glyphs |
| `singularity_seed` | Semente da Singularidade / Singularity Seed | Rare Item | 1.200 | tiny black sphere bending light around it |

Os 16 Equipments estão na §16.5 (preço de venda: Tier 1 = 30, Tier 2 = 90, Tier 3 = 250, Tier 4 = 600).

### 16.5 Recipes e Equipment

| Tier | Id | pt-BR / en | Ingredientes | Bônus | Visual (prompt) |
|---|---|---|---|---|---|
| 1 | `field_scanner` | Scanner de Campo / Field Scanner | 6 Minério de Ferro, 1 Placa de Circuito | Success +5 | handheld scanner with small screen |
| 1 | `padded_suit` | Traje Acolchoado / Padded Suit | 8 Areia de Sílica, 4 Pó de Carbono | Risk −4 | quilted grey space suit torso |
| 1 | `salvage_kit` | Kit de Coleta / Salvage Kit | 6 Minério de Ferro, 4 Areia de Sílica | Loot +15% | toolbox with pliers and clamp |
| 1 | `emergency_beacon` | Sinalizador de Emergência / Emergency Beacon | 6 Cristal de Gelo, 1 Célula de Energia | Member Loss −8 | small beacon with red light |
| 2 | `deep_scanner` | Scanner Profundo / Deep Scanner | Scanner de Campo, 8 Minério de Titânio, 1 Lente Óptica | Success +10 | scanner with long antenna and lens |
| 2 | `alloy_armor` | Armadura de Liga / Alloy Armor | Traje Acolchoado, 2 Placa de Liga, 6 Minério de Titânio | Risk −8 | plated armor chestpiece |
| 2 | `drill_rig` | Perfuratriz / Drill Rig | Kit de Coleta, 5 Hélio-3, 2 Célula de Energia | Loot +30% | compact drill with amber motor |
| 2 | `stasis_pod` | Cápsula de Estase / Stasis Pod | Sinalizador de Emergência, 4 Hélio-3, 1 Pérola Estelar | Member Loss −15 | small capsule with frosted window |
| 3 | `quantum_scanner` | Scanner Quântico / Quantum Scanner | Scanner Profundo, 1 Chip Quântico, 2 Lente Óptica | Success +16 | scanner with violet holographic display |
| 3 | `shield_harness` | Arnês de Escudo / Shield Harness | Armadura de Liga, 2 Barra de Combustível, 6 Musgo de Plasma | Risk −13 | harness projecting a blue energy shield |
| 3 | `nano_forge` | Nanoforja / Nano Forge | Perfuratriz, 2 Nanogel, 1 Cristal Vivo | Loot +50%, Rare +2 | portable forge with silver glow |
| 3 | `phase_cloak` | Manto de Fase / Phase Cloak | Cápsula de Estase, 5 Pó do Vazio, 1 Barra de Combustível | Member Loss −22, Risk −4 | translucent shimmering cloak |
| 4 | `oracle_array` | Matriz Oráculo / Oracle Array | Scanner Quântico, 2 Chip Quântico, 1 Fragmento de Matéria Escura | Success +24 | floating ring of sensor orbs |
| 4 | `graviton_aegis` | Égide de Gráviton / Graviton Aegis | Arnês de Escudo, 2 Bobina de Gráviton, 1 Núcleo Ancestral | Risk −20 | heavy shield with swirling gravity core |
| 4 | `matter_weaver` | Tecelã de Matéria / Matter Weaver | Nanoforja, 1 Bobina de Gráviton, 1 Fragmento de Matéria Escura, 2 Nanogel | Loot +75%, Rare +3 | gauntlet weaving glowing threads |
| 4 | `lazarus_module` | Módulo Lázaro / Lazarus Module | Manto de Fase, 1 Núcleo Ancestral, 2 Cristal Vivo | Member Loss −30, Risk −8 | chest module with golden heart light |

- **Tech Tiers:** Tier 1 liberado desde o início; Tier 2 ao alcançar **Ember** (Planet 7); Tier 3 ao alcançar **Vega Rift** (Planet 13); Tier 4 ao alcançar **Cinder Crown** (Planet 16).
- A **Semente da Singularidade** não entra em Recipe: é o troféu de venda mais caro do jogo.

### 16.6 Simulação de ritmo (Cycle 1)

Estimativa para um jogador que abre o jogo ~4 vezes por dia depois do primeiro dia:

| Trecho | Timers em sequência (sem Pilot) | Com 1 Pilot (−25%) | Gargalo real | Estimativa |
|---|---|---|---|---|
| Galaxy 1 | 38 min | 29 min | Nenhum: sessão ativa | **Dia 1**, na primeira sessão |
| Contratar as 6 classes | — | — | ~850 Credits no total | **Dias 2–3** |
| Galaxy 2 | 3 h 35 | 2 h 41 | Intervalo entre sessões | **Dias 2–3** |
| Galaxy 3 | 14 h | 10 h 30 | Intervalo entre sessões + Equipment Tier 3/4 para chances aceitáveis | **Dias 4–7** |
| **Cycle 1 completo** | | | | **~1 semana** |

- Na Galaxy 1, uma Expedition solo rende ~10–40 Credits se vendida; a 2ª contratação (60 Credits) sai em poucos minutos.
- Na Galaxy 3 sem Equipment, uma Squad Scout+Guard+Scout tem ~39% de Success no Singularity Gate; com Equipment Tier 3 na Squad, ~80%.
- A partir do Cycle 2, o Loot +25% por Cycle compensa o Risk +8: o jogador mais equipado avança mais rápido que no Cycle 1.

## 17. Em aberto

- **Áudio:** fonte das músicas e dos efeitos (§12).
- **E-mail de contato** da política de privacidade e da Play Console (§14.3).
- **Liberação na Failure:** hoje o Claim de uma Failure também libera o próximo Planet (§4.1). Isso deixa o avanço limitado só pelo tempo: dá para "correr" com um único Scout barato, aceitando as perdas. Vale observar no teste fechado se a progressão fica rápida demais; a alternativa é liberar só no Success.
- Todos os números da §16 são **valores iniciais** para o teste fechado.

---

# Parte 2 — Guia de Implementação Unity

## 18. Guia de Implementação Unity (versão 1.0)

Este guia leva o jogo do projeto vazio até a publicação na Google Play. Ele é **didático**: cada fase explica os conceitos novos antes de usar e termina com algo que dá para ver funcionando. Mas o código é de **produto final**: dados em ScriptableObjects, regras de jogo em classes C# puras e testáveis, save versionado e serviços de plataforma (anúncios, compras, notificações, analytics) atrás de interfaces.

Cada fase segue o mesmo formato:
- **Conceitos novos:** o que você vai aprender e por quê.
- **Passos:** o que fazer no Editor e o código completo de cada script.
- **✅ Checkpoint:** como confirmar que funcionou.
- **Problemas comuns:** os erros mais prováveis e como resolver.

### 18.1 Convenções do projeto

**Idioma:** todo nome no projeto (scripts, classes, variáveis, GameObjects, Prefabs, assets, pastas) é em **inglês** e usa os termos do [glossário](contexts/star-expedition-co/CONTEXT.md). Se o glossário diz **Squad**, nada no projeto se chama `Team` ou `Party`; se diz **Claim**, nada se chama `Collect`. Comentários no código podem ser em português.

**Código C#:**

| Elemento | Padrão | Exemplo |
|---|---|---|
| Namespace | `StarExpedition.<Área>` | `StarExpedition.Expeditions` |
| Classe, struct, enum, interface | PascalCase; interfaces com `I` | `ExpeditionService`, `IAdService` |
| Método e propriedade | PascalCase | `TryHire()`, `Credits` |
| Campo privado | `_camelCase` | `_save` |
| Campo exposto no Inspector | `[SerializeField] private` + `_camelCase` | `[SerializeField] private TMP_Text _nameLabel;` |
| Campo de dado serializado (save, ScriptableObject) | `camelCase` público | `public int baseRisk;` |
| Evento C# | PascalCase, verbo no passado, sem `On` | `event Action<ExpeditionState> Started;` |
| Método que responde a evento | `Handle` + nome do evento | `HandleStarted(ExpeditionState e)` |

> **Por que dados públicos nos ScriptableObjects e no save?** São "sacos de dados": o `JsonUtility` e o gerador de dados (Fase 2) precisam escrevê-los, e nenhuma regra de jogo mora neles. As regras ficam nos *services*, que expõem só métodos.

**Assets:**

| Tipo | Padrão | Exemplo |
|---|---|---|
| Prefab | PascalCase, nome do conceito | `PlanetNode.prefab`, `MemberCard.prefab` |
| ScriptableObject de dados | `<Tipo>_<id>` | `Class_scout`, `Item_iron_ore`, `Recipe_field_scanner`, `Planet_kora`, `Galaxy_1` |
| Sprite | `SPR_<Tipo>_<Nome>` | `SPR_Crew_Scout_1`, `SPR_Item_iron_ore` |
| Áudio | `SFX_<Nome>` / `MUS_<Nome>` | `SFX_ClaimSuccess`, `MUS_Ambient` |
| Cena | PascalCase | `Boot`, `Main` |

**Hierarquia das cenas:** GameObjects vazios de agrupamento na raiz, entre colchetes: `[Systems]` (sem visual) e `[UI]` (Canvas). Nada solto na raiz além deles, da câmera e do `EventSystem`.

### 18.2 Arquitetura em uma página

```
                    ┌──────────────────────────── GameBootstrap (antes da 1ª cena) ─┐
                    │ cria e liga todos os services; guarda-os em Services          │
                    └───────────────────────────────────────────────────────────────┘
  Dados (ScriptableObjects)          Regras (C# puro, testável)          Plataforma (interfaces)
  ───────────────────────            ─────────────────────────          ──────────────────────
  GameDatabase ──┐                   SaveService ◄── SaveData            INotificationService
  GameBalance    │                   TrustedClock                        IAdService
  CrewClassDef.  ├──────────────────►CrewService, InventoryService       IPurchaseService
  ItemDefinition │                   WalletService, ProgressService      IAnalyticsService
  RecipeDef.     │                   ExpeditionService ─► ExpeditionResolver (função pura)
  PlanetDef.     │                   CraftingService, ShopService, TutorialService
  GalaxyDef. ────┘                              ▲ eventos C#
                                                │
                              UI (MonoBehaviours): só lê os services e chama métodos
```

- **Regra de ouro:** a UI **nunca** altera dados diretamente. Ela chama um método de um service (`Services.Crew.TryHire(...)`); o service valida, muda o `SaveData`, grava e dispara um evento; a UI se redesenha ao ouvir o evento.
- **Por que services em C# puro, e não MonoBehaviours singletons (como no rascunho do MVP)?** Classes comuns podem ser criadas em testes automáticos sem cena (Fase 14), e a ordem de criação fica explícita num único lugar (`GameBootstrap`). Isso acaba com o problema clássico de "`Instance` nulo porque o `Awake` rodou antes".

### 18.3 Mapa de sistemas

| Área (namespace) | Script | Responsabilidade | Fase |
|---|---|---|---|
| `Core` | `GameBootstrap`, `Services` | Cria e guarda todos os services | 1 |
| `Core` | `SaveData`, `SaveStorage`, `SaveService` | Estado do jogo, gravação atômica, versões | 1 |
| `Core` | `IClock`, `TrustedClock` | Relógio com proteção contra volta | 1 |
| `Core` | `AppLifecycle`, `BootSequence` | Segundo plano; cena Boot | 1 |
| `Core` | `L` | Atalho de localização | 1 |
| `Data` | `CrewBonus`, `CrewClassDefinition`, `ItemDefinition`, `RecipeDefinition`, `PlanetDefinition`, `GalaxyDefinition`, `GameBalance`, `GameDatabase` | Dados do jogo em ScriptableObjects | 2 |
| `Editor` | `DatabaseSeeder` | Gera todos os ScriptableObjects e textos a partir da §16 | 2 |
| `Economy` | `WalletService` | Credits | 3 |
| `Items` | `InventoryService` | Inventário | 3 |
| `Crew` | `CrewService`, `NameGenerator` | Roster, Starter Pick, Hire, Equip, Member Loss, Emergency Recruit | 3 |
| `Progress` | `ProgressService` | Desbloqueio de Planets, Tech Tiers e Cycles | 3 |
| `Expeditions` | `ExpeditionResolver`, `ExpeditionOdds`, `ExpeditionOutcome` | Fórmulas e sorteio (função pura) | 4 |
| `Expeditions` | `ExpeditionService` | Enviar, timer, Claim, Double Loot | 4 |
| `Crafting` | `CraftingService` | Recipes | 5 |
| `Economy` | `ShopService` | Venda de Items | 5 |
| `UI` | `PlanetSurface` + shader `PlanetSphere` | Planet girando | 6 |
| `Platform` | `PlatformContracts` (`INotificationService`, `IAdService`, `IPurchaseService`, `IAnalyticsService`), `NullPlatformServices` | Contratos de plataforma e versões falsas para o Editor | 7 |
| `UI` | `IntegerCanvasScaler`, `SafeAreaFitter`, `UIRoot`, `TabBar`, `TopBar`, `BottomSheet`, `ConfirmSheet`, `UIFlipbook`, `ItemSlotView`, `Format` | Base da interface | 7 |
| `Editor` | `UiTextSeeder` | Textos de UI pt-BR/en na tabela `UI` | 7 |
| `UI` | `Toast`, `MapView`, `PlanetNode`, `OrbitingShip`, `PlanetPanel`, `SquadMemberToggle`, `ResultPanel`, `NewCycleBanner` | Mapa e Expeditions | 8 |
| `UI` | `CrewView`, `MemberCard`, `MemberPanel`, `EquipOptionRow`, `WorkshopView`, `RecipeCard`, `ShopView`, `SellRow`, `HireCard`, `OfferCard` | Demais abas | 8 |
| `Onboarding` | `TutorialService`, `StarterPickPanel`, `StarterOption`, `TutorialOverlay`, `HireHintBadge` | Starter Pick, tutorial e dica da Loja | 9 |
| `Platform` | `AndroidNotificationService`, `NotificationScheduler` | Notificações locais | 10 |
| `Platform` | `ConsentService`, `AdMobAdService`, `UnityPurchaseService` | Consentimento, anúncio e compras | 11 |
| `Platform` | `FirebaseAnalyticsService`, `AnalyticsReporter` | Analytics e Crashlytics | 12 |
| `Audio` | `AudioLibrary` (+ `SfxId`), `AudioService`, `AudioReactor`, `UIButtonSound` | Música e efeitos | 13 |
| `Core` / `UI` | `SettingsService`, `SettingsPanel` | Volumes, idioma, notificações, privacidade | 13 |
| `Tests` | `TestData`, `ExpeditionResolverTests`, `TrustedClockTests`, `ProgressServiceTests`, `CrewServiceTests` | Testes automáticos | 14 |
| `Core` | `DevPanel` | Atalhos de teste (só em builds de desenvolvimento) | 14 |

### 18.4 Fases

| Fase | Conteúdo |
|---|---|
| 0 | Setup do projeto |
| 1 | Arquitetura: bootstrap, save, relógio, ciclo de vida |
| 2 | Dados: ScriptableObjects e gerador a partir da §16 |
| 3 | Tripulação, inventário, Credits e progresso |
| 4 | Expeditions: envio, timer, resolução, Claim e Cycles |
| 5 | Crafting e venda |
| 6 | Arte: SpriteCook, importação e shader dos Planets |
| 7 | Base da UI: escala inteira, abas, painéis, localização |
| 8 | Telas: Mapa, Planet, Resultado, Tripulação, Oficina, Loja, Settings |
| 9 | Starter Pick e tutorial |
| 10 | Notificações locais |
| 11 | Consentimento, anúncio recompensado e compras |
| 12 | Firebase Analytics e Crashlytics |
| 13 | Áudio e Settings |
| 14 | Testes automáticos e ferramentas de desenvolvimento |
| 15 | Build de release, Play Console, teste fechado e publicação |

---

### Fase 0 — Setup do Projeto

**Conceitos novos:**
- **Unity Hub e módulos:** o Hub instala versões da Unity e os módulos de plataforma. Sem o módulo Android, a Unity não gera o `.aab` exigido pela Google Play.
- **Pacote (package):** biblioteca oficial instalada pelo **Package Manager** (Localization, Mobile Notifications, In-App Purchasing). Os SDKs do Google (AdMob, Firebase) chegam nas Fases 11 e 12.
- **Assembly Definition (asmdef):** agrupa scripts numa "assembly" separada. A Unity recompila só o que mudou e as dependências ficam explícitas. É também o que permite ter uma assembly só de testes (Fase 14).
- **Preset:** configuração de importação salva e aplicada automaticamente numa pasta. Evita a pixel art borrada.
- **Git LFS:** guarda binários (PNG, áudio) fora do histórico normal do Git.

#### Passo 1 — Instalar a Unity

1. Instale o **Unity Hub** (unity.com/download).
2. **Installs → Install Editor** → a versão **Unity 6 LTS** mais recente (`6000.x`, marcada como LTS).
3. Marque o módulo **Android Build Support**, com **OpenJDK** e **Android SDK & NDK Tools**.

#### Passo 2 — Criar o projeto e o repositório

1. **Projects → New Project** → template **Universal 2D** → nome `StarExpeditionCo` → **Create project**.
2. Na pasta do projeto, crie o repositório e o `.gitignore` da Unity:

   ```powershell
   git init
   curl.exe -L https://raw.githubusercontent.com/github/gitignore/main/Unity.gitignore -o .gitignore
   git lfs install
   git lfs track "*.png" "*.wav" "*.ogg" "*.mp3" "*.ttf" "*.otf"
   ```

3. Adicione ao `.gitignore` as linhas `*.keystore` e `Builds/`: o keystore de assinatura (Fase 15) **nunca** entra no Git, e as builds são geradas de novo a cada versão.
4. **Edit → Project Settings → Editor**: **Version Control Mode** = `Visible Meta Files`, **Asset Serialization Mode** = `Force Text`.

#### Passo 3 — Instalar os pacotes

**Window → Package Manager → Unity Registry**, instale:

| Pacote | Para quê |
|---|---|
| **Localization** | pt-BR e inglês (Fase 7) |
| **Mobile Notifications** | notificações locais (Fase 10) |
| **In-App Purchasing** (versão **5.x**) | Ad-Free e Founder Pack (Fase 11) |

Já vêm no template: **Input System**, **uGUI** (que na Unity 6 inclui o **TextMeshPro**) e **Test Framework**. Na primeira vez que um `TMP_Text` for criado, aceite **Import TMP Essentials**.

> **Por que IAP 5 e não 4?** A Google Play exige versões recentes da Play Billing Library para publicar e atualizar apps. O IAP 5 usa a Billing Library atual; o 4.x ficou para trás.

#### Passo 4 — Estrutura de pastas

```
Assets/
  _Project/
    Art/            Crew/ Planets/ Items/ UI/ Backgrounds/ Ships/ Fonts/
    Audio/          Music/ SFX/
    Data/           Classes/ Items/ Recipes/ Planets/ Galaxies/
    Localization/
    Materials/
    Prefabs/        UI/
    Resources/      (só GameDatabase.asset — Fase 2)
    Scenes/
    Scripts/        Core/ Data/ Crew/ Items/ Economy/ Progress/ Expeditions/
                    Crafting/ Platform/ Audio/ UI/ Onboarding/ Editor/
    Shaders/
    Tests/          EditMode/
```

#### Passo 5 — Assembly Definitions

1. Em `Scripts/`: **Create → Scripting → Assembly Definition** → `StarExpedition`. Em **Assembly Definition References**, adicione `Unity.TextMeshPro`, `UnityEngine.UI`, `Unity.InputSystem`, `Unity.Localization` e `Unity.ResourceManager`. **Apply**.
2. Em `Scripts/Editor/`: outra asmdef, `StarExpedition.Editor`, com referência a `StarExpedition`, `Unity.Localization` e `Unity.Localization.Editor`. Em **Platforms**, deixe só **Editor**.
3. A asmdef de testes é criada na Fase 14.

> As referências a `Unity.Notifications.Android` e `UnityEngine.Purchasing` entram nas Fases 10 e 11, junto com o código que as usa. Os SDKs do Google (AdMob, Firebase) vêm como DLLs pré-compiladas, referenciadas automaticamente.

#### Passo 6 — Preset de importação de pixel art

1. Importe qualquer PNG para `Art/` e selecione-o. No Inspector:
   - **Texture Type:** `Sprite (2D and UI)`
   - **Pixels Per Unit:** `32`
   - **Filter Mode:** `Point (no filter)`
   - **Compression:** `None`
   - **Generate Mip Maps:** desligado
2. No topo do Inspector, clique no ícone de **Preset** (os controles deslizantes) → **Save current to…** → `Assets/_Project/Art/PixelArt.preset`.
3. **Edit → Project Settings → Preset Manager** → **Add Default Preset → Importer → TextureImporter** → escolha `PixelArt` e, em **Filter**, escreva `glob:"Assets/_Project/Art/**"`.

Toda imagem nova em `Art/` já entra certa. As superfícies dos Planets recebem um ajuste extra na Fase 6.

#### Passo 7 — Cenas

1. Renomeie `SampleScene` para `Boot` e mova-a para `Scenes/`. Crie também a cena `Main`.
2. **File → Build Profiles** → **Scene List**: `Boot` (índice 0) e `Main` (índice 1).

#### Passo 8 — Plataforma Android e Player Settings

1. **File → Build Profiles → Android → Switch Platform**.
2. **Edit → Project Settings → Player**:

| Seção | Campo | Valor | Por quê |
|---|---|---|---|
| (topo) | Company Name | `MangueByteGames` | Aparece no caminho do save no Editor |
| (topo) | Product Name | `Star Expedition Co.` | Nome embaixo do ícone |
| (topo) | Version | `1.0.0` | Versão visível na loja |
| Resolution and Presentation | Default Orientation | `Portrait` | GDD §1 |
| Other Settings → Identification | Package Name | `com.manguebytegames.starexpeditionco` | **Imutável** depois de publicado |
| Other Settings → Identification | Minimum API Level | `Android 8.0 (API level 26)` | GDD §13.7 |
| Other Settings → Identification | Target API Level | `Automatic (highest installed)` | A Play exige a API alvo recente do ano |
| Other Settings → Identification | Bundle Version Code | `1` | Sobe a cada envio à Play |
| Other Settings → Configuration | Scripting Backend | `IL2CPP` | Exigido para ARM64 |
| Other Settings → Configuration | Target Architectures | só `ARM64` | A Play exige 64 bits; ARMv7 só aumenta o tamanho |
| Other Settings → Configuration | Active Input Handling | `Input System Package (New)` | O template já vem assim |

#### Passo 9 — Commit

```powershell
git add .
git commit -m "Setup: projeto Unity 6, pacotes, pastas, asmdefs e preset de pixel art"
```

#### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console, com a plataforma Android ativa.
- A pasta `_Project` tem a estrutura acima; as duas asmdefs existem.
- Um PNG novo em `Art/` entra com **Point** e sem compressão.
- `Boot` e `Main` estão na Scene List, nessa ordem.

#### Problemas comuns
- **"Android module not installed" ao trocar de plataforma:** Hub → Installs → engrenagem da versão → **Add modules** → Android Build Support.
- **O preset não é aplicado:** confira o filtro `glob:"Assets/_Project/Art/**"` (com aspas) e reimporte a imagem (botão direito → **Reimport**).
- **Não aparece a versão 5 do In-App Purchasing:** abra a página do pacote → **Version History** → escolha a 5.x mais recente.

---

### Fase 1 — Arquitetura: bootstrap, save, relógio e ciclo de vida

> Objetivo: ter o "esqueleto" que todo o resto usa — um ponto único onde os services nascem, um save que sobrevive a crashes e um relógio que não pode ser voltado para trás.

**Conceitos novos:**
- **`[RuntimeInitializeOnLoadMethod]`:** marca um método estático para a Unity rodar sozinha, **antes da primeira cena**. É onde criamos todos os services, então nenhum script de cena encontra um service nulo.
- **Service locator (`Services`):** uma classe estática com uma propriedade por service. A UI escreve `Services.Crew.TryHire(...)`, sem precisar arrastar referências no Inspector.
- **Save versionado:** o `SaveData` tem um número de versão. Quando uma atualização do jogo mudar o formato, o `SaveService` converte saves antigos em vez de apagá-los.
- **Gravação atômica:** gravar num arquivo temporário e só depois trocar pelo definitivo. Se o celular desligar no meio da gravação, o save anterior continua inteiro.
- **"Marcar sujo" e gravar uma vez por frame:** várias mudanças no mesmo frame (ex.: um Claim que adiciona 4 Items) viram uma única gravação.
- **Relógio confiável:** o timer é calculado com o `DateTime.UtcNow` do aparelho, **nunca** com `Time.time` (que zera ao fechar o app). O `TrustedClock` impede que voltar o relógio "desfaça" o tempo (GDD §4.4).

#### Passo 1 — O ponto de acesso: `Services`

A classe cresce a cada fase: cada fase acrescenta as propriedades dos services que cria. Nesta fase, só save e relógio.

```csharp
// Caminho: Assets/_Project/Scripts/Core/Services.cs
namespace StarExpedition.Core
{
    /// Acesso central a todos os services. Preenchido só pelo GameBootstrap.
    public static class Services
    {
        public static SaveService Save { get; internal set; }
        public static IClock Clock { get; internal set; }
        // Fase 2+: as próximas propriedades entram aqui.
    }
}
```

#### Passo 2 — Os dados salvos: `SaveData`

Este é o formato **completo** do save da 1.0. Alguns campos só serão usados em fases posteriores; eles já nascem aqui para que o save não precise mudar de versão durante o desenvolvimento.

```csharp
// Caminho: Assets/_Project/Scripts/Core/SaveData.cs
using System;
using System.Collections.Generic;

namespace StarExpedition.Core
{
    /// Todo o estado do jogador. Só dados: nenhuma regra de jogo mora aqui.
    [Serializable]
    public class SaveData
    {
        public const int CurrentVersion = 1;

        public int version = CurrentVersion;
        public long lastSeenUtcTicks;             // TrustedClock (GDD §4.4)

        // Economia e inventário
        public int credits;
        public List<ItemStack> inventory = new List<ItemStack>();

        // Tripulação
        public List<CrewMemberState> roster = new List<CrewMemberState>();
        public int nextMemberSerial;
        public bool starterPicked;

        // Expeditions ativas (uma por Planet — GDD §2)
        public List<ExpeditionState> expeditions = new List<ExpeditionState>();
        public int totalExpeditionsStarted;

        // Progresso
        public int cycle = 1;
        public int unlockedPlanetIndex;           // índice global (0..17) do Planet mais avançado liberado neste Cycle
        public int bestUnlockedPlanetIndex;       // o maior já alcançado em qualquer Cycle (libera Tech Tiers)
        public bool cycleCompleted;               // o último Planet deste Cycle já teve Claim

        // Onboarding
        public int tutorialStep;
        public bool hireHintSeen;
        public bool notificationPromptAnswered;

        // Compras
        public bool adFree;
        public bool founderPackGranted;

        public SettingsState settings = new SettingsState();
    }

    [Serializable]
    public class CrewMemberState
    {
        public string id;
        public string classId;
        public int variant;                       // 0..2 — qual dos 3 visuais da Crew Class
        public string name;
        public string equippedItemId;             // vazio = sem Equipment
    }

    [Serializable]
    public class ExpeditionState
    {
        public string planetId;
        public List<string> memberIds = new List<string>();
        public long startUtcTicks;
        public int durationSeconds;
        public int seed;                          // sorteio fixado no envio (GDD §2)
        public int cycle;
        public bool isTutorial;
        public int notificationId = -1;           // Fase 10
    }

    [Serializable]
    public class ItemStack
    {
        public string itemId;
        public int quantity;

        public ItemStack() { }
        public ItemStack(string itemId, int quantity) { this.itemId = itemId; this.quantity = quantity; }
    }

    [Serializable]
    public class SettingsState
    {
        public float musicVolume = 0.7f;
        public float sfxVolume = 1f;
        public string localeCode = "";           // vazio = idioma do aparelho
        public bool notificationsEnabled = true;
    }
}
```

> **Por que não guardar "membro ocupado" no `CrewMemberState`?** Porque essa informação já existe nas Expeditions ativas. Guardar duas vezes abre espaço para as duas cópias discordarem (o bug clássico de "membro preso para sempre em expedição"). O `CrewService` pergunta ao `ExpeditionService` (Fase 3).

#### Passo 3 — Onde o save mora: `SaveStorage`

```csharp
// Caminho: Assets/_Project/Scripts/Core/SaveStorage.cs
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace StarExpedition.Core
{
    /// Lê e grava o save.json com gravação atômica e cópia de segurança.
    public class SaveStorage
    {
        private readonly string _path;
        private readonly string _tempPath;
        private readonly string _backupPath;

        public SaveStorage(string directory)
        {
            _path = Path.Combine(directory, "save.json");
            _tempPath = _path + ".tmp";
            _backupPath = _path + ".bak";
        }

        public string FilePath => _path;

        /// Devolve os conteúdos possíveis, do mais confiável para o menos:
        /// o save atual, o temporário (se a troca foi interrompida) e a cópia anterior.
        public IEnumerable<string> ReadCandidates()
        {
            foreach (var path in new[] { _path, _tempPath, _backupPath })
            {
                string json = TryRead(path);
                if (!string.IsNullOrWhiteSpace(json)) yield return json;
            }
        }

        public void Write(string json)
        {
            // 1. Grava tudo no temporário. Se o app morrer aqui, o save atual está intacto.
            File.WriteAllText(_tempPath, json);

            // 2. O save atual vira a cópia de segurança.
            if (File.Exists(_path))
            {
                File.Copy(_path, _backupPath, overwrite: true);
                File.Delete(_path);
            }

            // 3. O temporário vira o save atual. Se o app morrer entre 2 e 3,
            //    ReadCandidates encontra o temporário completo.
            File.Move(_tempPath, _path);
        }

        public void DeleteAll()
        {
            foreach (var path in new[] { _path, _tempPath, _backupPath })
                if (File.Exists(path)) File.Delete(path);
        }

        private static string TryRead(string path)
        {
            if (!File.Exists(path)) return null;
            try { return File.ReadAllText(path); }
            catch (IOException e)
            {
                Debug.LogWarning($"[Save] Não deu para ler {path}: {e.Message}");
                return null;
            }
        }
    }
}
```

#### Passo 4 — O serviço de save: `SaveService`

```csharp
// Caminho: Assets/_Project/Scripts/Core/SaveService.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace StarExpedition.Core
{
    public class SaveService
    {
        private readonly SaveStorage _storage;
        private bool _dirty;

        public SaveData Data { get; private set; } = new SaveData();
        public bool IsNewGame { get; private set; }

        public SaveService(SaveStorage storage) => _storage = storage;

        public void Load()
        {
            foreach (string json in _storage.ReadCandidates())
            {
                try
                {
                    var data = JsonUtility.FromJson<SaveData>(json);
                    if (data == null) continue;
                    Data = Migrate(data);
                    IsNewGame = false;
                    return;
                }
                catch (Exception e)
                {
                    Debug.LogWarning($"[Save] Arquivo corrompido, tentando o próximo: {e.Message}");
                }
            }

            Data = new SaveData();
            IsNewGame = true;
        }

        /// Marca que algo mudou. O AppLifecycle grava no fim do frame (uma vez só).
        public void MarkDirty() => _dirty = true;

        public void SaveIfDirty()
        {
            if (_dirty) SaveNow();
        }

        public void SaveNow()
        {
            _dirty = false;
            Data.version = SaveData.CurrentVersion;
            try
            {
                _storage.Write(JsonUtility.ToJson(Data));
            }
            catch (Exception e)
            {
                // Disco cheio ou sem permissão: o jogo continua, e tenta de novo na próxima mudança.
                _dirty = true;
                Debug.LogError($"[Save] Falha ao gravar: {e.Message}");
            }
        }

        /// Apaga o progresso (usado pelo DevPanel, Fase 14).
        public void ResetAll()
        {
            _storage.DeleteAll();
            Data = new SaveData();
            IsNewGame = true;
        }

        private static SaveData Migrate(SaveData data)
        {
            if (data.version > SaveData.CurrentVersion)
                Debug.LogWarning($"[Save] Save da versão {data.version}, mais nova que o jogo ({SaveData.CurrentVersion}).");

            // Exemplo para o futuro:
            // if (data.version < 2) { /* converter campos da v1 para a v2 */ data.version = 2; }

            // O JsonUtility deixa listas nulas quando o campo não existia no arquivo.
            data.inventory ??= new List<ItemStack>();
            data.roster ??= new List<CrewMemberState>();
            data.expeditions ??= new List<ExpeditionState>();
            data.settings ??= new SettingsState();
            if (data.cycle < 1) data.cycle = 1;
            return data;
        }
    }
}
```

#### Passo 5 — O relógio: `IClock` e `TrustedClock`

```csharp
// Caminho: Assets/_Project/Scripts/Core/IClock.cs
using System;

namespace StarExpedition.Core
{
    public interface IClock
    {
        /// Hora atual (UTC) que o jogo deve usar para os timers.
        DateTime UtcNow { get; }

        /// true enquanto o relógio do aparelho estiver atrás da última hora vista.
        bool IsRolledBack { get; }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/TrustedClock.cs
using System;

namespace StarExpedition.Core
{
    /// Relógio que nunca anda para trás (GDD §4.4).
    /// Se o aparelho voltar a hora, o jogo "congela" na última hora vista
    /// até o relógio real alcançá-la de novo.
    public class TrustedClock : IClock
    {
        private readonly SaveService _save;
        private readonly Func<DateTime> _systemUtcNow;

        public bool IsRolledBack { get; private set; }

        /// systemUtcNow é o relógio de verdade; nos testes (Fase 14) passamos um relógio falso.
        public TrustedClock(SaveService save, Func<DateTime> systemUtcNow)
        {
            _save = save;
            _systemUtcNow = systemUtcNow;
        }

        public DateTime UtcNow
        {
            get
            {
                long real = _systemUtcNow().Ticks;
                long lastSeen = _save.Data.lastSeenUtcTicks;

                if (real >= lastSeen)
                {
                    IsRolledBack = false;
                    _save.Data.lastSeenUtcTicks = real;   // gravado junto com o próximo save
                    return new DateTime(real, DateTimeKind.Utc);
                }

                IsRolledBack = true;
                return new DateTime(lastSeen, DateTimeKind.Utc);
            }
        }
    }
}
```

#### Passo 6 — Ciclo de vida do app: `AppLifecycle`

```csharp
// Caminho: Assets/_Project/Scripts/Core/AppLifecycle.cs
using UnityEngine;

namespace StarExpedition.Core
{
    /// Grava o save no fim de cada frame em que algo mudou, e sempre ao ir para segundo plano.
    public class AppLifecycle : MonoBehaviour
    {
        private void LateUpdate() => Services.Save?.SaveIfDirty();

        private void OnApplicationPause(bool paused)
        {
            // No Android, "pausa" = o app foi para segundo plano. Pode ser a última chance de gravar.
            if (paused) SaveNow();
        }

        private void OnApplicationQuit() => SaveNow();

        private static void SaveNow()
        {
            if (Services.Save == null) return;
            _ = Services.Clock?.UtcNow;   // atualiza a "última hora vista" antes de gravar
            Services.Save.SaveNow();
        }
    }
}
```

#### Passo 7 — Quem liga tudo: `GameBootstrap`

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameBootstrap.cs
using System;
using UnityEngine;

namespace StarExpedition.Core
{
    public static class GameBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Initialize()
        {
            Application.targetFrameRate = 60;

            var host = new GameObject("[Services]");
            UnityEngine.Object.DontDestroyOnLoad(host);

            CreateServices(host);
        }

        private static void CreateServices(GameObject host)
        {
            // --- Núcleo ---
            var save = new SaveService(new SaveStorage(Application.persistentDataPath));
            save.Load();
            var clock = new TrustedClock(save, () => DateTime.UtcNow);

            Services.Save = save;
            Services.Clock = clock;

            // Fase 2+: os próximos services são criados aqui, nesta ordem.

            host.AddComponent<AppLifecycle>();
            Debug.Log(save.IsNewGame ? "[Boot] Jogo novo." : "[Boot] Save carregado.");
        }
    }
}
```

> **Enter Play Mode sem recarregar o domínio:** se você ativar *Enter Play Mode Options → Do not reload Domain* (Play Mode mais rápido), campos estáticos sobrevivem entre execuções. Não há problema aqui: o `Initialize` roda de novo a cada Play e sobrescreve todas as propriedades de `Services`.

#### Passo 8 — Configuração base da Localization

1. **Edit → Project Settings → Localization → Create** → salve como `Assets/_Project/Localization/LocalizationSettings.asset`.
2. **Locale Generator** → marque **Portuguese (Brazil) (pt-BR)** e **English (en)** → **Generate Locales** em `Localization/`.
3. Em **Locale Selectors**, deixe a ordem: *Command Line*, *System Locale*, *Specific Locale* = `en` (fallback). Remova o *Player Prefs*: a escolha manual de idioma fica no save e é aplicada pelo `SettingsService` (Fase 13).
4. **Window → Asset Management → Localization Tables → New Table Collection** → tipo **String Table Collection**, nome `UI`, os dois locales → **Create** em `Localization/`.
5. Repita para uma segunda coleção chamada `Content` (nomes de classes, Items, Galaxies — preenchida pelo gerador da Fase 2).
6. Selecione cada coleção e, no Inspector, marque **Preload All Tables** (os textos ficam prontos na memória logo no Boot; o jogo nunca espera por eles no meio de uma tela).

E o atalho usado em todo código de UI:

```csharp
// Caminho: Assets/_Project/Scripts/Core/L.cs
using UnityEngine.Localization.Settings;

namespace StarExpedition.Core
{
    /// Atalho para textos da tabela "UI". Ex.: L.Get("planet.send"), L.Get("top.cycle", 2).
    public static class L
    {
        public const string UiTable = "UI";

        public static string Get(string key)
            => LocalizationSettings.StringDatabase.GetLocalizedString(UiTable, key);

        public static string Get(string key, params object[] args)
            => LocalizationSettings.StringDatabase.GetLocalizedString(UiTable, key, args);
    }
}
```

#### Passo 9 — A cena `Boot`: `BootSequence`

```csharp
// Caminho: Assets/_Project/Scripts/Core/BootSequence.cs
using System.Collections;
using UnityEngine;
using UnityEngine.Localization.Settings;
using UnityEngine.SceneManagement;

namespace StarExpedition.Core
{
    /// Mostra o logo enquanto prepara textos (e, a partir da Fase 11, consentimento,
    /// anúncios e compras), depois carrega a cena Main.
    public class BootSequence : MonoBehaviour
    {
        [SerializeField] private float _minimumLogoSeconds = 1.2f;

        private IEnumerator Start()
        {
            float started = Time.realtimeSinceStartup;

            yield return LocalizationSettings.InitializationOperation;

            // Fase 11: consentimento → anúncios → compras entram aqui.

            float remaining = _minimumLogoSeconds - (Time.realtimeSinceStartup - started);
            if (remaining > 0f) yield return new WaitForSecondsRealtime(remaining);

            SceneManager.LoadScene("Main");
        }
    }
}
```

Na cena `Boot`:
1. Crie `[Systems]` com um filho `BootSequence` (componente `BootSequence`).
2. Crie `[UI]` com um **Canvas** (Screen Space – Overlay), fundo `Slate 900` (`#1B2030`) e uma `Image` no centro para o logo (a arte chega na Fase 6).
3. Na **Main Camera**, **Background** = `#1B2030`.

#### Passo 10 — Commit

```powershell
git add .
git commit -m "Fase 1: bootstrap, save atômico versionado, relógio confiável, localização base"
```

#### ✅ Checkpoint da Fase 1
- Dar Play na cena `Boot`: o Console mostra `[Boot] Jogo novo.` e a cena `Main` carrega depois de ~1 s.
- Parar o Play: o arquivo `save.json` existe em `%userprofile%\AppData\LocalLow\MangueByteGames\Star Expedition Co.\`.
- Dar Play de novo: o Console mostra `[Boot] Save carregado.`
- Abrir o `save.json` num editor de texto, apagar metade do conteúdo e dar Play: o jogo carrega o `save.json.bak` (Console avisa "Arquivo corrompido, tentando o próximo").

#### Problemas comuns
- **`save.json` não aparece:** confira **Company Name** e **Product Name** no Player Settings (Fase 0): eles formam o caminho. `Debug.Log(Application.persistentDataPath)` mostra o caminho exato.
- **`LocalizationSettings` nulo / erro "No Localization Settings":** o Passo 8.1 não foi feito ou o asset não está marcado como ativo em **Project Settings → Localization**.
- **A cena Main não carrega:** confira se `Main` está na Scene List (Fase 0, Passo 7) com esse nome exato.

---

### Fase 2 — Dados: ScriptableObjects e gerador a partir da §16

> Objetivo: todas as Crew Classes, Items, Recipes, Planets e Galaxies do jogo existindo como assets, com os valores da §16 — sem digitar 80 assets à mão no Inspector.

**Conceitos novos:**
- **ScriptableObject:** um asset de dados editável no Inspector. Cada Planet é um arquivo `Planet_kora.asset`; o código lê os valores dele em vez de tê-los escritos no C#. Balancear o jogo = editar assets, sem recompilar.
- **`LocalizedString`:** um campo que aponta para uma entrada de uma tabela de localização (ex.: `Content/item.iron_ore`). Em jogo, `GetLocalizedString()` devolve o texto no idioma atual.
- **Script de Editor (`[MenuItem]`):** código que só roda dentro do Editor e aparece como item de menu. O `DatabaseSeeder` lê as tabelas da §16 (copiadas para dentro dele) e cria/atualiza todos os assets e textos num clique.
- **`Resources.Load`:** carrega um asset da pasta `Resources` pelo nome, sem referência de cena. Usamos só para o `GameDatabase`, que o `GameBootstrap` precisa antes de qualquer cena existir.

> **Fonte da verdade:** o gerador existe para criar o jogo a partir do GDD **uma vez**. Depois disso, quem manda são os assets. Rodar o gerador de novo **sobrescreve** os valores dos assets com os da §16 — ele pede confirmação antes. Para só religar sprites novos sem tocar em números, use **Star Expedition → Link Art** (Fase 6).

#### Passo 1 — Bônus: `CrewBonus`

Crew Classes e Equipment dão o mesmo tipo de bônus, então os dois usam a mesma estrutura, e somar bônus da Squad é somar structs.

```csharp
// Caminho: Assets/_Project/Scripts/Data/CrewBonus.cs
using System;

namespace StarExpedition.Data
{
    /// Bônus de uma Crew Class ou de um Equipment (GDD §3.1). Todos os valores em pontos inteiros.
    [Serializable]
    public struct CrewBonus
    {
        public int success;          // + pontos percentuais na chance de Success
        public int riskReduction;    // − pontos de Risk efetivo
        public int lootPercent;      // + % na quantidade de Loot
        public int rareChance;       // + pontos percentuais na chance de Rare Item
        public int lossReduction;    // − pontos percentuais na chance de Member Loss
        public int durationPercent;  // − % na duração da Expedition

        public static CrewBonus operator +(CrewBonus a, CrewBonus b) => new CrewBonus
        {
            success = a.success + b.success,
            riskReduction = a.riskReduction + b.riskReduction,
            lootPercent = a.lootPercent + b.lootPercent,
            rareChance = a.rareChance + b.rareChance,
            lossReduction = a.lossReduction + b.lossReduction,
            durationPercent = a.durationPercent + b.durationPercent,
        };
    }
}
```

#### Passo 2 — As definições

```csharp
// Caminho: Assets/_Project/Scripts/Data/CrewClassDefinition.cs
using System;
using UnityEngine;
using UnityEngine.Localization;

namespace StarExpedition.Data
{
    [CreateAssetMenu(menuName = "Star Expedition/Crew Class")]
    public class CrewClassDefinition : ScriptableObject
    {
        public string id;
        public LocalizedString displayName;
        public CrewBonus bonus;
        public int hireBaseCost;
        public Color accent = Color.white;
        public PortraitVariant[] variants = new PortraitVariant[3];

        public string DisplayName => displayName.GetLocalizedString();

        public Sprite[] PortraitFrames(int variant)
        {
            if (variants == null || variants.Length == 0) return Array.Empty<Sprite>();
            var v = variants[Mathf.Clamp(variant, 0, variants.Length - 1)];
            return v?.frames ?? Array.Empty<Sprite>();
        }
    }

    [Serializable]
    public class PortraitVariant
    {
        public Sprite[] frames;   // idle de 4 quadros (GDD §10.3)
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/ItemDefinition.cs
using System;
using UnityEngine;
using UnityEngine.Localization;

namespace StarExpedition.Data
{
    public enum ItemCategory { RawMaterial, Component, RareItem, Equipment }

    [CreateAssetMenu(menuName = "Star Expedition/Item")]
    public class ItemDefinition : ScriptableObject
    {
        public string id;
        public LocalizedString displayName;
        public ItemCategory category;
        public Sprite icon;
        public int sellPrice;
        [Tooltip("Só Equipment: Tech Tier de 1 a 4.")] public int tier;
        [Tooltip("Só Equipment: bônus ao equipar.")] public CrewBonus equipBonus;

        public string DisplayName => displayName.GetLocalizedString();
        public bool IsEquipment => category == ItemCategory.Equipment;
    }

    [Serializable]
    public class ItemAmount
    {
        public ItemDefinition item;
        public int amount = 1;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/RecipeDefinition.cs
using System.Collections.Generic;
using UnityEngine;

namespace StarExpedition.Data
{
    [CreateAssetMenu(menuName = "Star Expedition/Recipe")]
    public class RecipeDefinition : ScriptableObject
    {
        public string id;
        [Range(1, 4)] public int tier = 1;
        public List<ItemAmount> inputs = new List<ItemAmount>();
        public ItemDefinition output;
        public int outputAmount = 1;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/PlanetDefinition.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace StarExpedition.Data
{
    [CreateAssetMenu(menuName = "Star Expedition/Planet")]
    public class PlanetDefinition : ScriptableObject
    {
        public string id;
        [Tooltip("Nome próprio: igual em todos os idiomas.")] public string displayName;
        [Range(0, 100)] public int baseRisk;
        public int durationSeconds;
        public List<LootEntry> lootTable = new List<LootEntry>();
        [Tooltip("Textura plana e repetível da superfície (Fase 6).")] public Texture2D surface;
        [Tooltip("Posição no mapa da Galaxy, de (0,0) embaixo à esquerda a (1,1) em cima à direita.")]
        public Vector2 mapPosition;
    }

    [Serializable]
    public class LootEntry
    {
        public ItemDefinition item;
        [Range(0f, 1f)] public float chance = 1f;
        public int min = 1;
        public int max = 1;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Data/GalaxyDefinition.cs
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Localization;

namespace StarExpedition.Data
{
    [CreateAssetMenu(menuName = "Star Expedition/Galaxy")]
    public class GalaxyDefinition : ScriptableObject
    {
        public string id;
        public LocalizedString displayName;
        public Sprite background;
        public Color accent = Color.white;
        public List<PlanetDefinition> planets = new List<PlanetDefinition>();

        public string DisplayName => displayName.GetLocalizedString();
    }
}
```

#### Passo 3 — Constantes de balanceamento: `GameBalance`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameBalance.cs
using System.Collections.Generic;
using UnityEngine;

namespace StarExpedition.Data
{
    /// Todas as constantes da §16.2 num único asset.
    [CreateAssetMenu(menuName = "Star Expedition/Game Balance")]
    public class GameBalance : ScriptableObject
    {
        [Header("Chance de Success (%)")]
        public int baseSuccess = 95;
        public int minSuccess = 5;
        public int maxSuccess = 98;

        [Header("Member Loss na Failure (%)")]
        public int baseLoss = 25;
        public float lossPerRisk = 0.4f;
        public int maxLoss = 90;

        [Header("Duração")]
        public int maxDurationReductionPercent = 60;
        public int minDurationSeconds = 30;
        public int tutorialDurationSeconds = 30;

        [Header("Cycles (por Cycle acima do 1º)")]
        public int cycleRiskStep = 8;
        public int cycleLootPercent = 25;
        public int cycleRareChance = 2;

        [Header("Tripulação")]
        public int minSquadSize = 1;
        public int maxSquadSize = 3;
        public float hireCostGrowth = 1.25f;
        public List<CrewClassDefinition> starterClasses = new List<CrewClassDefinition>();
        public CrewClassDefinition emergencyClass;

        [Header("Tech Tiers: [0] = Planet que libera o Tier 1 ... [3] = Tier 4")]
        public List<PlanetDefinition> tierUnlockPlanets = new List<PlanetDefinition>();

        [Header("Tutorial (GDD §9)")]
        public List<ItemAmount> tutorialLoot = new List<ItemAmount>();

        [Header("Founder Pack (GDD §13.2)")]
        public int founderCredits = 600;
        public CrewClassDefinition founderClass;
    }
}
```

#### Passo 4 — O índice de tudo: `GameDatabase`

```csharp
// Caminho: Assets/_Project/Scripts/Data/GameDatabase.cs
using System.Collections.Generic;
using UnityEngine;

namespace StarExpedition.Data
{
    /// Todos os dados do jogo. Fica em Resources/GameDatabase.asset.
    [CreateAssetMenu(menuName = "Star Expedition/Game Database")]
    public class GameDatabase : ScriptableObject
    {
        public GameBalance balance;
        public List<CrewClassDefinition> classes = new List<CrewClassDefinition>();
        public List<ItemDefinition> items = new List<ItemDefinition>();
        public List<RecipeDefinition> recipes = new List<RecipeDefinition>();
        public List<GalaxyDefinition> galaxies = new List<GalaxyDefinition>();

        private Dictionary<string, CrewClassDefinition> _classById;
        private Dictionary<string, ItemDefinition> _itemById;
        private Dictionary<string, PlanetDefinition> _planetById;
        private Dictionary<PlanetDefinition, GalaxyDefinition> _galaxyOfPlanet;
        private List<PlanetDefinition> _planetsInOrder;

        /// Monta os índices. Chamado uma vez pelo GameBootstrap (e pelos testes).
        public void Initialize()
        {
            _classById = new Dictionary<string, CrewClassDefinition>();
            foreach (var c in classes) _classById[c.id] = c;

            _itemById = new Dictionary<string, ItemDefinition>();
            foreach (var i in items) _itemById[i.id] = i;

            _planetById = new Dictionary<string, PlanetDefinition>();
            _galaxyOfPlanet = new Dictionary<PlanetDefinition, GalaxyDefinition>();
            _planetsInOrder = new List<PlanetDefinition>();
            foreach (var g in galaxies)
            foreach (var p in g.planets)
            {
                _planetById[p.id] = p;
                _galaxyOfPlanet[p] = g;
                _planetsInOrder.Add(p);
            }
        }

        public CrewClassDefinition GetClass(string id) => id != null && _classById.TryGetValue(id, out var c) ? c : null;
        public ItemDefinition GetItem(string id) => id != null && _itemById.TryGetValue(id, out var i) ? i : null;
        public PlanetDefinition GetPlanet(string id) => id != null && _planetById.TryGetValue(id, out var p) ? p : null;

        /// Os 18 Planets na ordem linear de desbloqueio (GDD §4.1).
        public IReadOnlyList<PlanetDefinition> Planets => _planetsInOrder;
        public int PlanetCount => _planetsInOrder.Count;
        public int IndexOf(PlanetDefinition planet) => _planetsInOrder.IndexOf(planet);
        public PlanetDefinition PlanetAt(int index) => _planetsInOrder[Mathf.Clamp(index, 0, _planetsInOrder.Count - 1)];
        public GalaxyDefinition GalaxyOf(PlanetDefinition planet) => _galaxyOfPlanet.TryGetValue(planet, out var g) ? g : null;
    }
}
```

#### Passo 5 — Acrescentar o banco aos services

Em `Services.cs`, acrescente (e o `using StarExpedition.Data;` no topo):

```csharp
        public static GameDatabase Database { get; internal set; }
```

Em `GameBootstrap.CreateServices`, **antes** de criar o save:

```csharp
            var database = Resources.Load<GameDatabase>("GameDatabase");
            if (database == null)
            {
                Debug.LogError("[Boot] Resources/GameDatabase.asset não encontrado. Rode Star Expedition → Seed Database.");
                return;
            }
            database.Initialize();
            Services.Database = database;
```

(com `using StarExpedition.Data;` no topo do arquivo).

#### Passo 6 — O gerador: `DatabaseSeeder`

É um script longo, mas mecânico: as tabelas da §16 viram arrays, e cada linha vira um asset. Os textos pt-BR/en vão direto para a tabela `Content` da Localization.

```csharp
// Caminho: Assets/_Project/Scripts/Editor/DatabaseSeeder.cs
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using StarExpedition.Data;
using UnityEditor;
using UnityEditor.Localization;
using UnityEngine;
using UnityEngine.Localization;
using UnityEngine.Localization.Tables;

namespace StarExpedition.EditorTools
{
    /// Cria/atualiza todos os ScriptableObjects do jogo a partir das tabelas da §16 do GDD.
    public static class DatabaseSeeder
    {
        private const string DataRoot = "Assets/_Project/Data";
        private const string ArtRoot = "Assets/_Project/Art";
        private const string DatabasePath = "Assets/_Project/Resources/GameDatabase.asset";
        private const string BalancePath = DataRoot + "/GameBalance.asset";

        // ---------- §16.1 Crew Classes ----------
        private static readonly (string id, string pt, string en, string bonus, int cost, string color)[] ClassRows =
        {
            ("scout",     "Batedor",    "Scout",     "success=12",  60, "#5EC46B"),
            ("engineer",  "Engenheiro", "Engineer",  "loot=40",     60, "#F2A33A"),
            ("guard",     "Guarda",     "Guard",     "risk=10",     60, "#8A96B8"),
            ("scientist", "Cientista",  "Scientist", "rare=4",     120, "#B07CFF"),
            ("medic",     "Médico",     "Medic",     "loss=20",    120, "#4FC3C9"),
            ("pilot",     "Piloto",     "Pilot",     "duration=25",120, "#FF8A3D"),
        };

        // ---------- §16.4 Items (sem Equipment) ----------
        private static readonly (string id, string pt, string en, ItemCategory cat, int sell)[] ItemRows =
        {
            ("iron_ore",         "Minério de Ferro",            "Iron Ore",          ItemCategory.RawMaterial, 2),
            ("silica_sand",      "Areia de Sílica",             "Silica Sand",       ItemCategory.RawMaterial, 2),
            ("ice_crystal",      "Cristal de Gelo",             "Ice Crystal",       ItemCategory.RawMaterial, 3),
            ("carbon_dust",      "Pó de Carbono",               "Carbon Dust",       ItemCategory.RawMaterial, 4),
            ("titanium_ore",     "Minério de Titânio",          "Titanium Ore",      ItemCategory.RawMaterial, 6),
            ("helium3",          "Hélio-3",                     "Helium-3",          ItemCategory.RawMaterial, 8),
            ("plasma_moss",      "Musgo de Plasma",             "Plasma Moss",       ItemCategory.RawMaterial, 10),
            ("void_dust",        "Pó do Vazio",                 "Void Dust",         ItemCategory.RawMaterial, 14),
            ("circuit_board",    "Placa de Circuito",           "Circuit Board",     ItemCategory.Component, 10),
            ("power_cell",       "Célula de Energia",           "Power Cell",        ItemCategory.Component, 14),
            ("alloy_plate",      "Placa de Liga",               "Alloy Plate",       ItemCategory.Component, 22),
            ("optical_lens",     "Lente Óptica",                "Optical Lens",      ItemCategory.Component, 26),
            ("fuel_rod",         "Barra de Combustível",        "Fuel Rod",          ItemCategory.Component, 34),
            ("nano_gel",         "Nanogel",                     "Nano Gel",          ItemCategory.Component, 45),
            ("quantum_chip",     "Chip Quântico",               "Quantum Chip",      ItemCategory.Component, 60),
            ("graviton_coil",    "Bobina de Gráviton",          "Graviton Coil",     ItemCategory.Component, 80),
            ("alien_relic",      "Relíquia Alienígena",         "Alien Relic",       ItemCategory.RareItem, 80),
            ("star_pearl",       "Pérola Estelar",              "Star Pearl",        ItemCategory.RareItem, 120),
            ("living_crystal",   "Cristal Vivo",                "Living Crystal",    ItemCategory.RareItem, 200),
            ("dark_matter",      "Fragmento de Matéria Escura", "Dark Matter Shard", ItemCategory.RareItem, 350),
            ("ancient_core",     "Núcleo Ancestral",            "Ancient Core",      ItemCategory.RareItem, 450),
            ("singularity_seed", "Semente da Singularidade",    "Singularity Seed",  ItemCategory.RareItem, 1200),
        };

        // ---------- §16.5 Recipes (cada uma cria um Equipment) ----------
        private static readonly int[] EquipmentSellByTier = { 0, 30, 90, 250, 600 };

        private static readonly (int tier, string id, string pt, string en, string inputs, string bonus)[] RecipeRows =
        {
            (1, "field_scanner",    "Scanner de Campo",           "Field Scanner",    "iron_ore:6,circuit_board:1",                     "success=5"),
            (1, "padded_suit",      "Traje Acolchoado",           "Padded Suit",      "silica_sand:8,carbon_dust:4",                    "risk=4"),
            (1, "salvage_kit",      "Kit de Coleta",              "Salvage Kit",      "iron_ore:6,silica_sand:4",                       "loot=15"),
            (1, "emergency_beacon", "Sinalizador de Emergência",  "Emergency Beacon", "ice_crystal:6,power_cell:1",                     "loss=8"),
            (2, "deep_scanner",     "Scanner Profundo",           "Deep Scanner",     "field_scanner:1,titanium_ore:8,optical_lens:1",  "success=10"),
            (2, "alloy_armor",      "Armadura de Liga",           "Alloy Armor",      "padded_suit:1,alloy_plate:2,titanium_ore:6",     "risk=8"),
            (2, "drill_rig",        "Perfuratriz",                "Drill Rig",        "salvage_kit:1,helium3:5,power_cell:2",           "loot=30"),
            (2, "stasis_pod",       "Cápsula de Estase",          "Stasis Pod",       "emergency_beacon:1,helium3:4,star_pearl:1",      "loss=15"),
            (3, "quantum_scanner",  "Scanner Quântico",           "Quantum Scanner",  "deep_scanner:1,quantum_chip:1,optical_lens:2",   "success=16"),
            (3, "shield_harness",   "Arnês de Escudo",            "Shield Harness",   "alloy_armor:1,fuel_rod:2,plasma_moss:6",         "risk=13"),
            (3, "nano_forge",       "Nanoforja",                  "Nano Forge",       "drill_rig:1,nano_gel:2,living_crystal:1",        "loot=50;rare=2"),
            (3, "phase_cloak",      "Manto de Fase",              "Phase Cloak",      "stasis_pod:1,void_dust:5,fuel_rod:1",            "loss=22;risk=4"),
            (4, "oracle_array",     "Matriz Oráculo",             "Oracle Array",     "quantum_scanner:1,quantum_chip:2,dark_matter:1", "success=24"),
            (4, "graviton_aegis",   "Égide de Gráviton",          "Graviton Aegis",   "shield_harness:1,graviton_coil:2,ancient_core:1","risk=20"),
            (4, "matter_weaver",    "Tecelã de Matéria",          "Matter Weaver",    "nano_forge:1,graviton_coil:1,dark_matter:1,nano_gel:2", "loot=75;rare=3"),
            (4, "lazarus_module",   "Módulo Lázaro",              "Lazarus Module",   "phase_cloak:1,ancient_core:1,living_crystal:2",  "loss=30;risk=8"),
        };

        // ---------- §16.3 Galaxies e Planets ----------
        private static readonly (string pt, string en, string color)[] GalaxyRows =
        {
            ("Cinturão Mangue", "Mangrove Belt", "#5EC46B"),
            ("Nebulosa Âmbar",  "Amber Nebula",  "#F2A33A"),
            ("Abismo de Vega",  "Vega Abyss",    "#B07CFF"),
        };

        // loot: "itemId:chance:min-max", separados por vírgula
        private static readonly (int galaxy, string id, string name, int risk, int seconds, string loot)[] PlanetRows =
        {
            (1, "kora",     "Kora",             5,    60, "iron_ore:1:3-5,silica_sand:0.7:2-3,alien_relic:0.01:1-1"),
            (1, "rust9",    "Rust-9",          10,   120, "iron_ore:0.9:4-6,circuit_board:0.35:1-2,alien_relic:0.015:1-1"),
            (1, "glacia",   "Glacia",          14,   240, "ice_crystal:1:3-5,silica_sand:0.6:2-4,alien_relic:0.02:1-1"),
            (1, "tamarin",  "Tamarin",         18,   360, "carbon_dust:0.9:3-5,circuit_board:0.45:1-2,star_pearl:0.02:1-1"),
            (1, "duna",     "Duna",            24,   600, "silica_sand:1:5-8,power_cell:0.35:1-2,alien_relic:0.03:1-1"),
            (1, "coral",    "Coral Prime",     30,   900, "ice_crystal:0.8:4-6,carbon_dust:0.8:3-5,power_cell:0.45:1-2,star_pearl:0.03:1-1"),
            (2, "ember",    "Ember",           35,   900, "titanium_ore:1:3-5,carbon_dust:0.7:3-5,star_pearl:0.03:1-1"),
            (2, "halcyon",  "Halcyon",         40,  1200, "helium3:0.9:2-4,power_cell:0.5:1-2,living_crystal:0.03:1-1"),
            (2, "mire",     "Mire",            45,  1800, "titanium_ore:0.9:4-6,alloy_plate:0.4:1-2,star_pearl:0.04:1-1"),
            (2, "vitra",    "Vitra",           50,  2400, "silica_sand:0.9:6-9,optical_lens:0.4:1-2,living_crystal:0.04:1-1"),
            (2, "obsidia",  "Obsidia",         55,  3000, "titanium_ore:0.8:5-7,alloy_plate:0.5:1-3,living_crystal:0.05:1-1"),
            (2, "lumen",    "Lumen",           60,  3600, "helium3:0.9:3-5,optical_lens:0.5:1-2,fuel_rod:0.3:1-1,living_crystal:0.06:1-1"),
            (3, "vegarift", "Vega Rift",       65,  3600, "plasma_moss:1:3-5,fuel_rod:0.45:1-2,dark_matter:0.04:1-1"),
            (3, "hollow",   "Hollow",          70,  5400, "void_dust:0.9:2-4,nano_gel:0.4:1-2,ancient_core:0.04:1-1"),
            (3, "nyx",      "Nyx",             75,  7200, "plasma_moss:0.9:4-6,quantum_chip:0.35:1-1,dark_matter:0.05:1-1"),
            (3, "cinder",   "Cinder Crown",    80,  9000, "titanium_ore:0.9:6-9,graviton_coil:0.35:1-1,ancient_core:0.05:1-1"),
            (3, "echo",     "Echo",            85, 10800, "void_dust:0.9:4-6,quantum_chip:0.45:1-2,nano_gel:0.45:1-2,dark_matter:0.06:1-1"),
            (3, "gate",     "Singularity Gate",90, 14400, "void_dust:1:5-8,graviton_coil:0.5:1-2,singularity_seed:0.05:1-1,ancient_core:0.06:1-1"),
        };

        /// Caminho em zigue-zague de baixo para cima; as Galaxies pares espelham na horizontal.
        private static readonly Vector2[] MapPath =
        {
            new Vector2(0.30f, 0.10f), new Vector2(0.70f, 0.26f), new Vector2(0.35f, 0.42f),
            new Vector2(0.68f, 0.58f), new Vector2(0.30f, 0.74f), new Vector2(0.62f, 0.90f),
        };

        [MenuItem("Star Expedition/Seed Database (GDD §16)")]
        public static void Seed()
        {
            if (!EditorUtility.DisplayDialog("Seed Database",
                    "Criar/atualizar todos os dados com os valores da §16 do GDD?\n\n" +
                    "Valores editados à mão nos assets serão SOBRESCRITOS.", "Gerar", "Cancelar"))
                return;

            var content = LocalizationEditorSettings.GetStringTableCollection("Content");
            if (content == null)
            {
                EditorUtility.DisplayDialog("Seed Database", "Crie a String Table Collection 'Content' (Fase 1, Passo 8).", "OK");
                return;
            }

            foreach (var folder in new[] { "Classes", "Items", "Recipes", "Planets", "Galaxies" })
                EnsureFolder($"{DataRoot}/{folder}");
            EnsureFolder("Assets/_Project/Resources");

            var classes = SeedClasses(content);
            var items = SeedItems(content);
            var recipes = SeedRecipes(content, items);
            var galaxies = SeedGalaxies(content, items);
            var balance = SeedBalance(classes, items, galaxies);

            var db = LoadOrCreate<GameDatabase>(DatabasePath);
            db.balance = balance;
            db.classes = classes;
            db.items = items.Values.ToList();
            db.recipes = recipes;
            db.galaxies = galaxies;
            EditorUtility.SetDirty(db);

            LinkArt();
            AssetDatabase.SaveAssets();
            Debug.Log($"[Seeder] {classes.Count} classes, {items.Count} items, {recipes.Count} recipes, " +
                      $"{galaxies.Sum(g => g.planets.Count)} planets.");
        }

        /// Liga sprites e texturas da pasta Art aos assets pelo nome do arquivo, sem mexer em números.
        [MenuItem("Star Expedition/Link Art")]
        public static void LinkArt()
        {
            var db = AssetDatabase.LoadAssetAtPath<GameDatabase>(DatabasePath);
            if (db == null) { Debug.LogWarning("[Seeder] Rode o Seed Database primeiro."); return; }

            int missing = 0;
            foreach (var c in db.classes)
            {
                var en = ClassRows.First(r => r.id == c.id).en;
                c.variants = new PortraitVariant[3];
                for (int v = 0; v < 3; v++)
                {
                    var frames = AssetDatabase.LoadAllAssetsAtPath($"{ArtRoot}/Crew/SPR_Crew_{en}_{v + 1}.png")
                        .OfType<Sprite>().OrderBy(s => s.name, StringComparer.Ordinal).ToArray();
                    if (frames.Length == 0) missing++;
                    c.variants[v] = new PortraitVariant { frames = frames };
                }
                EditorUtility.SetDirty(c);
            }

            foreach (var item in db.items)
            {
                item.icon = AssetDatabase.LoadAssetAtPath<Sprite>($"{ArtRoot}/Items/SPR_Item_{item.id}.png");
                if (item.icon == null) missing++;
                EditorUtility.SetDirty(item);
            }

            for (int g = 0; g < db.galaxies.Count; g++)
            {
                var galaxy = db.galaxies[g];
                galaxy.background = AssetDatabase.LoadAssetAtPath<Sprite>($"{ArtRoot}/Backgrounds/SPR_Bg_Galaxy{g + 1}.png");
                if (galaxy.background == null) missing++;
                foreach (var p in galaxy.planets)
                {
                    p.surface = AssetDatabase.LoadAssetAtPath<Texture2D>($"{ArtRoot}/Planets/SPR_Planet_{p.id}_Surface.png");
                    if (p.surface == null) missing++;
                    EditorUtility.SetDirty(p);
                }
                EditorUtility.SetDirty(galaxy);
            }

            AssetDatabase.SaveAssets();
            Debug.Log(missing == 0 ? "[Seeder] Toda a arte ligada." : $"[Seeder] Arte ligada; {missing} arquivos ainda não existem.");
        }

        // ------------------------------------------------------------------

        private static List<CrewClassDefinition> SeedClasses(StringTableCollection content)
        {
            var list = new List<CrewClassDefinition>();
            foreach (var r in ClassRows)
            {
                var c = LoadOrCreate<CrewClassDefinition>($"{DataRoot}/Classes/Class_{r.id}.asset");
                c.id = r.id;
                c.displayName = SetText(content, $"class.{r.id}", r.pt, r.en);
                c.bonus = ParseBonus(r.bonus);
                c.hireBaseCost = r.cost;
                ColorUtility.TryParseHtmlString(r.color, out c.accent);
                EditorUtility.SetDirty(c);
                list.Add(c);
            }
            return list;
        }

        private static Dictionary<string, ItemDefinition> SeedItems(StringTableCollection content)
        {
            var items = new Dictionary<string, ItemDefinition>();
            foreach (var r in ItemRows)
            {
                var i = LoadOrCreate<ItemDefinition>($"{DataRoot}/Items/Item_{r.id}.asset");
                i.id = r.id;
                i.displayName = SetText(content, $"item.{r.id}", r.pt, r.en);
                i.category = r.cat;
                i.sellPrice = r.sell;
                i.tier = 0;
                i.equipBonus = default;
                EditorUtility.SetDirty(i);
                items[r.id] = i;
            }
            foreach (var r in RecipeRows)
            {
                var e = LoadOrCreate<ItemDefinition>($"{DataRoot}/Items/Item_{r.id}.asset");
                e.id = r.id;
                e.displayName = SetText(content, $"item.{r.id}", r.pt, r.en);
                e.category = ItemCategory.Equipment;
                e.sellPrice = EquipmentSellByTier[r.tier];
                e.tier = r.tier;
                e.equipBonus = ParseBonus(r.bonus);
                EditorUtility.SetDirty(e);
                items[r.id] = e;
            }
            return items;
        }

        private static List<RecipeDefinition> SeedRecipes(StringTableCollection content, Dictionary<string, ItemDefinition> items)
        {
            var list = new List<RecipeDefinition>();
            foreach (var r in RecipeRows)
            {
                var recipe = LoadOrCreate<RecipeDefinition>($"{DataRoot}/Recipes/Recipe_{r.id}.asset");
                recipe.id = r.id;
                recipe.tier = r.tier;
                recipe.output = items[r.id];
                recipe.outputAmount = 1;
                recipe.inputs = r.inputs.Split(',').Select(part =>
                {
                    var kv = part.Split(':');
                    return new ItemAmount { item = items[kv[0]], amount = int.Parse(kv[1]) };
                }).ToList();
                EditorUtility.SetDirty(recipe);
                list.Add(recipe);
            }
            return list;
        }

        private static List<GalaxyDefinition> SeedGalaxies(StringTableCollection content, Dictionary<string, ItemDefinition> items)
        {
            var galaxies = new List<GalaxyDefinition>();
            for (int g = 0; g < GalaxyRows.Length; g++)
            {
                var row = GalaxyRows[g];
                var galaxy = LoadOrCreate<GalaxyDefinition>($"{DataRoot}/Galaxies/Galaxy_{g + 1}.asset");
                galaxy.id = $"galaxy{g + 1}";
                galaxy.displayName = SetText(content, $"galaxy.{g + 1}", row.pt, row.en);
                ColorUtility.TryParseHtmlString(row.color, out galaxy.accent);
                galaxy.planets = new List<PlanetDefinition>();

                var rows = PlanetRows.Where(p => p.galaxy == g + 1).ToList();
                for (int i = 0; i < rows.Count; i++)
                {
                    var r = rows[i];
                    var planet = LoadOrCreate<PlanetDefinition>($"{DataRoot}/Planets/Planet_{r.id}.asset");
                    planet.id = r.id;
                    planet.displayName = r.name;
                    planet.baseRisk = r.risk;
                    planet.durationSeconds = r.seconds;
                    planet.lootTable = ParseLoot(r.loot, items);
                    var pos = MapPath[i];
                    planet.mapPosition = g % 2 == 1 ? new Vector2(1f - pos.x, pos.y) : pos;
                    EditorUtility.SetDirty(planet);
                    galaxy.planets.Add(planet);
                }
                EditorUtility.SetDirty(galaxy);
                galaxies.Add(galaxy);
            }
            return galaxies;
        }

        private static GameBalance SeedBalance(List<CrewClassDefinition> classes, Dictionary<string, ItemDefinition> items,
                                               List<GalaxyDefinition> galaxies)
        {
            var b = LoadOrCreate<GameBalance>(BalancePath);
            var fresh = ScriptableObject.CreateInstance<GameBalance>();   // valores padrão = §16.2
            EditorUtility.CopySerialized(fresh, b);
            UnityEngine.Object.DestroyImmediate(fresh);

            CrewClassDefinition Class(string id) => classes.First(c => c.id == id);
            PlanetDefinition Planet(string id) => galaxies.SelectMany(g => g.planets).First(p => p.id == id);

            b.starterClasses = new List<CrewClassDefinition> { Class("scout"), Class("engineer"), Class("guard") };
            b.emergencyClass = Class("scout");
            b.founderClass = Class("medic");
            b.tierUnlockPlanets = new List<PlanetDefinition> { Planet("kora"), Planet("ember"), Planet("vegarift"), Planet("cinder") };
            b.tutorialLoot = new List<ItemAmount>
            {
                new ItemAmount { item = items["iron_ore"], amount = 8 },
                new ItemAmount { item = items["silica_sand"], amount = 5 },
            };
            EditorUtility.SetDirty(b);
            return b;
        }

        // ------------------------------------------------------------------

        private static CrewBonus ParseBonus(string text)
        {
            var b = new CrewBonus();
            foreach (var part in text.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries))
            {
                var kv = part.Split('=');
                int v = int.Parse(kv[1], CultureInfo.InvariantCulture);
                switch (kv[0])
                {
                    case "success": b.success = v; break;
                    case "risk": b.riskReduction = v; break;
                    case "loot": b.lootPercent = v; break;
                    case "rare": b.rareChance = v; break;
                    case "loss": b.lossReduction = v; break;
                    case "duration": b.durationPercent = v; break;
                    default: throw new ArgumentException($"Bônus desconhecido: {kv[0]}");
                }
            }
            return b;
        }

        private static List<LootEntry> ParseLoot(string text, Dictionary<string, ItemDefinition> items)
        {
            return text.Split(',').Select(part =>
            {
                var f = part.Split(':');
                var range = f[2].Split('-');
                return new LootEntry
                {
                    item = items[f[0]],
                    chance = float.Parse(f[1], CultureInfo.InvariantCulture),
                    min = int.Parse(range[0]),
                    max = int.Parse(range[1]),
                };
            }).ToList();
        }

        private static LocalizedString SetText(StringTableCollection collection, string key, string pt, string en)
        {
            foreach (var (code, text) in new[] { ("pt-BR", pt), ("en", en) })
            {
                if (collection.GetTable(code) is StringTable table)
                {
                    table.AddEntry(key, text);
                    EditorUtility.SetDirty(table);
                }
                else Debug.LogWarning($"[Seeder] A tabela '{collection.TableCollectionName}' não tem o locale {code}.");
            }
            EditorUtility.SetDirty(collection.SharedData);
            return new LocalizedString(collection.TableCollectionName, key);
        }

        private static T LoadOrCreate<T>(string path) where T : ScriptableObject
        {
            var asset = AssetDatabase.LoadAssetAtPath<T>(path);
            if (asset != null) return asset;
            asset = ScriptableObject.CreateInstance<T>();
            AssetDatabase.CreateAsset(asset, path);
            return asset;
        }

        private static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            var parent = System.IO.Path.GetDirectoryName(path)!.Replace('\\', '/');
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, System.IO.Path.GetFileName(path));
        }
    }
}
```

> **Por que o nome do Planet não passa pela tabela `Content`?** Nomes próprios (Kora, Rust-9) são iguais nos dois idiomas (GDD §16.3). Menos entradas para traduzir, menos chance de esquecer uma.

#### Passo 7 — Gerar

1. Menu **Star Expedition → Seed Database (GDD §16)** → **Gerar**.
2. O Console mostra `[Seeder] 6 classes, 38 items, 16 recipes, 18 planets.` e um aviso de arte faltando (normal: a arte chega na Fase 6).

#### Passo 8 — Commit

```powershell
git add .
git commit -m "Fase 2: ScriptableObjects de dados e gerador a partir do GDD §16"
```

#### ✅ Checkpoint da Fase 2
- `Data/` tem 6 `Class_*`, 38 `Item_*`, 16 `Recipe_*`, 18 `Planet_*`, 3 `Galaxy_*` e o `GameBalance`.
- `Resources/GameDatabase.asset` lista tudo. Abra `Planet_gate`: Risk 90, duração 14400, 4 entradas de Loot.
- **Window → Asset Management → Localization Tables → Content**: as colunas pt-BR e en estão preenchidas (ex.: `item.iron_ore` = "Minério de Ferro" / "Iron Ore").
- Dar Play na cena `Boot` não mostra o erro "GameDatabase.asset não encontrado".

#### Problemas comuns
- **`The type or namespace 'UnityEditor.Localization' could not be found`:** a asmdef `StarExpedition.Editor` precisa referenciar `Unity.Localization.Editor` (Fase 0, Passo 5).
- **`KeyNotFoundException` ao gerar:** um id de Item escrito errado numa Recipe ou Loot Table. A mensagem mostra o id; corrija a linha e gere de novo.
- **Os textos aparecem como "No translation found" em jogo:** a coleção precisa se chamar exatamente `Content`, com locales de código `pt-BR` e `en`.

---

### Fase 3 — Tripulação, inventário, Credits e progresso

> Objetivo: as regras de Roster (Starter Pick, Hire com preço crescente, Equip, Member Loss, Emergency Recruit), do inventário, dos Credits e do desbloqueio linear de Planets e Tech Tiers.

**Conceitos novos:**
- **Service de domínio:** uma classe C# comum que é a **única** dona de uma parte do `SaveData`. Só o `WalletService` mexe em `credits`; só o `CrewService` mexe em `roster`. Se os Credits estiverem errados, só há um lugar para procurar.
- **Eventos C# (`event Action`):** o service avisa "algo mudou" sem saber quem está ouvindo. A UI (Fase 8), o tutorial (Fase 9) e o analytics (Fase 12) se inscrevem sem que o service precise conhecê-los.
- **Injeção de dependência pelo construtor:** cada service recebe no construtor os outros de que precisa. As dependências ficam visíveis na assinatura, e os testes (Fase 14) podem montar services com dados de teste.

#### Passo 1 — Credits: `WalletService`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/WalletService.cs
using System;
using StarExpedition.Core;

namespace StarExpedition.Economy
{
    /// Dono único dos Credits (GDD §7).
    public class WalletService
    {
        private readonly SaveService _save;

        public event Action<int> Changed;

        public WalletService(SaveService save) => _save = save;

        public int Credits => _save.Data.credits;

        public void Add(int amount)
        {
            if (amount <= 0) return;
            _save.Data.credits += amount;
            _save.MarkDirty();
            Changed?.Invoke(Credits);
        }

        public bool TrySpend(int amount)
        {
            if (amount < 0 || _save.Data.credits < amount) return false;
            _save.Data.credits -= amount;
            _save.MarkDirty();
            Changed?.Invoke(Credits);
            return true;
        }
    }
}
```

#### Passo 2 — Inventário: `InventoryService`

```csharp
// Caminho: Assets/_Project/Scripts/Items/InventoryService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;

namespace StarExpedition.Items
{
    /// Dono único do inventário. Equipment equipado NÃO está aqui: está no Crew Member.
    public class InventoryService
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;

        public event Action Changed;

        public InventoryService(SaveService save, GameDatabase db)
        {
            _save = save;
            _db = db;
        }

        public IReadOnlyList<ItemStack> Stacks => _save.Data.inventory;

        public int Count(string itemId)
            => _save.Data.inventory.FirstOrDefault(s => s.itemId == itemId)?.quantity ?? 0;

        public bool HasAll(IEnumerable<ItemAmount> required)
            => required.All(r => Count(r.item.id) >= r.amount);

        public void Add(string itemId, int amount)
        {
            if (amount <= 0 || _db.GetItem(itemId) == null) return;
            var stack = _save.Data.inventory.FirstOrDefault(s => s.itemId == itemId);
            if (stack == null) _save.Data.inventory.Add(new ItemStack(itemId, amount));
            else stack.quantity += amount;
            _save.MarkDirty();
            Changed?.Invoke();
        }

        public bool TryRemove(string itemId, int amount)
        {
            var stack = _save.Data.inventory.FirstOrDefault(s => s.itemId == itemId);
            if (amount <= 0 || stack == null || stack.quantity < amount) return false;
            stack.quantity -= amount;
            if (stack.quantity == 0) _save.Data.inventory.Remove(stack);
            _save.MarkDirty();
            Changed?.Invoke();
            return true;
        }

        /// Equipments soltos no inventário (para o painel de equipar).
        public IEnumerable<ItemDefinition> OwnedEquipment()
            => _save.Data.inventory
                .Select(s => _db.GetItem(s.itemId))
                .Where(i => i != null && i.IsEquipment)
                .OrderBy(i => i.tier);
    }
}
```

#### Passo 3 — Nomes: `NameGenerator`

Nomes curtos (cabem na UI de 360 px) e neutros, iguais em pt e en (GDD §3.2).

```csharp
// Caminho: Assets/_Project/Scripts/Crew/NameGenerator.cs
using System;
using System.Collections.Generic;
using System.Linq;

namespace StarExpedition.Crew
{
    public class NameGenerator
    {
        private static readonly string[] FirstNames =
        {
            "Ana", "Bia", "Caio", "Davi", "Edu", "Fe", "Gil", "Ian", "Jade", "Kai",
            "Lia", "Leo", "Mei", "Nina", "Otto", "Paz", "Rui", "Sol", "Tito", "Uri",
            "Vera", "Zoe", "Ravi", "Iara", "Noah", "Maya", "Theo", "Luna", "Omar", "Ines",
        };

        private static readonly string[] LastNames =
        {
            "Moura", "Kato", "Silva", "Okafor", "Lind", "Rocha", "Tanaka", "Costa", "Novak", "Reyes",
            "Arruda", "Kim", "Lopes", "Ivanov", "Duarte", "Sato", "Brito", "Nunes", "Pereira", "Mendes",
        };

        private readonly Random _rng;

        public NameGenerator(Random rng) => _rng = rng;

        /// Um nome que ainda não existe no Roster, se possível.
        public string Next(IEnumerable<string> namesInUse)
        {
            var used = new HashSet<string>(namesInUse ?? Enumerable.Empty<string>());
            for (int attempt = 0; attempt < 50; attempt++)
            {
                string name = $"{FirstNames[_rng.Next(FirstNames.Length)]} {LastNames[_rng.Next(LastNames.Length)]}";
                if (!used.Contains(name)) return name;
            }
            return $"{FirstNames[_rng.Next(FirstNames.Length)]} {_rng.Next(10, 99)}";
        }
    }
}
```

#### Passo 4 — Tripulação: `CrewService`

```csharp
// Caminho: Assets/_Project/Scripts/Crew/CrewService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.Economy;
using StarExpedition.Items;

namespace StarExpedition.Crew
{
    /// Dono único do Roster (GDD §3).
    public class CrewService
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private readonly WalletService _wallet;
        private readonly InventoryService _inventory;
        private readonly NameGenerator _names;
        private readonly Random _rng;
        private Func<string, bool> _isBusy = _ => false;

        public event Action RosterChanged;
        public event Action<CrewMemberState> StarterPicked;
        public event Action<CrewMemberState> Hired;
        public event Action<CrewMemberState> Equipped;
        public event Action<CrewMemberState, string> Lost;          // membro, id do Equipment perdido junto
        public event Action<CrewMemberState> EmergencyRecruited;

        public CrewService(SaveService save, GameDatabase db, WalletService wallet, InventoryService inventory, Random rng)
        {
            _save = save;
            _db = db;
            _wallet = wallet;
            _inventory = inventory;
            _rng = rng;
            _names = new NameGenerator(rng);
        }

        /// Quem sabe se um membro está em Expedition é o ExpeditionService (Fase 4).
        public void SetBusyCheck(Func<string, bool> isBusy) => _isBusy = isBusy;

        public IReadOnlyList<CrewMemberState> Roster => _save.Data.roster;
        public CrewMemberState Get(string memberId) => _save.Data.roster.FirstOrDefault(m => m.id == memberId);
        public bool IsBusy(CrewMemberState member) => _isBusy(member.id);
        public IEnumerable<CrewMemberState> Available => Roster.Where(m => !IsBusy(m));
        public CrewClassDefinition ClassOf(CrewMemberState member) => _db.GetClass(member.classId);
        public ItemDefinition EquipmentOf(CrewMemberState member) => _db.GetItem(member.equippedItemId);

        /// Bônus da Crew Class + do Equipment do membro.
        public CrewBonus BonusOf(CrewMemberState member)
        {
            var bonus = ClassOf(member)?.bonus ?? default;
            var equipment = EquipmentOf(member);
            if (equipment != null) bonus += equipment.equipBonus;
            return bonus;
        }

        // ---------- Starter Pick (GDD §3.3) ----------

        public bool NeedsStarterPick => !_save.Data.starterPicked;

        public CrewMemberState PickStarter(CrewClassDefinition crewClass)
        {
            if (!NeedsStarterPick || !_db.balance.starterClasses.Contains(crewClass)) return null;
            var member = CreateMember(crewClass);
            _save.Data.starterPicked = true;
            _save.MarkDirty();
            StarterPicked?.Invoke(member);
            RosterChanged?.Invoke();
            return member;
        }

        // ---------- Hire (GDD §7) ----------

        /// preço = base × crescimento^(tamanho do Roster − 1), arredondado para múltiplo de 5.
        public int HireCost(CrewClassDefinition crewClass)
        {
            int rosterSize = Roster.Count;
            double cost = crewClass.hireBaseCost * Math.Pow(_db.balance.hireCostGrowth, Math.Max(0, rosterSize - 1));
            return (int)(Math.Round(cost / 5.0) * 5);
        }

        public int CheapestHireCost => _db.classes.Min(HireCost);

        public bool TryHire(CrewClassDefinition crewClass, out CrewMemberState member)
        {
            member = null;
            if (!_wallet.TrySpend(HireCost(crewClass))) return false;
            member = CreateMember(crewClass);
            Hired?.Invoke(member);
            RosterChanged?.Invoke();
            return true;
        }

        /// Entrega um membro sem custo (Founder Pack, GDD §13.2).
        public CrewMemberState Grant(CrewClassDefinition crewClass)
        {
            var member = CreateMember(crewClass);
            RosterChanged?.Invoke();
            return member;
        }

        // ---------- Equipment (GDD §6) ----------

        public bool CanChangeEquipment(CrewMemberState member) => member != null && !IsBusy(member);

        public bool TryEquip(CrewMemberState member, ItemDefinition equipment)
        {
            if (!CanChangeEquipment(member) || equipment == null || !equipment.IsEquipment) return false;
            if (!_inventory.TryRemove(equipment.id, 1)) return false;

            if (!string.IsNullOrEmpty(member.equippedItemId))
                _inventory.Add(member.equippedItemId, 1);   // o anterior volta para o inventário

            member.equippedItemId = equipment.id;
            _save.MarkDirty();
            Equipped?.Invoke(member);
            RosterChanged?.Invoke();
            return true;
        }

        public bool TryUnequip(CrewMemberState member)
        {
            if (!CanChangeEquipment(member) || string.IsNullOrEmpty(member.equippedItemId)) return false;
            _inventory.Add(member.equippedItemId, 1);
            member.equippedItemId = "";
            _save.MarkDirty();
            RosterChanged?.Invoke();
            return true;
        }

        // ---------- Member Loss e Emergency Recruit (GDD §3.4, §3.5) ----------

        /// Remove o membro para sempre. O Equipment dele se perde junto.
        public void RemoveLost(string memberId)
        {
            var member = Get(memberId);
            if (member == null) return;
            string lostEquipment = member.equippedItemId;
            _save.Data.roster.Remove(member);
            _save.MarkDirty();
            Lost?.Invoke(member, lostEquipment);
            RosterChanged?.Invoke();
        }

        /// Se o Roster ficou vazio e os Credits não pagam ninguém, dá um Scout grátis.
        public CrewMemberState EnsureEmergencyRecruit()
        {
            if (NeedsStarterPick || Roster.Count > 0) return null;
            if (_wallet.Credits >= CheapestHireCost) return null;

            var member = CreateMember(_db.balance.emergencyClass);
            EmergencyRecruited?.Invoke(member);
            RosterChanged?.Invoke();
            return member;
        }

        // ------------------------------------------------------------------

        private CrewMemberState CreateMember(CrewClassDefinition crewClass)
        {
            var member = new CrewMemberState
            {
                id = $"m{++_save.Data.nextMemberSerial}",
                classId = crewClass.id,
                variant = _rng.Next(0, 3),
                name = _names.Next(Roster.Select(m => m.name)),
                equippedItemId = "",
            };
            _save.Data.roster.Add(member);
            _save.MarkDirty();
            return member;
        }
    }
}
```

> **O Equipment de quem está em Expedition não muda** (GDD §3.2). Isso garante que o bônus calculado no Claim é o mesmo mostrado no envio.

#### Passo 5 — Progresso: `ProgressService`

```csharp
// Caminho: Assets/_Project/Scripts/Progress/ProgressService.cs
using System;
using StarExpedition.Core;
using StarExpedition.Data;

namespace StarExpedition.Progress
{
    /// Dono do desbloqueio de Planets, Tech Tiers e Cycles (GDD §4.1, §6, §8).
    public class ProgressService
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private Func<bool> _hasActiveExpeditions = () => false;

        public event Action<PlanetDefinition> PlanetUnlocked;
        public event Action CycleCompleted;
        public event Action<int> CycleStarted;

        public ProgressService(SaveService save, GameDatabase db)
        {
            _save = save;
            _db = db;
        }

        public void SetActiveExpeditionCheck(Func<bool> hasActiveExpeditions) => _hasActiveExpeditions = hasActiveExpeditions;

        public int Cycle => _save.Data.cycle;
        public int UnlockedIndex => _save.Data.unlockedPlanetIndex;
        public PlanetDefinition FrontierPlanet => _db.PlanetAt(UnlockedIndex);

        public bool IsUnlocked(PlanetDefinition planet)
        {
            int index = _db.IndexOf(planet);
            return index >= 0 && index <= UnlockedIndex;
        }

        public bool IsUnlocked(GalaxyDefinition galaxy) => galaxy.planets.Count > 0 && IsUnlocked(galaxy.planets[0]);

        /// Tech Tiers dependem do Planet MAIS AVANÇADO já alcançado em qualquer Cycle.
        public bool IsTierUnlocked(int tier)
        {
            var planet = TierUnlockPlanet(tier);
            return planet == null || _save.Data.bestUnlockedPlanetIndex >= _db.IndexOf(planet);
        }

        public PlanetDefinition TierUnlockPlanet(int tier)
        {
            var list = _db.balance.tierUnlockPlanets;
            int i = tier - 1;
            return i >= 0 && i < list.Count ? list[i] : null;
        }

        /// Chamado pelo ExpeditionService em todo Claim (Success ou Failure).
        public void RegisterClaim(PlanetDefinition planet)
        {
            int index = _db.IndexOf(planet);
            if (index != UnlockedIndex) return;   // Planet antigo: farm, não libera nada

            if (index < _db.PlanetCount - 1)
            {
                _save.Data.unlockedPlanetIndex = index + 1;
                _save.Data.bestUnlockedPlanetIndex = Math.Max(_save.Data.bestUnlockedPlanetIndex, index + 1);
                _save.MarkDirty();
                PlanetUnlocked?.Invoke(_db.PlanetAt(index + 1));
            }
            else if (!_save.Data.cycleCompleted)
            {
                _save.Data.cycleCompleted = true;
                _save.MarkDirty();
                CycleCompleted?.Invoke();
            }
        }

        // ---------- Cycles (GDD §8) ----------

        public bool IsCycleCompleted => _save.Data.cycleCompleted;
        public bool CanStartNewCycle => IsCycleCompleted && !_hasActiveExpeditions();

        public bool TryStartNewCycle()
        {
            if (!CanStartNewCycle) return false;
            _save.Data.cycle++;
            _save.Data.unlockedPlanetIndex = 0;
            _save.Data.cycleCompleted = false;
            _save.SaveNow();   // momento importante: grava na hora
            CycleStarted?.Invoke(Cycle);
            return true;
        }
    }
}
```

#### Passo 6 — Ligar no bootstrap

Em `Services.cs`, acrescente (com os `using` de `StarExpedition.Economy`, `.Items`, `.Crew` e `.Progress`):

```csharp
        public static WalletService Wallet { get; internal set; }
        public static InventoryService Inventory { get; internal set; }
        public static CrewService Crew { get; internal set; }
        public static ProgressService Progress { get; internal set; }
```

Em `GameBootstrap.CreateServices`, depois do relógio:

```csharp
            var rng = new System.Random();
            var wallet = new WalletService(save);
            var inventory = new InventoryService(save, database);
            var crew = new CrewService(save, database, wallet, inventory, rng);
            var progress = new ProgressService(save, database);

            Services.Wallet = wallet;
            Services.Inventory = inventory;
            Services.Crew = crew;
            Services.Progress = progress;
```

#### Passo 7 — Commit

```powershell
git add .
git commit -m "Fase 3: services de Credits, inventário, tripulação e progresso"
```

#### ✅ Checkpoint da Fase 3

Ainda sem UI; confirme pelo Console. Crie um script temporário `Phase3Probe.cs` num GameObject da cena `Main`:

```csharp
using StarExpedition.Core;
using UnityEngine;

public class Phase3Probe : MonoBehaviour
{
    private void Start()
    {
        var db = Services.Database;
        var crew = Services.Crew;
        if (crew.NeedsStarterPick) crew.PickStarter(db.GetClass("scout"));
        Debug.Log($"Roster: {crew.Roster.Count}, primeiro: {crew.Roster[0].name}");

        Services.Wallet.Add(500);
        Debug.Log($"Contratar Engineer custa {crew.HireCost(db.GetClass("engineer"))}");
        crew.TryHire(db.GetClass("engineer"), out var m);
        Debug.Log($"Contratado {m?.name}. Próximo Engineer custa {crew.HireCost(db.GetClass("engineer"))}");

        Services.Progress.RegisterClaim(db.PlanetAt(0));
        Debug.Log($"Planet liberado: {Services.Progress.FrontierPlanet.displayName}");
    }
}
```

- Primeiro Play: o Console mostra Roster 1, "custa 60", depois "custa 75" e "Planet liberado: Rust-9".
- **Apague o `Phase3Probe`** e o `save.json` (ou use o DevPanel da Fase 14) antes de seguir.

#### Problemas comuns
- **`NullReferenceException` em `Services.Crew`:** o `GameDatabase` não foi encontrado e o bootstrap parou antes (veja o erro vermelho no início do Console).
- **O preço de contratação não sobe:** o preço depende do tamanho do Roster **antes** da contratação; com 1 membro o multiplicador é 1,25⁰ = 1. Com 2 membros, 1,25¹.

---

### Fase 4 — Expeditions: envio, timer, resolução, Claim e Cycles

> Objetivo: o coração do jogo. Enviar uma Squad, contar o tempo real (inclusive com o app fechado), resolver Success/Failure com as fórmulas da §16.2, aplicar Loot, Member Loss, desbloqueio e Emergency Recruit — e o Double Loot.

**Conceitos novos:**
- **Função pura:** `ExpeditionResolver` recebe tudo de que precisa por parâmetro e devolve um resultado, sem ler nem alterar nada fora dele. É o código mais importante do jogo e, por isso, o mais fácil de testar (Fase 14).
- **Semente de sorteio (seed):** o `System.Random` criado com a mesma semente sempre sorteia a mesma sequência. A semente é sorteada **no envio** e salva; o resultado é calculado **no Claim**. Fechar o app antes do Claim não muda nada (GDD §2), então não existe "fechar e tentar de novo".
- **Timer por timestamp:** a Expedition guarda **quando começou** (`startUtcTicks`) e **quanto dura**. O tempo restante é sempre `fim − agora`, calculado na hora. Nada roda "em segundo plano".

#### Passo 1 — Os tipos de resultado

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ExpeditionOdds.cs
namespace StarExpedition.Expeditions
{
    /// O que o jogador vê antes de enviar (GDD §11.2): chances e duração final.
    public readonly struct ExpeditionOdds
    {
        public readonly int PlanetRisk;       // Risk base + Cycle
        public readonly int EffectiveRisk;    // depois da redução da Squad
        public readonly float SuccessChance;  // 0..1
        public readonly float LossChance;     // 0..1, só se aplica numa Failure
        public readonly int DurationSeconds;

        public ExpeditionOdds(int planetRisk, int effectiveRisk, float successChance, float lossChance, int durationSeconds)
        {
            PlanetRisk = planetRisk;
            EffectiveRisk = effectiveRisk;
            SuccessChance = successChance;
            LossChance = lossChance;
            DurationSeconds = durationSeconds;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ExpeditionOutcome.cs
using System.Collections.Generic;
using StarExpedition.Core;

namespace StarExpedition.Expeditions
{
    /// O resultado de um Claim.
    public class ExpeditionOutcome
    {
        public string planetId;
        public bool success;
        public List<ItemStack> loot = new List<ItemStack>();
        public string lostMemberId;           // null = ninguém perdido
        public string lostMemberName;         // guardado porque o membro some do Roster
        public string lostEquipmentId;
        public bool lootDoubled;
        public bool doubledByAdFree;
        public string unlockedPlanetId;       // null = nada novo liberado
        public string emergencyRecruitName;   // null = não houve Emergency Recruit
    }
}
```

#### Passo 2 — As fórmulas: `ExpeditionResolver`

Cada linha da §16.2 vira uma linha de código. Se o balanceamento mudar a fórmula, é aqui (e nos testes da Fase 14).

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ExpeditionResolver.cs
using System;
using System.Collections.Generic;
using StarExpedition.Core;
using StarExpedition.Data;

namespace StarExpedition.Expeditions
{
    /// Fórmulas da §16.2. Função pura: mesmos parâmetros + mesma semente = mesmo resultado.
    public static class ExpeditionResolver
    {
        public static int PlanetRisk(PlanetDefinition planet, int cycle, GameBalance b)
            => planet.baseRisk + b.cycleRiskStep * Math.Max(0, cycle - 1);

        public static ExpeditionOdds ComputeOdds(PlanetDefinition planet, int cycle, CrewBonus squad, GameBalance b)
        {
            int planetRisk = PlanetRisk(planet, cycle, b);
            int effectiveRisk = Math.Max(0, planetRisk - squad.riskReduction);

            int success = Clamp(b.baseSuccess - effectiveRisk + squad.success, b.minSuccess, b.maxSuccess);
            float loss = Math.Min(b.maxLoss, Math.Max(0f, b.baseLoss + b.lossPerRisk * effectiveRisk - squad.lossReduction));

            return new ExpeditionOdds(planetRisk, effectiveRisk, success / 100f, loss / 100f,
                                      ComputeDuration(planet, squad, b));
        }

        public static int ComputeDuration(PlanetDefinition planet, CrewBonus squad, GameBalance b)
        {
            int reduction = Math.Min(b.maxDurationReductionPercent, Math.Max(0, squad.durationPercent));
            int seconds = (int)Math.Round(planet.durationSeconds * (1 - reduction / 100.0));
            return Math.Max(b.minDurationSeconds, seconds);
        }

        /// Sorteia o resultado. Não altera nada: quem aplica é o ExpeditionService.
        public static ExpeditionOutcome Resolve(PlanetDefinition planet, int cycle, IReadOnlyList<string> squadIds,
                                                CrewBonus squad, GameBalance b, int seed)
        {
            var rng = new Random(seed);
            var odds = ComputeOdds(planet, cycle, squad, b);
            var outcome = new ExpeditionOutcome { planetId = planet.id };

            // 1. Um único sorteio decide Success ou Failure (GDD §4.3).
            outcome.success = rng.NextDouble() < odds.SuccessChance;

            if (outcome.success)
            {
                RollLoot(planet, cycle, squad, b, odds, rng, outcome.loot);
            }
            else if (squadIds.Count > 0 && rng.NextDouble() < odds.LossChance)
            {
                // 2. Na Failure, sorteia o Member Loss e, se houver, quem não volta.
                outcome.lostMemberId = squadIds[rng.Next(squadIds.Count)];
            }

            return outcome;
        }

        private static void RollLoot(PlanetDefinition planet, int cycle, CrewBonus squad, GameBalance b,
                                     ExpeditionOdds odds, Random rng, List<ItemStack> loot)
        {
            int extraCycles = Math.Max(0, cycle - 1);
            double lootMultiplier = 1 + (squad.lootPercent + b.cycleLootPercent * extraCycles) / 100.0;
            double rareBonus = (squad.rareChance + b.cycleRareChance * extraCycles) / 100.0;

            foreach (var entry in planet.lootTable)
            {
                bool isRare = entry.item.category == ItemCategory.RareItem;
                double chance = isRare
                    ? entry.chance * (1 + odds.PlanetRisk / 100.0) + rareBonus   // o Guard NÃO reduz raros (§16.2)
                    : entry.chance;

                if (rng.NextDouble() >= chance) continue;

                int quantity = isRare ? 1 : (int)Math.Round(rng.Next(entry.min, entry.max + 1) * lootMultiplier);
                if (quantity > 0) loot.Add(new ItemStack(entry.item.id, quantity));
            }

            // Success sempre entrega algo (GDD §4.3).
            if (loot.Count == 0 && planet.lootTable.Count > 0)
            {
                var first = planet.lootTable[0];
                loot.Add(new ItemStack(first.item.id, Math.Max(1, first.min)));
            }
        }

        private static int Clamp(int value, int min, int max) => value < min ? min : value > max ? max : value;
    }
}
```

> **A ordem dos sorteios importa.** Com a mesma semente, mudar a ordem (ex.: sortear o Loot antes do Success) muda todos os resultados. Isso só é problema para Expeditions que estavam em andamento durante uma atualização do jogo — e só muda qual resultado sai, não quebra nada.

#### Passo 3 — O service: `ExpeditionService`

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ExpeditionService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Crew;
using StarExpedition.Data;
using StarExpedition.Items;
using StarExpedition.Progress;

namespace StarExpedition.Expeditions
{
    public enum StartCheck { Ok, PlanetLocked, PlanetBusy, InvalidSquadSize, MemberUnavailable }

    /// Dono das Expeditions ativas (GDD §2, §4).
    public class ExpeditionService
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private readonly IClock _clock;
        private readonly CrewService _crew;
        private readonly InventoryService _inventory;
        private readonly ProgressService _progress;
        private readonly Random _seedSource;

        public event Action<ExpeditionState> Started;
        public event Action<ExpeditionState, ExpeditionOutcome> Claimed;
        public event Action<ExpeditionOutcome> LootDoubled;

        public ExpeditionService(SaveService save, GameDatabase db, IClock clock, CrewService crew,
                                 InventoryService inventory, ProgressService progress, Random seedSource)
        {
            _save = save;
            _db = db;
            _clock = clock;
            _crew = crew;
            _inventory = inventory;
            _progress = progress;
            _seedSource = seedSource;
        }

        public IReadOnlyList<ExpeditionState> Active => _save.Data.expeditions;
        public ExpeditionState Get(PlanetDefinition planet) => _save.Data.expeditions.FirstOrDefault(e => e.planetId == planet.id);
        public bool IsMemberBusy(string memberId) => _save.Data.expeditions.Any(e => e.memberIds.Contains(memberId));

        // ---------- Tempo ----------

        public DateTime EndUtc(ExpeditionState e)
            => new DateTime(e.startUtcTicks, DateTimeKind.Utc).AddSeconds(e.durationSeconds);

        public TimeSpan Remaining(ExpeditionState e)
        {
            var remaining = EndUtc(e) - _clock.UtcNow;
            return remaining > TimeSpan.Zero ? remaining : TimeSpan.Zero;
        }

        public bool IsComplete(ExpeditionState e) => Remaining(e) == TimeSpan.Zero;

        // ---------- Envio ----------

        public CrewBonus SquadBonus(IEnumerable<CrewMemberState> squad)
            => squad.Aggregate(default(CrewBonus), (sum, m) => sum + _crew.BonusOf(m));

        public ExpeditionOdds PreviewOdds(PlanetDefinition planet, IReadOnlyList<CrewMemberState> squad)
        {
            var odds = ExpeditionResolver.ComputeOdds(planet, _progress.Cycle, SquadBonus(squad), _db.balance);
            if (IsTutorialNext)   // a 1ª Expedition do jogo é o tutorial (GDD §9)
                return new ExpeditionOdds(odds.PlanetRisk, odds.EffectiveRisk, 1f, 0f, _db.balance.tutorialDurationSeconds);
            return odds;
        }

        public StartCheck CanStart(PlanetDefinition planet, IReadOnlyList<CrewMemberState> squad)
        {
            if (!_progress.IsUnlocked(planet)) return StartCheck.PlanetLocked;
            if (Get(planet) != null) return StartCheck.PlanetBusy;
            if (squad == null || squad.Count < _db.balance.minSquadSize || squad.Count > _db.balance.maxSquadSize)
                return StartCheck.InvalidSquadSize;
            if (squad.Any(m => m == null || _crew.Get(m.id) == null || IsMemberBusy(m.id)) || squad.Distinct().Count() != squad.Count)
                return StartCheck.MemberUnavailable;
            return StartCheck.Ok;
        }

        public ExpeditionState Start(PlanetDefinition planet, IReadOnlyList<CrewMemberState> squad)
        {
            if (CanStart(planet, squad) != StartCheck.Ok) return null;

            var odds = PreviewOdds(planet, squad);
            var expedition = new ExpeditionState
            {
                planetId = planet.id,
                memberIds = squad.Select(m => m.id).ToList(),
                startUtcTicks = _clock.UtcNow.Ticks,
                durationSeconds = odds.DurationSeconds,
                seed = _seedSource.Next(),
                cycle = _progress.Cycle,
                isTutorial = IsTutorialNext,
            };

            _save.Data.expeditions.Add(expedition);
            _save.Data.totalExpeditionsStarted++;
            _save.SaveNow();   // o timer precisa estar no disco antes de o jogador fechar o app
            Started?.Invoke(expedition);
            return expedition;
        }

        private bool IsTutorialNext => _save.Data.totalExpeditionsStarted == 0;

        // ---------- Claim ----------

        public ExpeditionOutcome Claim(PlanetDefinition planet)
        {
            var expedition = Get(planet);
            if (expedition == null || !IsComplete(expedition)) return null;

            var squad = expedition.memberIds.Select(_crew.Get).Where(m => m != null).ToList();
            var outcome = expedition.isTutorial
                ? TutorialOutcome(planet)
                : ExpeditionResolver.Resolve(planet, expedition.cycle, squad.Select(m => m.id).ToList(),
                                             SquadBonus(squad), _db.balance, expedition.seed);

            // A Squad fica livre antes de aplicar o resultado.
            _save.Data.expeditions.Remove(expedition);

            foreach (var stack in outcome.loot) _inventory.Add(stack.itemId, stack.quantity);

            if (outcome.success && _save.Data.adFree)   // Ad-Free: Double Loot automático (GDD §13.2)
            {
                foreach (var stack in outcome.loot) _inventory.Add(stack.itemId, stack.quantity);
                outcome.lootDoubled = true;
                outcome.doubledByAdFree = true;
            }

            if (outcome.lostMemberId != null)
            {
                var lost = _crew.Get(outcome.lostMemberId);
                outcome.lostMemberName = lost?.name;
                outcome.lostEquipmentId = lost?.equippedItemId;
                _crew.RemoveLost(outcome.lostMemberId);
            }

            int frontierBefore = _progress.UnlockedIndex;
            _progress.RegisterClaim(planet);
            if (_progress.UnlockedIndex != frontierBefore)
                outcome.unlockedPlanetId = _progress.FrontierPlanet.id;

            outcome.emergencyRecruitName = _crew.EnsureEmergencyRecruit()?.name;

            _save.SaveNow();
            Claimed?.Invoke(expedition, outcome);
            return outcome;
        }

        // ---------- Double Loot (GDD §13.1) ----------

        public bool CanDoubleLoot(ExpeditionOutcome outcome) => outcome != null && outcome.success && !outcome.lootDoubled;

        /// Chamado quando o anúncio recompensado termina.
        public void ApplyDoubleLoot(ExpeditionOutcome outcome)
        {
            if (!CanDoubleLoot(outcome)) return;
            foreach (var stack in outcome.loot) _inventory.Add(stack.itemId, stack.quantity);
            outcome.lootDoubled = true;
            _save.SaveNow();
            LootDoubled?.Invoke(outcome);
        }

        private ExpeditionOutcome TutorialOutcome(PlanetDefinition planet)
        {
            var outcome = new ExpeditionOutcome { planetId = planet.id, success = true };
            foreach (var entry in _db.balance.tutorialLoot)
                outcome.loot.Add(new ItemStack(entry.item.id, entry.amount));
            return outcome;
        }
    }
}
```

> **Por que o Double Loot não é "desfeito" se o app fechar durante o anúncio?** Porque o Loot base já foi entregue e gravado no Claim. O anúncio só **acrescenta**. O pior caso é o jogador perder o bônus, nunca o Loot.

#### Passo 4 — Ligar no bootstrap

Em `Services.cs` (com `using StarExpedition.Expeditions;`):

```csharp
        public static ExpeditionService Expeditions { get; internal set; }
```

Em `GameBootstrap.CreateServices`, depois do `progress`:

```csharp
            var expeditions = new ExpeditionService(save, database, clock, crew, inventory, progress, rng);
            crew.SetBusyCheck(expeditions.IsMemberBusy);
            progress.SetActiveExpeditionCheck(() => expeditions.Active.Count > 0);
            crew.EnsureEmergencyRecruit();   // cobre um save antigo que ficou sem ninguém

            Services.Expeditions = expeditions;
```

#### Passo 5 — Commit

```powershell
git add .
git commit -m "Fase 4: Expeditions com timer real, resolução com semente, Claim, Double Loot e Cycles"
```

#### ✅ Checkpoint da Fase 4

Script temporário `Phase4Probe.cs` na cena `Main` (apague o `save.json` antes):

```csharp
using System.Linq;
using StarExpedition.Core;
using UnityEngine;

public class Phase4Probe : MonoBehaviour
{
    private void Start()
    {
        var db = Services.Database;
        if (Services.Crew.NeedsStarterPick) Services.Crew.PickStarter(db.GetClass("guard"));
        var kora = db.PlanetAt(0);
        var squad = Services.Crew.Available.Take(1).ToList();
        if (Services.Expeditions.Get(kora) == null)
            Debug.Log($"Enviado: {Services.Expeditions.Start(kora, squad)?.durationSeconds}s");
    }

    private void Update()
    {
        var kora = Services.Database.PlanetAt(0);
        var e = Services.Expeditions.Get(kora);
        if (e == null) return;
        if (!Services.Expeditions.IsComplete(e)) return;
        var o = Services.Expeditions.Claim(kora);
        Debug.Log($"Success={o.success} Loot={string.Join(", ", o.loot.Select(s => $"{s.quantity}x {s.itemId}"))} " +
                  $"Liberado={o.unlockedPlanetId}");
    }
}
```

- O Console mostra `Enviado: 30s` (Expedition do tutorial).
- **Pare o Play antes dos 30 s, espere, dê Play de novo:** o timer continuou contando com o jogo fechado; ao completar, aparece `Success=True Loot=8x iron_ore, 5x silica_sand Liberado=rust9`.
- Apague o probe antes de seguir.

#### Problemas comuns
- **O timer "zera" ao dar Play de novo:** algo está usando `Time.time`. O tempo restante vem só de `EndUtc(e) − _clock.UtcNow`.
- **A Expedition nunca completa:** confira se o relógio do PC não foi atrasado depois de um Play (o `TrustedClock` congela o tempo até alcançar a última hora vista — é o comportamento certo).
- **`Claim` devolve `null`:** ou não há Expedition no Planet, ou ela ainda não completou. O botão de Claim da UI (Fase 8) só aparece quando `IsComplete` é `true`.

---

### Fase 5 — Crafting e venda

> Objetivo: transformar Loot em Equipment (Recipes em 4 Tech Tiers) e em Credits (venda), e entregar o conteúdo das compras (Ad-Free, Founder Pack).

**Conceitos novos:**
- **Operação "tudo ou nada":** craftar consome vários Items. O `CraftingService` confere **antes** se todos existem e só então remove; nunca fica meio consumido.
- **Entitlement:** o direito a uma compra não consumível. A loja (Fase 11) só diz "o jogador tem `ad_free`"; quem sabe o que isso significa no jogo é o `ShopService`. Se amanhã trocarmos o Unity IAP por outra biblioteca, as regras não mudam.

#### Passo 1 — `CraftingService`

```csharp
// Caminho: Assets/_Project/Scripts/Crafting/CraftingService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.Items;
using StarExpedition.Progress;

namespace StarExpedition.Crafting
{
    /// Recipes (GDD §6).
    public class CraftingService
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private readonly InventoryService _inventory;
        private readonly ProgressService _progress;

        public event Action<RecipeDefinition> Crafted;

        public CraftingService(SaveService save, GameDatabase db, InventoryService inventory, ProgressService progress)
        {
            _save = save;
            _db = db;
            _inventory = inventory;
            _progress = progress;
        }

        public IEnumerable<RecipeDefinition> RecipesOfTier(int tier) => _db.recipes.Where(r => r.tier == tier);
        public bool IsUnlocked(RecipeDefinition recipe) => _progress.IsTierUnlocked(recipe.tier);
        public bool CanCraft(RecipeDefinition recipe) => IsUnlocked(recipe) && _inventory.HasAll(recipe.inputs);

        public bool TryCraft(RecipeDefinition recipe)
        {
            if (!CanCraft(recipe)) return false;

            foreach (var input in recipe.inputs)
                _inventory.TryRemove(input.item.id, input.amount);   // HasAll garantiu que todos existem
            _inventory.Add(recipe.output.id, recipe.outputAmount);

            _save.SaveNow();
            Crafted?.Invoke(recipe);
            return true;
        }
    }
}
```

#### Passo 2 — `ShopService`

```csharp
// Caminho: Assets/_Project/Scripts/Economy/ShopService.cs
using System;
using StarExpedition.Core;
using StarExpedition.Crew;
using StarExpedition.Data;
using StarExpedition.Items;

namespace StarExpedition.Economy
{
    public static class ProductIds
    {
        public const string AdFree = "ad_free";
        public const string FounderPack = "founder_pack";
    }

    /// Venda de Items (GDD §7) e conteúdo das compras (GDD §13.2).
    public class ShopService
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private readonly InventoryService _inventory;
        private readonly WalletService _wallet;
        private readonly CrewService _crew;

        public event Action<ItemDefinition, int, int> Sold;   // item, quantidade, Credits recebidos
        public event Action<string> EntitlementGranted;

        public ShopService(SaveService save, GameDatabase db, InventoryService inventory, WalletService wallet, CrewService crew)
        {
            _save = save;
            _db = db;
            _inventory = inventory;
            _wallet = wallet;
            _crew = crew;
        }

        public bool TrySell(ItemDefinition item, int quantity)
        {
            if (item == null || quantity <= 0) return false;
            if (!_inventory.TryRemove(item.id, quantity)) return false;
            int credits = item.sellPrice * quantity;
            _wallet.Add(credits);
            Sold?.Invoke(item, quantity, credits);
            return true;
        }

        // ---------- Compras ----------

        public bool IsAdFree => _save.Data.adFree;
        public bool IsFounderPackGranted => _save.Data.founderPackGranted;

        /// Chamado pela loja (Fase 11) para cada compra confirmada ou restaurada.
        /// Idempotente: chamar duas vezes não entrega em dobro.
        public void GrantEntitlement(string productId)
        {
            switch (productId)
            {
                case ProductIds.AdFree:
                    if (_save.Data.adFree) return;
                    _save.Data.adFree = true;
                    break;

                case ProductIds.FounderPack:
                    if (_save.Data.founderPackGranted) return;   // uma vez por save (GDD §13.2)
                    _save.Data.founderPackGranted = true;
                    _wallet.Add(_db.balance.founderCredits);
                    _crew.Grant(_db.balance.founderClass);
                    break;

                default:
                    return;
            }

            _save.SaveNow();
            EntitlementGranted?.Invoke(productId);
        }
    }
}
```

#### Passo 3 — Ligar no bootstrap

Em `Services.cs` (com `using StarExpedition.Crafting;`):

```csharp
        public static CraftingService Crafting { get; internal set; }
        public static ShopService Shop { get; internal set; }
```

Em `GameBootstrap.CreateServices`, depois das Expeditions:

```csharp
            Services.Crafting = new CraftingService(save, database, inventory, progress);
            Services.Shop = new ShopService(save, database, inventory, wallet, crew);
```

#### Passo 4 — Commit

```powershell
git add .
git commit -m "Fase 5: crafting, venda de Items e entitlements"
```

#### ✅ Checkpoint da Fase 5

Script temporário na cena `Main`:

```csharp
using StarExpedition.Core;
using UnityEngine;

public class Phase5Probe : MonoBehaviour
{
    private void Start()
    {
        var db = Services.Database;
        if (Services.Crew.NeedsStarterPick) Services.Crew.PickStarter(db.GetClass("scout"));
        Services.Inventory.Add("iron_ore", 8);
        Services.Inventory.Add("silica_sand", 5);

        var kit = db.recipes.Find(r => r.id == "salvage_kit");
        Debug.Log($"Craftou: {Services.Crafting.TryCraft(kit)}; ferro restante: {Services.Inventory.Count("iron_ore")}");
        Debug.Log($"Equipou: {Services.Crew.TryEquip(Services.Crew.Roster[0], db.GetItem("salvage_kit"))}");

        Services.Shop.TrySell(db.GetItem("iron_ore"), 2);
        Debug.Log($"Credits: {Services.Wallet.Credits}");

        var tier2 = db.recipes.Find(r => r.id == "deep_scanner");
        Debug.Log($"Tier 2 liberado? {Services.Crafting.IsUnlocked(tier2)}");
    }
}
```

- Console: `Craftou: True; ferro restante: 2`, `Equipou: True`, `Credits: 4`, `Tier 2 liberado? False`.
- Apague o probe e o `save.json` antes de seguir.

#### Problemas comuns
- **`TryCraft` devolve `false` com os Items no inventário:** o Tech Tier da Recipe ainda não foi liberado (`IsUnlocked`). No Tier 1 isso não acontece; confira `GameBalance.tierUnlockPlanets[0]` = `Planet_kora`.

---

### Fase 6 — Arte: SpriteCook, importação e shader dos Planets

> Objetivo: produzir os ~110 arquivos do catálogo (§10.5) no SpriteCook, importá-los com as configurações certas e fazer os Planets girarem por shader.

**Conceitos novos:**
- **Âncora de estilo:** o primeiro asset aprovado de cada grupo vira a referência visual dos seguintes. Sem isso, 38 ícones gerados um a um parecem de 38 jogos diferentes.
- **Folha de sprites (sprite sheet):** vários quadros numa imagem só (ex.: os 4 quadros do idle de um retrato), fatiados no Unity pelo **Sprite Editor**.
- **9-slice:** um painel dividido em 9 partes; os cantos nunca esticam, só o meio. Um único PNG de 48×48 vira painéis de qualquer tamanho.
- **Shader de UI:** um pequeno programa da placa de vídeo que desenha a imagem. O `PlanetSphere` pega uma textura plana da superfície e a "enrola" numa esfera sombreada, deslizando a textura para simular rotação — 18 Planets animados sem nenhum quadro de animação.
- **Sprite Atlas:** junta muitos sprites pequenos numa textura grande. A UI inteira desenha em poucas chamadas à placa de vídeo, o que importa em celular de entrada.

#### Passo 1 — Preparar o SpriteCook no Claude Code

1. Crie a conta em app.spritecook.ai e gere uma **API key** nas configurações da conta.
2. No terminal (fora do Claude Code): `npx spritecook-mcp setup`. Ele detecta o Claude Code, pede a key e configura o servidor MCP.
3. Reinicie a sessão do Claude Code na pasta do GDD. As ferramentas do SpriteCook passam a aparecer para o agente.
4. Crie as pastas no repositório do GDD: `Sprites/StarExpeditionCo/{Crew,Planets,Items,UI,Backgrounds,Ships,Store}/` e o arquivo `Sprites/StarExpeditionCo/PROMPTS.md`, com o **bloco de estilo** da §10.4 no topo.

> Sem o MCP, o fluxo é o mesmo pelo site: gere, baixe o PNG, renomeie para o nome final e coloque na pasta certa.

#### Passo 2 — Ordem de produção

Gere nesta ordem; cada grupo só começa depois de a âncora dele estar aprovada:

| Ordem | Grupo | Âncora de estilo | Como pedir |
|---|---|---|---|
| 1 | UI | `SPR_UI_Panel` + `SPR_UI_Button_Primary_Normal` | Bloco de estilo + "UI panel/button, 9-slice friendly, flat center" |
| 2 | Items | `SPR_Item_iron_ore` | Bloco de estilo + "inventory icon, 32x32" + a coluna *Visual* da §16.4/§16.5 |
| 3 | Crew | `SPR_Crew_Scout_1` | Duas etapas: (1) busto parado com bloco de estilo + "character bust portrait, head and shoulders, front view" + a coluna *Visual* da §16.1; (2) `animate_game_art` nesse busto, 4 quadros, formato `spritesheet`, prompt de respirar + piscar. A folha (4 quadros de ~88 px) é reduzida com nearest neighbor para 4 quadros de 64×64 com o mesmo enquadramento |
| 4 | Planets | `SPR_Planet_kora_Surface` | Bloco de estilo (sem o *centered, transparent background*) + "seamless horizontally tileable planet surface texture map, equirectangular, 128x64" + a coluna *Visual* da §16.3 |
| 5 | Backgrounds | `SPR_Bg_Galaxy1` | "Pixel art starfield with soft nebula, <cor da Galaxy>, 360x960, vertical, dark (#1B2030 base)" |
| 6 | Ships, ícones 16×16, Logo, Store | — | Bloco de estilo + descrição da §10.5 |

Para cada asset:
1. Gerar no **tamanho nativo** da tabela §10.5. Se o SpriteCook devolver maior, reduzir com **nearest neighbor** para o tamanho exato (nunca bilinear).
2. Conferir: fundo transparente (exceto superfícies e fundos), contorno de 1 px `#0E1018`, sem anti-aliasing (nenhum pixel "meio transparente" na borda).
3. **Superfícies dos Planets:** colocar duas cópias lado a lado num visualizador e conferir se a emenda do meio some. Se não sumir, gerar de novo ou corrigir a coluna da borda à mão.
4. Aprovar → renomear para o nome final → pasta do grupo. Rejeitados → `_candidatos_descartados/`.
5. Registrar no `PROMPTS.md`: nome do arquivo, ferramenta/modo, prompt, seed (se houver) e qual candidato foi escolhido.

**Ícone e feature graphic da loja:** gere `SPR_Store_Icon` em 64×64 e `SPR_Store_Feature` em 256×125, e amplie **8×** e **4×** com nearest neighbor para 512×512 e 1024×500 (Fase 15).

#### Passo 3 — Levar a arte para o Unity

Copie as pastas de `Sprites/StarExpeditionCo/` para `Assets/_Project/Art/`, **sem** `_candidatos_descartados/` e sem o `PROMPTS.md`. No PowerShell (ajuste os dois caminhos):

```powershell
$src = "C:\caminho\para\GDD\Sprites\StarExpeditionCo"
$dst = "C:\caminho\para\StarExpeditionCo\Assets\_Project\Art"
robocopy $src $dst /E /XD _candidatos_descartados /XF PROMPTS.md
```

O preset da Fase 0 já aplica **Point**, sem compressão e sem mipmaps. Ajustes por grupo:

| Grupo | Ajuste no Inspector |
|---|---|
| Crew (`SPR_Crew_*`) | **Sprite Mode** = `Multiple` → **Sprite Editor → Slice → Grid By Cell Size** `64×64` → **Slice** → **Apply** |
| Planets (`SPR_Planet_*_Surface`) | **Texture Type** = `Default`, **Wrap Mode U** = `Repeat`, **Wrap Mode V** = `Clamp` |
| UI 9-slice (`SPR_UI_Panel`, `SPR_UI_Button_*`, `SPR_UI_TabBar`, `SPR_UI_TopBar`) | **Sprite Editor** → **Border**: Panel = 16 em todos os lados; botões = 8; barras = 8 à esquerda/direita |

Depois, **Star Expedition → Link Art** (Fase 2): o Console deve mostrar `Toda a arte ligada.`

#### Passo 4 — Fonte pixel

1. Baixe a **Pixel Operator** (licença CC0) e copie `PixelOperator8.ttf` e `PixelOperator8-Bold.ttf` para `Art/Fonts/`.
2. **Window → TextMeshPro → Font Asset Creator**:
   - **Source Font File:** `PixelOperator8`
   - **Sampling Point Size:** `Custom Size` = `8`
   - **Padding:** `2`
   - **Packing Method:** `Optimum`
   - **Atlas Resolution:** `512 × 512`
   - **Character Set:** `Extended ASCII` (cobre todos os acentos do pt-BR)
   - **Render Mode:** `RASTER` (sem suavização)
   - **Generate Font Atlas** → **Save** como `Art/Fonts/PixelOperator8 SDF.asset`.
3. Selecione o atlas gerado dentro do Font Asset e confirme **Filter Mode** = `Point`.
4. Repita com a versão Bold para os títulos.
5. **Project Settings → TextMesh Pro → Settings → Default Font Asset** = `PixelOperator8`.

> Use sempre tamanhos de fonte **múltiplos de 8** (8 e 16). Tamanhos intermediários "borram" a fonte pixel.

#### Passo 5 — Sprite Atlas da interface

1. **Create → 2D → Sprite Atlas** em `Art/` → `UIAtlas`.
2. **Objects for Packing:** arraste as pastas `Art/UI`, `Art/Items`, `Art/Crew` e `Art/Ships`.
3. **Filter Mode** = `Point`, **Compression** = `None`, **Padding** = `2`, **Allow Rotation** e **Tight Packing** desligados.
4. **Edit → Project Settings → Editor → Sprite Packer → Mode** = `Sprite Atlas V2 - Enabled`.

As superfícies dos Planets e os fundos ficam **fora** do atlas (são texturas grandes e usam `Repeat`).

#### Passo 6 — O shader: `PlanetSphere`

```hlsl
// Caminho: Assets/_Project/Shaders/PlanetSphere.shader
Shader "StarExpedition/UI/PlanetSphere"
{
    Properties
    {
        [PerRendererData] _MainTex ("Surface (tileable)", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)
        _Pixels ("Sphere diameter (pixels)", Float) = 64
        _Speed ("Turns per minute", Float) = 1
        _Offset ("Start longitude (0-1)", Float) = 0
        _ShadeColor ("Night side", Color) = (0.08, 0.10, 0.20, 1)
        _OutlineColor ("Outline", Color) = (0.055, 0.063, 0.094, 1)

        // Obrigatórios para funcionar dentro de Mask/ScrollRect da UI
        _StencilComp ("Stencil Comparison", Float) = 8
        _Stencil ("Stencil ID", Float) = 0
        _StencilOp ("Stencil Operation", Float) = 0
        _StencilWriteMask ("Stencil Write Mask", Float) = 255
        _StencilReadMask ("Stencil Read Mask", Float) = 255
        _ColorMask ("Color Mask", Float) = 15
    }

    SubShader
    {
        Tags { "Queue"="Transparent" "IgnoreProjector"="True" "RenderType"="Transparent" "PreviewType"="Plane" "CanUseSpriteAtlas"="False" }

        Stencil
        {
            Ref [_Stencil]
            Comp [_StencilComp]
            Pass [_StencilOp]
            ReadMask [_StencilReadMask]
            WriteMask [_StencilWriteMask]
        }

        Cull Off
        Lighting Off
        ZWrite Off
        ZTest [unity_GUIZTestMode]
        Blend SrcAlpha OneMinusSrcAlpha
        ColorMask [_ColorMask]

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata { float4 vertex : POSITION; float4 color : COLOR; float2 uv : TEXCOORD0; };
            struct v2f { float4 pos : SV_POSITION; fixed4 color : COLOR; float2 uv : TEXCOORD0; };

            sampler2D _MainTex;
            fixed4 _Color, _ShadeColor, _OutlineColor;
            float _Pixels, _Speed, _Offset;

            v2f vert (appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.color = v.color * _Color;
                return o;
            }

            fixed4 frag (v2f i) : SV_Target
            {
                // 1. Arredonda a UV para a grade de pixels da esfera: o resultado continua pixel art.
                float2 uv = (floor(i.uv * _Pixels) + 0.5) / _Pixels;
                float2 p = uv * 2.0 - 1.0;
                float r2 = dot(p, p);
                if (r2 > 1.0) return fixed4(0, 0, 0, 0);

                // 2. Contorno de 1 pixel na borda do círculo.
                float edge = 1.0 - 2.0 / _Pixels;
                if (r2 > edge * edge) return fixed4(_OutlineColor.rgb, i.color.a);

                // 3. Normal da esfera e coordenadas de longitude/latitude na textura.
                float z = sqrt(1.0 - r2);
                float3 n = float3(p.x, p.y, z);
                float lon = atan2(p.x, z) / 6.2831853;       // metade da textura fica visível
                float lat = asin(p.y) / 3.1415926 + 0.5;

                // 4. Rotação em passos inteiros de texel (nada "desliza entre pixels").
                float texWidth = _Pixels * 2.0;
                float turn = floor((_Time.y * _Speed / 60.0 + _Offset) * texWidth) / texWidth;
                fixed4 col = tex2D(_MainTex, float2(lon + turn, lat));

                // 5. Luz de cima à esquerda em 3 faixas (GDD §10.1).
                float3 light = normalize(float3(-0.55, 0.6, 0.6));
                float ndl = saturate(dot(n, light));
                float band = ndl > 0.6 ? 1.0 : (ndl > 0.25 ? 0.7 : 0.4);
                col.rgb = lerp(_ShadeColor.rgb, col.rgb, band);
                col.a = 1.0;
                return col * i.color;
            }
            ENDCG
        }
    }
}
```

Crie o material: **Create → Material** em `Materials/` → `M_PlanetSphere` → **Shader** = `StarExpedition/UI/PlanetSphere`.

#### Passo 7 — O componente: `PlanetSurface`

```csharp
// Caminho: Assets/_Project/Scripts/UI/PlanetSurface.cs
using StarExpedition.Data;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Mostra um Planet girando com o shader PlanetSphere num RawImage.
    [RequireComponent(typeof(RawImage))]
    public class PlanetSurface : MonoBehaviour
    {
        private static readonly int Offset = Shader.PropertyToID("_Offset");
        private static readonly int Speed = Shader.PropertyToID("_Speed");
        private static readonly int Pixels = Shader.PropertyToID("_Pixels");

        [SerializeField] private Material _sphereMaterial;
        [SerializeField] private float _turnsPerMinute = 1f;
        [SerializeField] private int _diameterPixels = 64;
        [SerializeField] private Color _lockedTint = new Color(0.35f, 0.37f, 0.45f, 1f);

        private RawImage _image;
        private Material _material;

        private void Awake()
        {
            _image = GetComponent<RawImage>();
            // Um material por Planet, para cada um começar numa longitude diferente.
            _material = new Material(_sphereMaterial);
            _material.SetFloat(Speed, _turnsPerMinute);
            _material.SetFloat(Pixels, _diameterPixels);
            _image.material = _material;
        }

        public void Show(PlanetDefinition planet, bool locked)
        {
            _image.texture = planet.surface;
            _image.color = locked ? _lockedTint : Color.white;
            _material.SetFloat(Offset, StableFraction(planet.id));
        }

        private void OnDestroy()
        {
            if (_material != null) Destroy(_material);
        }

        /// Um número de 0 a 1 que depende só do id (string.GetHashCode pode variar entre execuções).
        private static float StableFraction(string id)
        {
            unchecked
            {
                int hash = 17;
                foreach (char c in id) hash = hash * 31 + c;
                return (hash & 0x7FFF) / 32768f;
            }
        }
    }
}
```

#### Passo 8 — Commit

```powershell
git add .
git commit -m "Fase 6: arte do SpriteCook, fonte pixel, atlas e shader dos Planets"
```

#### ✅ Checkpoint da Fase 6
- Na cena `Main`, crie temporariamente um Canvas com um **RawImage** de 64×64, adicione `PlanetSurface` (material `M_PlanetSphere`) e, num script de teste, chame `Show(Services.Database.PlanetAt(0), false)`. Em Play, Kora aparece como uma esfera com contorno escuro, sombra à direita embaixo, girando devagar em "degraus" de 1 pixel.
- Um retrato (`SPR_Crew_Scout_1`) aparece fatiado em 4 sprites no Project.
- Um texto TMP com "Configurações — Ação, Coração" aparece nítido, com todos os acentos.
- **Star Expedition → Link Art** informa `Toda a arte ligada.`

#### Problemas comuns
- **A esfera aparece como quadrado cheio:** o RawImage está usando o material padrão. Confira se `_sphereMaterial` foi arrastado no `PlanetSurface`.
- **Uma "costura" vertical aparece na esfera girando:** a textura não é repetível. Veja o item 3 do Passo 2.
- **A superfície parece borrada:** a textura do Planet está com **Filter Mode** `Bilinear`. Deve ser `Point`.
- **Pixels "tremendo" ou de tamanhos diferentes:** o RawImage não tem exatamente 64×64 unidades de UI, ou a escala da UI não é inteira (a Fase 7 resolve a escala).

---

### Fase 7 — Base da UI: escala inteira, abas, painéis, localização e contratos de plataforma

> Objetivo: a "moldura" de todas as telas — Canvas com escala inteira, área segura (notch), barra de topo, barra de abas, painéis que sobem de baixo, botão voltar do Android, todos os textos de UI em pt-BR/en — e as interfaces de plataforma (notificações, anúncios, compras, analytics) com versões "falsas" para o Editor.

**Conceitos novos:**
- **Escala inteira da UI:** o `CanvasScaler` padrão escala a UI por qualquer fator (ex.: 2,7×), e a pixel art fica com pixels de tamanhos diferentes. O `IntegerCanvasScaler` usa sempre um fator inteiro (2×, 3×, 4×) calculado pela largura da tela; em telas mais altas, sobra espaço vertical (GDD §10.2).
- **Safe Area:** a parte da tela que não fica atrás do notch nem da barra de gestos. O `SafeAreaFitter` encolhe a UI para dentro dela.
- **Bottom sheet:** painel que sobe da parte de baixo da tela, por cima da aba atual. Todos os painéis do jogo (Planet, Resultado, membro, Settings) herdam de `BottomSheet`.
- **Interface + implementação nula (Null Object):** a UI chama `Services.Ads.ShowRewarded(...)` sem saber se é AdMob de verdade ou uma versão falsa. No Editor usamos a falsa (que "assiste" o anúncio na hora); no celular, a real (Fase 11). Nenhum `if (Application.isEditor)` espalhado pela UI.

#### Passo 1 — Contratos de plataforma

```csharp
// Caminho: Assets/_Project/Scripts/Platform/PlatformContracts.cs
using System;

namespace StarExpedition.Platform
{
    /// Notificações locais (Fase 10).
    public interface INotificationService
    {
        bool IsPermissionGranted { get; }
        void Initialize();
        void RequestPermission(Action<bool> onAnswered);
        int Schedule(string title, string body, DateTime fireUtc);   // devolve o id, ou -1
        void Cancel(int id);
        void OpenSystemSettings();
    }

    /// Anúncio recompensado (Fase 11).
    public interface IAdService
    {
        bool IsRewardedReady { get; }
        event Action ReadyChanged;
        void Initialize();
        /// onFinished(true) só se o jogador assistiu até o fim.
        void ShowRewarded(Action<bool> onFinished);
    }

    /// Compras no app (Fase 11). Quem entrega o conteúdo é o ShopService.
    public interface IPurchaseService
    {
        bool IsReady { get; }
        event Action ProductsChanged;
        event Action<string> Purchased;
        event Action<string> PurchaseFailed;
        void Initialize();
        string PriceText(string productId);
        void Buy(string productId);
    }

    /// Analytics (Fase 12).
    public interface IAnalyticsService
    {
        void Initialize(bool consentGranted);
        void Log(string eventName, params (string key, object value)[] parameters);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Platform/NullPlatformServices.cs
using System;
using StarExpedition.Economy;
using UnityEngine;

namespace StarExpedition.Platform
{
    /// Versões usadas no Editor: fazem o jogo funcionar sem SDKs nem celular.
    public class NullNotificationService : INotificationService
    {
        private int _nextId = 1;
        public bool IsPermissionGranted => true;
        public void Initialize() { }
        public void RequestPermission(Action<bool> onAnswered) => onAnswered?.Invoke(true);
        public int Schedule(string title, string body, DateTime fireUtc)
        {
            Debug.Log($"[Notificação falsa #{_nextId}] {fireUtc.ToLocalTime():HH:mm:ss} — {title}: {body}");
            return _nextId++;
        }
        public void Cancel(int id) => Debug.Log($"[Notificação falsa #{id}] cancelada");
        public void OpenSystemSettings() => Debug.Log("[Notificação falsa] abriria as configurações do sistema");
    }

    public class NullAdService : IAdService
    {
        public bool IsRewardedReady => true;
        public event Action ReadyChanged { add { } remove { } }
        public void Initialize() { }
        public void ShowRewarded(Action<bool> onFinished)
        {
            Debug.Log("[Anúncio falso] assistido até o fim");
            onFinished?.Invoke(true);
        }
    }

    public class NullPurchaseService : IPurchaseService
    {
        private readonly ShopService _shop;
        public NullPurchaseService(ShopService shop) => _shop = shop;

        public bool IsReady => true;
        public event Action ProductsChanged { add { } remove { } }
        public event Action<string> Purchased;
        public event Action<string> PurchaseFailed { add { } remove { } }
        public void Initialize() { }
        public string PriceText(string productId) => "R$ 0,00 (teste)";
        public void Buy(string productId)
        {
            Debug.Log($"[Loja falsa] comprou {productId}");
            _shop.GrantEntitlement(productId);
            Purchased?.Invoke(productId);
        }
    }

    public class NullAnalyticsService : IAnalyticsService
    {
        public void Initialize(bool consentGranted) { }
        public void Log(string eventName, params (string key, object value)[] parameters)
        {
#if UNITY_EDITOR
            var args = string.Join(", ", Array.ConvertAll(parameters, p => $"{p.key}={p.value}"));
            Debug.Log($"[Analytics] {eventName} {args}");
#endif
        }
    }
}
```

Em `Services.cs` (com `using StarExpedition.Platform;`):

```csharp
        public static INotificationService Notifications { get; internal set; }
        public static IAdService Ads { get; internal set; }
        public static IPurchaseService Purchases { get; internal set; }
        public static IAnalyticsService Analytics { get; internal set; }
```

Em `GameBootstrap.CreateServices`, depois do `Shop`:

```csharp
            // Plataforma: versões falsas por enquanto. As Fases 10–12 trocam pelas reais no Android.
            Services.Notifications = new NullNotificationService();
            Services.Ads = new NullAdService();
            Services.Purchases = new NullPurchaseService(Services.Shop);
            Services.Analytics = new NullAnalyticsService();
```

#### Passo 2 — Escala inteira e área segura

```csharp
// Caminho: Assets/_Project/Scripts/UI/IntegerCanvasScaler.cs
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Escala a UI por um fator INTEIRO baseado na largura da tela (GDD §10.2):
    /// 720 px → 2×, 1080 px → 3×, 1440 px → 4×. A largura útil fica ≥ 360 unidades.
    [ExecuteAlways]
    [RequireComponent(typeof(CanvasScaler))]
    public class IntegerCanvasScaler : MonoBehaviour
    {
        [SerializeField] private int _referenceWidth = 360;

        private CanvasScaler _scaler;
        private int _lastScreenWidth = -1;

        private void OnEnable()
        {
            _scaler = GetComponent<CanvasScaler>();
            _scaler.uiScaleMode = CanvasScaler.ScaleMode.ConstantPixelSize;
            Apply();
        }

        private void Update()
        {
            if (Screen.width != _lastScreenWidth) Apply();
        }

        private void Apply()
        {
            _lastScreenWidth = Screen.width;
            _scaler.scaleFactor = Mathf.Max(1, Mathf.FloorToInt(Screen.width / (float)_referenceWidth));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/SafeAreaFitter.cs
using UnityEngine;

namespace StarExpedition.UI
{
    /// Mantém a UI fora do notch e da barra de gestos.
    [RequireComponent(typeof(RectTransform))]
    public class SafeAreaFitter : MonoBehaviour
    {
        private RectTransform _rect;
        private Rect _lastSafeArea;

        private void Awake()
        {
            _rect = GetComponent<RectTransform>();
            Apply();
        }

        private void Update()
        {
            if (Screen.safeArea != _lastSafeArea) Apply();
        }

        private void Apply()
        {
            _lastSafeArea = Screen.safeArea;
            var min = _lastSafeArea.position;
            var max = _lastSafeArea.position + _lastSafeArea.size;
            min.x /= Screen.width; min.y /= Screen.height;
            max.x /= Screen.width; max.y /= Screen.height;
            _rect.anchorMin = min;
            _rect.anchorMax = max;
            _rect.offsetMin = Vector2.zero;
            _rect.offsetMax = Vector2.zero;
        }
    }
}
```

#### Passo 3 — Utilidades: `Format`, `UIFlipbook`, `ItemSlotView`

```csharp
// Caminho: Assets/_Project/Scripts/UI/Format.cs
using System;
using System.Collections.Generic;
using StarExpedition.Core;
using StarExpedition.Data;
using UnityEngine.Localization.Settings;

namespace StarExpedition.UI
{
    public static class Format
    {
        public static string Duration(TimeSpan t)
        {
            t = TimeSpan.FromSeconds(Math.Ceiling(Math.Max(0, t.TotalSeconds)));
            if (t.TotalHours >= 1) return $"{(int)t.TotalHours}h {t.Minutes:00}m";
            if (t.TotalMinutes >= 1) return $"{t.Minutes}m {t.Seconds:00}s";
            return $"{t.Seconds}s";
        }

        public static string Duration(int seconds) => Duration(TimeSpan.FromSeconds(seconds));

        public static string Percent(float chance01) => $"{Math.Round(chance01 * 100)}%";

        public static string Number(int value)
        {
            var culture = LocalizationSettings.SelectedLocale?.Identifier.CultureInfo;
            return culture != null ? value.ToString("N0", culture) : value.ToString("N0");
        }

        /// "Sucesso +12%\nRisco −10" — só as linhas diferentes de zero.
        public static string Bonus(CrewBonus b)
        {
            var lines = new List<string>();
            if (b.success != 0) lines.Add(L.Get("bonus.success", b.success));
            if (b.riskReduction != 0) lines.Add(L.Get("bonus.risk", b.riskReduction));
            if (b.lootPercent != 0) lines.Add(L.Get("bonus.loot", b.lootPercent));
            if (b.rareChance != 0) lines.Add(L.Get("bonus.rare", b.rareChance));
            if (b.lossReduction != 0) lines.Add(L.Get("bonus.loss", b.lossReduction));
            if (b.durationPercent != 0) lines.Add(L.Get("bonus.duration", b.durationPercent));
            return string.Join("\n", lines);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/UIFlipbook.cs
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Anima uma Image trocando de sprite (idle dos retratos, GDD §10.3).
    [RequireComponent(typeof(Image))]
    public class UIFlipbook : MonoBehaviour
    {
        [SerializeField] private float _framesPerSecond = 4f;

        private Image _image;
        private Sprite[] _frames;
        private float _offset;

        private void Awake() => _image = GetComponent<Image>();

        public void SetFrames(Sprite[] frames)
        {
            if (_image == null) _image = GetComponent<Image>();
            _frames = frames;
            _offset = Random.value * 10f;   // retratos lado a lado não "respiram" juntos
            _image.enabled = frames != null && frames.Length > 0;
            if (_image.enabled) _image.sprite = frames[0];
        }

        private void Update()
        {
            if (_frames == null || _frames.Length < 2) return;
            int frame = (int)((Time.unscaledTime + _offset) * _framesPerSecond) % _frames.Length;
            _image.sprite = _frames[frame];
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/ItemSlotView.cs
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Um ícone de Item com quantidade. Usado no Loot, nas Recipes e na Loja.
    public class ItemSlotView : MonoBehaviour
    {
        [SerializeField] private Image _icon;
        [SerializeField] private TMP_Text _quantity;
        [SerializeField] private GameObject _rareGlow;
        [SerializeField] private Color _enoughColor = new Color32(0xE8, 0xEC, 0xF5, 0xFF);
        [SerializeField] private Color _missingColor = new Color32(0xE0, 0x52, 0x4A, 0xFF);

        public void Bind(ItemDefinition item, int quantity)
        {
            _icon.sprite = item.icon;
            _quantity.text = quantity > 1 ? $"x{quantity}" : "";
            _quantity.color = _enoughColor;
            if (_rareGlow) _rareGlow.SetActive(item.category == ItemCategory.RareItem);
        }

        /// Para Recipes: "tem/precisa", vermelho se faltar.
        public void BindRequirement(ItemDefinition item, int owned, int required)
        {
            Bind(item, 1);
            _quantity.text = $"{owned}/{required}";
            _quantity.color = owned >= required ? _enoughColor : _missingColor;
        }
    }
}
```

#### Passo 4 — Painéis: `BottomSheet` e `ConfirmSheet`

```csharp
// Caminho: Assets/_Project/Scripts/UI/BottomSheet.cs
using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Painel que sobe da parte de baixo da tela. Base de todos os painéis do jogo.
    public class BottomSheet : MonoBehaviour
    {
        [SerializeField] private RectTransform _panel;           // âncora e pivô embaixo no centro
        [SerializeField] private Button _backdrop;               // área escura atrás do painel
        [SerializeField] private Button _closeButton;
        [SerializeField] private bool _closeOnBackdrop = true;
        [SerializeField] private float _slideSeconds = 0.15f;

        public bool IsOpen { get; private set; }
        public virtual bool CanCloseWithBack => true;
        public event Action Closed;

        protected virtual void Awake()
        {
            if (_backdrop) _backdrop.onClick.AddListener(() => { if (_closeOnBackdrop) Close(); });
            if (_closeButton) _closeButton.onClick.AddListener(Close);
            if (!IsOpen) gameObject.SetActive(false);
        }

        public void Open()
        {
            if (IsOpen) return;
            IsOpen = true;
            gameObject.SetActive(true);
            transform.SetAsLastSibling();
            UIRoot.Instance.PushSheet(this);
            StopAllCoroutines();
            StartCoroutine(Slide(opening: true));
        }

        public void Close()
        {
            if (!IsOpen) return;
            IsOpen = false;
            UIRoot.Instance.PopSheet(this);
            StopAllCoroutines();
            if (gameObject.activeInHierarchy) StartCoroutine(Slide(opening: false));
            else gameObject.SetActive(false);
            OnClosed();
            Closed?.Invoke();
        }

        protected virtual void OnClosed() { }

        private IEnumerator Slide(bool opening)
        {
            Canvas.ForceUpdateCanvases();
            float height = _panel.rect.height;
            float from = opening ? -height : 0f;
            float to = opening ? 0f : -height;

            for (float t = 0f; t < _slideSeconds; t += Time.unscaledDeltaTime)
            {
                float k = 1f - Mathf.Pow(1f - t / _slideSeconds, 3f);   // desacelera no fim
                _panel.anchoredPosition = new Vector2(0f, Mathf.Round(Mathf.Lerp(from, to, k)));
                yield return null;
            }

            _panel.anchoredPosition = new Vector2(0f, to);
            if (!opening) gameObject.SetActive(false);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/ConfirmSheet.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Pergunta genérica de sim/não (sair do jogo, Novo Ciclo, permissão de notificação).
    public class ConfirmSheet : BottomSheet
    {
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _body;
        [SerializeField] private Button _yesButton;
        [SerializeField] private TMP_Text _yesLabel;
        [SerializeField] private Button _noButton;
        [SerializeField] private TMP_Text _noLabel;

        private Action _onYes;
        private Action _onNo;

        protected override void Awake()
        {
            base.Awake();
            _yesButton.onClick.AddListener(() => { var a = _onYes; _onNo = null; Close(); a?.Invoke(); });
            _noButton.onClick.AddListener(Close);
        }

        public void Ask(string title, string body, string yes, string no, Action onYes, Action onNo = null)
        {
            _title.text = title;
            _body.text = body;
            _body.gameObject.SetActive(!string.IsNullOrEmpty(body));
            _yesLabel.text = yes;
            _noLabel.text = no;
            _onYes = onYes;
            _onNo = onNo;
            Open();
        }

        /// Fechar por "Não", pelo fundo ou pelo voltar conta como "não".
        protected override void OnClosed()
        {
            var a = _onNo;
            _onNo = null;
            a?.Invoke();
        }
    }
}
```

#### Passo 5 — A raiz: `UIRoot`, `TabBar`, `TopBar`

```csharp
// Caminho: Assets/_Project/Scripts/UI/UIRoot.cs
using System;
using System.Collections.Generic;
using StarExpedition.Core;
using UnityEngine;
using UnityEngine.InputSystem;

namespace StarExpedition.UI
{
    public enum Tab { Map, Crew, Workshop, Shop }

    /// Troca de abas, pilha de painéis abertos e o botão voltar do Android (GDD §11.1).
    public class UIRoot : MonoBehaviour
    {
        /// Única referência estática da UI: os painéis precisam registrar-se na raiz da cena.
        public static UIRoot Instance { get; private set; }

        [SerializeField] private GameObject _mapView;
        [SerializeField] private GameObject _crewView;
        [SerializeField] private GameObject _workshopView;
        [SerializeField] private GameObject _shopView;
        [SerializeField] private TabBar _tabBar;
        [SerializeField] private ConfirmSheet _confirm;

        private readonly List<BottomSheet> _openSheets = new List<BottomSheet>();

        public Tab CurrentTab { get; private set; }
        public ConfirmSheet Confirm => _confirm;
        public bool HasOpenSheet => _openSheets.Count > 0;
        public event Action<Tab> TabChanged;

        private void Awake() => Instance = this;
        private void OnDestroy() { if (Instance == this) Instance = null; }
        private void Start() => ShowTab(Tab.Map);

        public void ShowTab(Tab tab)
        {
            CurrentTab = tab;
            _mapView.SetActive(tab == Tab.Map);
            _crewView.SetActive(tab == Tab.Crew);
            _workshopView.SetActive(tab == Tab.Workshop);
            _shopView.SetActive(tab == Tab.Shop);
            _tabBar.SetSelected(tab);
            TabChanged?.Invoke(tab);
        }

        internal void PushSheet(BottomSheet sheet)
        {
            _openSheets.Remove(sheet);
            _openSheets.Add(sheet);
        }

        internal void PopSheet(BottomSheet sheet) => _openSheets.Remove(sheet);

        private void Update()
        {
            // No Android, o botão/gesto "voltar" chega como a tecla Escape.
            var keyboard = Keyboard.current;
            if (keyboard != null && keyboard.escapeKey.wasPressedThisFrame) HandleBack();
        }

        private void HandleBack()
        {
            if (_openSheets.Count > 0)
            {
                var top = _openSheets[_openSheets.Count - 1];
                if (top.CanCloseWithBack) top.Close();
                return;
            }
            if (CurrentTab != Tab.Map)
            {
                ShowTab(Tab.Map);
                return;
            }
            _confirm.Ask(L.Get("quit.title"), "", L.Get("quit.yes"), L.Get("quit.no"), Application.Quit);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/TabBar.cs
using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using StarExpedition.Core;

namespace StarExpedition.UI
{
    public class TabBar : MonoBehaviour
    {
        [Serializable]
        private class TabButton
        {
            public Tab tab;
            public Button button;
            public TMP_Text label;
            public string labelKey;          // ex.: "tab.map"
            public GameObject selectedMark;
        }

        [SerializeField] private TabButton[] _buttons;
        [SerializeField] private UIRoot _root;

        private void Awake()
        {
            foreach (var b in _buttons)
            {
                var tab = b.tab;
                b.button.onClick.AddListener(() => _root.ShowTab(tab));
            }
        }

        private void OnEnable()
        {
            foreach (var b in _buttons) b.label.text = L.Get(b.labelKey);
        }

        public void SetSelected(Tab tab)
        {
            foreach (var b in _buttons) b.selectedMark.SetActive(b.tab == tab);
        }

        /// Para o tutorial e as dicas apontarem para uma aba.
        public RectTransform RectOf(Tab tab)
            => Array.Find(_buttons, b => b.tab == tab)?.button.transform as RectTransform;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/TopBar.cs
using StarExpedition.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Credits, Cycle, aviso de relógio e engrenagem de Settings (GDD §11.1).
    public class TopBar : MonoBehaviour
    {
        [SerializeField] private TMP_Text _credits;
        [SerializeField] private TMP_Text _cycle;
        [SerializeField] private GameObject _clockWarning;
        [SerializeField] private Button _settingsButton;
        [SerializeField] private BottomSheet _settingsPanel;   // ligado na Fase 13

        private void Awake()
        {
            _settingsButton.onClick.AddListener(() => { if (_settingsPanel) _settingsPanel.Open(); });
        }

        private void OnEnable()
        {
            Services.Wallet.Changed += HandleCreditsChanged;
            Services.Progress.CycleStarted += HandleCycleStarted;
            HandleCreditsChanged(Services.Wallet.Credits);
            HandleCycleStarted(Services.Progress.Cycle);
        }

        private void OnDisable()
        {
            Services.Wallet.Changed -= HandleCreditsChanged;
            Services.Progress.CycleStarted -= HandleCycleStarted;
        }

        private void Update() => _clockWarning.SetActive(Services.Clock.IsRolledBack);

        private void HandleCreditsChanged(int credits) => _credits.text = Format.Number(credits);
        private void HandleCycleStarted(int cycle) => _cycle.text = L.Get("top.cycle", cycle);
    }
}
```

> **Inscrever em `OnEnable`, desinscrever em `OnDisable`:** se a UI se inscreve num evento e é destruída sem se desinscrever, o service continua chamando um objeto morto (`MissingReferenceException`). Sempre em pares.

#### Passo 6 — Os textos de UI: `UiTextSeeder`

Todos os textos da interface num lugar só, gerados na tabela `UI`. Para mudar um texto depois, edite direto na tabela de Localization (ou aqui e gere de novo).

```csharp
// Caminho: Assets/_Project/Scripts/Editor/UiTextSeeder.cs
using UnityEditor;
using UnityEditor.Localization;
using UnityEngine;
using UnityEngine.Localization.Tables;

namespace StarExpedition.EditorTools
{
    public static class UiTextSeeder
    {
        private static readonly (string key, string pt, string en)[] Rows =
        {
            ("tab.map", "Mapa", "Map"),
            ("tab.crew", "Tripulação", "Crew"),
            ("tab.workshop", "Oficina", "Workshop"),
            ("tab.shop", "Loja", "Shop"),
            ("top.cycle", "Ciclo {0}", "Cycle {0}"),
            ("top.clock_warning", "O relógio do aparelho voltou. Timers pausados.", "Device clock went back. Timers paused."),
            ("common.close", "Fechar", "Close"),
            ("common.continue", "Continuar", "Continue"),
            ("quit.title", "Sair do jogo?", "Quit the game?"),
            ("quit.yes", "Sair", "Quit"),
            ("quit.no", "Ficar", "Stay"),

            ("planet.risk", "Risco {0}", "Risk {0}"),
            ("planet.duration", "Duração {0}", "Duration {0}"),
            ("planet.loot_title", "Pode trazer", "Possible loot"),
            ("planet.pick_squad", "Escolha de 1 a 3 tripulantes", "Pick 1 to 3 crew members"),
            ("planet.no_free_members", "Ninguém livre. Espere uma equipe voltar ou contrate na Loja.", "No one available. Wait for a crew to return or hire in the Shop."),
            ("planet.success_chance", "Sucesso {0}", "Success {0}"),
            ("planet.loss_chance", "Perda se falhar {0}", "Loss on failure {0}"),
            ("planet.send", "Enviar", "Send"),
            ("planet.returns_in", "Volta em {0}", "Returns in {0}"),
            ("planet.ready", "A equipe voltou!", "The crew is back!"),
            ("planet.claim", "Abrir resultado", "Open result"),
            ("planet.member_busy", "Em {0}", "At {0}"),
            ("planet.locked", "Bloqueado", "Locked"),

            ("result.success_title", "Expedição concluída!", "Expedition complete!"),
            ("result.failure_title", "A expedição falhou", "The expedition failed"),
            ("result.nothing", "A equipe voltou de mãos vazias.", "The crew came back empty-handed."),
            ("result.member_lost", "{0} não voltou.", "{0} did not come back."),
            ("result.equipment_lost", "{0} se perdeu junto.", "{0} was lost too."),
            ("result.double_ad", "Dobrar (anúncio)", "Double (ad)"),
            ("result.doubled", "Loot dobrado!", "Loot doubled!"),
            ("result.doubled_adfree", "Dobrado — Sem Anúncios", "Doubled — Ad-Free"),
            ("result.planet_unlocked", "Novo planeta liberado: {0}", "New planet unlocked: {0}"),
            ("result.emergency", "A companhia enviou um recruta de emergência: {0}.", "The company sent an emergency recruit: {0}."),

            ("cycle.banner", "Todas as galáxias exploradas!", "All galaxies explored!"),
            ("cycle.start", "Novo Ciclo", "New Cycle"),
            ("cycle.blocked", "Espere todas as expedições voltarem.", "Wait for every expedition to return."),
            ("cycle.confirm_title", "Iniciar o Ciclo {0}?", "Start Cycle {0}?"),
            ("cycle.confirm_body", "Você mantém tripulação, equipamentos, itens e créditos. Os planetas voltam a ser bloqueados e ficam mais perigosos — e mais ricos.", "You keep your crew, gear, items and credits. Planets lock again and become deadlier — and richer."),

            ("crew.empty", "Ninguém na tripulação. Contrate na Loja.", "No crew yet. Hire in the Shop."),
            ("crew.free", "Livre", "Available"),
            ("crew.busy", "Em expedição: {0}", "On expedition: {0}"),
            ("crew.no_equipment", "Sem equipamento", "No equipment"),
            ("crew.equip", "Equipar", "Equip"),
            ("crew.unequip", "Desequipar", "Unequip"),
            ("crew.no_items", "Nenhum equipamento no inventário. Crie na Oficina.", "No equipment in inventory. Craft some in the Workshop."),
            ("crew.locked_busy", "Em expedição: não dá para trocar o equipamento.", "On expedition: equipment can't be changed."),

            ("workshop.tier", "Nível {0}", "Tier {0}"),
            ("workshop.locked", "Libera ao alcançar {0}", "Unlocks at {0}"),
            ("workshop.craft", "Criar", "Craft"),
            ("workshop.crafted", "{0} criado!", "{0} crafted!"),

            ("shop.sell_title", "Vender", "Sell"),
            ("shop.hire_title", "Contratar", "Hire"),
            ("shop.offers_title", "Ofertas", "Offers"),
            ("shop.sell_one", "Vender 1", "Sell 1"),
            ("shop.sell_all", "Tudo", "All"),
            ("shop.inventory_empty", "Inventário vazio.", "Inventory is empty."),
            ("shop.hire", "Contratar", "Hire"),
            ("shop.hired", "{0} entrou para a companhia!", "{0} joined the company!"),
            ("shop.owned", "Adquirido", "Owned"),
            ("shop.store_unavailable", "Loja indisponível", "Store unavailable"),
            ("shop.purchase_failed", "A compra não foi concluída.", "The purchase was not completed."),
            ("offer.ad_free.title", "Sem Anúncios", "Ad-Free"),
            ("offer.ad_free.desc", "Todo sucesso vem com loot dobrado, sem assistir anúncio.", "Every success comes with double loot, no ads to watch."),
            ("offer.founder.title", "Pacote do Fundador", "Founder Pack"),
            ("offer.founder.desc", "600 créditos + 1 Médico.", "600 credits + 1 Medic."),

            ("settings.title", "Configurações", "Settings"),
            ("settings.music", "Música", "Music"),
            ("settings.sfx", "Efeitos", "Sound effects"),
            ("settings.language", "Idioma", "Language"),
            ("settings.notifications", "Notificações", "Notifications"),
            ("settings.notifications_blocked", "Bloqueadas no sistema. Toque para abrir as configurações.", "Blocked by the system. Tap to open settings."),
            ("settings.privacy_options", "Opções de privacidade", "Privacy options"),
            ("settings.privacy_policy", "Política de privacidade", "Privacy policy"),
            ("settings.version", "Versão {0}", "Version {0}"),

            ("starter.title", "Escolha seu primeiro tripulante", "Choose your first crew member"),
            ("starter.subtitle", "Os outros você contrata depois, com créditos.", "You can hire the others later with credits."),
            ("starter.pick", "Escolher", "Choose"),

            ("tutorial.open_planet", "Toque em Kora para planejar a primeira expedição.", "Tap Kora to plan your first expedition."),
            ("tutorial.pick_member", "Escolha quem vai.", "Choose who goes."),
            ("tutorial.send", "Envie a equipe!", "Send the crew!"),
            ("tutorial.wait", "Expedições levam tempo real. Esta leva só 30 segundos.", "Expeditions take real time. This one takes only 30 seconds."),
            ("tutorial.claim", "A equipe voltou! Abra o resultado.", "The crew is back! Open the result."),
            ("tutorial.close_result", "Veja o que a equipe trouxe.", "See what the crew brought back."),
            ("tutorial.go_workshop", "Na Oficina, o loot vira equipamento.", "In the Workshop, loot becomes gear."),
            ("tutorial.craft", "Crie o Kit de Coleta.", "Craft the Salvage Kit."),
            ("tutorial.go_crew", "Agora equipe seu tripulante.", "Now equip your crew member."),
            ("tutorial.open_member", "Toque no tripulante.", "Tap your crew member."),
            ("tutorial.equip", "Equipe o Kit de Coleta.", "Equip the Salvage Kit."),
            ("tutorial.done", "Pronto! Explore, venda o que sobrar e contrate mais gente.", "All set! Explore, sell what you don't need and hire more people."),

            ("notify.prompt_title", "Quer ser avisado quando sua equipe voltar?", "Want to know when your crew is back?"),
            ("notify.prompt_allow", "Sim, avisar", "Yes, notify me"),
            ("notify.prompt_deny", "Agora não", "Not now"),
            ("notify.channel_name", "Expedições", "Expeditions"),
            ("notify.channel_desc", "Avisa quando uma expedição termina.", "Lets you know when an expedition ends."),
            ("notify.title", "Expedição concluída!", "Expedition complete!"),
            ("notify.body", "A equipe voltou de {0}. Toque para ver o resultado.", "Your crew is back from {0}. Tap to see the result."),

            ("bonus.success", "Sucesso +{0}%", "Success +{0}%"),
            ("bonus.risk", "Risco −{0}", "Risk −{0}"),
            ("bonus.loot", "Loot +{0}%", "Loot +{0}%"),
            ("bonus.rare", "Raro +{0}%", "Rare +{0}%"),
            ("bonus.loss", "Perda −{0}%", "Loss −{0}%"),
            ("bonus.duration", "Duração −{0}%", "Duration −{0}%"),

            ("category.RawMaterial", "Matéria-prima", "Raw material"),
            ("category.Component", "Componente", "Component"),
            ("category.RareItem", "Item raro", "Rare item"),
            ("category.Equipment", "Equipamento", "Equipment"),
        };

        [MenuItem("Star Expedition/Seed UI Texts")]
        public static void Seed()
        {
            var collection = LocalizationEditorSettings.GetStringTableCollection("UI");
            if (collection == null)
            {
                EditorUtility.DisplayDialog("Seed UI Texts", "Crie a String Table Collection 'UI' (Fase 1, Passo 8).", "OK");
                return;
            }

            var pt = collection.GetTable("pt-BR") as StringTable;
            var en = collection.GetTable("en") as StringTable;
            foreach (var (key, ptText, enText) in Rows)
            {
                pt.AddEntry(key, ptText);
                en.AddEntry(key, enText);
            }

            EditorUtility.SetDirty(pt);
            EditorUtility.SetDirty(en);
            EditorUtility.SetDirty(collection.SharedData);
            AssetDatabase.SaveAssets();
            Debug.Log($"[UiTextSeeder] {Rows.Length} textos gravados na tabela UI.");
        }
    }
}
```

Rode **Star Expedition → Seed UI Texts**.

#### Passo 7 — Montar a cena `Main`

Hierarquia (medidas em unidades de UI, já na escala de 360 de largura):

```
Main
├─ Main Camera                      Background #1B2030
├─ EventSystem                      com Input System UI Input Module
├─ [Systems]
└─ [UI]
   └─ Canvas                        Screen Space - Overlay · Canvas Scaler + IntegerCanvasScaler · UIRoot
      ├─ Background                 Image Slate 900, esticada na tela toda
      └─ SafeArea                   esticada · SafeAreaFitter
         ├─ TopBar                  topo, altura 32 · TopBar (Image SPR_UI_TopBar)
         │   ├─ SettingsButton      16×16, à esquerda
         │   ├─ CycleLabel          TMP 8 px, centro
         │   ├─ CreditsGroup        ícone Credits + TMP, à direita
         │   └─ ClockWarning        ícone Alert (desativado)
         ├─ Content                 esticada, top 32, bottom 48
         │   ├─ MapView             (Fase 8)
         │   ├─ CrewView            (Fase 8)
         │   ├─ WorkshopView        (Fase 8)
         │   └─ ShopView            (Fase 8)
         ├─ TabBar                  embaixo, altura 48 · TabBar (Image SPR_UI_TabBar)
         │   └─ 4 botões            90 de largura cada: ícone 24×24 + TMP 8 px + SelectedMark
         └─ Sheets                  esticada — todos os painéis entram aqui
             └─ ConfirmSheet        (prefab abaixo)
```

**Prefab de painel (base de todos):**

```
SheetName                            esticado · componente do painel (ex.: ConfirmSheet)
├─ Backdrop                          esticado · Image preta 60% alpha · Button
└─ Panel                             âncora bottom-stretch, pivô (0.5, 0), altura conforme conteúdo
    │                                Image SPR_UI_Panel (Sliced) · Vertical Layout Group (padding 12, spacing 8)
    │                                Content Size Fitter (Vertical = Preferred)
    ├─ Header                        TMP 16 px bold + CloseButton (ícone Close) à direita
    └─ ...conteúdo...
```

Crie o `ConfirmSheet` com esse modelo (Title, Body, e uma linha com YesButton [primário] e NoButton [secundário]) e salve como prefab em `Prefabs/UI/`. Ligue no `UIRoot`: as 4 views (GameObjects vazios por enquanto), a `TabBar` e o `ConfirmSheet`. Ligue no `TabBar` os 4 botões com `labelKey` = `tab.map`, `tab.crew`, `tab.workshop`, `tab.shop`.

**Botões:** Image `SPR_UI_Button_Primary_Normal` (Sliced), **Transition** = `Sprite Swap` com os sprites Pressed/Disabled. Altura mínima de **24** unidades (72 px em 1080p, confortável para o dedo).

#### Passo 8 — Commit

```powershell
git add .
git commit -m "Fase 7: base da UI, painéis, textos de UI e contratos de plataforma"
```

#### ✅ Checkpoint da Fase 7
- Play na `Boot`: a `Main` abre com barra de topo (Credits 0, "Ciclo 1") e 4 abas; tocar nas abas troca o destaque.
- **Game view** em *1080×1920*: a UI fica nítida em 3×. Em *1080×2400*, a UI fica igual, só com mais espaço vertical no conteúdo.
- **Esc** (voltar) na aba Loja volta para o Mapa; Esc no Mapa abre "Sair do jogo?".
- Mude o locale no seletor de idioma do Game view (**Localization Scene Controls**) para `en`: as abas mudam para Map/Crew/Workshop/Shop quando a cena é recarregada.

#### Problemas comuns
- **Pixels com tamanhos diferentes:** algum elemento tem posição ou tamanho fracionado (ex.: 31,5). Use valores inteiros e evite âncoras em porcentagem para sprites pequenos.
- **Texto "No translation found for 'tab.map'":** o Seed UI Texts não rodou, ou a coleção não se chama `UI`.
- **O painel aparece por um frame antes de subir:** o `Panel` precisa ter pivô Y = 0 e âncora embaixo, para `anchoredPosition.y = −altura` esconder tudo.

---

### Fase 8 — Telas: Mapa, Planet, Resultado, Tripulação, Oficina e Loja

> Objetivo: o jogo inteiro jogável no Editor, do envio da primeira Expedition à contratação, com as telas da §11.2.

**Conceitos novos:**
- **View que só lê e chama:** cada tela lê o estado dos services, desenha, e em cada botão chama **um** método de service. Quando o service dispara o evento de mudança, a tela redesenha. Nenhuma tela guarda cópia de dados do jogo.
- **Lista reconstruída:** listas curtas (≤ 40 itens) são simplesmente destruídas e recriadas a cada mudança. É mais simples que atualizar item a item e, nesse tamanho, não pesa.
- **Atualizar texto só quando muda:** o timer é lido todo frame, mas o `TMP_Text` só recebe texto novo quando o segundo muda. Trocar texto todo frame gera lixo de memória (GC) e engasgos em celular fraco.

> **Canvas → Pixel Perfect:** marque essa opção no componente `Canvas` da cena `Main`. Ela arredonda a posição de cada elemento para o pixel mais próximo, o que mantém os Planets e ícones nítidos mesmo quando a posição no mapa cai "entre pixels".

#### Passo 1 — Avisos rápidos: `Toast`

```csharp
// Caminho: Assets/_Project/Scripts/UI/Toast.cs
using System.Collections;
using TMPro;
using UnityEngine;

namespace StarExpedition.UI
{
    /// Mensagem curta que aparece e some ("Kit de Coleta criado!").
    public class Toast : MonoBehaviour
    {
        private static Toast _instance;

        [SerializeField] private CanvasGroup _group;
        [SerializeField] private TMP_Text _label;
        [SerializeField] private float _visibleSeconds = 1.8f;

        private void Awake()
        {
            _instance = this;
            _group.alpha = 0f;
            _group.blocksRaycasts = false;
        }

        private void OnDestroy() { if (_instance == this) _instance = null; }

        public static void Show(string message)
        {
            if (_instance == null) return;
            _instance.StopAllCoroutines();
            _instance.StartCoroutine(_instance.Run(message));
        }

        private IEnumerator Run(string message)
        {
            _label.text = message;
            _group.alpha = 1f;
            yield return new WaitForSecondsRealtime(_visibleSeconds);
            for (float t = 0f; t < 0.2f; t += Time.unscaledDeltaTime)
            {
                _group.alpha = 1f - t / 0.2f;
                yield return null;
            }
            _group.alpha = 0f;
        }
    }
}
```

#### Passo 2 — Mapa: `MapView`, `PlanetNode`, `OrbitingShip`

```csharp
// Caminho: Assets/_Project/Scripts/UI/MapView.cs
using System.Collections.Generic;
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Mapa da Galaxy com os Planets posicionados (GDD §11.2).
    public class MapView : MonoBehaviour
    {
        [SerializeField] private Image _background;
        [SerializeField] private RectTransform _planetArea;
        [SerializeField] private PlanetNode _nodePrefab;
        [SerializeField] private Button _previousGalaxy;
        [SerializeField] private Button _nextGalaxy;
        [SerializeField] private TMP_Text _galaxyName;
        [SerializeField] private PlanetPanel _planetPanel;

        private readonly List<PlanetNode> _nodes = new List<PlanetNode>();
        private int _galaxyIndex = -1;

        private GameDatabase Db => Services.Database;
        private int FrontierGalaxyIndex => Db.galaxies.IndexOf(Db.GalaxyOf(Services.Progress.FrontierPlanet));

        private void Awake()
        {
            _previousGalaxy.onClick.AddListener(() => ShowGalaxy(_galaxyIndex - 1));
            _nextGalaxy.onClick.AddListener(() => ShowGalaxy(_galaxyIndex + 1));
        }

        private void OnEnable()
        {
            Services.Progress.PlanetUnlocked += HandlePlanetUnlocked;
            Services.Progress.CycleStarted += HandleCycleStarted;
            ShowGalaxy(_galaxyIndex < 0 ? FrontierGalaxyIndex : _galaxyIndex);
        }

        private void OnDisable()
        {
            Services.Progress.PlanetUnlocked -= HandlePlanetUnlocked;
            Services.Progress.CycleStarted -= HandleCycleStarted;
        }

        public PlanetNode NodeFor(PlanetDefinition planet) => _nodes.Find(n => n.Planet == planet);

        public void ShowGalaxy(int index)
        {
            _galaxyIndex = Mathf.Clamp(index, 0, FrontierGalaxyIndex);   // só Galaxies liberadas
            var galaxy = Db.galaxies[_galaxyIndex];

            _background.sprite = galaxy.background;
            _galaxyName.text = galaxy.DisplayName;
            _galaxyName.color = galaxy.accent;
            _previousGalaxy.interactable = _galaxyIndex > 0;
            _nextGalaxy.interactable = _galaxyIndex < FrontierGalaxyIndex;

            foreach (var node in _nodes) Destroy(node.gameObject);
            _nodes.Clear();

            foreach (var planet in galaxy.planets)
            {
                var node = Instantiate(_nodePrefab, _planetArea);
                var rect = (RectTransform)node.transform;
                rect.anchorMin = rect.anchorMax = planet.mapPosition;
                rect.anchoredPosition = Vector2.zero;
                node.Bind(planet, _planetPanel.Show);
                _nodes.Add(node);
            }
        }

        private void HandlePlanetUnlocked(PlanetDefinition planet)
            => ShowGalaxy(Db.galaxies.IndexOf(Db.GalaxyOf(planet)));

        private void HandleCycleStarted(int cycle) => ShowGalaxy(0);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/PlanetNode.cs
using System;
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Um Planet no mapa: nome, cadeado, timer, "!" de Claim e a navezinha (GDD §10.3, §11.2).
    public class PlanetNode : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private PlanetSurface _surface;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _timer;
        [SerializeField] private GameObject _lockIcon;
        [SerializeField] private GameObject _readyBadge;
        [SerializeField] private OrbitingShip _ship;

        private bool? _lastUnlocked;
        private int _lastSeconds = -1;

        public PlanetDefinition Planet { get; private set; }

        public void Bind(PlanetDefinition planet, Action<PlanetDefinition> onClick)
        {
            Planet = planet;
            _name.text = planet.displayName;
            _button.onClick.RemoveAllListeners();
            _button.onClick.AddListener(() => onClick(planet));
            _lastUnlocked = null;
            Refresh();
        }

        private void Update() => Refresh();

        private void Refresh()
        {
            if (Planet == null) return;

            bool unlocked = Services.Progress.IsUnlocked(Planet);
            if (_lastUnlocked != unlocked)
            {
                _lastUnlocked = unlocked;
                _surface.Show(Planet, locked: !unlocked);
                _lockIcon.SetActive(!unlocked);
                _button.interactable = unlocked;
            }

            var expedition = Services.Expeditions.Get(Planet);
            bool running = expedition != null && !Services.Expeditions.IsComplete(expedition);
            bool ready = expedition != null && !running;

            _ship.gameObject.SetActive(running);
            _readyBadge.SetActive(ready);

            int seconds = running ? (int)Math.Ceiling(Services.Expeditions.Remaining(expedition).TotalSeconds) : -1;
            if (seconds != _lastSeconds)
            {
                _lastSeconds = seconds;
                _timer.text = running ? Format.Duration(seconds) : "";
            }
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/OrbitingShip.cs
using UnityEngine;

namespace StarExpedition.UI
{
    /// A navezinha que orbita o Planet com Expedition ativa, em passos de 1 pixel.
    public class OrbitingShip : MonoBehaviour
    {
        [SerializeField] private RectTransform _ship;
        [SerializeField] private float _radius = 40f;
        [SerializeField] private float _flatten = 0.45f;       // órbita "deitada"
        [SerializeField] private float _secondsPerOrbit = 6f;

        private void Update()
        {
            float angle = Time.unscaledTime / _secondsPerOrbit * Mathf.PI * 2f;
            var p = new Vector2(Mathf.Cos(angle) * _radius, Mathf.Sin(angle) * _radius * _flatten);
            _ship.anchoredPosition = new Vector2(Mathf.Round(p.x), Mathf.Round(p.y));

            // Virada para onde está indo; atrás do Planet na metade de cima da órbita.
            float directionX = -Mathf.Sin(angle);
            _ship.localScale = new Vector3(directionX < 0f ? -1f : 1f, 1f, 1f);
            bool behind = Mathf.Sin(angle) > 0f;
            transform.SetSiblingIndex(behind ? 0 : transform.parent.childCount - 1);
        }
    }
}
```

**Prefab `PlanetNode`** (em `Prefabs/UI/`):

```
PlanetNode                  RectTransform 96×96, pivô (0.5, 0.5) · Button (Transition None) · PlanetNode
├─ Orbit                    esticado · OrbitingShip (Ship = filho abaixo)
│   └─ Ship                 Image SPR_Ship_Scout 16×16
├─ Surface                  RawImage 64×64 no centro · PlanetSurface (M_PlanetSphere, 64 px)
├─ Lock                     Image SPR_UI_Icon_Lock 16×16 no centro
├─ ReadyBadge               Image SPR_UI_Icon_Alert 16×16 no canto superior direito
├─ Name                     TMP 8 px, abaixo da esfera
└─ Timer                    TMP 8 px Amber 300, abaixo do nome
```

> O `OrbitingShip` fica num GameObject próprio (`Orbit`), irmão da `Surface`: é a posição **dele** na hierarquia que muda para a nave passar atrás ou na frente do Planet.

#### Passo 3 — Painel do Planet: `PlanetPanel`, `SquadMemberToggle`

```csharp
// Caminho: Assets/_Project/Scripts/UI/SquadMemberToggle.cs
using System;
using StarExpedition.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Um Crew Member na lista de montagem da Squad.
    public class SquadMemberToggle : MonoBehaviour
    {
        [SerializeField] private Toggle _toggle;
        [SerializeField] private UIFlipbook _portrait;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _details;

        public CrewMemberState Member { get; private set; }

        public void Bind(CrewMemberState member, string busyAtPlanet, Action<SquadMemberToggle, bool> onChanged)
        {
            Member = member;
            var crewClass = Services.Crew.ClassOf(member);
            _portrait.SetFrames(crewClass.PortraitFrames(member.variant));
            _name.text = $"{member.name} · {crewClass.DisplayName}";
            _details.text = busyAtPlanet == null
                ? Format.Bonus(Services.Crew.BonusOf(member)).Replace("\n", " · ")
                : L.Get("planet.member_busy", busyAtPlanet);

            _toggle.onValueChanged.RemoveAllListeners();
            _toggle.SetIsOnWithoutNotify(false);
            _toggle.interactable = busyAtPlanet == null;
            _toggle.onValueChanged.AddListener(on => onChanged(this, on));
        }

        public void SetOn(bool on) => _toggle.SetIsOnWithoutNotify(on);
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/PlanetPanel.cs
using System;
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.Expeditions;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Painel do Planet: montar a Squad e enviar, ou acompanhar e fazer o Claim (GDD §11.2).
    public class PlanetPanel : BottomSheet
    {
        [Header("Cabeçalho")]
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _risk;
        [SerializeField] private TMP_Text _baseDuration;
        [SerializeField] private Transform _lootContainer;
        [SerializeField] private ItemSlotView _slotPrefab;

        [Header("Planejamento")]
        [SerializeField] private GameObject _planningGroup;
        [SerializeField] private Transform _memberContainer;
        [SerializeField] private SquadMemberToggle _togglePrefab;
        [SerializeField] private GameObject _noFreeMembers;
        [SerializeField] private TMP_Text _successChance;
        [SerializeField] private TMP_Text _lossChance;
        [SerializeField] private TMP_Text _finalDuration;
        [SerializeField] private Button _sendButton;

        [Header("Em andamento")]
        [SerializeField] private GameObject _activeGroup;
        [SerializeField] private TMP_Text _squadNames;
        [SerializeField] private TMP_Text _status;
        [SerializeField] private Button _claimButton;

        [SerializeField] private ResultPanel _resultPanel;

        private readonly List<CrewMemberState> _selected = new List<CrewMemberState>();
        private readonly List<SquadMemberToggle> _toggles = new List<SquadMemberToggle>();
        private int _lastSeconds = -2;

        public PlanetDefinition Planet { get; private set; }
        public event Action<PlanetDefinition> Shown;

        public RectTransform SendButtonRect => (RectTransform)_sendButton.transform;
        public RectTransform ClaimButtonRect => (RectTransform)_claimButton.transform;
        public RectTransform FirstToggleRect => _toggles.Count > 0 ? (RectTransform)_toggles[0].transform : null;

        protected override void Awake()
        {
            base.Awake();
            _sendButton.onClick.AddListener(Send);
            _claimButton.onClick.AddListener(Claim);
        }

        public void Show(PlanetDefinition planet)
        {
            Planet = planet;
            _selected.Clear();
            Open();
            BuildHeader();
            Rebuild();
            Shown?.Invoke(planet);
        }

        private void BuildHeader()
        {
            var db = Services.Database;
            _title.text = Planet.displayName;
            _risk.text = L.Get("planet.risk", ExpeditionResolver.PlanetRisk(Planet, Services.Progress.Cycle, db.balance));
            _baseDuration.text = L.Get("planet.duration", Format.Duration(Planet.durationSeconds));

            foreach (Transform child in _lootContainer) Destroy(child.gameObject);
            foreach (var entry in Planet.lootTable)
                Instantiate(_slotPrefab, _lootContainer).Bind(entry.item, 1);
        }

        private void Rebuild()
        {
            var expedition = Services.Expeditions.Get(Planet);
            _planningGroup.SetActive(expedition == null);
            _activeGroup.SetActive(expedition != null);
            _lastSeconds = -2;

            if (expedition == null)
            {
                BuildToggles();
                RefreshOdds();
            }
            else
            {
                _squadNames.text = string.Join(", ", expedition.memberIds
                    .Select(Services.Crew.Get).Where(m => m != null).Select(m => m.name));
            }
        }

        private void BuildToggles()
        {
            foreach (var t in _toggles) Destroy(t.gameObject);
            _toggles.Clear();

            foreach (var member in Services.Crew.Roster)
            {
                var busyAt = Services.Expeditions.Active.FirstOrDefault(e => e.memberIds.Contains(member.id));
                string busyPlanet = busyAt != null ? Services.Database.GetPlanet(busyAt.planetId)?.displayName : null;
                var toggle = Instantiate(_togglePrefab, _memberContainer);
                toggle.Bind(member, busyPlanet, HandleToggle);
                _toggles.Add(toggle);
            }

            _noFreeMembers.SetActive(!Services.Crew.Available.Any());
        }

        private void HandleToggle(SquadMemberToggle toggle, bool on)
        {
            if (on)
            {
                if (_selected.Count >= Services.Database.balance.maxSquadSize)
                {
                    toggle.SetOn(false);
                    return;
                }
                _selected.Add(toggle.Member);
            }
            else _selected.Remove(toggle.Member);

            RefreshOdds();
        }

        private void RefreshOdds()
        {
            if (_selected.Count == 0)
            {
                _successChance.text = L.Get("planet.success_chance", "—");
                _lossChance.text = L.Get("planet.loss_chance", "—");
                _finalDuration.text = L.Get("planet.duration", "—");
                _sendButton.interactable = false;
                return;
            }

            var odds = Services.Expeditions.PreviewOdds(Planet, _selected);
            _successChance.text = L.Get("planet.success_chance", Format.Percent(odds.SuccessChance));
            _lossChance.text = L.Get("planet.loss_chance", Format.Percent(odds.LossChance));
            _finalDuration.text = L.Get("planet.duration", Format.Duration(odds.DurationSeconds));
            _sendButton.interactable = Services.Expeditions.CanStart(Planet, _selected) == StartCheck.Ok;
        }

        private void Send()
        {
            if (Services.Expeditions.Start(Planet, _selected) == null) return;
            _selected.Clear();
            Rebuild();
        }

        private void Update()
        {
            if (!IsOpen || Planet == null) return;
            var expedition = Services.Expeditions.Get(Planet);
            if (expedition == null) return;

            bool complete = Services.Expeditions.IsComplete(expedition);
            _claimButton.gameObject.SetActive(complete);

            int seconds = complete ? -1 : (int)Math.Ceiling(Services.Expeditions.Remaining(expedition).TotalSeconds);
            if (seconds == _lastSeconds) return;
            _lastSeconds = seconds;
            _status.text = complete ? L.Get("planet.ready") : L.Get("planet.returns_in", Format.Duration(seconds));
        }

        private void Claim()
        {
            var planet = Planet;
            var outcome = Services.Expeditions.Claim(planet);
            if (outcome == null) return;
            Close();
            _resultPanel.Show(planet, outcome);
        }
    }
}
```

**Prefab `PlanetPanel`** (modelo de painel da Fase 7, dentro de `Sheets`):

```
PlanetPanel
├─ Backdrop
└─ Panel                         Vertical Layout
    ├─ Header                    Title (16 px) + CloseButton
    ├─ Stats                     Risk (ícone Risk) · BaseDuration (ícone Timer)
    ├─ LootTitle                 TMP "planet.loot_title"
    ├─ Loot                      Horizontal Layout (ItemSlotView 32×32)
    ├─ Planning                  (GameObject)
    │   ├─ PickHint              TMP "planet.pick_squad"
    │   ├─ Members               ScrollRect vertical, altura 176 · Content com Vertical Layout
    │   ├─ NoFreeMembers         TMP "planet.no_free_members"
    │   ├─ Odds                  SuccessChance (verde) · LossChance (vermelho) · FinalDuration
    │   └─ SendButton            botão primário "planet.send"
    └─ Active                    (GameObject)
        ├─ SquadNames            TMP
        ├─ Status                TMP 16 px
        └─ ClaimButton           botão primário "planet.claim"
```

Os textos fixos (como "Enviar") usam o componente **Localize String Event** da Localization (botão direito no TMP → **Localize**), apontando para a tabela `UI`.

**Prefab `SquadMemberToggle`:** `Toggle` com fundo `SPR_UI_Panel` e um **Checkmark** (ícone Check); dentro, `Portrait` (Image 64×64 + `UIFlipbook`), `Name` e `Details` (TMP 8 px).

#### Passo 4 — Resultado: `ResultPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/ResultPanel.cs
using System.Collections.Generic;
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.Expeditions;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Resultado do Claim, com o Double Loot (GDD §11.2, §13.1).
    public class ResultPanel : BottomSheet
    {
        [SerializeField] private TMP_Text _title;
        [SerializeField] private Image _titleIcon;
        [SerializeField] private Sprite _successIcon;
        [SerializeField] private Sprite _failureIcon;
        [SerializeField] private Transform _lootContainer;
        [SerializeField] private ItemSlotView _slotPrefab;
        [SerializeField] private TMP_Text _messages;
        [SerializeField] private Button _doubleButton;
        [SerializeField] private TMP_Text _doubledLabel;
        [SerializeField] private Button _continueButton;

        private ExpeditionOutcome _outcome;
        private bool _adInProgress;

        public RectTransform ContinueButtonRect => (RectTransform)_continueButton.transform;

        protected override void Awake()
        {
            base.Awake();
            _doubleButton.onClick.AddListener(WatchAdToDouble);
            _continueButton.onClick.AddListener(Close);
        }

        private void OnEnable() => Services.Ads.ReadyChanged += RefreshDouble;
        private void OnDisable() => Services.Ads.ReadyChanged -= RefreshDouble;

        public void Show(PlanetDefinition planet, ExpeditionOutcome outcome)
        {
            _outcome = outcome;
            _adInProgress = false;
            Open();

            _title.text = L.Get(outcome.success ? "result.success_title" : "result.failure_title");
            _titleIcon.sprite = outcome.success ? _successIcon : _failureIcon;

            var db = Services.Database;
            var lines = new List<string>();
            if (!outcome.success) lines.Add(L.Get("result.nothing"));
            if (outcome.lostMemberName != null)
            {
                lines.Add(L.Get("result.member_lost", outcome.lostMemberName));
                var lostGear = db.GetItem(outcome.lostEquipmentId);
                if (lostGear != null) lines.Add(L.Get("result.equipment_lost", lostGear.DisplayName));
            }
            if (outcome.unlockedPlanetId != null)
                lines.Add(L.Get("result.planet_unlocked", db.GetPlanet(outcome.unlockedPlanetId).displayName));
            if (outcome.emergencyRecruitName != null)
                lines.Add(L.Get("result.emergency", outcome.emergencyRecruitName));
            _messages.text = string.Join("\n", lines);

            BuildLoot();
            RefreshDouble();
        }

        private void BuildLoot()
        {
            foreach (Transform child in _lootContainer) Destroy(child.gameObject);
            int multiplier = _outcome.lootDoubled ? 2 : 1;
            foreach (var stack in _outcome.loot)
                Instantiate(_slotPrefab, _lootContainer).Bind(Services.Database.GetItem(stack.itemId), stack.quantity * multiplier);
        }

        private void RefreshDouble()
        {
            if (_outcome == null) return;
            bool canDouble = Services.Expeditions.CanDoubleLoot(_outcome);
            // O botão só aparece com anúncio carregado (GDD §13.1).
            _doubleButton.gameObject.SetActive(canDouble && Services.Ads.IsRewardedReady && !_adInProgress);
            _doubledLabel.gameObject.SetActive(_outcome.lootDoubled);
            _doubledLabel.text = L.Get(_outcome.doubledByAdFree ? "result.doubled_adfree" : "result.doubled");
        }

        private void WatchAdToDouble()
        {
            _adInProgress = true;
            RefreshDouble();
            Services.Analytics.Log("ad_offer_accepted", ("placement", "double_loot"));

            Services.Ads.ShowRewarded(rewarded =>
            {
                _adInProgress = false;
                Services.Analytics.Log("ad_finished", ("placement", "double_loot"), ("rewarded", rewarded));
                if (rewarded) Services.Expeditions.ApplyDoubleLoot(_outcome);
                BuildLoot();
                RefreshDouble();
            });
        }
    }
}
```

**Prefab `ResultPanel`:** Header (TitleIcon 16×16 + Title 16 px), Loot (Grid Layout, células 32×40), Messages (TMP 8 px), DoubleButton (botão primário com ícone Ad + "result.double_ad"), DoubledLabel (TMP Amber), ContinueButton (secundário, "common.continue").

#### Passo 5 — Novo Ciclo: `NewCycleBanner`

```csharp
// Caminho: Assets/_Project/Scripts/UI/NewCycleBanner.cs
using StarExpedition.Core;
using StarExpedition.Expeditions;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Banner "Novo Ciclo" no Mapa (GDD §8).
    public class NewCycleBanner : MonoBehaviour
    {
        [SerializeField] private GameObject _root;
        [SerializeField] private Button _startButton;
        [SerializeField] private TMP_Text _blockedLabel;

        private void Awake() => _startButton.onClick.AddListener(AskToStart);

        private void OnEnable()
        {
            Services.Progress.CycleCompleted += Refresh;
            Services.Progress.CycleStarted += HandleCycleStarted;
            Services.Expeditions.Started += HandleExpeditionStarted;
            Services.Expeditions.Claimed += HandleExpeditionClaimed;
            Refresh();
        }

        private void OnDisable()
        {
            Services.Progress.CycleCompleted -= Refresh;
            Services.Progress.CycleStarted -= HandleCycleStarted;
            Services.Expeditions.Started -= HandleExpeditionStarted;
            Services.Expeditions.Claimed -= HandleExpeditionClaimed;
        }

        private void HandleCycleStarted(int cycle) => Refresh();
        private void HandleExpeditionStarted(ExpeditionState e) => Refresh();
        private void HandleExpeditionClaimed(ExpeditionState e, ExpeditionOutcome o) => Refresh();

        private void Refresh()
        {
            _root.SetActive(Services.Progress.IsCycleCompleted);
            bool canStart = Services.Progress.CanStartNewCycle;
            _startButton.interactable = canStart;
            _blockedLabel.gameObject.SetActive(!canStart);
        }

        private void AskToStart()
        {
            int next = Services.Progress.Cycle + 1;
            UIRoot.Instance.Confirm.Ask(L.Get("cycle.confirm_title", next), L.Get("cycle.confirm_body"),
                L.Get("cycle.start"), L.Get("common.close"), () => Services.Progress.TryStartNewCycle());
        }
    }
}
```

#### Passo 6 — Tripulação: `CrewView`, `MemberCard`, `MemberPanel`, `EquipOptionRow`

```csharp
// Caminho: Assets/_Project/Scripts/UI/MemberCard.cs
using System;
using System.Linq;
using StarExpedition.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    public class MemberCard : MonoBehaviour
    {
        [SerializeField] private Button _button;
        [SerializeField] private UIFlipbook _portrait;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _className;
        [SerializeField] private Image _equipmentIcon;
        [SerializeField] private TMP_Text _status;

        public CrewMemberState Member { get; private set; }

        public void Bind(CrewMemberState member, Action<CrewMemberState> onClick)
        {
            Member = member;
            var crewClass = Services.Crew.ClassOf(member);
            _portrait.SetFrames(crewClass.PortraitFrames(member.variant));
            _name.text = member.name;
            _className.text = crewClass.DisplayName;
            _className.color = crewClass.accent;

            var equipment = Services.Crew.EquipmentOf(member);
            _equipmentIcon.enabled = equipment != null;
            if (equipment != null) _equipmentIcon.sprite = equipment.icon;

            var expedition = Services.Expeditions.Active.FirstOrDefault(e => e.memberIds.Contains(member.id));
            _status.text = expedition == null
                ? L.Get("crew.free")
                : L.Get("crew.busy", Services.Database.GetPlanet(expedition.planetId).displayName);

            _button.onClick.RemoveAllListeners();
            _button.onClick.AddListener(() => onClick(member));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/CrewView.cs
using System.Collections.Generic;
using StarExpedition.Core;
using StarExpedition.Expeditions;
using UnityEngine;

namespace StarExpedition.UI
{
    /// Aba Tripulação (GDD §11.2).
    public class CrewView : MonoBehaviour
    {
        [SerializeField] private Transform _list;
        [SerializeField] private MemberCard _cardPrefab;
        [SerializeField] private GameObject _emptyLabel;
        [SerializeField] private MemberPanel _memberPanel;

        private readonly List<MemberCard> _cards = new List<MemberCard>();

        public RectTransform FirstCardRect => _cards.Count > 0 ? (RectTransform)_cards[0].transform : null;

        private void OnEnable()
        {
            Services.Crew.RosterChanged += Rebuild;
            Services.Expeditions.Started += HandleStarted;
            Services.Expeditions.Claimed += HandleClaimed;
            Rebuild();
        }

        private void OnDisable()
        {
            Services.Crew.RosterChanged -= Rebuild;
            Services.Expeditions.Started -= HandleStarted;
            Services.Expeditions.Claimed -= HandleClaimed;
        }

        private void HandleStarted(ExpeditionState e) => Rebuild();
        private void HandleClaimed(ExpeditionState e, ExpeditionOutcome o) => Rebuild();

        private void Rebuild()
        {
            foreach (var card in _cards) Destroy(card.gameObject);
            _cards.Clear();

            foreach (var member in Services.Crew.Roster)
            {
                var card = Instantiate(_cardPrefab, _list);
                card.Bind(member, _memberPanel.Show);
                _cards.Add(card);
            }
            _emptyLabel.SetActive(_cards.Count == 0);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/EquipOptionRow.cs
using System;
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Um Equipment do inventário na lista de equipar.
    public class EquipOptionRow : MonoBehaviour
    {
        [SerializeField] private ItemSlotView _slot;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _bonus;
        [SerializeField] private Button _equipButton;

        public ItemDefinition Item { get; private set; }
        public RectTransform EquipButtonRect => (RectTransform)_equipButton.transform;

        public void Bind(ItemDefinition item, bool canEquip, Action<ItemDefinition> onEquip)
        {
            Item = item;
            _slot.Bind(item, Services.Inventory.Count(item.id));
            _name.text = item.DisplayName;
            _bonus.text = Format.Bonus(item.equipBonus).Replace("\n", " · ");
            _equipButton.interactable = canEquip;
            _equipButton.onClick.RemoveAllListeners();
            _equipButton.onClick.AddListener(() => onEquip(item));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/MemberPanel.cs
using System.Collections.Generic;
using StarExpedition.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Painel do Crew Member: bônus total e troca de Equipment (GDD §6).
    public class MemberPanel : BottomSheet
    {
        [SerializeField] private UIFlipbook _portrait;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _className;
        [SerializeField] private TMP_Text _totalBonus;
        [SerializeField] private ItemSlotView _currentSlot;
        [SerializeField] private TMP_Text _currentName;
        [SerializeField] private Button _unequipButton;
        [SerializeField] private GameObject _busyLabel;
        [SerializeField] private Transform _optionsList;
        [SerializeField] private EquipOptionRow _optionPrefab;
        [SerializeField] private GameObject _noItemsLabel;

        private readonly List<EquipOptionRow> _rows = new List<EquipOptionRow>();
        private CrewMemberState _member;

        public RectTransform EquipButtonFor(string itemId)
            => _rows.Find(r => r.Item.id == itemId)?.EquipButtonRect;

        protected override void Awake()
        {
            base.Awake();
            _unequipButton.onClick.AddListener(() => Services.Crew.TryUnequip(_member));
        }

        private void OnEnable()
        {
            Services.Crew.RosterChanged += Refresh;
            Services.Inventory.Changed += Refresh;
        }

        private void OnDisable()
        {
            Services.Crew.RosterChanged -= Refresh;
            Services.Inventory.Changed -= Refresh;
        }

        public void Show(CrewMemberState member)
        {
            _member = member;
            Open();
            Refresh();
        }

        private void Refresh()
        {
            if (_member == null || !IsOpen) return;
            if (Services.Crew.Get(_member.id) == null) { Close(); return; }   // membro perdido enquanto o painel estava aberto

            var crewClass = Services.Crew.ClassOf(_member);
            _portrait.SetFrames(crewClass.PortraitFrames(_member.variant));
            _name.text = _member.name;
            _className.text = crewClass.DisplayName;
            _className.color = crewClass.accent;
            _totalBonus.text = Format.Bonus(Services.Crew.BonusOf(_member));

            var current = Services.Crew.EquipmentOf(_member);
            _currentSlot.gameObject.SetActive(current != null);
            if (current != null) _currentSlot.Bind(current, 1);
            _currentName.text = current != null ? current.DisplayName : L.Get("crew.no_equipment");

            bool canChange = Services.Crew.CanChangeEquipment(_member);
            _unequipButton.gameObject.SetActive(current != null);
            _unequipButton.interactable = canChange;
            _busyLabel.SetActive(!canChange);

            foreach (var row in _rows) Destroy(row.gameObject);
            _rows.Clear();
            foreach (var item in Services.Inventory.OwnedEquipment())
            {
                var row = Instantiate(_optionPrefab, _optionsList);
                row.Bind(item, canChange, equipment => Services.Crew.TryEquip(_member, equipment));
                _rows.Add(row);
            }
            _noItemsLabel.SetActive(_rows.Count == 0);
        }
    }
}
```

#### Passo 7 — Oficina: `WorkshopView`, `RecipeCard`

```csharp
// Caminho: Assets/_Project/Scripts/UI/RecipeCard.cs
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    public class RecipeCard : MonoBehaviour
    {
        [SerializeField] private ItemSlotView _output;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _bonus;
        [SerializeField] private Transform _inputs;
        [SerializeField] private ItemSlotView _inputPrefab;
        [SerializeField] private Button _craftButton;

        public RecipeDefinition Recipe { get; private set; }
        public RectTransform CraftButtonRect => (RectTransform)_craftButton.transform;

        public void Bind(RecipeDefinition recipe)
        {
            Recipe = recipe;
            _output.Bind(recipe.output, recipe.outputAmount);
            _name.text = recipe.output.DisplayName;
            _bonus.text = Format.Bonus(recipe.output.equipBonus).Replace("\n", " · ");

            foreach (Transform child in _inputs) Destroy(child.gameObject);
            foreach (var input in recipe.inputs)
                Instantiate(_inputPrefab, _inputs).BindRequirement(input.item, Services.Inventory.Count(input.item.id), input.amount);

            _craftButton.interactable = Services.Crafting.CanCraft(recipe);
            _craftButton.onClick.RemoveAllListeners();
            _craftButton.onClick.AddListener(() =>
            {
                if (Services.Crafting.TryCraft(recipe))
                    Toast.Show(L.Get("workshop.crafted", recipe.output.DisplayName));
            });
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/WorkshopView.cs
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Aba Oficina: Recipes por Tech Tier (GDD §6, §11.2).
    public class WorkshopView : MonoBehaviour
    {
        [SerializeField] private Button[] _tierButtons = new Button[4];
        [SerializeField] private GameObject[] _tierSelectedMarks = new GameObject[4];
        [SerializeField] private TMP_Text[] _tierLabels = new TMP_Text[4];
        [SerializeField] private Transform _list;
        [SerializeField] private RecipeCard _cardPrefab;
        [SerializeField] private TMP_Text _lockedLabel;

        private readonly List<RecipeCard> _cards = new List<RecipeCard>();
        private int _tier = 1;

        public RectTransform CraftButtonFor(string recipeId)
            => _cards.FirstOrDefault(c => c.Recipe.id == recipeId)?.CraftButtonRect;

        private void Awake()
        {
            for (int i = 0; i < _tierButtons.Length; i++)
            {
                int tier = i + 1;
                _tierButtons[i].onClick.AddListener(() => ShowTier(tier));
            }
        }

        private void OnEnable()
        {
            Services.Inventory.Changed += Rebuild;
            Services.Progress.PlanetUnlocked += HandlePlanetUnlocked;
            for (int i = 0; i < _tierLabels.Length; i++) _tierLabels[i].text = L.Get("workshop.tier", i + 1);
            Rebuild();
        }

        private void OnDisable()
        {
            Services.Inventory.Changed -= Rebuild;
            Services.Progress.PlanetUnlocked -= HandlePlanetUnlocked;
        }

        private void HandlePlanetUnlocked(PlanetDefinition p) => Rebuild();

        public void ShowTier(int tier)
        {
            _tier = tier;
            Rebuild();
        }

        private void Rebuild()
        {
            for (int i = 0; i < _tierSelectedMarks.Length; i++) _tierSelectedMarks[i].SetActive(i + 1 == _tier);

            foreach (var card in _cards) Destroy(card.gameObject);
            _cards.Clear();

            bool unlocked = Services.Progress.IsTierUnlocked(_tier);
            _lockedLabel.gameObject.SetActive(!unlocked);
            if (!unlocked)
            {
                _lockedLabel.text = L.Get("workshop.locked", Services.Progress.TierUnlockPlanet(_tier).displayName);
                return;
            }

            foreach (var recipe in Services.Crafting.RecipesOfTier(_tier))
            {
                var card = Instantiate(_cardPrefab, _list);
                card.Bind(recipe);
                _cards.Add(card);
            }
        }
    }
}
```

#### Passo 8 — Loja: `ShopView`, `SellRow`, `HireCard`, `OfferCard`

```csharp
// Caminho: Assets/_Project/Scripts/UI/SellRow.cs
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    public class SellRow : MonoBehaviour
    {
        [SerializeField] private ItemSlotView _slot;
        [SerializeField] private TMP_Text _name;
        [SerializeField] private TMP_Text _category;
        [SerializeField] private TMP_Text _unitPrice;
        [SerializeField] private Button _sellOne;
        [SerializeField] private Button _sellAll;

        public void Bind(ItemDefinition item, int quantity)
        {
            _slot.Bind(item, quantity);
            _name.text = item.DisplayName;
            _category.text = L.Get($"category.{item.category}");
            _unitPrice.text = Format.Number(item.sellPrice);

            _sellOne.onClick.RemoveAllListeners();
            _sellOne.onClick.AddListener(() => Services.Shop.TrySell(item, 1));
            _sellAll.onClick.RemoveAllListeners();
            _sellAll.onClick.AddListener(() => Services.Shop.TrySell(item, Services.Inventory.Count(item.id)));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/HireCard.cs
using StarExpedition.Core;
using StarExpedition.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    public class HireCard : MonoBehaviour
    {
        [SerializeField] private UIFlipbook _portrait;
        [SerializeField] private TMP_Text _className;
        [SerializeField] private TMP_Text _bonus;
        [SerializeField] private TMP_Text _cost;
        [SerializeField] private Button _hireButton;

        public void Bind(CrewClassDefinition crewClass)
        {
            _portrait.SetFrames(crewClass.PortraitFrames(0));
            _className.text = crewClass.DisplayName;
            _className.color = crewClass.accent;
            _bonus.text = Format.Bonus(crewClass.bonus);

            int cost = Services.Crew.HireCost(crewClass);
            _cost.text = Format.Number(cost);
            _hireButton.interactable = Services.Wallet.Credits >= cost;
            _hireButton.onClick.RemoveAllListeners();
            _hireButton.onClick.AddListener(() =>
            {
                if (Services.Crew.TryHire(crewClass, out var member))
                    Toast.Show(L.Get("shop.hired", member.name));
            });
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/OfferCard.cs
using StarExpedition.Core;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    /// Uma oferta de compra (Ad-Free ou Founder Pack).
    public class OfferCard : MonoBehaviour
    {
        [SerializeField] private string _productId;      // "ad_free" ou "founder_pack"
        [SerializeField] private string _titleKey;       // "offer.ad_free.title"
        [SerializeField] private string _descriptionKey; // "offer.ad_free.desc"
        [SerializeField] private TMP_Text _title;
        [SerializeField] private TMP_Text _description;
        [SerializeField] private TMP_Text _price;
        [SerializeField] private Button _buyButton;
        [SerializeField] private GameObject _ownedLabel;

        private void Awake() => _buyButton.onClick.AddListener(() => Services.Purchases.Buy(_productId));

        public void Refresh(bool owned)
        {
            _title.text = L.Get(_titleKey);
            _description.text = L.Get(_descriptionKey);
            _ownedLabel.SetActive(owned);
            _buyButton.gameObject.SetActive(!owned);
            _buyButton.interactable = Services.Purchases.IsReady;
            _price.text = Services.Purchases.IsReady ? Services.Purchases.PriceText(_productId) : L.Get("shop.store_unavailable");
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/UI/ShopView.cs
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;
using UnityEngine;

namespace StarExpedition.UI
{
    /// Aba Loja: vender, contratar e ofertas (GDD §7, §13.2).
    public class ShopView : MonoBehaviour
    {
        [SerializeField] private Transform _sellList;
        [SerializeField] private SellRow _sellRowPrefab;
        [SerializeField] private GameObject _emptyInventory;
        [SerializeField] private Transform _hireList;
        [SerializeField] private HireCard _hireCardPrefab;
        [SerializeField] private OfferCard _adFreeOffer;
        [SerializeField] private OfferCard _founderOffer;

        private readonly List<GameObject> _spawned = new List<GameObject>();

        private void OnEnable()
        {
            Services.Inventory.Changed += Rebuild;
            Services.Wallet.Changed += HandleCreditsChanged;
            Services.Crew.RosterChanged += Rebuild;
            Services.Shop.EntitlementGranted += HandleEntitlement;
            Services.Purchases.ProductsChanged += Rebuild;
            Services.Purchases.PurchaseFailed += HandlePurchaseFailed;
            Rebuild();
        }

        private void OnDisable()
        {
            Services.Inventory.Changed -= Rebuild;
            Services.Wallet.Changed -= HandleCreditsChanged;
            Services.Crew.RosterChanged -= Rebuild;
            Services.Shop.EntitlementGranted -= HandleEntitlement;
            Services.Purchases.ProductsChanged -= Rebuild;
            Services.Purchases.PurchaseFailed -= HandlePurchaseFailed;
        }

        private void HandleCreditsChanged(int credits) => Rebuild();
        private void HandleEntitlement(string productId) => Rebuild();
        private void HandlePurchaseFailed(string productId) => Toast.Show(L.Get("shop.purchase_failed"));

        private void Rebuild()
        {
            foreach (var go in _spawned) Destroy(go);
            _spawned.Clear();

            var db = Services.Database;
            var stacks = Services.Inventory.Stacks
                .Select(s => (item: db.GetItem(s.itemId), s.quantity))
                .Where(s => s.item != null)
                .OrderBy(s => s.item.category).ThenBy(s => s.item.sellPrice);
            foreach (var (item, quantity) in stacks)
            {
                var row = Instantiate(_sellRowPrefab, _sellList);
                row.Bind(item, quantity);
                _spawned.Add(row.gameObject);
            }
            _emptyInventory.SetActive(Services.Inventory.Stacks.Count == 0);

            foreach (var crewClass in db.classes)
            {
                var card = Instantiate(_hireCardPrefab, _hireList);
                card.Bind(crewClass);
                _spawned.Add(card.gameObject);
            }

            _adFreeOffer.Refresh(Services.Shop.IsAdFree);
            _founderOffer.Refresh(Services.Shop.IsFounderPackGranted);
        }
    }
}
```

#### Passo 9 — Montar as abas

- **MapView** (dentro de `Content`): `Background` (Image esticada, **Preserve Aspect** desligado, âncora no topo), `GalaxyHeader` no topo (PreviousButton, GalaxyName TMP 16 px, NextButton), `PlanetArea` (esticada, margens de 48 nas laterais e 40 em cima/embaixo), `NewCycleBanner` embaixo (painel com texto "cycle.banner", StartButton, BlockedLabel). Ligue `PlanetPanel` e o prefab `PlanetNode`.
- **CrewView**: ScrollRect vertical com Content (Vertical Layout, spacing 4) + `EmptyLabel`. Prefab `MemberCard` com altura 72: Portrait 64×64, Name, ClassName, EquipmentIcon 16×16, Status.
- **WorkshopView**: 4 botões de Tier no topo (com SelectedMark), ScrollRect com a lista, `LockedLabel` no centro. Prefab `RecipeCard`: Output (ItemSlotView), Name, Bonus, Inputs (Horizontal Layout), CraftButton.
- **ShopView**: um ScrollRect com três seções empilhadas (título + lista): Vender (`SellRow`), Contratar (`HireCard`), Ofertas (2 `OfferCard` fixos, já configurados com `ad_free`/`founder_pack` e as chaves de texto).
- **Sheets**: `PlanetPanel`, `ResultPanel`, `MemberPanel`, `ConfirmSheet`.
- **Toast**: um último filho do `SafeArea`, no terço de baixo, com `CanvasGroup` e fundo Slate 700.

#### Passo 10 — Commit

```powershell
git add .
git commit -m "Fase 8: telas de Mapa, Planet, Resultado, Tripulação, Oficina e Loja"
```

#### ✅ Checkpoint da Fase 8

Temporariamente, sem o Starter Pick (Fase 9), crie o primeiro membro com um probe (`Services.Crew.PickStarter(...)`) e jogue:
- Tocar em **Kora** → painel com Risk 5 e Loot; marcar o membro → chance 100% (tutorial) e 30s → **Enviar**. O painel passa a mostrar "Volta em 30s" e a nave orbita Kora.
- Fechar o painel, ir à Tripulação: o membro aparece "Em expedição: Kora".
- Aos 30 s aparece o "!" em Kora; **Abrir resultado** → 8 Minério de Ferro + 5 Areia de Sílica, "Novo planeta liberado: Rust-9", botão **Dobrar (anúncio)** (anúncio falso) → quantidades viram 16 e 10.
- **Oficina** → Kit de Coleta com 16/6 e 10/4 → **Criar** → toast. **Tripulação** → membro → **Equipar** o Kit → o bônus "Loot +15%" soma no total.
- **Loja** → vender Areia → Credits sobem; contratar um Engineer quando der.
- Pare e dê Play: tudo continua igual.

#### Problemas comuns
- **Os Planets aparecem todos no canto:** `mapPosition` está (0,0). Rode o **Seed Database** de novo (ele preenche as posições) ou confira o `PlanetArea` esticado.
- **Clicar num Planet não faz nada:** o `Button` do `PlanetNode` precisa de um `Graphic` com **Raycast Target** (o RawImage da `Surface` serve).
- **`MissingReferenceException` ao trocar de aba:** um `OnEnable` sem o `OnDisable` correspondente. Confira os pares de `+=`/`-=`.
- **A lista do painel não rola:** o `Content` do ScrollRect precisa de `Content Size Fitter` (Vertical = Preferred) e o Viewport de uma `RectMask2D`.

---

### Fase 9 — Starter Pick e tutorial

> Objetivo: a primeira abertura do jogo — escolher o primeiro Crew Member entre 3 e ser guiado por seta e frase curta até ter um Equipment equipado (GDD §3.3, §9).

**Conceitos novos:**
- **Máquina de passos:** o tutorial é um número salvo (`tutorialStep`). Cada passo termina quando o jogador **faz a ação** (não quando toca "próximo"), então fechar o app no meio não perde nada.
- **Completar "até" um passo:** `CompleteThrough(Send)` fecha o passo Send e todos os anteriores. Se o jogador fizer as coisas fora de ordem, o tutorial alcança sem travar (GDD §9: "cada passo se completa sozinho se o jogador já tiver feito a ação").
- **Overlay que não bloqueia:** a seta e a frase ficam num `CanvasGroup` com **Blocks Raycasts** desligado. O jogador toca "através" do tutorial, direto no botão real.

#### Passo 1 — `TutorialService`

```csharp
// Caminho: Assets/_Project/Scripts/Onboarding/TutorialService.cs
using System;
using StarExpedition.Core;
using StarExpedition.Crafting;
using StarExpedition.Crew;
using StarExpedition.Data;
using StarExpedition.Expeditions;
using StarExpedition.Items;

namespace StarExpedition.Onboarding
{
    public enum TutorialStep
    {
        StarterPick,       // escolher o primeiro Crew Member
        Send,              // abrir Kora, marcar o membro e enviar
        AskNotifications,  // pedir permissão de notificação
        Wait,              // esperar os 30 s
        Claim,             // abrir o resultado
        CloseResult,       // ver o Loot e continuar
        Craft,             // Oficina → Kit de Coleta
        Equip,             // Tripulação → membro → equipar o Kit
        Done,
    }

    /// Passos do tutorial (GDD §9) e a dica de contratação.
    public class TutorialService
    {
        public const string TutorialRecipeId = "salvage_kit";

        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private readonly CrewService _crew;
        private readonly InventoryService _inventory;
        private readonly ExpeditionService _expeditions;
        private readonly CraftingService _crafting;

        public event Action<TutorialStep> StepChanged;

        public TutorialService(SaveService save, GameDatabase db, CrewService crew, InventoryService inventory,
                               ExpeditionService expeditions, CraftingService crafting)
        {
            _save = save;
            _db = db;
            _crew = crew;
            _inventory = inventory;
            _expeditions = expeditions;
            _crafting = crafting;

            crew.StarterPicked += _ => CompleteThrough(TutorialStep.StarterPick);
            expeditions.Started += _ => CompleteThrough(TutorialStep.Send);
            expeditions.Claimed += (_, __) => CompleteThrough(TutorialStep.Claim);
            crafting.Crafted += r => { if (r.id == TutorialRecipeId) CompleteThrough(TutorialStep.Craft); };
            crew.Equipped += _ => CompleteThrough(TutorialStep.Equip);
        }

        public TutorialStep Step => (TutorialStep)_save.Data.tutorialStep;
        public bool IsActive => Step < TutorialStep.Done;

        public void CompleteThrough(TutorialStep step)
        {
            if (!IsActive || Step > step) return;
            _save.Data.tutorialStep = (int)step + 1;
            _save.MarkDirty();
            StepChanged?.Invoke(Step);
        }

        /// Pula passos que ficaram impossíveis (ex.: o jogador vendeu o Minério antes de craftar).
        public void SkipImpossibleSteps()
        {
            if (Step == TutorialStep.StarterPick && !_crew.NeedsStarterPick)
                CompleteThrough(TutorialStep.StarterPick);

            if (Step <= TutorialStep.Send && _save.Data.totalExpeditionsStarted > 0)
                CompleteThrough(TutorialStep.Send);

            if (Step == TutorialStep.Wait && _expeditions.Active.Count == 0)
                CompleteThrough(TutorialStep.Claim);

            var recipe = _db.recipes.Find(r => r.id == TutorialRecipeId);
            bool hasKit = _inventory.Count(TutorialRecipeId) > 0;
            if (Step == TutorialStep.Craft && !hasKit && !_crafting.CanCraft(recipe))
                CompleteThrough(TutorialStep.Equip);
            if (Step == TutorialStep.Equip && !hasKit)
                CompleteThrough(TutorialStep.Equip);
        }

        public void MarkNotificationPromptAnswered()
        {
            _save.Data.notificationPromptAnswered = true;
            CompleteThrough(TutorialStep.AskNotifications);
        }

        // ---------- Dica de contratação (GDD §9, passo 7) ----------

        public bool ShouldShowHireHint(int credits, int cheapestHireCost)
            => !IsActive && !_save.Data.hireHintSeen && credits >= cheapestHireCost;

        public void MarkHireHintSeen()
        {
            if (_save.Data.hireHintSeen) return;
            _save.Data.hireHintSeen = true;
            _save.MarkDirty();
        }
    }
}
```

Em `Services.cs` (com `using StarExpedition.Onboarding;`):

```csharp
        public static TutorialService Tutorial { get; internal set; }
```

Em `GameBootstrap.CreateServices`, depois de `Services.Shop`:

```csharp
            Services.Tutorial = new TutorialService(save, database, crew, inventory, expeditions, Services.Crafting);
```

E acrescente ao `PlanetPanel` (Fase 8) a propriedade que o tutorial consulta:

```csharp
        public int SelectedCount => _selected.Count;
```

#### Passo 2 — Starter Pick: `StarterPickPanel`, `StarterOption`

```csharp
// Caminho: Assets/_Project/Scripts/Onboarding/StarterOption.cs
using System;
using StarExpedition.Data;
using StarExpedition.UI;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace StarExpedition.Onboarding
{
    public class StarterOption : MonoBehaviour
    {
        [SerializeField] private UIFlipbook _portrait;
        [SerializeField] private TMP_Text _className;
        [SerializeField] private TMP_Text _bonus;
        [SerializeField] private Button _pickButton;

        public void Bind(CrewClassDefinition crewClass, Action<CrewClassDefinition> onPick)
        {
            _portrait.SetFrames(crewClass.PortraitFrames(0));
            _className.text = crewClass.DisplayName;
            _className.color = crewClass.accent;
            _bonus.text = Format.Bonus(crewClass.bonus);
            _pickButton.onClick.RemoveAllListeners();
            _pickButton.onClick.AddListener(() => onPick(crewClass));
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Onboarding/StarterPickPanel.cs
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.UI;
using UnityEngine;

namespace StarExpedition.Onboarding
{
    /// Primeira tela do jogo: 1 Crew Member grátis entre 3 (GDD §3.3).
    public class StarterPickPanel : BottomSheet
    {
        [SerializeField] private StarterOption[] _options = new StarterOption[3];

        public override bool CanCloseWithBack => false;   // não dá para fugir da escolha

        /// Chamado pelo TutorialOverlay no passo StarterPick.
        public void Show()
        {
            Open();
            var classes = Services.Database.balance.starterClasses;
            for (int i = 0; i < _options.Length; i++)
            {
                bool has = i < classes.Count;
                _options[i].gameObject.SetActive(has);
                if (has) _options[i].Bind(classes[i], Pick);
            }
        }

        private void Pick(CrewClassDefinition crewClass)
        {
            if (Services.Crew.PickStarter(crewClass) != null) Close();
        }
    }
}
```

> **Quem abre o painel?** Não é o próprio painel: um `BottomSheet` começa desativado, e um objeto desativado nunca roda `Start`. Quem o abre é o `TutorialOverlay` (Passo 3), que fica sempre ativo e chama `Show()` enquanto o passo for `StarterPick`.

**Prefab `StarterPickPanel`:** modelo de painel **sem** Backdrop clicável e sem CloseButton. Title ("starter.title"), Subtitle ("starter.subtitle"), 3 `StarterOption` lado a lado (100 de largura cada): Portrait 64×64, ClassName, Bonus, PickButton ("starter.pick").

#### Passo 3 — A seta: `TutorialOverlay`

```csharp
// Caminho: Assets/_Project/Scripts/Onboarding/TutorialOverlay.cs
using StarExpedition.Core;
using StarExpedition.UI;
using TMPro;
using UnityEngine;

namespace StarExpedition.Onboarding
{
    /// Seta + frase do tutorial, apontando para o botão real (GDD §9).
    public class TutorialOverlay : MonoBehaviour
    {
        [SerializeField] private CanvasGroup _group;       // Blocks Raycasts DESLIGADO
        [SerializeField] private RectTransform _arrow;     // aponta para baixo, pivô na ponta
        [SerializeField] private RectTransform _bubble;
        [SerializeField] private TMP_Text _text;

        [Header("Telas")]
        [SerializeField] private UIRoot _root;
        [SerializeField] private TabBar _tabBar;
        [SerializeField] private MapView _map;
        [SerializeField] private PlanetPanel _planetPanel;
        [SerializeField] private ResultPanel _resultPanel;
        [SerializeField] private WorkshopView _workshop;
        [SerializeField] private CrewView _crew;
        [SerializeField] private MemberPanel _memberPanel;
        [SerializeField] private StarterPickPanel _starterPick;

        private string _currentKey;
        private bool _askingNotifications;

        private void OnEnable() => Services.Tutorial.StepChanged += HandleStepChanged;
        private void OnDisable() => Services.Tutorial.StepChanged -= HandleStepChanged;

        private void HandleStepChanged(TutorialStep step)
        {
            if (step == TutorialStep.Done) Toast.Show(L.Get("tutorial.done"));
        }

        private void LateUpdate()
        {
            var tutorial = Services.Tutorial;
            if (!tutorial.IsActive) { Hide(); return; }
            tutorial.SkipImpossibleSteps();

            var kora = Services.Database.PlanetAt(0);
            bool koraPanelOpen = _planetPanel.IsOpen && _planetPanel.Planet == kora;

            switch (tutorial.Step)
            {
                case TutorialStep.StarterPick:
                    Hide();
                    if (!_starterPick.IsOpen) _starterPick.Show();
                    break;

                case TutorialStep.Send:
                    if (!koraPanelOpen) Point(NodeRect(kora), "tutorial.open_planet");
                    else if (_planetPanel.SelectedCount == 0) Point(_planetPanel.FirstToggleRect, "tutorial.pick_member");
                    else Point(_planetPanel.SendButtonRect, "tutorial.send");
                    break;

                case TutorialStep.AskNotifications:
                    Hide();
                    AskNotificationsOnce();
                    break;

                case TutorialStep.Wait:
                    var expedition = Services.Expeditions.Get(kora);
                    if (expedition == null || Services.Expeditions.IsComplete(expedition))
                        tutorial.CompleteThrough(TutorialStep.Wait);
                    else
                        Point(koraPanelOpen ? null : NodeRect(kora), "tutorial.wait");
                    break;

                case TutorialStep.Claim:
                    Point(koraPanelOpen ? _planetPanel.ClaimButtonRect : NodeRect(kora), "tutorial.claim");
                    break;

                case TutorialStep.CloseResult:
                    if (_resultPanel.IsOpen) Point(_resultPanel.ContinueButtonRect, "tutorial.close_result");
                    else tutorial.CompleteThrough(TutorialStep.CloseResult);
                    break;

                case TutorialStep.Craft:
                    if (_root.CurrentTab != Tab.Workshop || _root.HasOpenSheet)
                        Point(_tabBar.RectOf(Tab.Workshop), "tutorial.go_workshop");
                    else
                        Point(_workshop.CraftButtonFor(TutorialService.TutorialRecipeId), "tutorial.craft");
                    break;

                case TutorialStep.Equip:
                    if (_memberPanel.IsOpen)
                        Point(_memberPanel.EquipButtonFor(TutorialService.TutorialRecipeId), "tutorial.equip");
                    else if (_root.CurrentTab != Tab.Crew)
                        Point(_tabBar.RectOf(Tab.Crew), "tutorial.go_crew");
                    else
                        Point(_crew.FirstCardRect, "tutorial.open_member");
                    break;
            }
        }

        private RectTransform NodeRect(StarExpedition.Data.PlanetDefinition planet)
        {
            if (_root.CurrentTab != Tab.Map) return _tabBar.RectOf(Tab.Map);
            var node = _map.NodeFor(planet);
            return node != null ? (RectTransform)node.transform : null;
        }

        private void AskNotificationsOnce()
        {
            if (_askingNotifications) return;
            _askingNotifications = true;
            _planetPanel.Close();

            UIRoot.Instance.Confirm.Ask(L.Get("notify.prompt_title"), "",
                L.Get("notify.prompt_allow"), L.Get("notify.prompt_deny"),
                onYes: () => Services.Notifications.RequestPermission(_ => Finish()),
                onNo: Finish);

            void Finish()
            {
                _askingNotifications = false;
                Services.Tutorial.MarkNotificationPromptAnswered();
            }
        }

        private void Point(RectTransform target, string textKey)
        {
            _group.alpha = 1f;
            if (_currentKey != textKey)
            {
                _currentKey = textKey;
                _text.text = L.Get(textKey);
            }

            if (target == null)
            {
                // Sem alvo: só a frase, no terço de baixo da tela.
                _arrow.gameObject.SetActive(false);
                _bubble.anchoredPosition = new Vector2(0f, Mathf.Round(-((RectTransform)transform).rect.height * 0.25f));
                return;
            }

            _arrow.gameObject.SetActive(true);
            var top = target.TransformPoint(new Vector3(target.rect.center.x, target.rect.yMax, 0f));
            _arrow.position = top;
            float bob = Mathf.Round(Mathf.Abs(Mathf.Sin(Time.unscaledTime * 5f)) * 4f);
            _arrow.anchoredPosition = new Vector2(Mathf.Round(_arrow.anchoredPosition.x),
                                                  Mathf.Round(_arrow.anchoredPosition.y) + 2f + bob);

            // A frase fica acima da seta, sem sair da tela.
            var area = ((RectTransform)transform).rect;
            float halfWidth = _bubble.rect.width / 2f;
            float x = Mathf.Clamp(_arrow.anchoredPosition.x, area.xMin + halfWidth + 4f, area.xMax - halfWidth - 4f);
            float y = Mathf.Min(_arrow.anchoredPosition.y + 24f, area.yMax - _bubble.rect.height - 4f);
            _bubble.anchoredPosition = new Vector2(Mathf.Round(x), Mathf.Round(y));
        }

        private void Hide()
        {
            _group.alpha = 0f;
            _currentKey = null;
        }
    }
}
```

**Montagem:** `TutorialOverlay` é o **último filho** de `SafeArea` (depois de `Sheets` e `Toast`), esticado, com `CanvasGroup` (**Interactable** e **Blocks Raycasts** desligados). Filhos: `Arrow` (Image `SPR_UI_Arrow`, âncora e pivô no centro-baixo) e `Bubble` (painel Slate 700 com borda âmbar, largura 200, `ContentSizeFitter` vertical, TMP 8 px; âncora no centro). Ligue todas as telas no Inspector.

#### Passo 4 — Dica da Loja: `HireHintBadge`

```csharp
// Caminho: Assets/_Project/Scripts/Onboarding/HireHintBadge.cs
using StarExpedition.Core;
using StarExpedition.UI;
using UnityEngine;

namespace StarExpedition.Onboarding
{
    /// Bolinha na aba Loja na primeira vez em que os Credits pagam uma contratação (GDD §9).
    public class HireHintBadge : MonoBehaviour
    {
        [SerializeField] private GameObject _badge;
        [SerializeField] private UIRoot _root;

        private void OnEnable()
        {
            Services.Wallet.Changed += HandleCreditsChanged;
            Services.Tutorial.StepChanged += HandleStepChanged;
            _root.TabChanged += HandleTabChanged;
            Refresh();
        }

        private void OnDisable()
        {
            Services.Wallet.Changed -= HandleCreditsChanged;
            Services.Tutorial.StepChanged -= HandleStepChanged;
            _root.TabChanged -= HandleTabChanged;
        }

        private void HandleCreditsChanged(int credits) => Refresh();
        private void HandleStepChanged(TutorialStep step) => Refresh();

        private void HandleTabChanged(Tab tab)
        {
            if (tab == Tab.Shop && _badge.activeSelf) Services.Tutorial.MarkHireHintSeen();
            Refresh();
        }

        private void Refresh()
            => _badge.SetActive(Services.Tutorial.ShouldShowHireHint(Services.Wallet.Credits, Services.Crew.CheapestHireCost));
    }
}
```

Coloque o `HireHintBadge` no botão da aba Loja, com um filho `Badge` (círculo âmbar 8×8 no canto superior direito).

#### Passo 5 — Commit

```powershell
git add .
git commit -m "Fase 9: Starter Pick e tutorial guiado"
```

#### ✅ Checkpoint da Fase 9
Apague o `save.json` e dê Play na `Boot`:
1. Abre o Starter Pick com Scout, Engineer e Guard; o voltar (Esc) não fecha.
2. Escolhido o membro, a seta aponta para Kora → para o membro na lista → para **Enviar**.
3. Enviado, aparece "Quer ser avisado quando sua equipe voltar?" (a versão falsa aceita na hora).
4. A frase "Esta leva só 30 segundos" fica na tela; aos 30 s, a seta aponta para Kora/**Abrir resultado** → **Continuar**.
5. Seta na aba Oficina → **Criar** o Kit → aba Tripulação → membro → **Equipar** → toast "Pronto!".
6. Fechar o jogo em qualquer passo e reabrir: o tutorial continua do mesmo ponto.
7. Vender itens até ter 60 Credits (ou dar Credits pelo DevPanel da Fase 14): a bolinha aparece na Loja e some ao abrir a aba.

#### Problemas comuns
- **A seta aponta para o lugar errado depois de trocar de aba:** o alvo pode ter acabado de ser criado e ainda não passou pelo layout. O `LateUpdate` recalcula todo frame, então isso se corrige no frame seguinte.
- **Os toques não chegam aos botões:** o `CanvasGroup` do overlay está com **Blocks Raycasts** ligado, ou a `Image` do `Bubble` tem **Raycast Target** ligado.
- **O tutorial "trava" no Craft:** o jogador vendeu o Minério. O `SkipImpossibleSteps` pula para o fim; confira se ele está sendo chamado (primeira linha útil do `LateUpdate`).

---

### Fase 10 — Notificações locais

> Objetivo: uma notificação do Android por Expedition, na hora em que ela termina, mesmo com o app fechado — e cancelada no Claim (GDD §13.4).

**Conceitos novos:**
- **Notificação local:** o próprio app agenda a notificação no sistema, sem servidor. O Android a mostra na hora marcada mesmo com o jogo fechado.
- **Canal de notificação:** desde o Android 8, toda notificação pertence a um canal com nome visível nas configurações do sistema ("Expedições"). O jogador pode silenciar o canal sem desligar o app inteiro.
- **Permissão `POST_NOTIFICATIONS`:** desde o Android 13, o app precisa pedir permissão. Pedimos no passo 3 do tutorial, com uma frase explicando o porquê — pedidos "do nada" na primeira abertura são recusados com muito mais frequência.
- **Reagendar após reiniciar o celular:** o Android apaga notificações agendadas quando o aparelho reinicia. O pacote Mobile Notifications reagenda sozinho, se a opção estiver ligada.

#### Passo 1 — Configurar o pacote

1. **Edit → Project Settings → Mobile Notifications → Android**:
   - **Reschedule on Device Restart:** ligado (Expeditions de 4 h sobrevivem a um reinício).
   - **Schedule at exact time:** `Nothing` (atraso de alguns minutos é aceitável e evita a permissão de alarme exato).
2. Em **Notification Icons**, adicione:
   - `icon_small` (**Type: Small**): silhueta **branca** sobre transparente, 48×48, feita a partir do ícone do app. O Android pinta ícones pequenos de uma cor só; um ícone colorido vira um quadrado branco.
   - `icon_large` (**Type: Large**): o próprio `SPR_Store_Icon` ampliado para 192×192.
3. Na asmdef `StarExpedition`, acrescente a referência `Unity.Notifications.Android`.

#### Passo 2 — `AndroidNotificationService`

```csharp
// Caminho: Assets/_Project/Scripts/Platform/AndroidNotificationService.cs
#if UNITY_ANDROID
using System;
using System.Collections;
using StarExpedition.Core;
using Unity.Notifications.Android;
using UnityEngine;

namespace StarExpedition.Platform
{
    public class AndroidNotificationService : INotificationService
    {
        private const string ChannelId = "expeditions";
        private readonly MonoBehaviour _coroutineHost;

        public AndroidNotificationService(MonoBehaviour coroutineHost) => _coroutineHost = coroutineHost;

        public bool IsPermissionGranted => AndroidNotificationCenter.UserPermissionToPost == PermissionStatus.Allowed;

        /// Chamado no Boot, depois de a Localization estar pronta (o nome do canal é traduzido).
        public void Initialize()
        {
            AndroidNotificationCenter.RegisterNotificationChannel(new AndroidNotificationChannel
            {
                Id = ChannelId,
                Name = L.Get("notify.channel_name"),
                Description = L.Get("notify.channel_desc"),
                Importance = Importance.Default,
            });
        }

        public void RequestPermission(Action<bool> onAnswered)
            => _coroutineHost.StartCoroutine(Request(onAnswered));

        private static IEnumerator Request(Action<bool> onAnswered)
        {
            // Abaixo do Android 13 o status já volta "Allowed" sem mostrar nada.
            var request = new PermissionRequest();
            while (request.Status == PermissionStatus.RequestPending) yield return null;
            onAnswered?.Invoke(request.Status == PermissionStatus.Allowed);
        }

        public int Schedule(string title, string body, DateTime fireUtc)
        {
            if (!IsPermissionGranted) return -1;
            var notification = new AndroidNotification
            {
                Title = title,
                Text = body,
                FireTime = fireUtc.ToLocalTime(),
                SmallIcon = "icon_small",
                LargeIcon = "icon_large",
            };
            return AndroidNotificationCenter.SendNotification(notification, ChannelId);
        }

        public void Cancel(int id)
        {
            if (id >= 0) AndroidNotificationCenter.CancelNotification(id);
        }

        public void OpenSystemSettings() => AndroidNotificationCenter.OpenNotificationSettings();
    }
}
#endif
```

#### Passo 3 — Quem agenda: `NotificationScheduler`

O `ExpeditionService` não sabe que notificações existem. O `NotificationScheduler` escuta os eventos dele — o mesmo padrão que o analytics usará na Fase 12.

```csharp
// Caminho: Assets/_Project/Scripts/Platform/NotificationScheduler.cs
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.Expeditions;

namespace StarExpedition.Platform
{
    /// Agenda uma notificação por Expedition e cancela no Claim (GDD §13.4).
    public class NotificationScheduler
    {
        private readonly SaveService _save;
        private readonly GameDatabase _db;
        private readonly ExpeditionService _expeditions;
        private readonly INotificationService _notifications;

        public NotificationScheduler(SaveService save, GameDatabase db, ExpeditionService expeditions,
                                     INotificationService notifications)
        {
            _save = save;
            _db = db;
            _expeditions = expeditions;
            _notifications = notifications;

            expeditions.Started += ScheduleFor;
            expeditions.Claimed += (e, _) => CancelFor(e);
        }

        private bool Enabled => _save.Data.settings.notificationsEnabled;

        /// Liga/desliga pelas Settings (Fase 13).
        public void RescheduleAll()
        {
            foreach (var e in _expeditions.Active)
            {
                CancelFor(e);
                if (!_expeditions.IsComplete(e)) ScheduleFor(e);
            }
        }

        public void CancelAll()
        {
            foreach (var e in _expeditions.Active) CancelFor(e);
        }

        private void ScheduleFor(ExpeditionState e)
        {
            if (!Enabled) return;
            var planet = _db.GetPlanet(e.planetId);
            e.notificationId = _notifications.Schedule(
                L.Get("notify.title"),
                L.Get("notify.body", planet.displayName),
                _expeditions.EndUtc(e));
            _save.MarkDirty();
        }

        private void CancelFor(ExpeditionState e)
        {
            if (e.notificationId < 0) return;
            _notifications.Cancel(e.notificationId);
            e.notificationId = -1;
            _save.MarkDirty();
        }
    }
}
```

> **O tutorial pede a permissão depois do envio.** Por isso a 1ª Expedition (30 s) normalmente não gera notificação — o que é bom: o jogador está olhando para a tela. A partir da 2ª, tudo é agendado.

#### Passo 4 — Ligar no bootstrap e no Boot

Em `GameBootstrap.CreateServices`, o `AppLifecycle` passa a ser criado **no início** (ele também serve de "hospedeiro" de corrotinas), e a plataforma real entra no Android:

```csharp
            var lifecycle = host.AddComponent<AppLifecycle>();   // movido para o início do método
            // ...
#if UNITY_ANDROID && !UNITY_EDITOR
            Services.Notifications = new AndroidNotificationService(lifecycle);
#else
            Services.Notifications = new NullNotificationService();
#endif
            Services.NotificationScheduler = new NotificationScheduler(save, database, expeditions, Services.Notifications);
```

Em `Services.cs`:

```csharp
        public static NotificationScheduler NotificationScheduler { get; internal set; }
```

Em `BootSequence.Start`, logo depois de `yield return LocalizationSettings.InitializationOperation;`:

```csharp
            Services.Notifications.Initialize();
```

#### Passo 5 — Commit

```powershell
git add .
git commit -m "Fase 10: notificações locais por Expedition"
```

#### ✅ Checkpoint da Fase 10
- **No Editor:** enviar uma Expedition (a partir da 2ª) mostra `[Notificação falsa #N] HH:mm:ss — Expedição concluída!: ...`; o Claim mostra `cancelada`.
- **No celular** (Build and Run com cabo; ver Fase 15 para a primeira build): no tutorial, o sistema pede a permissão. Envie uma Expedition em Rust-9 (2 min), feche o app: a notificação chega em ~2 min; tocar nela abre o jogo.
- Reinicie o celular com uma Expedition longa em andamento: a notificação chega mesmo assim.

#### Problemas comuns
- **Notificação com ícone de quadrado branco:** o `icon_small` tem cor. Precisa ser branco puro sobre transparente.
- **Nada chega no Android 13+:** a permissão foi negada. Em **Configurações do Android → Apps → Star Expedition Co. → Notificações**, ligue e teste de novo.
- **A notificação atrasa vários minutos:** normal com "Schedule at exact time = Nothing" e o celular em modo de economia de bateria.
- **`The type or namespace 'Unity.Notifications' could not be found`:** falta a referência `Unity.Notifications.Android` na asmdef (Passo 1.3).

---

### Fase 11 — Consentimento, anúncio recompensado e compras

> Objetivo: o formulário de consentimento (GDPR/LGPD) antes de qualquer anúncio, o Double Loot com AdMob de verdade, e o Ad-Free e o Founder Pack comprados pela Google Play (GDD §13.1–13.3).

**Conceitos novos:**
- **UMP (User Messaging Platform):** a biblioteca do Google que decide, pela região do jogador, se é preciso pedir consentimento, e mostra o formulário. Só depois dela o jogo pode pedir anúncios.
- **Ad unit:** o "espaço de anúncio" criado no painel do AdMob. O jogo tem um só, `double_loot`, do tipo **Rewarded**.
- **IDs de teste:** durante o desenvolvimento, usamos o ad unit de teste do Google. Clicar em anúncios reais do próprio app pode **banir a conta do AdMob**.
- **Compra pendente → confirmada:** a Google Play entrega a compra como "pendente"; o jogo entrega o conteúdo e **confirma**. Compras não confirmadas em 3 dias são reembolsadas automaticamente pelo Google.
- **External Dependency Manager (EDM4U):** vem junto com os SDKs do Google e baixa as bibliotecas Android (`.aar`) de que eles precisam, via Gradle.

#### Passo 1 — Contas e painéis

1. **AdMob** (admob.google.com): crie a conta com o mesmo Google da Play Console.
   - **Apps → Add app** → Android → "ainda não está publicado" → nome `Star Expedition Co.`. Anote o **App ID** (`ca-app-pub-…~…`).
   - **Ad units → Add → Rewarded** → nome `double_loot` → recompensa `1` / `double_loot`. Anote o **Ad unit ID** (`ca-app-pub-…/…`).
   - **Privacy & messaging → GDPR** → crie a mensagem de consentimento para o app (idiomas pt e en) e **publique**. Sem mensagem publicada, o UMP não mostra nada na Europa.
2. **app-ads.txt:** publique `https://manguebytegames.com/app-ads.txt` com a linha que o AdMob mostra em **Apps → app-ads.txt** (formato `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`). O site precisa ser o mesmo informado na ficha da Play Store (Fase 15).
3. **Play Console:** os produtos de compra só podem ser criados depois que a primeira build for enviada a uma faixa de teste (Fase 15, Passo 7). Volte aqui depois disso para:
   - **Monetizar → Produtos → Produtos no app → Criar produto**: `ad_free` (R$ 14,90) e `founder_pack` (R$ 9,90), com título e descrição em pt-BR e en (§13.2). **Ativar** os dois.
   - **Configurações → Teste de licença:** adicione as contas Google dos testadores. Para elas, as compras são de teste e não cobram.

#### Passo 2 — Instalar os SDKs

1. Baixe o **Google Mobile Ads Unity Plugin** (página de releases do repositório `googleads/googleads-mobile-unity` no GitHub) e importe o `.unitypackage`. Ele traz o UMP e o EDM4U.
2. **Assets → Google Mobile Ads → Settings**: cole o **Android App ID** do AdMob.
3. **Player Settings → Publishing Settings**: ligue **Custom Main Gradle Template** e **Custom Gradle Properties Template** (o EDM4U precisa dos dois).
4. **Assets → External Dependency Manager → Android Resolver → Force Resolve**. Espere terminar sem erros.
5. Na asmdef `StarExpedition`, acrescente a referência `UnityEngine.Purchasing` (o In-App Purchasing 5 já foi instalado na Fase 0). O plugin de anúncios vem como DLL e não precisa de referência.

#### Passo 3 — Consentimento: `ConsentService`

```csharp
// Caminho: Assets/_Project/Scripts/Platform/ConsentService.cs
using System;
using UnityEngine;
#if UNITY_ANDROID && !UNITY_EDITOR
using GoogleMobileAds.Ump.Api;
#endif

namespace StarExpedition.Platform
{
    /// Consentimento GDPR/LGPD pelo Google UMP (GDD §13.3). No Editor, sempre "pode".
    public class ConsentService
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        public bool CanRequestAds => ConsentInformation.CanRequestAds();
        public bool PrivacyOptionsRequired
            => ConsentInformation.PrivacyOptionsRequirementStatus == PrivacyOptionsRequirementStatus.Required;

        public void Gather(Action onDone)
        {
            var request = new ConsentRequestParameters();
#if DEVELOPMENT_BUILD
            // Simula um jogador europeu para testar o formulário. O hash do aparelho aparece no Logcat.
            request.ConsentDebugSettings = new ConsentDebugSettings { DebugGeography = DebugGeography.EEA };
#endif
            ConsentInformation.Update(request, updateError =>
            {
                if (updateError != null)
                {
                    Debug.LogWarning($"[Consent] {updateError.Message}");
                    onDone?.Invoke();
                    return;
                }
                ConsentForm.LoadAndShowConsentFormIfRequired(formError =>
                {
                    if (formError != null) Debug.LogWarning($"[Consent] {formError.Message}");
                    onDone?.Invoke();
                });
            });
        }

        public void ShowPrivacyOptions(Action onDone)
            => ConsentForm.ShowPrivacyOptionsForm(error => onDone?.Invoke());
#else
        public bool CanRequestAds => true;
        public bool PrivacyOptionsRequired => true;   // no Editor, mostra o botão para testar o layout
        public void Gather(Action onDone) => onDone?.Invoke();
        public void ShowPrivacyOptions(Action onDone)
        {
            Debug.Log("[Consent] abriria o formulário de privacidade");
            onDone?.Invoke();
        }
#endif
    }
}
```

#### Passo 4 — Anúncio: `AdMobAdService`

```csharp
// Caminho: Assets/_Project/Scripts/Platform/AdMobAdService.cs
#if UNITY_ANDROID && !UNITY_EDITOR
using System;
using System.Collections;
using GoogleMobileAds.Api;
using UnityEngine;

namespace StarExpedition.Platform
{
    /// Anúncio recompensado do Double Loot (GDD §13.1).
    public class AdMobAdService : IAdService
    {
#if DEVELOPMENT_BUILD
        private const string RewardedUnitId = "ca-app-pub-3940256099942544/5224354917";   // teste do Google
#else
        private const string RewardedUnitId = "ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN";     // double_loot (Passo 1)
#endif

        private readonly MonoBehaviour _coroutineHost;
        private RewardedAd _ad;
        private bool _loading;
        private int _failedLoads;

        public event Action ReadyChanged;

        public AdMobAdService(MonoBehaviour coroutineHost) => _coroutineHost = coroutineHost;

        public bool IsRewardedReady => _ad != null && _ad.CanShowAd();

        public void Initialize()
        {
            MobileAds.RaiseAdEventsOnUnityMainThread = true;   // callbacks na thread da Unity
            MobileAds.Initialize(_ => Load());
        }

        private void Load()
        {
            if (_loading || IsRewardedReady) return;
            _loading = true;

            RewardedAd.Load(RewardedUnitId, new AdRequest(), (ad, error) =>
            {
                _loading = false;
                if (error != null || ad == null)
                {
                    // Espera 2, 4, 8… até 64 s antes de tentar de novo.
                    _failedLoads++;
                    _coroutineHost.StartCoroutine(RetryAfter(Mathf.Min(64f, Mathf.Pow(2f, _failedLoads))));
                    return;
                }
                _failedLoads = 0;
                _ad = ad;
                ReadyChanged?.Invoke();
            });
        }

        private IEnumerator RetryAfter(float seconds)
        {
            yield return new WaitForSecondsRealtime(seconds);
            Load();
        }

        public void ShowRewarded(Action<bool> onFinished)
        {
            if (!IsRewardedReady)
            {
                onFinished?.Invoke(false);
                return;
            }

            var ad = _ad;
            _ad = null;
            ReadyChanged?.Invoke();

            bool rewarded = false;
            ad.OnAdFullScreenContentClosed += () =>
            {
                ad.Destroy();
                onFinished?.Invoke(rewarded);
                Load();   // já prepara o próximo
            };
            ad.OnAdFullScreenContentFailed += _ =>
            {
                ad.Destroy();
                onFinished?.Invoke(false);
                Load();
            };
            ad.Show(_ => rewarded = true);
        }
    }
}
#endif
```

> **A recompensa só vale no fechamento.** O callback do `Show` diz "ganhou", mas o jogo só aplica o Double Loot quando o anúncio **fecha** — assim o jogador volta para uma tela já atualizada, e um anúncio que falha no meio nunca entrega metade.

#### Passo 5 — Compras: `UnityPurchaseService`

```csharp
// Caminho: Assets/_Project/Scripts/Platform/UnityPurchaseService.cs
using System;
using System.Collections.Generic;
using System.Linq;
using StarExpedition.Economy;
using UnityEngine;
using UnityEngine.Purchasing;

namespace StarExpedition.Platform
{
    /// Ad-Free e Founder Pack pela Google Play, com Unity IAP 5 (GDD §13.2).
    /// Quem entrega o conteúdo é o ShopService; aqui só se fala com a loja.
    public class UnityPurchaseService : IPurchaseService
    {
        private readonly ShopService _shop;
        private readonly Dictionary<string, Product> _products = new Dictionary<string, Product>();
        private StoreController _store;

        public bool IsReady { get; private set; }
        public event Action ProductsChanged;
        public event Action<string> Purchased;
        public event Action<string> PurchaseFailed;

        public UnityPurchaseService(ShopService shop) => _shop = shop;

        public async void Initialize()
        {
            try
            {
                _store = UnityIAPServices.StoreController();
                _store.OnPurchasePending += HandlePurchasePending;
                _store.OnPurchaseFailed += HandlePurchaseFailed;
                _store.OnProductsFetched += HandleProductsFetched;
                _store.OnPurchasesFetched += HandlePurchasesFetched;
                _store.OnStoreDisconnected += _ => { IsReady = false; ProductsChanged?.Invoke(); };

                await _store.Connect();

                _store.FetchProducts(new List<ProductDefinition>
                {
                    new ProductDefinition(ProductIds.AdFree, ProductType.NonConsumable),
                    new ProductDefinition(ProductIds.FounderPack, ProductType.NonConsumable),
                });
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[IAP] Loja indisponível: {e.Message}");
            }
        }

        public string PriceText(string productId)
            => _products.TryGetValue(productId, out var p) ? p.metadata.localizedPriceString : "";

        public void Buy(string productId)
        {
            if (!IsReady || !_products.TryGetValue(productId, out var product))
            {
                PurchaseFailed?.Invoke(productId);
                return;
            }
            _store.PurchaseProduct(product);
        }

        private void HandleProductsFetched(List<Product> products)
        {
            foreach (var p in products) _products[p.definition.id] = p;
            IsReady = true;
            ProductsChanged?.Invoke();
            _store.FetchPurchases();   // restaura compras de reinstalações e de outros aparelhos
        }

        private void HandlePurchasesFetched(Orders orders)
        {
            foreach (var order in orders.ConfirmedOrders)
            foreach (var item in order.CartOrdered.Items())
                _shop.GrantEntitlement(item.Product.definition.id);   // idempotente: não entrega em dobro
        }

        private void HandlePurchasePending(PendingOrder order)
        {
            foreach (var item in order.CartOrdered.Items())
            {
                string id = item.Product.definition.id;
                _shop.GrantEntitlement(id);   // grava o save ANTES de confirmar com a loja
                Purchased?.Invoke(id);
            }
            _store.ConfirmPurchase(order);
        }

        private void HandlePurchaseFailed(FailedOrder order)
        {
            string id = order.CartOrdered.Items().FirstOrDefault()?.Product.definition.id;
            Debug.LogWarning($"[IAP] Falhou: {id} — {order.FailureReason}");
            PurchaseFailed?.Invoke(id);
        }
    }
}
```

> **Versão do IAP:** este código segue a API do In-App Purchasing **5.x** (`StoreController`, `PendingOrder`, `ConfirmPurchase`). Se o compilador reclamar de algum nome, confira a página "Upgrade to IAP v5" da documentação da Unity para a versão exata instalada.

#### Passo 6 — Ligar tudo

Em `Services.cs`:

```csharp
        public static ConsentService Consent { get; internal set; }
```

Em `GameBootstrap.CreateServices`, troque as linhas de anúncio e compras da Fase 7:

```csharp
            Services.Consent = new ConsentService();
#if UNITY_ANDROID && !UNITY_EDITOR
            Services.Ads = new AdMobAdService(lifecycle);
            Services.Purchases = new UnityPurchaseService(Services.Shop);
#else
            Services.Ads = new NullAdService();
            Services.Purchases = new NullPurchaseService(Services.Shop);
#endif
```

E o `BootSequence.Start` completo passa a ser:

```csharp
        private IEnumerator Start()
        {
            float started = Time.realtimeSinceStartup;

            yield return LocalizationSettings.InitializationOperation;
            Services.Notifications.Initialize();

            // 1. Consentimento antes de qualquer SDK que colete dados (GDD §13.3).
            bool consentDone = false;
            Services.Consent.Gather(() => consentDone = true);
            while (!consentDone) yield return null;

            // 2. Anúncios só se o consentimento permitir; a loja não depende dele.
            if (Services.Consent.CanRequestAds) Services.Ads.Initialize();
            Services.Purchases.Initialize();
            // Fase 12: analytics entra aqui.

            float remaining = _minimumLogoSeconds - (Time.realtimeSinceStartup - started);
            if (remaining > 0f) yield return new WaitForSecondsRealtime(remaining);

            SceneManager.LoadScene("Main");
        }
```

#### Passo 7 — Commit

```powershell
git add .
git commit -m "Fase 11: consentimento UMP, anúncio recompensado AdMob e compras Unity IAP 5"
```

#### ✅ Checkpoint da Fase 11
- **Editor:** tudo continua funcionando com as versões falsas. Comprar na Loja entrega o conteúdo na hora ("R$ 0,00 (teste)"); o Founder Pack dá 600 Credits e um Medic uma única vez.
- **Celular, build de desenvolvimento** (**Development Build** ligado):
  - Na primeira abertura aparece o formulário de consentimento (geografia simulada: EEA).
  - Num Success, o botão **Dobrar (anúncio)** aparece depois de alguns segundos; o anúncio de **teste** do Google abre; assistindo até o fim, o Loot dobra.
- **Celular, depois da Fase 15, Passo 7 (faixa de teste interno), com uma conta de teste de licença:** a Loja mostra os preços reais em R$; comprar o Ad-Free abre a tela da Google Play ("pedido de teste") e o selo "Adquirido" aparece. Desinstalar e reinstalar: o Ad-Free volta sozinho.

#### Problemas comuns
- **O app fecha ao abrir, com erro "Missing application ID" no Logcat:** o App ID do AdMob não foi colado em **Assets → Google Mobile Ads → Settings**.
- **Erros de Gradle "Duplicate class" ou "AndroidX":** rode **Force Resolve** de novo e confirme que os dois templates de Gradle (Passo 2.3) estão ligados.
- **O formulário de consentimento não aparece:** a mensagem GDPR não foi publicada no AdMob, ou a geografia de depuração não está ativa (só em Development Build).
- **"Loja indisponível":** o app não foi instalado a partir da Play (faixa de teste), ou a conta do aparelho não é testadora de licença, ou os produtos não estão **ativos**.
- **O Double Loot nunca aparece em release:** o ad unit de release ainda é o placeholder `ca-app-pub-XXXX…`.

---

### Fase 12 — Firebase Analytics e Crashlytics

> Objetivo: saber o que os jogadores fazem (funil do tutorial, até onde chegam, quanto falham) e receber relatório de todo crash — os dados que ajustam os valores iniciais da §16 no teste fechado (GDD §13.6).

**Conceitos novos:**
- **Evento de analytics:** um nome curto (`expedition_claim`) com parâmetros (`planet=kora`, `success=1`). O painel do Firebase soma os eventos de todos os jogadores.
- **Funil:** a sequência de eventos que mostra onde os jogadores param (ex.: 100% abrem → 80% terminam o tutorial → 40% chegam à Galaxy 2).
- **Crashlytics:** registra crashes e exceções com a pilha de chamadas. Para builds IL2CPP, precisa dos **símbolos** da build (Fase 15) para mostrar nomes de métodos em vez de endereços.
- **Reporter por eventos:** como o `NotificationScheduler`, o `AnalyticsReporter` só escuta os eventos dos services. Nenhum service de regra de jogo sabe que o Firebase existe.

#### Passo 1 — Projeto no Firebase

1. console.firebase.google.com → **Adicionar projeto** → `Star Expedition Co` → Google Analytics **ligado**.
2. **Adicionar app → Android** → package `com.manguebytegames.starexpeditionco` → baixe o `google-services.json` e coloque em `Assets/` (em qualquer pasta).
3. Baixe o **Firebase Unity SDK** e importe **`FirebaseAnalytics.unitypackage`** e **`FirebaseCrashlytics.unitypackage`** (da mesma versão).
4. **Assets → External Dependency Manager → Android Resolver → Force Resolve**.

> **O `google-services.json` vai para o Git?** Ele identifica o projeto, não é uma senha. Num repositório **privado**, pode versionar. Num público, deixe fora (`.gitignore`) e guarde uma cópia junto do keystore.

#### Passo 2 — `FirebaseAnalyticsService`

```csharp
// Caminho: Assets/_Project/Scripts/Platform/FirebaseAnalyticsService.cs
#if UNITY_ANDROID && !UNITY_EDITOR
using System.Collections.Generic;
using System.Linq;
using Firebase;
using Firebase.Analytics;
using Firebase.Crashlytics;
using Firebase.Extensions;
using UnityEngine;

namespace StarExpedition.Platform
{
    public class FirebaseAnalyticsService : IAnalyticsService
    {
        private const int MaxQueued = 50;

        private readonly List<(string name, (string key, object value)[] parameters)> _queue
            = new List<(string, (string, object)[])>();
        private bool _ready;

        public void Initialize(bool consentGranted)
        {
            FirebaseApp.CheckAndFixDependenciesAsync().ContinueWithOnMainThread(task =>
            {
                if (task.Result != DependencyStatus.Available)
                {
                    Debug.LogWarning($"[Firebase] Indisponível: {task.Result}");
                    return;
                }

                _ = FirebaseApp.DefaultInstance;   // cria o app; o Crashlytics começa a funcionar aqui
                Crashlytics.ReportUncaughtExceptionsAsFatal = true;

                var status = consentGranted ? ConsentStatus.Granted : ConsentStatus.Denied;
                FirebaseAnalytics.SetConsent(new Dictionary<ConsentType, ConsentStatus>
                {
                    { ConsentType.AnalyticsStorage, status },
                    { ConsentType.AdStorage, status },
                    { ConsentType.AdUserData, status },
                    { ConsentType.AdPersonalization, status },
                });
                FirebaseAnalytics.SetAnalyticsCollectionEnabled(consentGranted);

                _ready = true;
                foreach (var (name, parameters) in _queue) Send(name, parameters);
                _queue.Clear();
            });
        }

        public void Log(string eventName, params (string key, object value)[] parameters)
        {
            if (_ready) Send(eventName, parameters);
            else if (_queue.Count < MaxQueued) _queue.Add((eventName, parameters));
        }

        private static void Send(string name, (string key, object value)[] parameters)
            => FirebaseAnalytics.LogEvent(name, parameters.Select(ToParameter).ToArray());

        private static Parameter ToParameter((string key, object value) p) => p.value switch
        {
            int i => new Parameter(p.key, i),
            long l => new Parameter(p.key, l),
            float f => new Parameter(p.key, f),
            double d => new Parameter(p.key, d),
            bool b => new Parameter(p.key, b ? 1L : 0L),
            _ => new Parameter(p.key, p.value?.ToString() ?? ""),
        };
    }
}
#endif
```

#### Passo 3 — Quem registra: `AnalyticsReporter`

```csharp
// Caminho: Assets/_Project/Scripts/Platform/AnalyticsReporter.cs
using System.Linq;
using StarExpedition.Core;

namespace StarExpedition.Platform
{
    /// Transforma os eventos dos services em eventos de analytics (GDD §13.6).
    public static class AnalyticsReporter
    {
        public static void Attach(IAnalyticsService analytics)
        {
            var db = Services.Database;

            Services.Tutorial.StepChanged += step => analytics.Log("tutorial_step", ("step", step.ToString()));

            Services.Expeditions.Started += e =>
            {
                var planet = db.GetPlanet(e.planetId);
                var squad = e.memberIds.Select(Services.Crew.Get).Where(m => m != null).ToList();
                var odds = Services.Expeditions.PreviewOdds(planet, squad);
                analytics.Log("expedition_start",
                    ("planet", e.planetId), ("cycle", e.cycle), ("squad_size", squad.Count),
                    ("success_chance", (int)(odds.SuccessChance * 100)), ("duration", e.durationSeconds));
            };

            Services.Expeditions.Claimed += (e, o) => analytics.Log("expedition_claim",
                ("planet", e.planetId), ("cycle", e.cycle), ("success", o.success),
                ("member_lost", o.lostMemberId != null), ("items", o.loot.Sum(s => s.quantity)),
                ("rare", o.loot.Any(s => db.GetItem(s.itemId)?.category == Data.ItemCategory.RareItem)));

            Services.Expeditions.LootDoubled += o => analytics.Log("double_loot", ("planet", o.planetId));
            Services.Progress.PlanetUnlocked += p => analytics.Log("planet_unlocked",
                ("planet", p.id), ("index", db.IndexOf(p)), ("cycle", Services.Progress.Cycle));
            Services.Progress.CycleStarted += cycle => analytics.Log("cycle_start", ("cycle", cycle));
            Services.Crafting.Crafted += r => analytics.Log("craft", ("recipe", r.id), ("tier", r.tier));
            Services.Crew.Hired += m => analytics.Log("hire", ("class", m.classId), ("roster_size", Services.Crew.Roster.Count));
            Services.Crew.Lost += (m, gear) => analytics.Log("member_lost", ("class", m.classId), ("had_gear", !string.IsNullOrEmpty(gear)));
            Services.Crew.EmergencyRecruited += m => analytics.Log("emergency_recruit");
            Services.Shop.Sold += (item, qty, credits) => analytics.Log("sell", ("item", item.id), ("quantity", qty), ("credits", credits));
            Services.Purchases.Purchased += id => analytics.Log("purchase", ("product", id));
        }
    }
}
```

Os eventos de anúncio (`ad_offer_accepted`, `ad_finished`) já são registrados pelo `ResultPanel` (Fase 8).

#### Passo 4 — Ligar

Em `GameBootstrap.CreateServices`, troque a linha do analytics da Fase 7 e ligue o reporter **depois** de todos os services existirem:

```csharp
#if UNITY_ANDROID && !UNITY_EDITOR
            Services.Analytics = new FirebaseAnalyticsService();
#else
            Services.Analytics = new NullAnalyticsService();
#endif
            AnalyticsReporter.Attach(Services.Analytics);
```

Em `BootSequence.Start`, no lugar do comentário `// Fase 12`:

```csharp
            Services.Analytics.Initialize(Services.Consent.CanRequestAds);
```

#### Passo 5 — Commit

```powershell
git add .
git commit -m "Fase 12: Firebase Analytics, Crashlytics e AnalyticsReporter"
```

#### ✅ Checkpoint da Fase 12
- **Editor:** jogar o tutorial mostra no Console `[Analytics] tutorial_step step=Send`, `[Analytics] expedition_start planet=kora ...` etc.
- **Celular (build de desenvolvimento):** ative o modo de depuração com `adb shell setprop debug.firebase.analytics.app com.manguebytegames.starexpeditionco`. No Firebase, **Analytics → DebugView** mostra os eventos em tempo real.
- **Crashlytics:** num build de desenvolvimento, force um erro (ex.: um botão temporário com `throw new System.Exception("teste")`), reabra o app e confira o crash em **Crashlytics** em até alguns minutos. Remova o botão.

#### Problemas comuns
- **"Firebase Indisponível: … Google Play services":** o emulador não tem Google Play. Use um emulador com a Play Store ou um aparelho real.
- **Nada aparece no DebugView:** o `setprop` precisa ser feito com o app fechado; depois, abra o app de novo. Sem consentimento (`CanRequestAds` falso), a coleta fica desligada.
- **Crash sem nomes de métodos:** faltam os símbolos IL2CPP (Fase 15, Passo 5).

---

### Fase 13 — Áudio e Settings

> Objetivo: a infraestrutura de som pronta para receber os arquivos (a fonte do áudio está **Em aberto**, GDD §12), a tela de Settings (§11.2) e a versão final do bootstrap.

**Conceitos novos:**
- **Biblioteca de áudio:** um ScriptableObject que liga cada som do jogo (`SfxId.ClaimSuccess`) a um ou mais arquivos. O código pede "o som de Claim com Success" sem saber qual arquivo é. Enquanto a biblioteca estiver vazia, o jogo roda em silêncio sem erro; quando os sons forem escolhidos, basta arrastá-los.
- **`PlayOneShot`:** toca um efeito curto sem interromper o que já está tocando na mesma fonte.
- **Trocar de idioma em jogo:** textos colocados por código só mudam quando a tela é redesenhada. O jeito mais simples e à prova de esquecimento: trocar o idioma e **recarregar a cena `Main`** (os services continuam vivos, então nada se perde).

#### Passo 1 — Sons: `SfxId`, `AudioLibrary`, `AudioService`

```csharp
// Caminho: Assets/_Project/Scripts/Audio/AudioLibrary.cs
using System;
using System.Collections.Generic;
using UnityEngine;

namespace StarExpedition.Audio
{
    /// Os eventos sonoros da 1.0 (GDD §12).
    public enum SfxId
    {
        ButtonTap, TabSwitch, SheetOpen, SheetClose,
        ExpeditionSent, ExpeditionReturned, ClaimSuccess, ClaimFailure, MemberLost, RareItem,
        Craft, Equip, Sell, Hire, NewCycle, Purchase,
    }

    /// Fica em Resources/AudioLibrary.asset. Arquivos: Audio/SFX/SFX_<Id>.ogg e Audio/Music/MUS_Ambient.ogg.
    [CreateAssetMenu(menuName = "Star Expedition/Audio Library")]
    public class AudioLibrary : ScriptableObject
    {
        [Serializable]
        public class Entry
        {
            public SfxId id;
            public AudioClip[] clips;   // mais de um = sorteia (evita repetição cansativa)
        }

        public AudioClip music;
        public List<Entry> sfx = new List<Entry>();

        public AudioClip[] Get(SfxId id) => sfx.Find(e => e.id == id)?.clips;
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Audio/AudioService.cs
using System.Collections.Generic;
using StarExpedition.Core;
using UnityEngine;

namespace StarExpedition.Audio
{
    /// Música ambiente e efeitos. Vive no [Services] (sobrevive às trocas de cena).
    public class AudioService : MonoBehaviour
    {
        private AudioLibrary _library;
        private AudioSource _music;
        private AudioSource _sfx;
        private readonly HashSet<string> _announcedReturns = new HashSet<string>();
        private float _nextReturnCheck;
        private bool _returnsPrimed;

        public void Setup(AudioLibrary library, float musicVolume, float sfxVolume)
        {
            _library = library;
            _music = gameObject.AddComponent<AudioSource>();
            _music.loop = true;
            _music.playOnAwake = false;
            _sfx = gameObject.AddComponent<AudioSource>();
            _sfx.playOnAwake = false;

            SetMusicVolume(musicVolume);
            SetSfxVolume(sfxVolume);

            if (_library != null && _library.music != null)
            {
                _music.clip = _library.music;
                _music.Play();
            }
        }

        public void SetMusicVolume(float volume) { if (_music) _music.volume = volume; }
        public void SetSfxVolume(float volume) { if (_sfx) _sfx.volume = volume; }

        public void Play(SfxId id)
        {
            var clips = _library != null ? _library.Get(id) : null;
            if (clips == null || clips.Length == 0) return;   // som ainda não escolhido (GDD §12)
            _sfx.PlayOneShot(clips[Random.Range(0, clips.Length)]);
        }

        /// "Expedition concluída" com o app aberto: confere uma vez por segundo.
        private void Update()
        {
            if (Services.Expeditions == null || Time.unscaledTime < _nextReturnCheck) return;
            _nextReturnCheck = Time.unscaledTime + 1f;

            foreach (var e in Services.Expeditions.Active)
            {
                if (!Services.Expeditions.IsComplete(e) || !_announcedReturns.Add(e.planetId + e.startUtcTicks)) continue;
                if (_returnsPrimed) Play(SfxId.ExpeditionReturned);   // não toca para o que já tinha voltado ao abrir o app
            }
            _returnsPrimed = true;
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Audio/AudioReactor.cs
using System.Linq;
using StarExpedition.Core;
using StarExpedition.Data;

namespace StarExpedition.Audio
{
    /// Liga os eventos dos services aos sons (mesmo padrão do AnalyticsReporter).
    public static class AudioReactor
    {
        public static void Attach(AudioService audio)
        {
            var db = Services.Database;
            Services.Expeditions.Started += _ => audio.Play(SfxId.ExpeditionSent);
            Services.Expeditions.Claimed += (e, o) =>
            {
                audio.Play(o.success ? SfxId.ClaimSuccess : SfxId.ClaimFailure);
                if (o.lostMemberId != null) audio.Play(SfxId.MemberLost);
                if (o.loot.Any(s => db.GetItem(s.itemId)?.category == ItemCategory.RareItem)) audio.Play(SfxId.RareItem);
            };
            Services.Crafting.Crafted += _ => audio.Play(SfxId.Craft);
            Services.Crew.Equipped += _ => audio.Play(SfxId.Equip);
            Services.Crew.Hired += _ => audio.Play(SfxId.Hire);
            Services.Shop.Sold += (_, __, ___) => audio.Play(SfxId.Sell);
            Services.Shop.EntitlementGranted += _ => audio.Play(SfxId.Purchase);
            Services.Progress.CycleStarted += _ => audio.Play(SfxId.NewCycle);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Audio/UIButtonSound.cs
using StarExpedition.Core;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace StarExpedition.Audio
{
    /// Coloque nos prefabs de botão: toca o som de toque.
    [RequireComponent(typeof(Selectable))]
    public class UIButtonSound : MonoBehaviour, IPointerClickHandler
    {
        private Selectable _selectable;
        private void Awake() => _selectable = GetComponent<Selectable>();

        public void OnPointerClick(PointerEventData eventData)
        {
            if (_selectable.IsInteractable()) Services.Audio?.Play(SfxId.ButtonTap);
        }
    }
}
```

Acrescente os sons de navegação:
- `UIRoot.ShowTab`, primeira linha: `Services.Audio?.Play(StarExpedition.Audio.SfxId.TabSwitch);`
- `BottomSheet.Open`, depois de `IsOpen = true;`: `Services.Audio?.Play(StarExpedition.Audio.SfxId.SheetOpen);`
- `BottomSheet.Close`, depois de `IsOpen = false;`: `Services.Audio?.Play(StarExpedition.Audio.SfxId.SheetClose);`

(com `using StarExpedition.Core;` nos dois arquivos).

Crie o asset: **Create → Star Expedition → Audio Library** em `Assets/_Project/Resources/AudioLibrary.asset`, com uma entrada por `SfxId` e os `clips` vazios. Quando os sons forem escolhidos: importe como **Vorbis**, **Load Type** `Decompress On Load` (efeitos) ou `Streaming` (música), e arraste para a biblioteca.

#### Passo 2 — `SettingsService`

```csharp
// Caminho: Assets/_Project/Scripts/Core/SettingsService.cs
using StarExpedition.Audio;
using StarExpedition.Platform;
using UnityEngine;
using UnityEngine.Localization.Settings;

namespace StarExpedition.Core
{
    /// Volumes, idioma e notificações (GDD §11.2).
    public class SettingsService
    {
        private readonly SaveService _save;
        private readonly AudioService _audio;
        private readonly NotificationScheduler _scheduler;

        public SettingsService(SaveService save, AudioService audio, NotificationScheduler scheduler)
        {
            _save = save;
            _audio = audio;
            _scheduler = scheduler;
        }

        private SettingsState State => _save.Data.settings;

        public float MusicVolume => State.musicVolume;
        public float SfxVolume => State.sfxVolume;
        public bool NotificationsEnabled => State.notificationsEnabled;
        public string LocaleCode => LocalizationSettings.SelectedLocale?.Identifier.Code;

        public void SetMusicVolume(float volume)
        {
            State.musicVolume = Mathf.Clamp01(volume);
            _audio.SetMusicVolume(State.musicVolume);
            _save.MarkDirty();
        }

        public void SetSfxVolume(float volume)
        {
            State.sfxVolume = Mathf.Clamp01(volume);
            _audio.SetSfxVolume(State.sfxVolume);
            _save.MarkDirty();
        }

        public void SetNotificationsEnabled(bool enabled)
        {
            State.notificationsEnabled = enabled;
            _save.MarkDirty();
            if (enabled) _scheduler.RescheduleAll();
            else _scheduler.CancelAll();
        }

        public bool SetLocale(string code)
        {
            var locale = LocalizationSettings.AvailableLocales.GetLocale(code);
            if (locale == null) return false;
            LocalizationSettings.SelectedLocale = locale;
            State.localeCode = code;
            _save.MarkDirty();
            return true;
        }

        /// No Boot: aplica o idioma escolhido pelo jogador (vazio = idioma do aparelho).
        public void ApplyStoredLocale()
        {
            if (string.IsNullOrEmpty(State.localeCode)) return;
            var locale = LocalizationSettings.AvailableLocales.GetLocale(State.localeCode);
            if (locale != null) LocalizationSettings.SelectedLocale = locale;
        }
    }
}
```

#### Passo 3 — `SettingsPanel`

```csharp
// Caminho: Assets/_Project/Scripts/UI/SettingsPanel.cs
using StarExpedition.Core;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace StarExpedition.UI
{
    public class SettingsPanel : BottomSheet
    {
        private const string PrivacyPolicyUrl = "https://manguebytegames.com/privacidade/starexpeditionco";

        [SerializeField] private Slider _music;
        [SerializeField] private Slider _sfx;
        [SerializeField] private Button _portuguese;
        [SerializeField] private Button _english;
        [SerializeField] private Toggle _notifications;
        [SerializeField] private Button _notificationsBlocked;
        [SerializeField] private Button _privacyOptions;
        [SerializeField] private Button _privacyPolicy;
        [SerializeField] private Button _versionButton;
        [SerializeField] private TMP_Text _versionLabel;

        private int _versionTaps;

        protected override void Awake()
        {
            base.Awake();
            _music.onValueChanged.AddListener(v => Services.Settings.SetMusicVolume(v));
            _sfx.onValueChanged.AddListener(v => Services.Settings.SetSfxVolume(v));
            _portuguese.onClick.AddListener(() => ChangeLocale("pt-BR"));
            _english.onClick.AddListener(() => ChangeLocale("en"));
            _notifications.onValueChanged.AddListener(HandleNotificationsToggle);
            _notificationsBlocked.onClick.AddListener(() => Services.Notifications.OpenSystemSettings());
            _privacyOptions.onClick.AddListener(() => Services.Consent.ShowPrivacyOptions(Refresh));
            _privacyPolicy.onClick.AddListener(() => Application.OpenURL(PrivacyPolicyUrl));
            _versionButton.onClick.AddListener(HandleVersionTap);
        }

        private void OnEnable() => Refresh();

        private void Refresh()
        {
            var settings = Services.Settings;
            _music.SetValueWithoutNotify(settings.MusicVolume);
            _sfx.SetValueWithoutNotify(settings.SfxVolume);
            _portuguese.interactable = settings.LocaleCode != "pt-BR";
            _english.interactable = settings.LocaleCode != "en";
            _notifications.SetIsOnWithoutNotify(settings.NotificationsEnabled);
            _notificationsBlocked.gameObject.SetActive(settings.NotificationsEnabled && !Services.Notifications.IsPermissionGranted);
            _privacyOptions.gameObject.SetActive(Services.Consent.PrivacyOptionsRequired);
            _versionLabel.text = L.Get("settings.version", Application.version);
        }

        private void HandleNotificationsToggle(bool on)
        {
            if (on && !Services.Notifications.IsPermissionGranted)
            {
                // Pede de novo; se o Android já bloqueou, o botão "bloqueadas" leva às configurações.
                Services.Notifications.RequestPermission(_ =>
                {
                    Services.Settings.SetNotificationsEnabled(true);
                    Refresh();
                });
                return;
            }
            Services.Settings.SetNotificationsEnabled(on);
            Refresh();
        }

        private void ChangeLocale(string code)
        {
            if (!Services.Settings.SetLocale(code)) return;
            Services.Save.SaveNow();
            SceneManager.LoadScene("Main");   // redesenha todos os textos no novo idioma
        }

        private void HandleVersionTap()
        {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            if (++_versionTaps >= 5) { _versionTaps = 0; DevPanel.Toggle(); }   // Fase 14
#endif
        }
    }
}
```

**Prefab `SettingsPanel`:** modelo de painel com linhas: Música (Slider), Efeitos (Slider), Idioma (dois botões "Português" / "English", sempre escritos no próprio idioma), Notificações (Toggle + `NotificationsBlocked` embaixo), Opções de privacidade, Política de privacidade, e o `VersionButton` com o `VersionLabel` (TMP 8 px, Slate 300). Ligue-o no campo `_settingsPanel` do `TopBar` (Fase 7).

> O `DevPanel` só é criado na Fase 14. Até lá, comente a linha `DevPanel.Toggle()` ou pule para a Fase 14 e volte.

#### Passo 4 — Versão final do bootstrap

Com todas as fases, `Services.cs` e `GameBootstrap.cs` ficam assim (substitua os arquivos inteiros):

```csharp
// Caminho: Assets/_Project/Scripts/Core/Services.cs
using StarExpedition.Audio;
using StarExpedition.Crafting;
using StarExpedition.Crew;
using StarExpedition.Data;
using StarExpedition.Economy;
using StarExpedition.Expeditions;
using StarExpedition.Items;
using StarExpedition.Onboarding;
using StarExpedition.Platform;
using StarExpedition.Progress;

namespace StarExpedition.Core
{
    /// Acesso central a todos os services. Preenchido só pelo GameBootstrap.
    public static class Services
    {
        public static GameDatabase Database { get; internal set; }
        public static SaveService Save { get; internal set; }
        public static IClock Clock { get; internal set; }

        public static WalletService Wallet { get; internal set; }
        public static InventoryService Inventory { get; internal set; }
        public static CrewService Crew { get; internal set; }
        public static ProgressService Progress { get; internal set; }
        public static ExpeditionService Expeditions { get; internal set; }
        public static CraftingService Crafting { get; internal set; }
        public static ShopService Shop { get; internal set; }
        public static TutorialService Tutorial { get; internal set; }

        public static ConsentService Consent { get; internal set; }
        public static INotificationService Notifications { get; internal set; }
        public static NotificationScheduler NotificationScheduler { get; internal set; }
        public static IAdService Ads { get; internal set; }
        public static IPurchaseService Purchases { get; internal set; }
        public static IAnalyticsService Analytics { get; internal set; }

        public static AudioService Audio { get; internal set; }
        public static SettingsService Settings { get; internal set; }
    }
}
```

```csharp
// Caminho: Assets/_Project/Scripts/Core/GameBootstrap.cs
using System;
using StarExpedition.Audio;
using StarExpedition.Crafting;
using StarExpedition.Crew;
using StarExpedition.Data;
using StarExpedition.Economy;
using StarExpedition.Expeditions;
using StarExpedition.Items;
using StarExpedition.Onboarding;
using StarExpedition.Platform;
using StarExpedition.Progress;
using UnityEngine;

namespace StarExpedition.Core
{
    public static class GameBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void Initialize()
        {
            Application.targetFrameRate = 60;

            var host = new GameObject("[Services]");
            UnityEngine.Object.DontDestroyOnLoad(host);

            CreateServices(host);
        }

        private static void CreateServices(GameObject host)
        {
            var lifecycle = host.AddComponent<AppLifecycle>();

            // --- Dados ---
            var database = Resources.Load<GameDatabase>("GameDatabase");
            if (database == null)
            {
                Debug.LogError("[Boot] Resources/GameDatabase.asset não encontrado. Rode Star Expedition → Seed Database.");
                return;
            }
            database.Initialize();
            Services.Database = database;

            // --- Núcleo ---
            var save = new SaveService(new SaveStorage(Application.persistentDataPath));
            save.Load();
            var clock = new TrustedClock(save, () => DateTime.UtcNow);
            Services.Save = save;
            Services.Clock = clock;

            // --- Regras de jogo ---
            var rng = new System.Random();
            var wallet = new WalletService(save);
            var inventory = new InventoryService(save, database);
            var crew = new CrewService(save, database, wallet, inventory, rng);
            var progress = new ProgressService(save, database);
            var expeditions = new ExpeditionService(save, database, clock, crew, inventory, progress, rng);
            crew.SetBusyCheck(expeditions.IsMemberBusy);
            progress.SetActiveExpeditionCheck(() => expeditions.Active.Count > 0);
            var crafting = new CraftingService(save, database, inventory, progress);
            var shop = new ShopService(save, database, inventory, wallet, crew);

            Services.Wallet = wallet;
            Services.Inventory = inventory;
            Services.Crew = crew;
            Services.Progress = progress;
            Services.Expeditions = expeditions;
            Services.Crafting = crafting;
            Services.Shop = shop;
            Services.Tutorial = new TutorialService(save, database, crew, inventory, expeditions, crafting);

            // --- Plataforma (versões reais só no aparelho Android) ---
            Services.Consent = new ConsentService();
#if UNITY_ANDROID && !UNITY_EDITOR
            Services.Notifications = new AndroidNotificationService(lifecycle);
            Services.Ads = new AdMobAdService(lifecycle);
            Services.Purchases = new UnityPurchaseService(shop);
            Services.Analytics = new FirebaseAnalyticsService();
#else
            Services.Notifications = new NullNotificationService();
            Services.Ads = new NullAdService();
            Services.Purchases = new NullPurchaseService(shop);
            Services.Analytics = new NullAnalyticsService();
#endif
            Services.NotificationScheduler = new NotificationScheduler(save, database, expeditions, Services.Notifications);
            AnalyticsReporter.Attach(Services.Analytics);

            // --- Áudio e Settings ---
            var audio = host.AddComponent<AudioService>();
            audio.Setup(Resources.Load<AudioLibrary>("AudioLibrary"), save.Data.settings.musicVolume, save.Data.settings.sfxVolume);
            Services.Audio = audio;
            AudioReactor.Attach(audio);
            Services.Settings = new SettingsService(save, audio, Services.NotificationScheduler);

#if UNITY_EDITOR || DEVELOPMENT_BUILD
            host.AddComponent<DevPanel>();
#endif

            crew.EnsureEmergencyRecruit();   // cobre um save antigo que ficou sem ninguém
            Debug.Log(save.IsNewGame ? "[Boot] Jogo novo." : "[Boot] Save carregado.");
        }
    }
}
```

E o `BootSequence.Start` final:

```csharp
        private IEnumerator Start()
        {
            float started = Time.realtimeSinceStartup;

            yield return LocalizationSettings.InitializationOperation;
            Services.Settings.ApplyStoredLocale();
            Services.Notifications.Initialize();

            bool consentDone = false;
            Services.Consent.Gather(() => consentDone = true);
            while (!consentDone) yield return null;

            if (Services.Consent.CanRequestAds) Services.Ads.Initialize();
            Services.Purchases.Initialize();
            Services.Analytics.Initialize(Services.Consent.CanRequestAds);

            float remaining = _minimumLogoSeconds - (Time.realtimeSinceStartup - started);
            if (remaining > 0f) yield return new WaitForSecondsRealtime(remaining);

            SceneManager.LoadScene("Main");
        }
```

#### Passo 5 — Commit

```powershell
git add .
git commit -m "Fase 13: áudio, Settings e bootstrap final"
```

#### ✅ Checkpoint da Fase 13
- A engrenagem do topo abre as Settings. Os sliders mudam o volume (teste com qualquer `.ogg` provisório na `AudioLibrary`) e o valor volta igual depois de reabrir o jogo.
- **English** recarrega a tela com todos os textos em inglês; reabrindo o jogo, continua em inglês.
- Desligar **Notificações** com uma Expedition ativa mostra `[Notificação falsa #N] cancelada` no Console; religar agenda de novo.
- Com a `AudioLibrary` vazia, o jogo inteiro roda sem nenhum erro no Console.

#### Problemas comuns
- **`NullReferenceException` no `AudioService.Setup`:** normal só se a `AudioLibrary` não existir em `Resources`; o serviço aceita biblioteca nula, então confira se o erro não vem de outro lugar.
- **O idioma volta ao do aparelho ao reabrir:** o `ApplyStoredLocale` precisa rodar **depois** da `InitializationOperation` no `BootSequence`.

---

### Fase 14 — Testes automáticos e ferramentas de desenvolvimento

> Objetivo: provar, em segundos e sem abrir o jogo, que as fórmulas da §16.2, o relógio, o desbloqueio e as regras de Roster fazem o que o GDD diz — e ter atalhos para testar horas de jogo em minutos.

**Conceitos novos:**
- **Teste EditMode:** um método marcado com `[Test]` que roda no **Test Runner** do Editor, sem cena e sem Play. Como os services são C# puro (Fase 1), dá para criar um `CrewService` inteiro num teste.
- **Dados de teste:** o `TestData` monta um `GameDatabase` pequeno em memória com `ScriptableObject.CreateInstance`, com os mesmos números da §16. O teste não depende dos assets do projeto: se alguém mudar um valor no Inspector, os testes das **fórmulas** continuam valendo.
- **Teste como documentação do balanceamento:** o teste `Gate_ScoutGuardScout_Da39PorCento` é literalmente a frase da §16.6. Se o balanceamento mudar, o teste falha e obriga a atualizar o GDD junto.

#### Passo 1 — Assembly de testes

1. Em `Tests/EditMode/`: **Create → Testing → Tests Assembly Folder**. Renomeie a asmdef criada para `StarExpedition.Tests`.
2. No Inspector da asmdef, acrescente a referência `StarExpedition`. Confirme **Platforms** = só **Editor** e, em **Assembly References**, `nunit.framework.dll`.

#### Passo 2 — `TestData`

```csharp
// Caminho: Assets/_Project/Tests/EditMode/TestData.cs
using System;
using System.Collections.Generic;
using System.IO;
using StarExpedition.Core;
using StarExpedition.Data;
using UnityEngine;

namespace StarExpedition.Tests
{
    /// Banco de dados mínimo em memória, com os números da §16.
    public static class TestData
    {
        private static readonly int[] Risks = { 5, 10, 14, 18, 24, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90 };
        private static readonly int[] Durations =
            { 60, 120, 240, 360, 600, 900, 900, 1200, 1800, 2400, 3000, 3600, 3600, 5400, 7200, 9000, 10800, 14400 };

        public static GameDatabase CreateDatabase()
        {
            var iron = Item("iron_ore", ItemCategory.RawMaterial, 2);
            var silica = Item("silica_sand", ItemCategory.RawMaterial, 2);
            var relic = Item("alien_relic", ItemCategory.RareItem, 80);
            var kit = Item("salvage_kit", ItemCategory.Equipment, 30, new CrewBonus { lootPercent = 15 });
            var scanner = Item("field_scanner", ItemCategory.Equipment, 30, new CrewBonus { success = 5 });

            var scout = Class("scout", new CrewBonus { success = 12 }, 60);
            var engineer = Class("engineer", new CrewBonus { lootPercent = 40 }, 60);
            var guard = Class("guard", new CrewBonus { riskReduction = 10 }, 60);
            var medic = Class("medic", new CrewBonus { lossReduction = 20 }, 120);
            var pilot = Class("pilot", new CrewBonus { durationPercent = 25 }, 120);

            var db = ScriptableObject.CreateInstance<GameDatabase>();
            db.balance = ScriptableObject.CreateInstance<GameBalance>();   // valores padrão = §16.2
            db.classes = new List<CrewClassDefinition> { scout, engineer, guard, medic, pilot };
            db.items = new List<ItemDefinition> { iron, silica, relic, kit, scanner };
            db.recipes = new List<RecipeDefinition>();

            for (int g = 0; g < 3; g++)
            {
                var galaxy = ScriptableObject.CreateInstance<GalaxyDefinition>();
                galaxy.id = $"galaxy{g + 1}";
                for (int i = 0; i < 6; i++)
                {
                    int index = g * 6 + i;
                    var planet = ScriptableObject.CreateInstance<PlanetDefinition>();
                    planet.id = $"p{index}";
                    planet.baseRisk = Risks[index];
                    planet.durationSeconds = Durations[index];
                    planet.lootTable = new List<LootEntry>
                    {
                        new LootEntry { item = iron, chance = 1f, min = 3, max = 5 },
                        new LootEntry { item = relic, chance = 0.01f, min = 1, max = 1 },
                    };
                    galaxy.planets.Add(planet);
                }
                db.galaxies.Add(galaxy);
            }
            db.Initialize();

            db.balance.starterClasses = new List<CrewClassDefinition> { scout, engineer, guard };
            db.balance.emergencyClass = scout;
            db.balance.founderClass = medic;
            db.balance.tierUnlockPlanets = new List<PlanetDefinition>
                { db.PlanetAt(0), db.PlanetAt(6), db.PlanetAt(12), db.PlanetAt(15) };
            db.balance.tutorialLoot = new List<ItemAmount>
            {
                new ItemAmount { item = iron, amount = 8 },
                new ItemAmount { item = silica, amount = 5 },
            };
            return db;
        }

        /// Save numa pasta temporária própria (os testes nunca tocam no save de verdade).
        public static SaveService CreateSave()
        {
            string dir = Path.Combine(Path.GetTempPath(), "sec-tests-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(dir);
            return new SaveService(new SaveStorage(dir));
        }

        public static CrewBonus Bonus(GameDatabase db, params string[] classIds)
        {
            var sum = default(CrewBonus);
            foreach (var id in classIds) sum += db.GetClass(id).bonus;
            return sum;
        }

        private static ItemDefinition Item(string id, ItemCategory category, int sell, CrewBonus bonus = default)
        {
            var item = ScriptableObject.CreateInstance<ItemDefinition>();
            item.id = id;
            item.category = category;
            item.sellPrice = sell;
            item.equipBonus = bonus;
            return item;
        }

        private static CrewClassDefinition Class(string id, CrewBonus bonus, int cost)
        {
            var c = ScriptableObject.CreateInstance<CrewClassDefinition>();
            c.id = id;
            c.bonus = bonus;
            c.hireBaseCost = cost;
            return c;
        }
    }
}
```

#### Passo 3 — Os testes

```csharp
// Caminho: Assets/_Project/Tests/EditMode/ExpeditionResolverTests.cs
using System.Collections.Generic;
using NUnit.Framework;
using StarExpedition.Data;
using StarExpedition.Expeditions;
using UnityEngine;

namespace StarExpedition.Tests
{
    public class ExpeditionResolverTests
    {
        private GameDatabase _db;
        private GameBalance B => _db.balance;

        [SetUp] public void SetUp() => _db = TestData.CreateDatabase();

        [Test]
        public void Kora_SemBonus_Da90PorCento()
        {
            var odds = ExpeditionResolver.ComputeOdds(_db.PlanetAt(0), 1, default, B);
            Assert.AreEqual(0.90f, odds.SuccessChance, 0.0001f);
        }

        [Test]
        public void Gate_ScoutGuardScout_Da39PorCento()   // GDD §16.6
        {
            var bonus = TestData.Bonus(_db, "scout", "guard", "scout");
            var odds = ExpeditionResolver.ComputeOdds(_db.PlanetAt(17), 1, bonus, B);
            Assert.AreEqual(80, odds.EffectiveRisk);
            Assert.AreEqual(0.39f, odds.SuccessChance, 0.0001f);
        }

        [Test]
        public void Cycle2_SomaOitoDeRisk()
            => Assert.AreEqual(13, ExpeditionResolver.PlanetRisk(_db.PlanetAt(0), 2, B));

        [Test]
        public void ChanceDeSuccess_RespeitaOsLimites()
        {
            var high = ExpeditionResolver.ComputeOdds(_db.PlanetAt(0), 1, new CrewBonus { success = 500 }, B);
            var low = ExpeditionResolver.ComputeOdds(_db.PlanetAt(17), 20, default, B);
            Assert.AreEqual(0.98f, high.SuccessChance, 0.0001f);
            Assert.AreEqual(0.05f, low.SuccessChance, 0.0001f);
        }

        [Test]
        public void MemberLoss_SegueAFormula()
        {
            var noMedic = ExpeditionResolver.ComputeOdds(_db.PlanetAt(17), 1, default, B);          // 25 + 0,4 × 90
            var medic = ExpeditionResolver.ComputeOdds(_db.PlanetAt(17), 1, TestData.Bonus(_db, "medic"), B);
            Assert.AreEqual(0.61f, noMedic.LossChance, 0.0001f);
            Assert.AreEqual(0.41f, medic.LossChance, 0.0001f);
        }

        [Test]
        public void Duracao_PilotReduzComTetoEPiso()
        {
            var coral = _db.PlanetAt(5);   // 900 s
            Assert.AreEqual(675, ExpeditionResolver.ComputeDuration(coral, TestData.Bonus(_db, "pilot"), B));
            Assert.AreEqual(360, ExpeditionResolver.ComputeDuration(coral, new CrewBonus { durationPercent = 90 }, B));  // teto 60%
            Assert.AreEqual(30, ExpeditionResolver.ComputeDuration(_db.PlanetAt(0), new CrewBonus { durationPercent = 60 }, B)); // piso 30 s
        }

        [Test]
        public void MesmaSemente_MesmoResultado()
        {
            var squad = new List<string> { "m1", "m2" };
            var a = ExpeditionResolver.Resolve(_db.PlanetAt(10), 1, squad, default, B, seed: 1234);
            var b = ExpeditionResolver.Resolve(_db.PlanetAt(10), 1, squad, default, B, seed: 1234);
            Assert.AreEqual(a.success, b.success);
            Assert.AreEqual(a.lostMemberId, b.lostMemberId);
            Assert.AreEqual(a.loot.Count, b.loot.Count);
        }

        [Test]
        public void Success_SempreEntregaPeloMenosUmItem()
        {
            var planet = ScriptableObject.CreateInstance<PlanetDefinition>();
            planet.lootTable = new List<LootEntry>
            {
                new LootEntry { item = _db.GetItem("iron_ore"), chance = 0f, min = 2, max = 4 },
            };
            int successes = 0;
            for (int seed = 0; seed < 200; seed++)
            {
                // Chance máxima é 98%: algumas sementes dão Failure, e essas não entram na conta.
                var o = ExpeditionResolver.Resolve(planet, 1, new List<string> { "m1" }, new CrewBonus { success = 100 }, B, seed);
                if (!o.success) continue;
                successes++;
                Assert.AreEqual(1, o.loot.Count);
                Assert.AreEqual(2, o.loot[0].quantity);   // a quantidade mínima do primeiro Item
            }
            Assert.Greater(successes, 150);
        }

        [Test]
        public void RareItem_VemSempreEmQuantidadeUm()
        {
            var planet = ScriptableObject.CreateInstance<PlanetDefinition>();
            planet.baseRisk = 0;
            planet.lootTable = new List<LootEntry>
            {
                new LootEntry { item = _db.GetItem("alien_relic"), chance = 1f, min = 1, max = 1 },
            };
            for (int seed = 0; seed < 50; seed++)
            {
                var o = ExpeditionResolver.Resolve(planet, 5, new List<string> { "m1" },
                                                   new CrewBonus { success = 100, lootPercent = 500 }, B, seed);
                if (o.success) Assert.AreEqual(1, o.loot[0].quantity);
            }
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/EditMode/TrustedClockTests.cs
using System;
using NUnit.Framework;
using StarExpedition.Core;

namespace StarExpedition.Tests
{
    public class TrustedClockTests
    {
        private static readonly DateTime T0 = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);

        [Test]
        public void RelogioVoltando_CongelaEDepoisRecupera()
        {
            var now = T0;
            var clock = new TrustedClock(TestData.CreateSave(), () => now);

            Assert.AreEqual(T0, clock.UtcNow);

            now = T0.AddSeconds(10);
            Assert.AreEqual(T0.AddSeconds(10), clock.UtcNow);
            Assert.IsFalse(clock.IsRolledBack);

            now = T0;   // o jogador voltou o relógio
            Assert.AreEqual(T0.AddSeconds(10), clock.UtcNow);
            Assert.IsTrue(clock.IsRolledBack);

            now = T0.AddSeconds(20);   // o relógio real passou da última hora vista
            Assert.AreEqual(T0.AddSeconds(20), clock.UtcNow);
            Assert.IsFalse(clock.IsRolledBack);
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/EditMode/ProgressServiceTests.cs
using NUnit.Framework;
using StarExpedition.Core;
using StarExpedition.Data;
using StarExpedition.Progress;

namespace StarExpedition.Tests
{
    public class ProgressServiceTests
    {
        private GameDatabase _db;
        private SaveService _save;
        private ProgressService _progress;

        [SetUp]
        public void SetUp()
        {
            _db = TestData.CreateDatabase();
            _save = TestData.CreateSave();
            _progress = new ProgressService(_save, _db);
        }

        [Test]
        public void ClaimNaFronteira_LiberaOProximo_ClaimAntigoNao()
        {
            _progress.RegisterClaim(_db.PlanetAt(0));
            Assert.AreEqual(1, _progress.UnlockedIndex);
            _progress.RegisterClaim(_db.PlanetAt(0));
            Assert.AreEqual(1, _progress.UnlockedIndex);
        }

        [Test]
        public void UltimoPlanet_CompletaOCycle()
        {
            _save.Data.unlockedPlanetIndex = 17;
            _progress.RegisterClaim(_db.PlanetAt(17));
            Assert.IsTrue(_progress.IsCycleCompleted);
        }

        [Test]
        public void NovoCiclo_BloqueadoComExpeditionAtiva()
        {
            _save.Data.cycleCompleted = true;
            _progress.SetActiveExpeditionCheck(() => true);
            Assert.IsFalse(_progress.TryStartNewCycle());
        }

        [Test]
        public void NovoCiclo_ZeraSoODesbloqueio()   // GDD §8
        {
            _save.Data.credits = 500;
            _save.Data.unlockedPlanetIndex = 17;
            _save.Data.bestUnlockedPlanetIndex = 17;
            _save.Data.cycleCompleted = true;

            Assert.IsTrue(_progress.TryStartNewCycle());
            Assert.AreEqual(2, _progress.Cycle);
            Assert.AreEqual(0, _progress.UnlockedIndex);
            Assert.AreEqual(17, _save.Data.bestUnlockedPlanetIndex);
            Assert.AreEqual(500, _save.Data.credits);
            Assert.IsTrue(_progress.IsTierUnlocked(4));   // Tech Tiers continuam liberados
        }
    }
}
```

```csharp
// Caminho: Assets/_Project/Tests/EditMode/CrewServiceTests.cs
using NUnit.Framework;
using StarExpedition.Core;
using StarExpedition.Crew;
using StarExpedition.Data;
using StarExpedition.Economy;
using StarExpedition.Items;

namespace StarExpedition.Tests
{
    public class CrewServiceTests
    {
        private GameDatabase _db;
        private WalletService _wallet;
        private InventoryService _inventory;
        private CrewService _crew;

        [SetUp]
        public void SetUp()
        {
            _db = TestData.CreateDatabase();
            var save = TestData.CreateSave();
            _wallet = new WalletService(save);
            _inventory = new InventoryService(save, _db);
            _crew = new CrewService(save, _db, _wallet, _inventory, new System.Random(1));
            _crew.PickStarter(_db.GetClass("scout"));
        }

        [Test]
        public void PrecoDeHire_CresceComORoster()   // GDD §7
        {
            var engineer = _db.GetClass("engineer");
            _wallet.Add(1000);
            Assert.AreEqual(60, _crew.HireCost(engineer));
            _crew.TryHire(engineer, out _);
            Assert.AreEqual(75, _crew.HireCost(engineer));
            _crew.TryHire(engineer, out _);
            Assert.AreEqual(95, _crew.HireCost(engineer));
        }

        [Test]
        public void EmergencyRecruit_SoQuandoRosterVazioESemCredits()   // GDD §3.5
        {
            _crew.RemoveLost(_crew.Roster[0].id);
            _wallet.Add(1000);
            Assert.IsNull(_crew.EnsureEmergencyRecruit());   // dá para contratar: nada de graça

            _wallet.TrySpend(1000);
            var recruit = _crew.EnsureEmergencyRecruit();
            Assert.IsNotNull(recruit);
            Assert.AreEqual("scout", recruit.classId);
        }

        [Test]
        public void Equipar_DevolveOAnteriorAoInventario()
        {
            var member = _crew.Roster[0];
            _inventory.Add("salvage_kit", 1);
            _inventory.Add("field_scanner", 1);
            Assert.IsTrue(_crew.TryEquip(member, _db.GetItem("salvage_kit")));
            Assert.IsTrue(_crew.TryEquip(member, _db.GetItem("field_scanner")));
            Assert.AreEqual(1, _inventory.Count("salvage_kit"));
            Assert.AreEqual(0, _inventory.Count("field_scanner"));
        }

        [Test]
        public void MembroEmExpedition_NaoTrocaEquipment()
        {
            _inventory.Add("salvage_kit", 1);
            _crew.SetBusyCheck(_ => true);
            Assert.IsFalse(_crew.TryEquip(_crew.Roster[0], _db.GetItem("salvage_kit")));
        }

        [Test]
        public void MemberLoss_LevaOEquipmentJunto()   // GDD §3.4
        {
            var member = _crew.Roster[0];
            _inventory.Add("salvage_kit", 1);
            _crew.TryEquip(member, _db.GetItem("salvage_kit"));
            _crew.RemoveLost(member.id);
            Assert.AreEqual(0, _inventory.Count("salvage_kit"));
            Assert.AreEqual(0, _crew.Roster.Count);
        }
    }
}
```

Rode em **Window → General → Test Runner → EditMode → Run All**: todos verdes.

#### Passo 4 — Atalhos de teste: `DevPanel`

```csharp
// Caminho: Assets/_Project/Scripts/Core/DevPanel.cs
#if UNITY_EDITOR || DEVELOPMENT_BUILD
using System;
using StarExpedition.Onboarding;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.SceneManagement;

namespace StarExpedition.Core
{
    /// Painel de atalhos: F1 no Editor, ou 5 toques na versão (Settings) no celular.
    /// Não existe em builds de release.
    public class DevPanel : MonoBehaviour
    {
        private static bool _visible;

        public static void Toggle() => _visible = !_visible;

        private void Update()
        {
            var keyboard = Keyboard.current;
            if (keyboard != null && keyboard.f1Key.wasPressedThisFrame) Toggle();
        }

        private void OnGUI()
        {
            if (!_visible || Services.Save == null) return;

            float scale = Mathf.Max(1, Screen.width / 360);
            GUI.matrix = Matrix4x4.Scale(new Vector3(scale, scale, 1f));
            GUILayout.BeginArea(new Rect(8, 48, 220, 420), GUI.skin.box);

            GUILayout.Label($"Ciclo {Services.Progress.Cycle} · Planet {Services.Progress.UnlockedIndex + 1}/18 · " +
                            $"Tutorial {Services.Tutorial.Step}");

            if (GUILayout.Button("+1000 Credits")) Services.Wallet.Add(1000);

            if (GUILayout.Button("+5 de cada Item"))
                foreach (var item in Services.Database.items) Services.Inventory.Add(item.id, 5);

            if (GUILayout.Button("Concluir todas as Expeditions"))
            {
                foreach (var e in Services.Expeditions.Active)
                    e.startUtcTicks -= TimeSpan.FromSeconds(e.durationSeconds).Ticks;
                Services.Save.MarkDirty();
            }

            if (GUILayout.Button("Liberar todos os Planets"))
            {
                var data = Services.Save.Data;
                data.unlockedPlanetIndex = data.bestUnlockedPlanetIndex = Services.Database.PlanetCount - 1;
                Services.Save.SaveNow();
                SceneManager.LoadScene("Main");
            }

            if (GUILayout.Button("Pular tutorial") && !Services.Crew.NeedsStarterPick)
                Services.Tutorial.CompleteThrough(TutorialStep.Equip);

            if (GUILayout.Button("Apagar save"))
            {
                Services.Save.ResetAll();
                SceneManager.LoadScene("Main");
            }

            if (GUILayout.Button("Fechar")) _visible = false;
            GUILayout.EndArea();
        }
    }
}
#endif
```

#### Passo 5 — Commit

```powershell
git add .
git commit -m "Fase 14: testes EditMode das regras e DevPanel"
```

#### ✅ Checkpoint da Fase 14
- **Test Runner → Run All:** os 19 testes passam.
- Mude temporariamente `baseSuccess` de 95 para 90 no `GameBalance` padrão (o valor inicial do campo no código): `Kora_SemBonus_Da90PorCento` e `Gate_…_Da39PorCento` falham. Volte o valor.
- Em Play, **F1** abre o painel: "Concluir todas as Expeditions" faz o "!" aparecer na hora; "Apagar save" volta ao Starter Pick.

#### Problemas comuns
- **Os testes não aparecem no Test Runner:** a asmdef de testes precisa referenciar `StarExpedition` e ter `UNITY_INCLUDE_TESTS` nas *Define Constraints* (a opção "Tests Assembly Folder" já configura).
- **Um teste falha com "Unhandled log message: [Save] Falha ao gravar":** o save de teste precisa de uma pasta existente — use sempre `TestData.CreateSave()`.

---

### Fase 15 — Build de release, Play Console, teste fechado e publicação

> Objetivo: sair do Editor para a Google Play — ícone, Auto Backup, assinatura, `.aab`, ficha da loja, formulários obrigatórios, teste interno, **teste fechado de 14 dias com 12 testadores** e o lançamento em produção (GDD §13.7, §14).

**Conceitos novos:**
- **Android App Bundle (`.aab`):** o formato exigido pela Play. A loja gera, a partir dele, um APK otimizado para cada aparelho.
- **Keystore e Play App Signing:** o keystore é a "chave de upload" que prova que a build veio de você. A Play guarda a chave final do app. **Perder o keystore de upload** exige um processo de recuperação com o Google; guarde-o com backup, fora do repositório.
- **Faixas (tracks):** *teste interno* (até 100 pessoas, disponível em minutos), *teste fechado* (lista de testadores; é o exigido para contas pessoais) e *produção*.
- **Lançamento gradual (staged rollout):** a versão chega primeiro a uma porcentagem dos jogadores. Se aparecer um crash grave, dá para parar antes de atingir todo mundo.

#### Passo 1 — Auto Backup (ADR 0001)

1. **Player Settings → Publishing Settings → Build → Custom Main Manifest**: ligado. A Unity cria `Assets/Plugins/Android/AndroidManifest.xml`.
2. Edite a tag `<manifest>` e a tag `<application>` desse arquivo para incluir:

   ```xml
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
             xmlns:tools="http://schemas.android.com/tools">
     <application android:allowBackup="true"
                  tools:replace="android:allowBackup">
       <!-- o restante gerado pela Unity continua igual -->
   ```

   O Auto Backup copia a pasta de dados do app (onde fica o `save.json`) para o Google Drive do jogador, cerca de 1× por dia, com Wi-Fi e carregando.
3. **Teste** (com o celular no cabo e uma build instalada):

   ```powershell
   adb shell bmgr enable true
   adb shell bmgr backupnow com.manguebytegames.starexpeditionco
   adb uninstall com.manguebytegames.starexpeditionco
   adb install caminho\para\build.apk
   ```

   Ao abrir, o progresso deve estar de volta.

#### Passo 2 — Ícone e splash

1. **Player Settings → Icon → Android → Adaptive**: **Foreground** = `SPR_Store_Icon` ampliado 6× (384×384) centralizado num PNG transparente de 432×432 (a área segura do ícone adaptativo é o círculo central de 264 px); **Background** = PNG liso `#1B2030` de 432×432.
2. **Round** e **Legacy**: o `SPR_Store_Icon` ampliado para 192×192.
3. **Splash Image**: desligue **Show Splash Screen** (a Unity 6 permite isso também no plano Personal) e defina **Background Color** = `#1B2030`. A cena `Boot` já mostra o logo.

#### Passo 3 — Keystore

1. **Player Settings → Publishing Settings → Keystore Manager → Keystore… → Create New → Anywhere** → salve **fora** do projeto (ex.: `Documentos\Chaves\starexpeditionco.keystore`).
2. Senha forte; alias `upload`; validade 50 anos. Anote as senhas num gerenciador de senhas.
3. **Faça backup** do arquivo `.keystore` (pendrive ou nuvem privada). Sem ele, cada atualização vira um chamado de recuperação no Google.
4. Em **Project Keystore**, marque **Custom Keystore** e selecione o arquivo e o alias.

#### Passo 4 — Configurações da build de release

| Onde | Campo | Valor |
|---|---|---|
| Build Profiles → Android | Development Build | **Desligado** |
| Build Profiles → Android | Build App Bundle (Google Play) | **Ligado** |
| Build Profiles → Android | Debug Symbols | `Public` (a Play e o Crashlytics usam para os relatórios de crash) |
| Player → Other Settings | Managed Stripping Level | `Minimal` (SDKs do Google usam reflexão) |
| Player → Other Settings | Bundle Version Code | **+1 a cada envio** à Play (1, 2, 3…) |
| Player | Version | `1.0.0` (visível na loja; suba o último número em correções: 1.0.1…) |
| Código | `AdMobAdService.RewardedUnitId` (release) | o Ad unit ID real do `double_loot` |

**Build** → escolha a pasta `Builds/` (fora de `Assets/`, e no `.gitignore`). O resultado é `StarExpeditionCo.aab` + um `.zip` de símbolos.

#### Passo 5 — Símbolos para o Crashlytics

Com a [Firebase CLI](https://firebase.google.com/docs/cli) instalada e logada:

```powershell
firebase crashlytics:symbols:upload --app=<App ID do Android no Firebase> caminho\para\StarExpeditionCo-1.0.0-v1.symbols.zip
```

O App ID está em **Firebase → Configurações do projeto → Seus apps** (`1:…:android:…`). Repita a cada build enviada.

#### Passo 6 — Criar o app na Play Console

1. **Criar app**: nome `Star Expedition Co.`, idioma padrão **Português (Brasil)**, **Jogo**, **Gratuito**, aceite as declarações.
2. **Painel → Configurar o app**, na ordem:

| Tarefa | Resposta |
|---|---|
| Acesso ao app | Todas as funcionalidades disponíveis sem acesso especial |
| Anúncios | **Sim**, o app contém anúncios |
| Classificação do conteúdo | Questionário IARC: categoria Jogo; sem violência, sem sangue, sem linguagem imprópria; **compras digitais: sim**; interação entre usuários: não |
| Público-alvo | **13 a 15, 16 a 17, 18+** (fora de "menores de 13"); o app **não** chama a atenção de crianças |
| Segurança dos dados | Tabela da GDD §14.2 |
| Apps governamentais / recursos financeiros / saúde | Não |
| Política de privacidade | `https://manguebytegames.com/privacidade/starexpeditionco` (texto da §14.3 publicado) |

3. **Presença na loja → Página principal da loja**: textos pt-BR e en-US da §14.1, ícone 512×512, feature graphic 1024×500 (§10.5), 4 a 8 screenshots em retrato (1080×1920). **Categoria:** Simulação. **Detalhes de contato:** site `https://manguebytegames.com` (o mesmo do `app-ads.txt`) e o e-mail de contato (**Em aberto**, §17).
4. **Monetizar → Configuração de monetização:** crie o perfil de pagamentos (necessário para vender o Ad-Free e o Founder Pack).

#### Passo 7 — Teste interno (primeiro envio)

1. **Testar → Teste interno → Criar versão** → envie o `.aab` → notas da versão → **Salvar → Revisar → Iniciar lançamento**.
2. **Testadores:** crie uma lista com o seu e-mail e o de quem vai testar com você; abra o **link de participação** no celular e instale pela Play.
3. Agora que existe uma build com a permissão de faturamento, crie os produtos `ad_free` e `founder_pack` (Fase 11, Passo 1.3) e adicione as contas em **Teste de licença**.
4. Rode o **teste de aceitação** abaixo nessa build instalada pela Play.

**Teste de aceitação (build de release instalada pela Play):**

- [ ] Primeira abertura: consentimento (se na Europa) → logo → Starter Pick.
- [ ] Tutorial completo; o pedido de permissão de notificação aparece no passo 3.
- [ ] Enviar Expeditions em 2 Planets ao mesmo tempo; tentar enviar de novo num Planet ocupado não é possível.
- [ ] Fechar o app com Expeditions ativas; as notificações chegam; tocar abre o jogo; os timers estão certos.
- [ ] Voltar o relógio do Android 1 hora: aviso no topo e timers parados; restaurar a hora automática: tudo volta ao normal.
- [ ] Success com **Dobrar (anúncio)** real (não clique no anúncio de verdade: só assista).
- [ ] Failure com Member Loss (use Planets altos com 1 membro): "<Nome> não voltou." e o Equipment some.
- [ ] Perder o último membro sem Credits: aparece o Emergency Recruit.
- [ ] Craftar, equipar, vender, contratar; o preço sobe a cada contratação.
- [ ] Comprar **Ad-Free** e **Founder Pack** com conta de teste de licença; desinstalar e reinstalar: as compras voltam e o Founder Pack não entrega Credits de novo no mesmo save.
- [ ] Settings: volumes, idioma (pt ⇄ en), notificações, opções de privacidade, link da política.
- [ ] Botão voltar do Android em todas as telas.
- [ ] Auto Backup (Passo 1.3).
- [ ] Nenhum crash no Crashlytics; nenhum ANR em **Play Console → Android vitals**.

#### Passo 8 — Teste fechado (obrigatório para conta pessoal)

1. **Testar → Teste fechado → Criar faixa** (ex.: "Alfa") → **Testadores**: um **Grupo do Google** ou lista de e-mails com **pelo menos 12 pessoas** (convide 15–20: nem todo mundo mantém o app instalado).
2. Promova a build do teste interno para essa faixa e compartilhe o link de participação.
3. Os testadores precisam **aceitar o convite e continuar participando por 14 dias seguidos**. Peça que joguem de verdade ao longo das duas semanas (é um jogo idle: abrir 2–3 vezes por dia já basta).
4. **Use as duas semanas para balancear** (é o teste fechado previsto na §13.7). No Firebase Analytics, acompanhe:

   | Pergunta | Evento | Sinal de problema |
   |---|---|---|
   | O tutorial prende? | `tutorial_step` | Muita gente parando antes de `Done` |
   | O ritmo bate com a §16.6? | `planet_unlocked` (`index`) por dia de jogo | Galaxy 3 antes do dia 3, ou ninguém nela no dia 10 |
   | As chances estão justas? | `expedition_claim` (`success`, `member_lost`) por Planet | Taxa de Success < 50% na Galaxy 1 |
   | A economia flui? | `hire`, `sell` | Pouca contratação depois do dia 2 |
   | O "correr com 1 Scout" é problema? (§17) | `expedition_start` com `squad_size = 1` na Galaxy 3 | Muitos avançando só com Squads de 1 |
   | O anúncio é usado? | `ad_offer_accepted` / `double_loot` | Quase ninguém aceita |

   Ajuste os ScriptableObjects, suba o **Bundle Version Code**, envie novas builds à mesma faixa (o prazo de 14 dias continua contando), e registre os novos números na §16 do GDD.
5. Terminado o prazo: **Painel → Solicitar acesso à produção** e responda o questionário (como o teste foi feito, o que mudou com o feedback, por que o app está pronto). A resposta do Google costuma levar alguns dias.

#### Passo 9 — Produção

1. **Produção → Países/regiões**: todos (ou comece por Brasil + países de língua inglesa).
2. **Criar versão** → promova a build aprovada → notas da versão em pt-BR e en.
3. **Lançamento gradual:** comece com **20%**. Se, depois de 2–3 dias, o Crashlytics e o Android vitals estiverem limpos, aumente para 50% e depois 100%.
4. No AdMob, ligue o app à ficha publicada (**Apps → App settings → Add store**), para os anúncios reais passarem a ser servidos com todo o inventário.

#### Passo 10 — Depois do lançamento

- **Diariamente, na primeira semana:** Crashlytics (crashes novos), Android vitals (ANR < 0,47% e crashes < 1,09% são os limites de "mau comportamento" da Play), avaliações na loja.
- **Cada atualização:** suba o Bundle Version Code, gere o `.aab`, envie os símbolos (Passo 5), passe o teste de aceitação no teste interno antes de promover.
- **Se o formato do save mudar:** incremente `SaveData.CurrentVersion` e escreva a conversão em `SaveService.Migrate` (Fase 1). Nunca apague saves antigos.
- **Próximos conteúdos:** a lista "Fora da 1.0" da §15, priorizada pelo Analytics.

#### ✅ Checkpoint da Fase 15 (e do projeto)
- O `.aab` assinado sobe sem erros para o teste interno.
- O teste de aceitação do Passo 7 passa inteiro numa build instalada pela Play.
- O teste fechado completa 14 dias com ≥ 12 testadores ativos, e o acesso à produção é concedido.
- O **Star Expedition Co.** está na Google Play. 🚀

#### Problemas comuns
- **"Você enviou um APK ou Android App Bundle assinado no modo de depuração":** a build saiu com Development Build ou sem o keystore customizado (Passo 3.4).
- **"O código de versão X já foi usado":** suba o **Bundle Version Code**.
- **"Seu app segmenta o nível de API N; precisa segmentar pelo menos M":** instale no Unity Hub/Android SDK a plataforma de API mais recente e mantenha **Target API Level** = `Automatic (highest installed)`.
- **Aviso sobre a Play Billing Library desatualizada:** atualize o pacote In-App Purchasing para a versão 5.x mais recente.
- **Pedido de acesso à produção negado:** geralmente por testadores que saíram antes dos 14 dias ou por pouca atividade. Rode outro ciclo de teste fechado com mais testadores engajados e respostas mais detalhadas no questionário.

---
*Versão: 1.0 — lançamento na Google Play. Valores de balanceamento: iniciais, a ajustar no teste fechado (§16, §17).*
