# Protocolo Ectoplasma — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`GDD_Protocolo_Ectoplasma.md`](../../GDD_Protocolo_Ectoplasma.md), com a pixel art do PixelLab em [`Sprites/ProtocoloEctoplasma/`](../../Sprites/ProtocoloEctoplasma/). PC, mouse e teclado. Abra `index.html` no navegador.

## O que tem
- **Core loop (§5):** mapa → imóvel → sugar os fantasmas → loja → próximo imóvel, até a cidade ficar 100% limpa.
- **Mapa da cidade (§6.1, §8):** `map/mapa_cidade.png` com os 4 imóveis do bairro (MVP da §9). Cada um mostra a ameaça (1 a 5 caveiras), os fantasmas, o contrato e uma comparação com o seu equipamento (adequado, arriscado, perigoso ou suicida). Nada é bloqueado: a ameaça vira números (regeneração, plasma e dano). Imóvel limpo ganha brilho neon e o selo "VALORIZADO".
- **Sucção (§6.2):** segure o botão do mouse com a mira sobre o fantasma, dentro do alcance. A barra de plasma dele cai, e se você soltar ela volta a encher depois de 1,2 s. Sugar andando rende metade (estabilidade de mira). O tanque da mochila gasta energia sugando, recarrega parado e, se zerar, só volta a funcionar com 35%.
- **Fantasmas (§7):**
  - Errante: vaga devagar.
  - Assombrado: foge quando mirado.
  - Poltergeist: mantém distância e arremessa cadeiras e abajures.
  - Residual: chefe com 3 fases. A cada fase se parte em Errantes e solta uma onda de choque, e da 2ª fase em diante cospe ectoplasma.
  - Todos são semitransparentes e flutuam sobre a névoa, que some conforme a casa é limpa.
- **Armadilhas (§6.3):**
  - **Q autônoma:** suga sozinha o fantasma mais perto.
  - **E suporte:** atrai, desacelera e impede a regeneração.
  - São compradas com plasma e gastas ao serem colocadas, e o número em campo é limitado.
- **Upgrades (§6.4):** velocidade de sucção, tanque, alcance, resistência, armadilhas e o upgrade de história "Decodificador de memórias", que mostra a memória do fantasma ao passar a mira.
- **Narrativa (§3.2):**
  - Ato 1: memorando corporativo no início.
  - Ato 2: cada fantasma sugado deixa uma memória, e um bilhete aparece depois de 2 casas limpas.
  - Ato 3: arquivo interno sobre a tecnologia de comunicação engavetada e a vitória vazia.
- **Evacuação:** morrer ou sair com Esc perde metade do plasma da mochila, e o imóvel continua contaminado. O save fica no `localStorage`.

## Escolhas do protótipo
- O GDD pede o botão direito para sugar; aqui qualquer botão do mouse suga, para funcionar em touchpad.
- A cena é a rua em frente à casa contaminada (tileset `rua_calcada`). Ainda não há interior de casa (pendência do README dos sprites). A calçada bege do tileset foi escurecida no código.
- O MVP da §9 pede só Errante + Residual e 1 armadilha; o protótipo usa os 4 tipos e as 2 armadilhas porque a arte já existe.
- Todos os números (plasma, regeneração, preços, dano) são do protótipo. Num teste automático, o chefe foi vencido com por volta de 11 níveis de upgrade.

## O que ficou de fora
O final alternativo (comunicar em vez de sugar, §3.2), NPCs, áudio, bairros além do primeiro e a animação de caminhada (o operador só troca entre as 8 direções paradas).

## Atalhos
Na URL: `#go` (pula a introdução), `#rich` (+600 de plasma), `#h1` … `#h4` (entra direto no imóvel), `#god` (sem dano), `#reset` (apaga o save).
