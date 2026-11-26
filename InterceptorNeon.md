# Interceptor Neon — GDD inicial

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

## 1. Visão geral

Interceptor Neon é um jogo de ação aérea por missões. O jogador pilota um caça e cumpre missões curtas: interceptar e identificar aviões estranhos, escoltar, derrubar um bombardeiro antes que ele chegue à cidade e travar batalhas aéreas contra caças. O visual é um fliperama neon 8-bit em 3D: céu escuro com sol listrado, chão em grade acesa, montanhas e aviões de arame com brilho.

O diferencial é a **câmera livre**: a qualquer momento, sem pausar, o jogador troca entre três perspectivas: **de cima** (top-down), **perseguição** (atrás do avião) e **cabine** (primeira pessoa, dentro do cockpit, no estilo dos jogos de combate aéreo arcade). As regras não mudam com a câmera; muda o que o jogador consegue ver e fazer bem.

"Interceptor Neon" é nome de trabalho.

**Pilares**

- **Troque de olhar quando quiser.** As três câmeras mostram o mesmo mundo 3D; a troca é uma tecla e leva meio segundo de transição suave.
- **Cada câmera tem um uso.** De cima se lê o espaço (radar, flanco, altitude de todos); na perseguição se voa e se atira com conforto; na cabine se identifica e se mira melhor. Nenhuma é obrigatória o tempo todo, mas algumas tarefas pedem uma delas.
- **Pense antes de atirar.** Nem todo contato é inimigo: desconhecidos precisam ser identificados de perto antes de as armas guiadas serem liberadas, e atirar num civil encerra a missão.
- **Fliperama neon.** Fundo escuro, linhas acesas com brilho, poucas cores saturadas, pixel grande e scanlines. Tudo é desenhado em código, sem imagens prontas.

**Plataforma:** o protótipo é web (Three.js, sem build), para PC com teclado ou controle. **Em aberto:** plataforma da versão final (PC/Steam, console, celular) e motor (continuar na web ou passar para Unity).

**Protótipo:** [`prototipos/interceptor-neon/`](prototipos/interceptor-neon/). Os números deste documento são **proposta** de balanceamento e vêm do protótipo.

## 2. Câmeras

**Definido**

| Câmera | Tecla | O que mostra | Voo padrão |
|---|---|---|---|
| De cima | `1` | Câmera 520 m acima do avião, olhando para baixo, com a frente do avião sempre para cima da tela (gira com o rumo). | Assistido |
| Perseguição | `2` | Atrás e um pouco acima do avião; a câmera acompanha a rotação com um pequeno atraso, para sentir a curva. | Manual |
| Cabine | `3` | Dentro do cockpit: arco do canopi, painel com três telas e o HUD com a escada de arfagem. O próprio avião some. | Manual |

- `V` passa para a próxima câmera. A transição leva 0,6 s, com posição, rotação e campo de visão interpolados; a pose de partida anda junto com o avião, então a troca não "solta" a câmera no ar.
- O jogo lembra a última câmera usada.
- **Altitude na câmera de cima.** De cima é difícil ler a altura, então cada avião ganha uma linha vertical até o chão com uma cruz no ponto embaixo dele, e o alvo selecionado mostra a diferença de altitude (`+400`, `-120`). A linha só aparece para aviões abaixo da câmera.
- **Identificação pede câmera de perto.** De cima "não dá para ler a matrícula": identificar um contato só funciona na perseguição ou na cabine (§6), e a cabine é mais rápida.

**Em aberto**

- Se a câmera de cima deve se afastar quando um alvo está muito acima ou abaixo (hoje fica fixa a 520 m acima do jogador, e um avião acima da câmera só aparece no HUD).
- Se a cabine dá outra vantagem além de identificar (por exemplo, trava de míssil mais rápida ou canhão mais preciso).
- Câmera de olhar livre na cabine (virar a cabeça para trás com o direcional direito).

## 3. Controles

**Definido** (protótipo)

| Ação | Teclado | Controle |
|---|---|---|
| Subir / descer (arfagem) | `W`/`S` ou `↑`/`↓` | Analógico esquerdo, vertical |
| Rolar / virar | `A`/`D` ou `←`/`→` | Analógico esquerdo, horizontal |
| Leme | `Q`/`E` | Analógico direito, horizontal |
| Acelerar / frear | `Shift` / `Z` | RT / LT |
| Canhão | `Espaço` ou `J` (segurar) | A |
| Míssil | `F` ou `K` | B |
| Flare | `C` | X |
| Câmera | `V`, `1`, `2`, `3` | Y |
| Trocar alvo | `Tab` | LB / RB |
| Voo assistido liga/desliga | `T` | Select |
| Pausa | `Esc` ou `P` | Start |

- As teclas são as mesmas em todas as câmeras: `W` sempre puxa o nariz para cima. O menu tem a opção **Inverter subir/descer**.
- **Voo assistido** (padrão na câmera de cima): o comando lateral vira uma inclinação desejada (até ~70°) e o vertical uma arfagem desejada (até 40°). O avião corrige sozinho e nivela as asas quando o comando solta. É o jeito de "virar para a esquerda" de cima, sem pensar em rolagem.
- **Voo manual** (padrão na perseguição e na cabine): o comando gira o avião no próprio eixo, como um manche. Dá para fazer loop e voar de cabeça para baixo.
- `T` troca o modo da câmera atual, e a escolha fica salva por câmera.

**Em aberto:** controles de celular (toque) e mira com mouse.

## 4. Voo

**Definido** (modelo arcade, igual para jogador e IA)

- O avião voa sempre para onde o nariz aponta. Inclinado, ele faz curva sozinho (a sustentação puxa para o lado), mais forte quanto mais inclinado.
- **Velocidade:** três alvos (frear, cruzeiro, acelerar), alcançados aos poucos. Subir perde velocidade e mergulhar ganha. Não existe estol: abaixo do mínimo o avião só fica mais lento.
- **Colisão:** encostar no chão, numa montanha ou num prédio destrói o avião. O HUD pisca **SUBA! SUBA!** quando o avião está a menos de 250 m do chão e descendo.
- **Teto:** 7 500 m.
- **Área de operação:** um quadrado de 32 km com a cidade no centro. Fora dele, um aviso conta 10 s; se o jogador não voltar, a missão falha.

| Avião | Casco | Cruzeiro | Mín. / máx. (m/s) | Observação |
|---|---|---|---|---|
| Caça do jogador | 100 | 190 | 110 / 310 | Curva um pouco melhor que o caça inimigo |
| Caça inimigo | 60 | 190 | 110 / 300 | |
| Bombardeiro | 320 | 140 | 110 / 170 | Grande, curva pouco |
| Avião civil | 200 | 150 | 120 / 180 | |

O HUD mostra a velocidade em km/h (m/s × 3,6).

## 5. Armas

**Definido** (proposta)

- **Canhão:** 16 tiros/s, alterna as duas bocas, 6 de dano por bala, alcance ~1,3 s de voo. Sem munição limitada.
- **Míssil guiado:** só trava em alvo **hostil**. A trava enche em 0,9 s com o alvo a menos de 3,2 km e num cone de 25° à frente; um círculo anda do nariz até o alvo e vira **TRAVADO** (com tom de trava). Disparado travado, o míssil persegue o alvo (70 de dano); sem trava, sai reto. A quantidade de mísseis depende da missão.
- **Flares:** soltam dois clarões; cada míssil inimigo a menos de 2,5 km tem 75% de chance de ir atrás deles. 1,2 s entre um disparo e outro; 30 a 40 por missão.
- **Inimigos:** os caças atiram rajadas curtas de canhão (3 de dano) e, se tiverem mísseis, travam por 1,5 s antes de disparar (45 de dano). O HUD avisa **ALERTA: TRAVA INIMIGA** enquanto travam e **MÍSSIL! SOLTE FLARES [C]** quando há míssil vindo, com alarme sonoro. O míssil inimigo é mais lento para virar que o caça: uma curva fechada em velocidade de cruzeiro também despista.
- Os caças inimigos fazem curva brusca para fugir de cerca de metade dos mísseis do jogador.

## 6. Regras de engajamento e identificação

**Definido**

- Cores: **ciano** é o jogador, **amarelo** é desconhecido, **rosa** é hostil e **verde** é civil.
- **Desconhecido não pode ser travado.** Apertar míssil com um desconhecido selecionado a menos de 4 km mostra **ARMAS RESTRITAS: IDENTIFIQUE**. O canhão continua livre, e a responsabilidade é do jogador.
- **Identificar:** ficar a menos de 700 m do contato, com ele no centro da tela (metade central da imagem), na câmera de perseguição (3,5 s) ou de cabine (2 s). A barra **ID** enche enquanto a condição vale e esvazia devagar quando ela é perdida. Na câmera de cima não identifica: a dica manda trocar de câmera.
- **Atirar num civil** (ou num desconhecido que se revela civil) falha a missão na hora.

**Em aberto:** contato que se rende ou que muda de lado durante a missão; penalidade por fogo sem identificar contra um alvo que depois se revela hostil.

## 7. Missões

**Definido** (protótipo, liberadas em sequência)

1. **Voo de reconhecimento** (tutorial). Passar por 7 anéis verdes: por cima da cidade, por um cânion entre duas montanhas a 420 m e de volta. O rádio ensina subir/descer, trocar de câmera, acelerar/frear e o voo assistido.
2. **Contato desconhecido.** Um avião sem plano de voo e sem rádio cruza o espaço aéreo. Interceptar, identificar (é um avião de passageiros) e **sinalizar**: voar ao lado dele (25–180 m para o lado, até 130 m à frente ou atrás, mesma altura, velocidade parecida) por 4 s. Ele balança as asas e segue para a base. Falha se o jogador atirar nele ou se ele sair do espaço aéreo sem ser identificado.
3. **Bombardeiro.** Um contato grande com dois aviões colados vem direto para a cidade. Identificar revela um bombardeiro hostil; as escoltas se soltam e atacam. É preciso derrubar o bombardeiro antes que ele chegue a 900 m do centro da cidade (cerca de 90 s).
4. **Batalha aérea.** Duas ondas de caças com mísseis: três pelo norte, depois quatro pelo leste.

O fim de cada missão mostra tempo, abates e pontaria do canhão. O melhor tempo de cada missão fica salvo.

**Em aberto**

- Campanha: quantas missões, se há história (de quem é o espaço aéreo, quem é o inimigo) e progressão (aviões novos, armas especiais, upgrades).
- Mais tipos de missão: ataque a alvos no solo, escolta de comboio, interceptação noturna, perseguição de um avião furtivo que só aparece em certas câmeras.
- Ala (avião aliado controlado pela IA) e comandos para ela.
- Nota/ranking por missão (hoje só o tempo).

## 8. Estética: fliperama neon 8-bit em 3D

**Definido**

- **Resolução baixa de verdade:** a cena é desenhada com ~360 linhas na vertical e ampliada sem suavizar, então todo traço vira pixel grande. O tamanho do pixel acompanha a janela.
- **Arame aceso:** todo objeto (aviões, montanhas, prédios, anéis, mísseis) é um preenchimento quase preto, que esconde o que está atrás, mais as arestas em cor saturada. Brilho (bloom) em cima de tudo.
- **Cenário:** céu roxo escuro com estrelas e um sol de fliperama com listras no horizonte; chão preto com grade azul fina (250 m) e grade rosa larga (2 km); montanhas facetadas roxas; cidade de prédios em caixa ciano e rosa no centro do mapa; neblina roxa que apaga o que está longe.
- **HUD:** fonte Press Start 2P a 8 px, na mesma resolução baixa. Velocidade e altitude em caixas laterais, rumo no topo, objetivo e dica no canto superior esquerdo, casco/mísseis/flares/câmera no canto inferior esquerdo, radar circular (6 km, frente para cima) no inferior direito, mensagens de rádio embaixo no centro. Na cabine aparece a escada de arfagem verde, presa ao horizonte de verdade.
- **Scanlines e vinheta** de monitor CRT por cima de tudo.
- **Som** sintetizado (Web Audio): motor que sobe com a velocidade, canhão, míssil, explosões, tom de trava e alarme de míssil.

**Em aberto:** música; modelos e cores próprios para cada inimigo (hoje todos os caças usam o mesmo modelo); efeitos de dano no avião (fumaça, faíscas).

## 9. Em aberto (geral)

- Nome definitivo.
- Multijogador (dogfight em rede ou cooperativo).
- Se a versão final mantém tudo em código (arame) ou ganha modelos e texturas feitos à mão no mesmo estilo.
- Dificuldade (hoje há uma só).

## Histórico de versões

- **0.1.0** (2026-11-26): primeira versão. Caça com três câmeras trocáveis a qualquer momento (de cima, perseguição, cabine), voo arcade com modo assistido e manual, canhão, míssil com trava, flares, regras de engajamento com identificação visual, 4 missões (reconhecimento, contato desconhecido, bombardeiro, batalha aérea) e visual neon 8-bit em 3D com Three.js.
