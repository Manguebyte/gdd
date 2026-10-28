# Caderno de Aventuras — protótipo web

Protótipo jogável do [`CadernoDeAventuras.md`](../../CadernoDeAventuras.md): o RPG de caderno da escola. O herói anda pela folha pautada, o mestre desenha o mapa com canetas coloridas à medida que ele chega perto, e as lutas são decididas nos dados (cada item equipado dá dados; a soma é o dano). Cada monstro tem um rei no fundo da sua masmorra, personagens com "!" dão missões, à noite os monstros ficam mais fortes e o herói precisa de tocha para enxergar, e no lugar de vilas há fogueiras: descansar cura, mas os monstros voltam (e um guerreiro aceita um duelo de treino), e cada fogueira vende a sua lista de equipamento. Qualquer pessoa do caderno pode ser atacada, e quem morre não volta mais. O mundo são 5 páginas do caderno, uma por bioma (Campos, Deserto, Montanhas Geladas, Pântano Sombrio e Vulcão), cada uma da segunda em diante com uma regra própria (tempestade de areia e miragens, gelo escorregadio, neblina e monstros da noite, erupções) e todas com um monstro lendário que foge do herói. O dragão mora no fim da última.

Abra [`index.html`](index.html) no navegador (sem build). Não usa pasta `Sprites/`: **toda a arte é gerada por código** em traço de caneta e lápis de cor.

## Arquivos

| Arquivo | O que tem |
| --- | --- |
| `sketch.js` | Biblioteca de traços à mão: linha tremida, círculo que não fecha, hachura de lápis em zigue-zague, desenho parcial (para animar o mestre desenhando). |
| `world.js` | Gera as 5 páginas de uma semente. Cada página é uma ilha do seu bioma: terrenos, 3 regiões de perigo, 5 fogueiras, a passagem para a próxima página (ou o covil do dragão, na última), a seta de volta, monstros, baús, 6 masmorras e personagens (3 com missões, 4 com dicas, a 5+ quadrados um do outro); depois de todos os sorteios, as miragens (Deserto), os monstros da noite (Pântano Sombrio) e onde o lendário começa. Gera também o interior de cada masmorra, com a variação dela (porta trancada, armadilhas, enigma ou andar de baixo). |
| `art.js` | Desenhos: 31 monstros e as 30 versões chefe (com coroa), herói, ícones, dados (silhueta por tipo) e cada quadrado do mapa (com o desenho de cada bioma) e da masmorra. |
| `nuvem.js` | Conta do jogador (usuário e senha) e o save na nuvem, com Firebase. Desligado enquanto `FIREBASE_CONFIG` estiver `null`. |
| `game.js` | Jogo: mapa em chunks, caneta do mestre, movimento, virar a página, combate com dados, masmorras (e as variações), missões, dia e noite com tochas, regras das páginas, monstro lendário, fogueiras (descanso, loja própria de cada uma, duelo, monstros voltando), atacar gente (quem morre fica morto), mochila, salvamento. |
| `manifest.webmanifest`, `sw.js`, `icons/` | App instalável (PWA): nome, ícones (desenhados com a arte do jogo), tela cheia em qualquer orientação, e o service worker que guarda os arquivos para jogar sem internet. O cache leva a versão do jogo (de `../versao.js`). |
| `verify-browser.cjs` | Teste no navegador com Playwright: joga um pouco e tira screenshots em `_preview/` (fora do git). |

## Contar visitas (Google Analytics)

O `index.html` tem um trecho do Google Analytics que só conta quantas pessoas abrem o jogo (nenhum evento, nada pessoal). Ele fica desligado enquanto `GA_ID` estiver vazio: para ligar, cole o ID de medição da propriedade (`G-...`) em `var GA_ID = '';` no `<head>`. Só conta no site (https); abrindo do disco ou num servidor de teste, nada é enviado. Com ele ligado, a capa avisa que o jogo conta visitas.

## Conta e save na nuvem (Firebase)

O jogador pode criar uma conta com **usuário e senha** (sem e-mail) e continuar a aventura em qualquer aparelho. Fica desligado enquanto `FIREBASE_CONFIG` estiver `null` em `nuvem.js`. Para ligar:

1. **Console do Firebase → Configurações do projeto → Seus apps → app Web** (crie um, se não tiver): copie o objeto `firebaseConfig` e cole no lugar do `null` em `const FIREBASE_CONFIG = null;`. Essas chaves podem ficar no código público: quem protege os saves são as regras abaixo.
2. **Authentication → Método de login → E-mail/senha → Ativar.** O jogo usa esse provedor mesmo sem e-mail: o usuário vira `usuario@caderno-de-aventuras.manguebyte.github.io`, um e-mail interno que nunca recebe nada.
3. **Authentication → Configurações → Domínios autorizados:** confira se `manguebyte.github.io` está lá (e `localhost` para testar).
4. **Firestore Database → Regras:** cole e publique:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada jogador lê e grava só o próprio save.
    match /caderno-saves/{uid} {
      allow read, delete: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.data.save is string
        && request.resource.data.save.size() < 900000;
    }
  }
}
```

O save fica em `caderno-saves/{uid}` (o save inteiro como texto, mais `nome`, `nivel`, `pagina`, `tempo` (segundos jogados), `em` e `atualizado`). O SDK do Firebase (10.14.1, versão "compat") vem do CDN `www.gstatic.com` só quando a configuração está preenchida; sem internet, a conta não entra e o jogo segue com o save do aparelho.

## Instalar no celular

Abra o protótipo publicado no site (https) pelo navegador do celular:

- **Android (Chrome):** toque em **Instalar no celular** na capa (ou no menu ⋮ → "Instalar app").
- **iPhone (Safari):** Compartilhar → **Adicionar à Tela de Início**.

O jogo ganha ícone, abre em tela cheia, gira junto com o celular (em pé ou deitado) e funciona sem internet. No Android o save é o mesmo do navegador; no iPhone o app instalado tem um save separado do Safari. O service worker só é registrado em https: abrindo o `index.html` do disco ou num servidor local, o jogo roda normal, sem ele.

## Controles

| Tecla ou toque | Ação |
| --- | --- |
| Setas / WASD / direcional na tela | Andar |
| Clique ou toque num quadrado desenhado | Ir até lá pelo caminho mais curto |
| B ou I | Mochila |
| M | Ver a página inteira |
| 1–9 | Botões das folhas (luta, diálogos) |

## Atalhos de desenvolvimento (URL)

| Parâmetro | Efeito |
| --- | --- |
| `?novo` | Ignora o save (não apaga até você começar outra aventura). |
| `?seed=N` | Começa direto uma aventura no mundo da semente N. |
| `?revelar` | Revela a página inteira. |
| `?ouro=N` | Começa com N moedas. |
| `?nivel=N` | Sobe até o nível N. |
| `?habilidades` | Já sabe as 25 habilidades passivas; `?habilidades=2,10,15` só essas (número da fogueira − 1). As 2 primeiras da lista ficam equipadas. |
| `?luta=orc` | Abre uma luta contra um monstro pelo id (a lista está em `POOLS`, no `world.js`: `slime`, `escorpiao`, `boneco_neve`, `fenix`...; ou `dragao`) ou um chefe (`chefe_rato`, `chefe_fenix`...) ou guardião (`guarda_0` a `guarda_3`). |
| `?luta=lobo&grupo=3` | Com `?luta`, luta contra 2 ou 3 monstros iguais. |
| `?noite` | Começa à noite (acende uma tocha se tiver). |
| `?tochas=N` | Começa com N tochas. |
| `?pagina=N` | Começa na primeira fogueira da página N (1 Campos, 2 Deserto, 3 Montanhas Geladas, 4 Pântano Sombrio, 5 Vulcão). |
| `?masmorra=N` | Começa dentro da masmorra N da página (0 a 5, na ordem das regiões). Junto com `?pagina`, é da página escolhida. |
| `?andar` | Com `?masmorra`, começa no andar de baixo (se aquela masmorra tiver a variação "andar"). |
| `?tempestade` | No Deserto, a tempestade de areia vem no próximo passo. |
| `?erupcao` | No Vulcão, a erupção vem no próximo passo. |
| `?lenda` | O monstro lendário da página aparece a 2–3 quadrados à direita do herói. |
| `?luta=lenda_0` / `?luta=duelo_0` | Luta contra o lendário da página 1 (`lenda_0` a `lenda_4`) ou duelo com o guerreiro da fogueira 1 (`duelo_0` a `duelo_24`; pela URL, sem as regras de treino). |

Exemplo: `index.html?novo&seed=7&revelar&ouro=2000`.

Save no `localStorage` em `caderno-aventuras-save-v3`. Saves de antes das páginas (`-v1` e `-v2`) não são carregados: a mesma semente agora gera outro mundo.
