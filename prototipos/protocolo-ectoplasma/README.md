# Protocolo Ectoplasma — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`GDD_Protocolo_Ectoplasma.md`](../../GDD_Protocolo_Ectoplasma.md), com a pixel art do PixelLab em [`Sprites/ProtocoloEctoplasma/`](../../Sprites/ProtocoloEctoplasma/). PC, mouse e teclado. Abra `index.html` no navegador.

## O que tem
- **Estrutura de fases (§6.6):**
  - **Cidade:** o mapa tem 4 bairros. O primeiro já começa aberto, e os outros são liberados quando o bairro anterior fica 100% limpo, chefe incluído.
  - **Bairro:** cada bairro tem 3 imóveis. Cada imóvel mostra a ameaça, os fantasmas, as etapas já limpas e uma comparação com o seu equipamento (adequado, arriscado, perigoso ou suicida, §6.1). O último imóvel é o chefe Residual.
  - **Imóvel:** tem 3 etapas, rua → térreo → porão. Você só passa para a etapa seguinte pela porta da casa ou pela escada, depois que a etapa atual estiver limpa.
- **Regra entre etapas (§6.6):**
  - Vida, tanque e mochila passam de uma etapa para a outra, e a loja só abre fora do imóvel.
  - Depois de limpar uma etapa, **Esc evacua guardando todo o plasma**.
  - Sair ou morrer no meio de uma etapa perde metade da mochila.
  - Etapa limpa fica salva: na próxima entrada no imóvel, você começa na primeira etapa pendente, com a vida cheia.
- **Cenas:**
  - **Rua:** a casa contaminada e o tileset de rua.
  - **Térreo:** 3 plantas feitas à mão (sala, cozinha e quarto), com paredes internas que bloqueiam o movimento, cortam o feixe e param objetos arremessados. Os móveis bloqueiam a passagem.
  - **Porão:** escuro. Só se enxerga o círculo da lanterna e o facho na direção da mira; fantasmas, gosma e armadilhas brilham um pouco.
- **Temas dos bairros** (proposta da §6.6):
  - Vila Operária, para aprender.
  - Beira-rio, com poças que deixam o operador lento.
  - Bairro Nobre, com mais Poltergeists.
  - Centro Antigo, onde até o térreo fica escuro.
- **Sucção (§6.2):** segure o botão do mouse com a mira sobre o fantasma, dentro do alcance e sem parede no caminho. Se você soltar, a barra dele volta a encher; sugar andando rende metade; o tanque gasta e recarrega.
- **Fantasmas (§7):**
  - Errante.
  - Assombrado, que foge quando mirado e pode se esconder atrás das paredes.
  - Poltergeist, que pega a cadeira, o abajur ou as caixas da própria sala e arremessa no operador; o móvel some do lugar.
  - Residual, o chefe, com 3 fases.
- **Armadilhas (§6.3):** Q autônoma, E suporte.
- **Upgrades (§6.4):** inclui a Lanterna (raio de luz no escuro, proposta "Em aberto" da §6.6) e o Decodificador de memórias.
- **Narrativa (§3.2):**
  - Ato 1: memorando no início.
  - Cada fantasma sugado deixa uma memória.
  - Cada térreo tem um **bilhete** para pegar, que muda de tom a cada bairro: do folheto da empresa às pistas do Ato 2 e aos papéis do Projeto PONTE.
  - Um bilhete aparece no mapa depois do 1º bairro.
  - Ato 3: o arquivo interno e a vitória vazia no fim.

## Sensação de jogo (ajustes de 2026-10-15)
- **Operador anda** com a animação de caminhada do PixelLab nas 8 direções.
- **Rua com cenário:** carro abandonado, postes, árvore seca, cercas, placa de "vende-se", lixeiras e hidrante (PixelLab), faixa tracejada, bueiro e rachaduras no asfalto. Imóveis pares usam a cena espelhada. A lixeira pode ser arremessada pelo Poltergeist.
- **Paredes internas** desenhadas como parede de verdade (tampo de reboco com moldura, face com rodapé e sombra no piso), no lugar do retângulo escuro que parecia um pilar.
- **Captura com peso:** o fantasma treme e estica enquanto é sugado, solta fiapos de plasma que voam para o bico, e na captura é esticado e puxado para dentro, com uma pausa de impacto curta e tremor de tela (maiores no chefe).
- **Aviso antes do ataque:** o Poltergeist faz o móvel tremer, subir e brilhar em roxo por 0,6 s antes de arremessar; sem móvel por perto, um objeto gira sobre ele. O Residual incha e brilha por 0,45 s antes de cuspir ectoplasma.
- **Retorno de dano:** cada golpe empurra o operador para longe da origem, treme a tela, acende uma borda vermelha e dá 0,5 s de invencibilidade (o operador pisca). O contato com o Residual virou golpe com empurrão (6 de dano) em vez de dano contínuo; na prática ele tira cerca de metade da vida por segundo que tirava antes.
- **Sons sintetizados** no navegador, sem arquivos: ronco do aspirador que sobe de tom conforme o fantasma esvazia, captura, golpe, aviso, arremesso, batida, cuspe, armadilha, porta e etapa limpa. **M** liga e desliga. O áudio está "Em aberto" no GDD; estes sons são do protótipo.

## Escolhas do protótipo
- O GDD pede o botão direito para sugar; aqui qualquer botão do mouse suga, para funcionar em touchpad.
- **Números do protótipo:**
  - A composição de fantasmas de cada etapa, a ameaça de cada imóvel, os preços e o dano são todos do protótipo.
  - Um robô que só mira no mais perto e desvia dos objetos venceu os chefes da Vila (com 4 a 6 níveis de upgrade), do Beira-rio (9 níveis) e do Centro Antigo (16 níveis), terminando com 20 a 40 de vida.
- O mapa do bairro é uma tela com os 3 imóveis, e não uma arte de mapa própria; essa decisão está "Em aberto" na §6.6.
- O save mudou para `ectoplasma-save-v2`, e o progresso da versão antiga não é aproveitado.

## O que ficou de fora
- O andar de cima, alternativa ao porão.
- O final alternativo da §3.2, comunicar em vez de sugar.
- NPCs e trilha sonora.

## Atalhos
Na URL:
- `#go`: pula a introdução.
- `#rich`: +1500 de plasma.
- `#all`: todos os bairros liberados.
- `#t<bairro><imóvel>`: entra direto num imóvel; com `#e<etapa>` começa numa etapa específica. Exemplo: `#t13,e3` é o porão do chefe da Vila.
- `#god`: sem dano.
- `#reset`: apaga o save.
