# Marble Arena — protótipo web (TypeScript)

Marco 1 do [`MarbleArena.md`](../../MarbleArena.md): bolinha de gude 3D em TypeScript, com Three.js via React Three Fiber, física do Rapier, estado no Zustand e build pelo Vite.

**Diferente dos outros protótipos:** este precisa de build. Abrir o `index.html` direto no navegador não funciona.

## Como rodar

Precisa de Node 20 ou mais novo.

```bash
cd prototipos/marble-arena
npm install
npm run dev        # abre em http://localhost:5173 com recarga automática
npm test           # testes das regras e da física (Vitest, sem navegador)
npm run build      # gera dist/, que é o que o site publica
npm run preview    # serve o dist/ em http://localhost:4173
```

No GitHub Pages, o workflow `deploy-site.yml` roda `npm ci`, `npm test` e `npm run build` e publica o `dist/` em `/gdd/prototipos/marble-arena/`.

## O que tem (Marco 1)
- **Arena (GDD §3):** chão de terra batida de 1,8 × 1,3 m com tábuas em volta (as paredes da física), triângulo riscado no centro, linha de referência no fundo (já desenhada para o Marco 2), área de tiro do lado do jogador, pedras, capim e folhas em volta. Tudo é geometria primitiva com texturas geradas em canvas.
- **10 casadas** arrumadas em triângulo compacto dentro do triângulo riscado; bolinhas olho-de-gato (vidro com pétalas coloridas) e leitosas (vidro opaco com espiral).
- **Tiro (§5):** direção pelo mouse (ou A/D), força de 0 a 100% (slider ou W/S), ângulo vertical de 0° a 45° (slider ou Q/E). A seta mostra a direção exata do impulso, já inclinada, e cresce e muda de cor com a força. Uma linha no chão estende a direção.
- **Física (§6):** Rapier com passo fixo de 1/120 s, escala de 1 unidade = 1 cm, gravidade de 981 cm/s², CCD nas bolinhas, restituição alta entre bolinhas e baixa contra a terra, e resistência ao rolamento feita à mão (o Rapier não tem).
- **Fim do tiro:** espera tudo parar, conta as casadas que saíram inteiras do triângulo (o corpo todo, não só o centro), tira da arena e volta a mirar. A bolinha de tiro continua de onde parou.
- **Câmera (§7):** visão de cima inclinada, botão direito gira, roda dá zoom, suavizada. "Câmera segue" (F) acompanha a bolinha de tiro durante o tiro e volta para a visão geral quando tudo para.
- **HUD (§8):** fase, capturadas, quantas ainda estão no triângulo, tiros, direção, medidor de força, ângulo, botão de atirar (desligado enquanto as bolinhas rolam), aviso animado do resultado de cada tiro e tela de "Triângulo limpo".
- **Testes:** geometria do triângulo e da captura, arrumação das casadas, conversão do tiro em impulso e testes com o Rapier de verdade (casada tirada do triângulo por um tiro forte, nada escapa da arena, tiro mais forte vai mais longe, mesmo tiro dá o mesmo resultado, tiro com ângulo sai do chão e volta).

## O que ficou de fora
Tudo dos Marcos 2 a 4: rodada de abertura, vez dos jogadores, eliminação, condições de vitória da partida, tela final completa, partículas, sons, IA, menu e configuração da partida. O `GameManager` já registra os toques diretos da bolinha de tiro (`CollisionSystem`), que é a base da eliminação.

## Controles
| Ação | Mouse/teclado |
|---|---|
| Apontar | mouse no chão |
| Travar/destravar a direção | clique |
| Ajuste fino da direção | A/D ou ←/→ (Shift: mais fino) |
| Força | W/S ou ↑/↓, ou o slider |
| Ângulo vertical | Q/E, ou o slider |
| Atirar | Espaço, Enter ou o botão |
| Girar a câmera | botão direito (ou do meio) arrastando |
| Zoom | roda do mouse |
| Visão geral | C ou Home |
| Câmera segue o tiro | F |

## Onde mexer
- **Números do jogo:** `src/config/gameConfig.ts` (raio, massa, atritos, restituição, impulso máximo, tamanho da arena e do triângulo, número de casadas).
- **Regras sem Three.js nem Rapier:** `src/core/` (dá para testar e rodar fora do navegador).
- **Física:** `src/physics/PhysicsManager.ts`.
- **Fluxo do tiro:** `src/game/GameManager.ts`; estado da interface em `src/game/store.ts`.
- **Tela 3D:** `src/render/`; **HUD:** `src/ui/`; **teclado:** `src/input/`.
