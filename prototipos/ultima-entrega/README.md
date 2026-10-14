# Última Entrega — protótipo web (MVP, JavaScript)

Versão jogável em HTML/JS puro do [`UltimaEntrega.md`](../../UltimaEntrega.md), cobrindo o "Conteúdo da demo" em versão curta. A pixel art é do PixelLab, em [`Sprites/UltimaEntrega/`](../../Sprites/UltimaEntrega/). PC, teclado. Abra `index.html` no navegador.

**Controles:** A/D anda · Shift corre · W ou Espaço pula · S agacha · Q/E equilibra a pilha · F interage (recolher caixa, entregar, negociar) · C toma calmante · Tab mostra o relógio de pulso · Esc pausa.

## O que tem
- **Depósito (hub):**
  - Terminal de pedidos: escolhe quais caixas levar, até 6, e mostra o peso e quanto isso tira de velocidade e de pulo.
  - Loja: arnês, botas, fones e calmante.
  - Diário de entregas, que fica rabiscado com a loucura alta.
  - A cápsula de clones, sem explicação.
- **Movimento com peso (Mecânicas):**
  - Cada ponto de peso tira 6% da velocidade e 5% do pulo (mínimos de 3,5 u/s e 1,6 u).
  - Pulo com altura variável, coyote time e jump buffer de 0,1 s.
- **A pilha de caixas:**
  - Cada caixa é um pêndulo invertido preso à de baixo. Ela inclina com a aceleração, a aterrissagem, a corrida e o vento.
  - Q/E inclina o corpo para segurar.
  - Passou de 35° (caixa de baixo) ou 25° (as de cima), a junta quebra: a caixa e as de cima caem com física.
  - Agachar parado por 1 s estabiliza.
  - Caixa caída pode ser recolhida (F). Perde-se se cair no abismo ou perto de um monstro.
  - A frágil quebra com impacto forte, mesmo sem cair; caixa que cai fica amassada.
- **Loucura aguda:**
  - Cada monstro tem uma aura que pesa mais de perto, e vale ×1,5 com linha de visão.
  - O Observador só pesa se te vê. Agachado atrás de um carro, você fica escondido.
  - Longe das auras, a loucura cai 8 por segundo depois de 2 s.
  - Em 100, o entregador colapsa e um novo clone é ativado na última cápsula.
  - **Efeitos:** vinheta e tremor acima de 40; balanço falso da pilha acima de 60; 50 ms de atraso nos comandos, aberração cromática e caixas alucinadas acima de 80.
- **Loucura acumulada:**
  - Sobe a cada fase (6 + 8% da aguda sofrida) e a cada morte. Multiplica a aguda.
  - **Abalado:** cores dessaturadas, sombras ao fundo e sussurros.
  - **Fraturado:** plataformas falsas, que parecem chão e não seguram, e clientes estranhos.
  - **Perdido:** tela ondulando e relógio e diário ilegíveis.
- **4 fases:**
  - **Primeira rota:** tutorial, com uma caixa extraviada para recolher.
  - **Viaduto:** rajadas de vento e 2 Observadores com carros para se esconder.
  - **Cratera:** o Rastejante patrulha o fundo; tem uma rota por cima e o mercado paralelo escondido no alto.
  - **Bunker Aurum:** o Coro, que vem atrás do barulho (correr, aterrissar forte, caixa caindo).
- **Mercado paralelo:** vender uma caixa paga em calmantes, aumenta a lealdade à superfície e a suspeita. A caixa selada revela peças de nave.
- **Entrega:** pagamento = base × condição (intacta, amassada, quebrada) × avaliação de 1 a 5 estrelas, com falas do cliente que mudam com a loucura.
- **Escolha grande e final:** no Aurum, entregar as peças seladas ou trocá-las com o contato da superfície. Depois vem o gancho final: o colega sem capacete com o seu rosto, e o título, com uma linha que muda conforme a escolha.
- Sem HUD fixo: o relógio de pulso (Tab) mostra o pedido, as caixas, os créditos e o pulso. O medidor numérico de loucura é uma opção de acessibilidade no depósito.

## Escolhas do protótipo
- **Fases curtas:** cada fase tem cerca de 100 a 120 tiles e leva de 1 a 3 minutos, menos que os 5 a 10 da demo.
- **Corrida para pular:** com carga, buraco de 2 tiles só se pula correndo. Na Cratera, com as 2 pesadas, a rota por cima fica impossível; ela serve para quem leva menos carga.
- **Sem áudio.** O GDD apoia muito do horror no som; aqui o batimento e os sussurros viram efeitos visuais.
- **Escambo:** o mercado só paga em calmantes. Os mapas de rota e as peças de equipamento ficaram de fora.
- **Clone novo:** a morte restaura a pilha que você tinha na última cápsula.
- **Números testados com um robô:**
  - Ele equilibra com Q/E e não se esconde.
  - Termina as 4 fases.
  - Passar exposto pelos Observadores leva a loucura a cerca de 60; agachado atrás dos carros, ela não sobe.

## Atalhos
Na URL: `#f1` … `#f4` (entra direto na fase), `#rich` (+500 créditos), `#god` (sem loucura e a pilha não cai), `#go` (pula a introdução), `#reset` (apaga o save).
