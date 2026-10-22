# Guerreiro da Masmorra (app) — protótipo web

O jogo do **app Android** do Guerreiro da Masmorra (`com.guerreirodamasmorra.app`, versão 9), extraído do APK: é a versão **anterior à mecânica de dados** do [V2](../guerreiro-da-masmorra-v2/). O `index.html` daqui é o do app, gerado por [`Sprites/GuerreiroDaMasmorraApp/_tools/importar_apk.py`](../../Sprites/GuerreiroDaMasmorraApp/_tools/importar_apk.py). Tela em retrato. Abra por um servidor http, porque em `file://` os painéis 9-slice não aparecem.

**Não edite o `index.html` à mão.** Para trazer outra versão do app, rode o script de novo com o APK completo (o APK "arquivado" que o Android deixa no lugar de um app arquivado não tem o jogo):

```
py Sprites/GuerreiroDaMasmorraApp/_tools/importar_apk.py <caminho do .apk>
```

## O que esta versão tem que o V2 não tem
- **Combate com Fúria** (até 5), que alimenta os especiais (Combo, Lâmina Invisível, Sequência, Ataque Aéreo), em vez das combinações de dados. O Monge pode selar a Fúria.
- **Quarta reação, abaixar:** arrastar para baixo esquiva do golpe alto (além de parry, pulo e esquiva lateral).
- **Barra de toques rápidos** em alguns golpes.
- **Árvore de habilidades** comprada com Souls e **missões diárias**.
- **Exaustão do herói** que cresce com a Defesa (5 a 20 segmentos), e a pose de cansado.
- **3 interiores** (Cripta, Igreja Profanada, Salão do Castelo), corredores fechados com parede e teto, além dos 4 biomas ao ar livre; silhueta de cidade no horizonte e textura nas margens.
- **Monstros novos** (Cultista, Cavaleiro Negro, Lanceiro Sepulcral, Arqueiro Espectral e outros), segundo golpe alternado no combo, sangue e efeitos de magia.
- Moeda é **ouro** (o V2 usa sangue).

## O que muda em relação ao app
- **Arte** em [`Sprites/GuerreiroDaMasmorraApp/`](../../Sprites/GuerreiroDaMasmorraApp/) (34 MB, a mídia de `assets/public/` do APK, no mesmo caminho relativo). Ela não é dividida com a pasta do V2: o áudio mudou quase todo e o jogo testa caminhos com `startsWith('assets/')`.
- **Sem AdSense.** Os vídeos premiados viram o anúncio simulado do próprio jogo. O AdMob e o login nativo só rodam dentro do app (`window.Capacitor`), então no navegador ficam desligados sozinhos.
- **Sem nuvem.** O módulo do Firebase sai e os botões de login/salvar somem.
- **Save próprio:** `guerreiro-app-save-v1` (o app usa `rpg-guerreiro-v3`).

## Versão 3D
A mesma versão com a batalha em 3D (HD-2D) está em [`../guerreiro-da-masmorra-app-3d/`](../guerreiro-da-masmorra-app-3d/).

## Atalhos
Na URL: `#batalha` (entra direto na masmorra; num save novo, abre o Campo de Treinamento). Para zerar, use "zerar progresso" no acampamento.
