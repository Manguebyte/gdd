# Sea Hauler — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`SeaHauler.md`](../../SeaHauler.md). Não precisa de build nem servidor: abra `index.html` no navegador. Joga-se no PC (mouse, teclado opcional) e no navegador do celular, deitado (toque).

Publicado em **https://manguebyte.github.io/gdd/prototipos/sea-hauler/** a cada push na `main` (workflow `deploy-site.yml`).

## De onde veio
Começou como cópia de [`../space-hauler/`](../space-hauler/) (mesma estrutura: `data.js` com os números, `sim.js` com as regras sem tela, `game.js` com desenho, entrada e telas), mas é um **jogo separado**: os códigos evoluem cada um por si, e o save fica em `seahauler.meta`.

## O que tem
- **3 classes de navio**: a run começa na **Corveta** (350 de casco, 6 portinholas, velas 7/11/15 m/s); no Porto dá para comprar a **Fragata** (250 de ouro: 500 de casco, 8 portinholas, 6/10/13 m/s) ou o **Navio de linha** (450: 800 de casco, 10 portinholas, 5/9/11,5 m/s). Trocar vende as armas pela metade do valor; as melhorias continuam e o navio novo sai com o casco inteiro.
- **Portinholas**: proa, popa e as bordadas. Cada uma só atira para o seu lado (arco de 180°). Parte começa fechada e se abre com ouro (60, 80, 100, 120).
- **Velas em 3 posições** (Rizadas, Meio pano, Pano cheio; a velocidade de cada uma depende da classe). Os piratas navegam no ritmo do mar (10 m/s): de Pano cheio, quem vem por trás com pouca sobra **fica para trás e não dá ouro**. O painel das velas mostra a velocidade e quantos ficaram para trás.
- **As 4 armas**: canhão longo, carronada (metralha em cone), bala encadeada (rasga as velas do inimigo) e fuzileiros (fogo contínuo em quem encosta, inclusive piratas a bordo). Cada uma tem 3 níveis.
- **As melhorias do navio**: Forro de cobre (+casco, −colisão), Velame (+1,5 m/s no Pano cheio), Tripulação (conserta 0,2 de casco/s por nível) e abrir portinholas.
- **Os 4 inimigos** e o pirata a bordo: escunas que rondam e atiram, brulotes em chamas, chalupas que soltam piratas (eles sabotam a portinhola aberta onde sobem) e o **Galeão pirata** no último trecho, que chama escunas, acompanha o navio (não dá para fugir dele) e bloqueia a chegada.
- **4 tipos de trecho**: Mar aberto (por trás, risco 0), Recifes (pela frente, com **rochedos** que doem mais quanto mais rápido, risco 1), Enseada pirata (360°, risco 2) e **Tempestade** (por trás e pelos lados, 60% dos piratas, **rajadas** com aviso que rasgam o Pano cheio, risco 1).
- **Porto**: nó sem combate com reparo (2 de casco por 1 de ouro), as melhorias e o **estaleiro** (os navios maiores). Aparece em 40% das camadas do meio.
- **Habilidades**: barris de pólvora (atrás do navio: dano e velas rasgadas) e bordada (recarga em dobro por 4 s).
- **Run roguelite**: carta náutica com bifurcações, 6 camadas. Navio, casco, armas, portinholas, melhorias, velas e ouro continuam de um trecho para o outro.
- **Desbloqueios permanentes** placeholder: carronada ao concluir 1 trecho numa run, bala encadeada ao concluir 3. Save no `localStorage`.
- **Mar isométrico** com a projeção do guia Unity: cristas de onda presas ao plano, esteira, ilhas ao longe, boias vermelhas/verdes a cada 100 m, faróis no começo e no fim de cada trecho, o porto de destino com o forte. A Tempestade escurece o mar e traz chuva e relâmpagos.
- **Arte PixelLab** em `Sprites/SeaHauler/` (ver o `README.md` de lá). Cada sprite é um redesenho da forma vetorial do protótipo; se um não carregar (ou com `#vector`), o objeto volta ao desenho por código. O mastreame é um sprite à parte (um por posição das velas) e fica meio transparente enquanto você mexe nas portinholas.

## Controles
- **Mouse:** clique numa arma da barra e depois numa portinhola aberta; clique numa arma montada para melhorar ou vender; clique numa portinhola fechada para abrir. Botão direito cancela.
- **Z / X / C** (ou setas ↑ ↓): Rizadas / Meio pano / Pano cheio.
- **F / G / T:** Forro de cobre / Velame / Tripulação. **Q W E R:** escolher arma. **1 / 2:** barris / bordada. **U / V:** melhorar / vender (ou abrir, numa fechada).
- **Shift + clique:** monta e mantém a mesma arma escolhida.
- **Esc:** cancela. **P:** pausa (também pausa sozinho se a janela perder o foco).

## Atalhos de desenvolvimento
Junte quantos quiser depois do `#`, separados por vírgula (ex.: `index.html#unlock,rich,type=storm`):

| Atalho | O que faz |
|---|---|
| `#short` | Trechos de 150 m em vez de 900 m. |
| `#rich` | Começa a run com 9999 de ouro. |
| `#unlock` | Todas as armas liberadas. |
| `#type=open` / `reefs` / `cove` / `storm` | O primeiro trecho da run é desse tipo. |
| `#ship=frigate` / `lineship` | A run começa nessa classe de navio (em vez da Corveta). |
| `#boss` | Pula direto para o último trecho (o do Galeão). |
| `#route` / `#port` | Abre direto a carta náutica / um Porto (com o casco em 220). |
| `#auto` | Piloto automático: escolhe a rota, mexe nas velas, abre portinholas, monta do lado do ataque, compra melhorias e navios, repara e usa habilidades (`autoPlay` em `sim.js`). |
| `#warp30` | Quando o primeiro trecho começa, simula 30 s de uma vez (para a miniatura do hub). |
| `#vector` | Ignora os sprites e usa só o desenho vetorial. |
| `#refs` | Exporta as referências vetoriais para o PixelLab. |

## Escolhas do protótipo onde o GDD diz "Em aberto"
Todas seguem os **placeholders** do próprio GDD:
- **Pirata a bordo** sobe na portinhola **aberta** mais perto da chalupa e pode ser alvo de qualquer arma, sem olhar o arco.
- **O Galeão nunca fica para trás:** navega no maior entre o ritmo do mar e a velocidade do navio. Sem isso, de Pano cheio ele nunca alcançava o navio e a chegada ficava bloqueada para sempre.
- **O orçamento de spawn é por segundo:** correr encurta o trecho e faz aparecer menos piratas. Os rochedos, ao contrário, têm densidade por metro.
- **Porto** sem combate, no máximo um por camada (25% de chance nas camadas do meio).
- **Ouro automático**, **sem pausa na alocação** e **casco que não volta entre trechos**: como no Space Hauler.

## Classes de navio no piloto automático
60 runs com o navio **fixo** a run inteira (sem trocar), tudo liberado:

| Navio | Chegou ao porto | Ouro por trecho |
|---|---|---|
| Corveta | 27/60 | 467 |
| Fragata | 34/60 | 571 |
| Navio de linha | 44/60 | 623 |

O navio maior ajuda, como devia. Com a troca no Porto, o piloto automático chega em ~28/60: ele gasta o ouro em armas assim que ganha e quase nunca junta o bastante para trocar. Um jogador que economiza deve se sair melhor.

## Primeira leitura do balanceamento (antes das classes, sempre na Fragata)
Piloto automático no Node, 40 runs com sementes diferentes, tudo liberado, comparando três jeitos de usar as velas (casco perdido e ouro ganho por trecho, em média):

| Velas | Chegou ao porto | Mar aberto | Recifes | Enseada | Tempestade |
|---|---|---|---|---|---|
| Piloto (cheio no Mar aberto, meio no resto) | 32/40 | −37 casco, 403 ouro | −99, 602 | −22, 831 | −5, 386 |
| Sempre Meio pano | 30/40 | −44, 555 | −117, 570 | −20, 856 | −5, 388 |
| Sempre Pano cheio | 24/40 | −18, 386 | −154, 428 | −33, 616 | −169, 395 |

No Mar aberto, correr economiza mais da metade do casco e custa ~30% do ouro: é a troca "fuga custa saque" funcionando. Pano cheio o tempo todo perde feio nos Recifes (rochedos doem mais) e na Tempestade (rajadas). A Enseada pirata segue barata demais para o risco 2 (o mesmo problema da Rota pirata do Space Hauler), e o ouro sobra: as melhorias estão baratas para a economia atual.
