# Guerreiro da Masmorra v2 — protótipo web

Este protótipo **é o próprio jogo** do repositório [`abraaovilanova/guerreiro-da-masmorra-v2`](https://github.com/abraaovilanova/guerreiro-da-masmorra-v2), não uma reescrita: o `index.html` daqui é o dela, gerado por [`Sprites/GuerreiroDaMasmorraV2/_tools/importar.py`](../../Sprites/GuerreiroDaMasmorraV2/_tools/importar.py). O comportamento está descrito na Parte 1 do [`GuerreiroDaMasmorraV2.md`](../../GuerreiroDaMasmorraV2.md). Tela em retrato. Abra por um servidor http, porque em `file://` os painéis 9-slice do Tiny Swords não aparecem.

**Não edite o `index.html` à mão.** Mudanças no jogo vão na v2; para trazê-las para cá, clone a v2 e rode o script de novo:

```
py Sprites/GuerreiroDaMasmorraV2/_tools/importar.py <pasta do clone da v2>
```

## O que muda em relação ao jogo publicado
- **Arte** vem de [`Sprites/GuerreiroDaMasmorraV2/`](../../Sprites/GuerreiroDaMasmorraV2/) (só os ~24 MB que o jogo carrega, no mesmo caminho relativo da v2).
- **Sem AdSense.** Os vídeos premiados (Baú do Dia, dobrar o bônus) e o intersticial a cada 5 entradas viram o anúncio simulado do próprio jogo (5 s e 3 s).
- **Sem nuvem.** O módulo do Firebase sai e os botões de login/salvar somem: o login daqui gravaria por cima da campanha real do jogador.
- **Save próprio** no `localStorage`: `guerreiro-v2-save-v1` (o jogo publicado usa `rpg-guerreiro-v3`).

## O que tem
O jogo inteiro como está na v2: Campo de Treinamento, Forja de Dados, combate com dados (travar, re-rolar, combinações de pôquer), as reações (parry, salto, esquiva lateral), os 4 especiais liberados pela Habilidade, 33 masmorras com NG+, todos os monstros e chefes, gemas, tochas, Souls, Baú do Dia, música e efeitos sonoros.

## O que ficou desligado (também na v2)
Mago Arcanista, Caçadora, Lanceiro e Monge jogáveis, troca de herói, mapa-múndi e recrutamento por duelo. O código existe, mas os botões estão comentados como "PATCH FUTURO".

## Atalhos
Na URL: `#batalha` (entra direto na masmorra; num save novo, abre o Campo de Treinamento). Para zerar, use o botão "zerar progresso" do acampamento.
