# Star Expedition Co. — protótipo web (JavaScript)

Versão jogável em HTML/JS puro da Parte 1 do [`StarExpeditionCo.md`](../../StarExpeditionCo.md), usando a arte do SpriteCook em [`Sprites/StarExpeditionCo/`](../../Sprites/StarExpeditionCo/) direto do lugar (sem cópias). Não precisa de build nem servidor: abra `index.html` no navegador.

## O que tem
- Starter Pick (Batedor, Engenheiro ou Guarda), 6 Crew Classes com 3 visuais e idle de 4 quadros, nomes do `NameGenerator` do guia Unity.
- 3 Galaxies × 6 Planets no mapa, com os Planets girando (superfície do SpriteCook projetada numa esfera) e a navezinha orbitando o Planet com Expedition ativa.
- Expeditions simultâneas (uma por Planet) com timer real, que corre com a aba fechada; resultado sorteado no Claim com a semente fixada no envio; Member Loss com perda do Equipment; Loot com Rare Items escalando por Risk.
- Oficina com as 16 Recipes em 4 Tech Tiers, Equipment por membro, Loja (vender 1 / tudo, contratar com preço crescente), Recruta de Emergência, Cycles infinitos.
- Tutorial guiado da §9 (seta + uma frase por passo), relógio protegido contra volta (§4.4), save no `localStorage`.
- Todos os números vêm da §16 (Balanceamento v1).

## O que ficou de fora
- Anúncios e compras (Double Loot, Ad-Free, Founder Pack), consentimento, analytics, áudio e inglês.
- Notificação com o navegador fechado: no navegador o aviso só sai com a aba aberta (em segundo plano). O build Android usa notificação local agendada.
- A fonte do GDD (Pixel Operator) ainda não está no repositório; o protótipo usa a `m5x7` de `Sprites/8-Bit-Armageddon/Fonts/`.

## Atalhos de desenvolvimento
Na URL, depois de `index.html`: `#fast` (timers 60x mais rápidos — a 1ª Expedition dura 0,5 s), `#rich` (+5000 Credits, grava no save), `#unlock` (libera todos os Planets e Tiers), `#reset` (apaga o save). Combine com vírgula: `#fast,rich`. Teclado: `Esc` faz o papel do botão voltar do Android.
