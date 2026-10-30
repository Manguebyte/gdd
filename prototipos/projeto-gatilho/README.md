# Projeto Gatilho — protótipo web (TypeScript)

MVP do [`ProjetoGatilho.md`](../../ProjetoGatilho.md): hack-and-slash topdown 2D em TypeScript, Canvas 2D e a Gamepad API do navegador, com build pelo Vite. O código é o da Parte 2 do GDD (guia web), com os acréscimos das Fases 3 a 5 já juntados.

**Diferente da maioria dos protótipos:** este precisa de build. Abrir o `index.html` direto no navegador não funciona.

## Como rodar

Precisa de Node 20 ou mais novo.

```bash
cd prototipos/projeto-gatilho
npm install
npm run dev        # abre em http://localhost:5173 com recarga automática
npm test           # testes da regra de input, dos alvos e das recargas (Vitest, sem navegador)
npm run build      # gera dist/, que é o que o site publica
npm run preview    # serve o dist/ em http://localhost:4173
```

No GitHub Pages, o workflow `deploy-site.yml` roda `npm ci`, `npm test` e `npm run build` e publica o `dist/` em `/gdd/prototipos/projeto-gatilho/`.

No `npm run dev`, o console mostra um 404 de `../versao.js`: o servidor de dev só serve esta pasta. No site o arquivo existe e a etiqueta de versão aparece.

## Controles

| Ação | Controle | Teclado e mouse |
|---|---|---|
| Mover | Analógico esquerdo | WASD |
| Mirar | Analógico direito (solto: para onde anda) | Mouse |
| Ataque básico | □ | Espaço |
| Especiais de área | Segurar R1 + X / △ / □ / ○ | Segurar botão direito + 1 / 2 / 3 / 4 |
| Especiais individuais | Segurar R2 + X / △ / □ / ○ | Segurar botão esquerdo + 1 / 2 / 3 / 4 |
| Esquiva | X | Shift |

O controle só aparece para o navegador depois que um botão dele é apertado com a página em foco.

## O que tem

- A regra de input do GDD §2.4: com gatilho segurado, o botão de face é sempre especial; o primeiro gatilho apertado vale; especial em recarga ou individual sem alvo não faz nada; o último dispositivo usado manda nos rótulos.
- 8 especiais placeholder (§3.2) com recarga própria, ataque básico em cone e esquiva.
- 4 salas com porta que tranca e ondas, capangas, brutamontes e o chefe (§4–5). Morrer recomeça a sala.
- HUD: vida e a barra cruzada (o losango do gatilho segurado cresce e mostra os nomes; a recarga escurece o slot).

## Ainda não tem

Arte, áudio, menus, combos, efeitos dos especiais além de dano e padrões do chefe (tudo **Em aberto** no GDD). Depois de vencer o chefe, recarregue a página para jogar de novo.
