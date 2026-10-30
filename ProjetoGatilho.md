# GDD — Projeto Gatilho

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

> Documento vivo. Rascunho inicial a partir do briefing do usuário: um jogo de navegador pensado para controle, com 8 ataques especiais em dois gatilhos (segurar R1 ou R2 + botão de face) e um ataque básico no □, e o mesmo esquema no teclado e mouse (segurar um botão do mouse + tecla 1–4). O que o usuário confirmou está marcado como **Definido**. Os números (dano, recarga, velocidade, alcance) e os especiais de exemplo foram escolhidos só para o guia ter código que roda: estão marcados como **placeholder** ou **proposta** e precisam de confirmação.
>
> "Projeto Gatilho" é um nome de trabalho (R1 e R2 são os gatilhos do controle). O nome real está **Em aberto**.
>
> O guia de implementação tem duas partes: a **versão web** (TypeScript, Vite, Canvas 2D, Gamepad API), que é a primeira versão do jogo e a do protótipo em [`prototipos/projeto-gatilho/`](prototipos/projeto-gatilho/), e um **porte para Unity** (Input System, build WebGL), para referência futura.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Guia de Implementação Web](#parte-2--guia-de-implementação-web)
3. [Parte 3 — Implementação Web: Fase 0 (Setup do Projeto)](#parte-3--implementação-web-fase-0-setup-do-projeto)
4. [Parte 4 — Implementação Web: Fase 1 (Input: Controle, Teclado e Mouse)](#parte-4--implementação-web-fase-1-input-controle-teclado-e-mouse)
5. [Parte 5 — Implementação Web: Fase 2 (Herói, Movimento e Câmera)](#parte-5--implementação-web-fase-2-herói-movimento-e-câmera)
6. [Parte 6 — Implementação Web: Fase 3 (Combate: Básico e Especiais)](#parte-6--implementação-web-fase-3-combate-básico-e-especiais)
7. [Parte 7 — Implementação Web: Fase 4 (Inimigos, Salas e Chefe)](#parte-7--implementação-web-fase-4-inimigos-salas-e-chefe)
8. [Parte 8 — Implementação Web: Fase 5 (HUD)](#parte-8--implementação-web-fase-5-hud)
9. [Parte 9 — Implementação Web: Fase 6 (Build, Deploy e Próximos Passos)](#parte-9--implementação-web-fase-6-build-deploy-e-próximos-passos)
10. [Parte 10 — Guia de Implementação Unity (porte)](#parte-10--guia-de-implementação-unity-porte)
11. [Parte 11 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-11--implementação-unity-fase-0-setup-do-projeto)
12. [Parte 12 — Implementação Unity: Fase 1 (Input System)](#parte-12--implementação-unity-fase-1-input-system)
13. [Parte 13 — Implementação Unity: Fase 2 (Herói e Movimento)](#parte-13--implementação-unity-fase-2-herói-e-movimento)
14. [Parte 14 — Implementação Unity: Fase 3 (Combate)](#parte-14--implementação-unity-fase-3-combate)
15. [Parte 15 — Implementação Unity: Fase 4 (Inimigos, Salas e Chefe)](#parte-15--implementação-unity-fase-4-inimigos-salas-e-chefe)
16. [Parte 16 — Implementação Unity: Fase 5 (HUD)](#parte-16--implementação-unity-fase-5-hud)
17. [Parte 17 — Implementação Unity: Fase 6 (Build WebGL e Próximos Passos)](#parte-17--implementação-unity-fase-6-build-webgl-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Nome:** **Em aberto**. "Projeto Gatilho" é provisório.
- **Gênero:** **Definido**: hack-and-slash / beat 'em up. Um herói contra grupos de inimigos, com ataque básico e especiais.
- **Dimensão:** **Definido**: 2D.
- **Câmera/perspectiva:** **Definido**: topdown (vista de cima), movimento livre em 8 direções (360° no analógico).
- **Plataforma-alvo:** **Definido**: navegador. O jogo é pensado para **controle** (gamepad); **teclado e mouse** também é suportado, com o mesmo esquema de especiais. **Em aberto:** navegador de celular, lojas, console.
- **Pilar de design:** **Em aberto** em palavras do usuário. Proposta: *"dois gatilhos, oito golpes: segurar um gatilho troca o que os botões fazem, e a escolha entre acertar todos ou acertar um só é a decisão de cada segundo."*
- **Fantasia central:** **Em aberto**.
- **Referências/inspirações:** **Em aberto**; nenhum jogo foi citado. Observação: segurar um gatilho para trocar o que os botões de face fazem é o mesmo princípio da "cross hotbar" de Final Fantasy XIV no controle, que pode servir de referência de leitura da HUD (§8).

## 2. Controles

O coração do jogo é o esquema de input: **4 botões de face × 2 gatilhos = 8 especiais**, mais o ataque básico.

### 2.1 Controle

| Ação | Controle (nomes PlayStation) | Equivalente Xbox | Status |
|---|---|---|---|
| Mover | Analógico esquerdo | Analógico esquerdo | **Proposta** |
| Mirar | Analógico direito; sem ele, o herói ataca para onde está olhando | Analógico direito | **Proposta** |
| Ataque básico | □ | X | **Definido** |
| Especial de área 1–4 | Segurar **R1** + X / △ / □ / ○ | Segurar **RB** + A / Y / X / B | **Definido** |
| Especial individual 1–4 | Segurar **R2** + X / △ / □ / ○ | Segurar **RT** + A / Y / X / B | **Definido** |
| Esquiva | X (sem gatilho) | A | **Proposta** |
| ○ e △ sem gatilho | — | — | **Em aberto** (o usuário definiu que são "movimento"; proposta: ○ = interagir, △ livre) |

### 2.2 Teclado e mouse

| Ação | Teclado e mouse | Status |
|---|---|---|
| Mover | WASD | **Definido** |
| Mirar | Mouse: o herói olha para o cursor | **Definido** |
| Ataque básico | Espaço | **Definido** |
| Especial de área 1–4 | Segurar **botão direito do mouse** + 1 / 2 / 3 / 4 | **Definido** |
| Especial individual 1–4 | Segurar **botão esquerdo do mouse** + 1 / 2 / 3 / 4 | **Definido** |
| Esquiva | Shift | **Proposta** |

- **Definido:** o botão direito do mouse faz o papel do R1 e o esquerdo o do R2 (mesma ordem em que o usuário listou os dois).
- **Proposta:** as teclas 1–4 correspondem aos botões de face na ordem em que o usuário os listou: **1 = X, 2 = △, 3 = □, 4 = ○**. Assim cada especial tem um slot só, e trocar de dispositivo não muda o que cada slot faz.
- **Definido:** clicar com um botão do mouse **sozinho** não ataca. Os botões do mouse são só modificadores.

### 2.3 Os dois conjuntos de especiais

- **Definido:** **R1 (botão direito do mouse) = especiais de área**: acertam todos os inimigos dentro de uma forma (círculo em volta do herói, cone à frente, círculo no ponto mirado).
- **Definido:** **R2 (botão esquerdo do mouse) = especiais individuais**: acertam um alvo só, normalmente com mais dano.
- **Definido:** são **8 especiais** no total (4 por gatilho), cada um com a **sua própria recarga** (cooldown). Não há barra de energia.
- **Placeholder:** os 8 especiais de exemplo do MVP (nomes, dano, recarga, forma) estão na tabela do §3.2.
- **Em aberto:** os especiais são fixos do herói ou o jogador escolhe/troca quais vão em cada slot? Há desbloqueio ao longo do jogo?

### 2.4 Regras de prioridade do input

Estas regras resolvem casos que o briefing não cobre. Todas são **proposta**:

1. **Gatilho segurado manda.** Com R1 ou R2 segurado, um botão de face **sempre** dispara o especial do slot e **nunca** o ataque básico ou a esquiva. Ex.: R1 + □ dispara o especial de área 3, não o ataque básico.
2. **O primeiro gatilho vale.** Se o jogador segurar R1 e depois também R2, continua valendo o R1 até ele ser solto. Soltando o R1 com o R2 ainda apertado, passa a valer o R2.
3. **Ordem dentro do quadro.** Se o gatilho e o botão de face forem apertados no mesmo quadro, conta como especial. Se o botão vier antes do gatilho, conta como ataque básico.
4. **Especial em recarga não faz nada** (não cai para o ataque básico).
5. **Especial individual sem alvo** (nenhum inimigo no alcance e no ângulo de mira) não dispara e não gasta a recarga.
6. **Último dispositivo usado manda.** O jogo lê o dispositivo que teve input por último (controle ou teclado/mouse) e mostra os ícones dele na HUD.

- **Em aberto:** uma janela de tolerância (ex.: 50 ms) para o caso "botão um pouco antes do gatilho" contar como especial.

### 2.5 Mira

- **Definido (PC):** o herói olha para o cursor; ataque básico, especiais em cone/no ponto e a busca do alvo individual usam essa direção.
- **Proposta (controle):** o analógico direito mira; solto, o herói olha para onde está andando.
- **Proposta:** o especial individual escolhe o inimigo mais alinhado com a mira dentro de um cone de ±35° e do alcance do especial (empate: o mais perto).
- **Em aberto:** trava de alvo (lock-on).

## 3. Combate

### 3.1 Ataque básico e esquiva

- **Definido:** □ (Espaço no PC) é o ataque básico.
- **Placeholder:** golpe em cone curto à frente (alcance 40 px, ±45°), 10 de dano, um a cada 0,35 s. Acerta todos os inimigos no cone.
- **Em aberto:** combo de ataques básicos (□ □ □) com finalizador.
- **Proposta:** esquiva rápida na direção do movimento (0,15 s, invulnerável enquanto dura, recarga de 0,6 s).

### 3.2 Especiais de exemplo do MVP

Todos **placeholder**: servem para testar o esquema de 8 slots. O desenho dos especiais de verdade está **Em aberto**.

| Gatilho | Slot (controle / PC) | Nome | Forma | Dano | Recarga |
|---|---|---|---|---|---|
| R1 área | X / 1 | Giro | Círculo de raio 90 em volta do herói | 20 | 4 s |
| R1 área | △ / 2 | Leque | Cone de alcance 160, ±45° | 25 | 5 s |
| R1 área | □ / 3 | Impacto | Círculo de raio 70 a 140 px à frente | 30 | 7 s |
| R1 área | ○ / 4 | Tremor | Círculo de raio 160 em volta do herói | 40 | 12 s |
| R2 individual | X / 1 | Estocada | Alvo único, alcance 70 | 35 | 3 s |
| R2 individual | △ / 2 | Disparo | Alvo único, alcance 320 | 30 | 4 s |
| R2 individual | □ / 3 | Golpe Pesado | Alvo único, alcance 90 | 55 | 8 s |
| R2 individual | ○ / 4 | Execução | Alvo único, alcance 90 | 80 | 14 s |

- **Em aberto:** efeitos além de dano (empurrão, atordoamento, sangramento, deslocar o herói até o alvo), animação/tempo de execução de cada especial (o herói fica parado?), se o herói pode ser interrompido.

### 3.3 Vida e dano

- **Placeholder:** herói com 100 de vida; ao levar dano fica 0,5 s invulnerável.
- **Em aberto:** cura, itens, defesa/bloqueio.

## 4. Inimigos e Chefe

- **Placeholder (MVP):** dois inimigos comuns que andam até o herói e causam dano de contato:

| Inimigo | Vida | Raio | Velocidade | Dano de contato | Intervalo |
|---|---|---|---|---|---|
| Capanga | 30 | 12 | 90 | 10 | 1 s |
| Brutamontes | 90 | 18 | 60 | 20 | 1,5 s |
| Chefe | 600 | 32 | 70 | 25 | 1,2 s |

- **Definido:** a fase termina num chefe.
- **Em aberto:** inimigos à distância, inimigos que só morrem com especial de área/individual (para dar razão de usar cada gatilho), padrões de ataque do chefe (no MVP ele é só um inimigo maior), tema e nomes dos inimigos.

## 5. Estrutura da Fase

- **Definido:** o MVP tem **uma fase linear** que termina num chefe.
- **Proposta:** a fase é uma sequência de **salas**. Ao entrar numa sala, a saída tranca e chegam **ondas** de inimigos; quando a última onda morre, a saída abre e o herói segue para a próxima sala. A última sala é a do chefe.
- **Placeholder:** 4 salas lado a lado (rolando para a direita), da mesma altura: sala 1 (1 onda de 3 capangas), sala 2 (2 ondas), sala 3 (com brutamontes), sala 4 (chefe).
- **Em aberto:** cenário/tema, layout das salas (corredores, salas em outras direções), segredos, itens no chão.

## 6. Vitória e Derrota

- **Definido:** vencer o chefe termina a fase.
- **Em aberto:** o que acontece quando o herói morre. **Proposta** (usada no guia): a sala atual recomeça (vida cheia, recargas zeradas, ondas da sala do zero); salas já vencidas continuam vencidas.
- **Em aberto:** pontuação, ranking, nota por fase.

## 7. Estilo Visual

- **Em aberto:** estilo de arte, tema e paleta. O guia desenha com formas simples (círculos, cones) até a arte existir.

## 8. HUD / UI

- **Proposta:** barra de vida no canto superior esquerdo.
- **Proposta:** **barra cruzada** na parte de baixo: dois losangos de 4 slots (o da esquerda é o R1/área, o da direita é o R2/individual), cada slot na posição do seu botão (△ em cima, X embaixo, □ à esquerda, ○ à direita). Cada slot mostra o nome do especial e a recarga como um "relógio" escurecendo. Segurar um gatilho **aumenta e acende** o losango dele, para o jogador ver o que cada botão vai fazer antes de apertar.
- **Proposta:** os ícones mudam com o dispositivo (§2.4, regra 6): no controle, X/△/□/○ e R1/R2; no PC, 1/2/3/4 e "Mouse Dir."/"Mouse Esq.".
- **Em aberto:** tela de título, pausa, tela de vitória/derrota, tela de configuração de controles.

## 9. Áudio

- **Em aberto.**

## 10. Backend / Serviços

- **Em aberto.** O MVP não precisa de servidor. Se houver ranking ou save na nuvem, a decisão de seguir o padrão Firebase dos outros jogos do estúdio ainda não foi tomada.

## 11. Arquitetura de Software

- **Proposta:** três camadas, para as regras de input e combate serem testáveis sem navegador e iguais na versão web e no porte Unity:
  - **Core (regras puras):** a regra que transforma o input bruto num comando (§2.4), recargas e a seleção de alvos (§2.5, §3.2). Não toca em tela, DOM nem Gamepad API.
  - **Input (dispositivos):** lê controle, teclado e mouse e entrega sempre o mesmo formato (`InputFrame`) ao Core.
  - **Jogo e tela:** herói, inimigos, salas, câmera, desenho e HUD.
- **Proposta:** todo número de jogo fica num arquivo de configuração (web: `gameConfig.ts`; Unity: ScriptableObjects). Balancear é mexer ali.

## 12. Escopo do MVP

**Definido:** 1 herói, 1 fase linear com chefe.

O MVP precisa ter:

- Herói que anda, mira, ataca com □/Espaço e dispara os 8 especiais pelo controle **e** pelo teclado/mouse, com as regras do §2.4.
- Recarga individual dos 8 especiais.
- 2 inimigos comuns e 1 chefe (§4).
- 4 salas com portas que trancam e ondas (§5).
- HUD com vida e a barra cruzada (§8).
- Rodar no navegador de desktop com controle de PlayStation e de Xbox.

Fica para depois (**Em aberto**): mais heróis, mais fases, escolha/desbloqueio de especiais, combos, arte, áudio, menus, save, ranking, celular.

## 13. Em aberto (consolidado)

- Nome do jogo, pilar e fantasia em palavras do usuário (§1).
- O que ○ e △ fazem sem gatilho; se X é esquiva (§2.1).
- Ordem 1–4 ↔ X/△/□/○ no teclado (§2.2).
- Regras de prioridade do input e janela de tolerância (§2.4).
- Mira no controle e trava de alvo (§2.5).
- Especiais fixos ou escolhidos; desbloqueio; efeitos além de dano; tempo de execução (§2.3, §3.2).
- Combo do ataque básico; cura, defesa (§3).
- Inimigos de verdade, padrões do chefe (§4).
- Tema, layout das salas (§5).
- O que acontece ao morrer; pontuação (§6).
- Estilo visual (§7), menus (§8), áudio (§9), backend (§10).
- Todos os números marcados como placeholder.

## Histórico de versões

- **0.1.0** (2026-10-30): primeiro rascunho do GDD: esquema de 8 especiais em dois gatilhos (R1 área, R2 individual) com o ataque básico no □, equivalente no teclado e mouse, MVP de 1 herói e 1 fase linear, guia web, protótipo web jogável (Vite + TypeScript) e porte Unity.

---

# Parte 2 — Guia de Implementação Web

> Guia fase a fase da versão web, a primeira versão do jogo: TypeScript, Vite, Canvas 2D e a Gamepad API do navegador, sem engine. As fases 0 a 5 constroem o MVP do §12; a Fase 6 publica e lista os próximos passos.
>
> O código completo e funcionando está em [`prototipos/projeto-gatilho/`](prototipos/projeto-gatilho/). As listagens abaixo são cópias desse código, fase a fase; no protótipo, os acréscimos das Fases 3 a 5 já estão juntados nos arquivos (`Game.ts`, `renderer.ts`, `main.ts`).

## Convenções

- **Nomes no código em inglês, comentários em português**, como nos outros jogos do estúdio.
- **Três camadas que não se misturam** (§11):
  - `src/core/`: regras puras (comando a partir do input, recargas, alvos). Não importa nada do navegador; roda no Vitest.
  - `src/input/`: teclado, mouse e controle. Cada dispositivo produz um `InputFrame`.
  - `src/game/`, `src/render/`, `src/ui/`: estado do jogo, desenho e HUD.
- **Todo número de jogo fica em `src/config/`.** Os especiais ficam em `specials.ts` e as salas em `stage.ts`.
- **Unidade do mundo: pixel lógico.** O canvas tem 960×540 pixels lógicos e o CSS o estica na janela.

## Arquitetura em uma página

```
 teclado/mouse ──▶ KeyboardMouseInput ─┐
                                       ├─▶ InputManager ── InputFrame ──▶ core/input.ts
 controle ──────▶ GamepadInput ────────┘   (último dispositivo)          ModifierLatch + resolveCommand
                                                                                │ Command
                                                                                ▼
                     core/targeting.ts, core/cooldowns.ts ◀────────────── Game.update(dt)
                                                                         herói, inimigos, salas
                                                                                │ lê
                                                                                ▼
                                                                   render/renderer.ts + ui/hud.ts
```

---

# Parte 3 — Implementação Web: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Vite + TypeScript que abre um canvas no navegador (`npm run dev`) e roda testes (`npm test`).

### 0.1 Pré-requisitos

1. Node.js 20 ou mais novo.
2. Um controle de PlayStation (DualShock 4/DualSense) ou de Xbox ligado por USB ou Bluetooth.
3. Chrome, Edge ou Firefox de desktop (os três têm a Gamepad API).

### 0.2 Criar o projeto

```bash
npm create vite@latest projeto-gatilho -- --template vanilla-ts
cd projeto-gatilho
npm install
npm install -D vitest
```

No `package.json`, deixe os scripts assim:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

### 0.3 Página e estilo

Apague o conteúdo de exemplo de `src/` e troque o `index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Projeto Gatilho</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <!-- 960x540 pixels lógicos; o CSS estica mantendo a proporção. -->
    <canvas id="game" width="960" height="540"></canvas>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```css
/* src/style.css */
html, body { margin: 0; height: 100%; background: #111; overflow: hidden; }
#game {
  display: block;
  width: min(100vw, calc(100vh * 16 / 9));
  height: min(100vh, calc(100vw * 9 / 16));
  margin: auto;
  position: absolute; inset: 0;
  cursor: crosshair;
}
```

### 0.4 Estrutura de pastas

```
src/
  config/     gameConfig.ts, specials.ts, stage.ts
  core/       vec.ts, input.ts, cooldowns.ts, targeting.ts (+ *.test.ts)
  input/      keyboardMouse.ts, gamepad.ts, InputManager.ts
  game/       Game.ts
  render/     camera.ts, renderer.ts
  ui/         hud.ts
  main.ts
  style.css
```

### ✅ Checkpoint da Fase 0
- `npm run dev` abre uma página com o fundo escuro (o canvas ainda está vazio).
- `npm test` roda (ainda sem testes: "No test files found" é esperado nesta fase).

#### Problemas comuns
- **`npm test` falha com "No test files found" e código de saída 1:** é esperado até a Fase 1. Se incomodar, rode `npx vitest run --passWithNoTests`.

Próxima fase: **Input** — ler controle, teclado e mouse no mesmo formato e transformar isso em comandos.

---

# Parte 4 — Implementação Web: Fase 1 (Input: Controle, Teclado e Mouse)

## Fase 1 — Input: Controle, Teclado e Mouse

> Objetivo desta fase: o esquema do §2 funcionando e testado: com um gatilho (ou botão do mouse) segurado, o botão de face (ou tecla 1–4) vira especial; sem gatilho, □/Espaço é ataque básico.

### 1.1 Configuração

```ts
// src/config/gameConfig.ts
// POR QUE: todo número de jogo num lugar só; balancear é mexer aqui (§11).
// Valores marcados como placeholder no GDD.
export const GAME = {
  view: { width: 960, height: 540 },
  input: {
    stickDeadzone: 0.25,     // analógico abaixo disso conta como solto
    triggerThreshold: 0.5,   // R2 é analógico: acima disso conta como segurado
  },
  hero: {
    radius: 14, speed: 220, maxHp: 100,
    hurtInvuln: 0.5,                              // invulnerável depois de levar dano (s)
    dashSpeed: 600, dashTime: 0.15, dashCooldown: 0.6,
  },
  basic: { damage: 10, range: 40, halfAngle: Math.PI / 4, cooldown: 0.35 },
  combat: { singleAimHalfAngle: (35 * Math.PI) / 180 }, // cone da busca de alvo individual (§2.5)
  enemies: {
    grunt: { hp: 30, radius: 12, speed: 90, contactDamage: 10, attackCooldown: 1 },
    brute: { hp: 90, radius: 18, speed: 60, contactDamage: 20, attackCooldown: 1.5 },
    boss: { hp: 600, radius: 32, speed: 70, contactDamage: 25, attackCooldown: 1.2 },
  },
} as const;

export type EnemyKind = keyof typeof GAME.enemies;
```

### 1.2 Vetores

```ts
// src/core/vec.ts
// POR QUE: o jogo é 2D; estas funções pequenas evitam repetir Math.hypot pelo código.
export interface Vec2 { x: number; y: number }

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => len(sub(a, b));

// Vetor de tamanho 1 na mesma direção (ou zero, se o vetor for zero).
export const norm = (a: Vec2): Vec2 => {
  const l = len(a);
  return l > 1e-6 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 };
};

// Corta o tamanho em `max` (a diagonal do WASD não anda mais rápido).
export const clampLen = (a: Vec2, max: number): Vec2 => {
  const l = len(a);
  return l > max ? scale(a, max / l) : a;
};
```

### 1.3 A regra do input (Core)

Este arquivo é a especificação do §2.4. Os dispositivos só dizem "o que está apertado"; quem decide se □ é ataque básico ou especial é `resolveCommand`.

```ts
// src/core/input.ts
// POR QUE: o mesmo botão (□) é ataque básico sozinho e especial com gatilho.
// Essa decisão é a regra central do jogo e precisa ser igual no controle e no PC,
// então mora aqui, sem saber de que dispositivo veio o input.
// ESTRATÉGIA: cada dispositivo preenche um InputFrame "burro" (o que está
// segurado e o que foi apertado neste quadro). ModifierLatch decide qual gatilho
// vale e resolveCommand transforma o quadro num comando só.
import type { Vec2 } from './vec';

// Os dois conjuntos de especiais (§2.3): R1/mouse direito = área, R2/mouse esquerdo = individual.
export type SpecialSet = 'area' | 'single';
// Slot 0..3 = X/1, △/2, □/3, ○/4 (§2.2).
export type Slot = 0 | 1 | 2 | 3;

export type Aim =
  | { kind: 'point'; screen: Vec2 } // mouse: um ponto do canvas
  | { kind: 'dir'; dir: Vec2 }      // analógico direito: uma direção
  | null;                           // sem mira: o herói olha para onde anda

export interface InputFrame {
  move: Vec2;               // -1..1 em cada eixo
  aim: Aim;
  areaHeld: boolean;        // R1 ou botão direito do mouse
  singleHeld: boolean;      // R2 ou botão esquerdo do mouse
  slotPressed: Slot | null; // botão de face ou tecla 1–4 apertado NESTE quadro
  basicPressed: boolean;    // □ ou Espaço apertado neste quadro
  dashPressed: boolean;     // X ou Shift apertado neste quadro
}

export type Command =
  | { kind: 'special'; set: SpecialSet; slot: Slot }
  | { kind: 'basic' }
  | { kind: 'dash' }
  | null;

// Um quadro sem nada apertado.
export const emptyFrame = (): InputFrame => ({
  move: { x: 0, y: 0 }, aim: null, areaHeld: false, singleHeld: false,
  slotPressed: null, basicPressed: false, dashPressed: false,
});

// POR QUE: com R1 e R2 apertados juntos, precisa haver uma resposta fixa (§2.4, regra 2).
// ESTRATÉGIA: guarda o gatilho atual; ele continua valendo enquanto estiver
// segurado, mesmo que o outro seja apertado depois.
export class ModifierLatch {
  private current: SpecialSet | null = null;

  // Chamado uma vez por quadro; devolve o gatilho que vale agora.
  update(areaHeld: boolean, singleHeld: boolean): SpecialSet | null {
    const held = (s: SpecialSet) => (s === 'area' ? areaHeld : singleHeld);
    if (this.current && held(this.current)) return this.current;
    this.current = areaHeld ? 'area' : singleHeld ? 'single' : null;
    return this.current;
  }

  // Esquece o gatilho (ao trocar de dispositivo ou recomeçar a sala).
  reset(): void { this.current = null; }
}

// A regra central (§2.4, regra 1): com gatilho, botão de face é especial e nada mais.
export function resolveCommand(frame: InputFrame, modifier: SpecialSet | null): Command {
  if (modifier) {
    return frame.slotPressed !== null ? { kind: 'special', set: modifier, slot: frame.slotPressed } : null;
  }
  if (frame.basicPressed) return { kind: 'basic' };
  if (frame.dashPressed) return { kind: 'dash' };
  return null;
}
```

### 1.4 Testes da regra

```ts
// src/core/input.test.ts
import { describe, expect, it } from 'vitest';
import { emptyFrame, ModifierLatch, resolveCommand, type InputFrame } from './input';

// □ no controle: slot 2 e ataque básico ao mesmo tempo; quem decide é a regra.
const square = (): InputFrame => ({ ...emptyFrame(), slotPressed: 2, basicPressed: true });

describe('resolveCommand', () => {
  it('□ sozinho é ataque básico', () => {
    expect(resolveCommand(square(), null)).toEqual({ kind: 'basic' });
  });
  it('R1 + □ é o especial de área 3, nunca o básico', () => {
    expect(resolveCommand(square(), 'area')).toEqual({ kind: 'special', set: 'area', slot: 2 });
  });
  it('R2 + X é o especial individual 1, nunca a esquiva', () => {
    const f = { ...emptyFrame(), slotPressed: 0 as const, dashPressed: true };
    expect(resolveCommand(f, 'single')).toEqual({ kind: 'special', set: 'single', slot: 0 });
  });
  it('gatilho sem botão de face não faz nada', () => {
    expect(resolveCommand(emptyFrame(), 'area')).toBeNull();
  });
  it('tecla 1–4 sem botão do mouse não faz nada', () => {
    expect(resolveCommand({ ...emptyFrame(), slotPressed: 3 }, null)).toBeNull();
  });
});

describe('ModifierLatch', () => {
  it('o primeiro gatilho continua valendo', () => {
    const l = new ModifierLatch();
    expect(l.update(true, false)).toBe('area');
    expect(l.update(true, true)).toBe('area');
  });
  it('soltando o primeiro, passa a valer o outro', () => {
    const l = new ModifierLatch();
    l.update(false, true);
    l.update(true, true);
    expect(l.update(true, false)).toBe('area');
  });
  it('sem gatilho, nenhum vale', () => {
    expect(new ModifierLatch().update(false, false)).toBeNull();
  });
});
```

### 1.5 Teclado e mouse

```ts
// src/input/keyboardMouse.ts
// POR QUE: o navegador entrega teclado e mouse como eventos, mas o jogo quer
// perguntar "o que está apertado agora?" uma vez por quadro.
// ESTRATÉGIA: os eventos só anotam estado (teclas e botões segurados, teclas
// apertadas desde o último quadro); poll() monta o InputFrame e limpa as anotações.
import { emptyFrame, type InputFrame, type Slot } from '../core/input';
import type { Vec2 } from '../core/vec';

const DIGIT_TO_SLOT: Record<string, Slot> = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
const MOUSE_LEFT = 0;
const MOUSE_RIGHT = 2;

export class KeyboardMouseInput {
  activity = false; // houve input deste dispositivo no último poll()
  private pendingActivity = false;
  private down = new Set<string>();     // teclas seguradas (KeyboardEvent.code)
  private pressed = new Set<string>();  // teclas apertadas desde o último poll()
  private buttons = new Set<number>();  // botões do mouse segurados
  private mouse: Vec2 | null = null;    // posição no canvas, em pixels lógicos

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code in DIGIT_TO_SLOT) e.preventDefault(); // Espaço rola a página
      if (e.repeat) return; // segurar a tecla não repete o golpe
      this.down.add(e.code);
      this.pressed.add(e.code);
      this.pendingActivity = true;
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    // mousedown/mouseup (e não pointerdown) disparam para CADA botão, mesmo com outro já apertado.
    canvas.addEventListener('mousedown', (e) => { this.buttons.add(e.button); this.pendingActivity = true; });
    window.addEventListener('mouseup', (e) => this.buttons.delete(e.button));
    canvas.addEventListener('mousemove', (e) => { this.mouse = this.toCanvas(e); this.pendingActivity = true; });
    // O botão direito é um gatilho, não o menu do navegador.
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    // Ao trocar de aba, o navegador não manda os keyup: soltar tudo evita tecla "presa".
    window.addEventListener('blur', () => { this.down.clear(); this.buttons.clear(); });
  }

  // Monta o quadro atual e zera o que é "apertado neste quadro".
  poll(): InputFrame {
    const f = emptyFrame();
    const k = (code: string) => this.down.has(code);
    f.move = { x: (k('KeyD') ? 1 : 0) - (k('KeyA') ? 1 : 0), y: (k('KeyS') ? 1 : 0) - (k('KeyW') ? 1 : 0) };
    f.aim = this.mouse ? { kind: 'point', screen: this.mouse } : null;
    f.areaHeld = this.buttons.has(MOUSE_RIGHT);
    f.singleHeld = this.buttons.has(MOUSE_LEFT);
    for (const code of this.pressed) if (code in DIGIT_TO_SLOT) f.slotPressed = DIGIT_TO_SLOT[code];
    f.basicPressed = this.pressed.has('Space');
    f.dashPressed = this.pressed.has('ShiftLeft') || this.pressed.has('ShiftRight');
    this.pressed.clear();
    this.activity = this.pendingActivity;
    this.pendingActivity = false;
    return f;
  }

  // Converte a posição do mouse na janela para pixels lógicos do canvas (o CSS estica o canvas).
  private toCanvas(e: MouseEvent): Vec2 {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * this.canvas.width) / r.width, y: ((e.clientY - r.top) * this.canvas.height) / r.height };
  }
}
```

> Usar `e.code` (posição física da tecla) e não `e.key` faz WASD e 1–4 funcionarem no teclado ABNT2 e em qualquer layout.

### 1.6 Controle

```ts
// src/input/gamepad.ts
// POR QUE: a Gamepad API não manda eventos de botão; o jogo precisa ler o
// controle a cada quadro e descobrir sozinho o que foi apertado agora.
// ESTRATÉGIA: compara os botões deste quadro com os do anterior ("apertou" =
// está segurado agora e não estava antes). Usa o "standard mapping", em que o
// índice de cada botão é o mesmo em controles de PlayStation e Xbox.
import { GAME } from '../config/gameConfig';
import { emptyFrame, type InputFrame, type Slot } from '../core/input';
import { len, norm, scale, type Vec2 } from '../core/vec';

// Índices do standard mapping (PlayStation / Xbox).
const BTN = { CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, R1: 5, R2: 7 } as const;
// Ordem do briefing: X, △, □, ○ = slots 0..3.
const FACE_TO_SLOT: [number, Slot][] = [[BTN.CROSS, 0], [BTN.TRIANGLE, 1], [BTN.SQUARE, 2], [BTN.CIRCLE, 3]];

// Zona morta radial: ignora o analógico perto do centro e reescala o resto para 0..1.
function deadzone(v: Vec2, dz: number): Vec2 {
  const l = len(v);
  if (l < dz) return { x: 0, y: 0 };
  return scale(norm(v), Math.min(1, (l - dz) / (1 - dz)));
}

export class GamepadInput {
  activity = false;   // houve input do controle no último poll()
  connected = false;
  private prev: boolean[] = [];

  // Lê o primeiro controle conectado e monta o quadro.
  poll(): InputFrame {
    const f = emptyFrame();
    const pad = navigator.getGamepads().find((p) => p?.connected) ?? null;
    this.connected = pad !== null;
    this.activity = false;
    if (!pad) { this.prev = []; return f; }

    const dz = GAME.input.stickDeadzone;
    f.move = deadzone({ x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 }, dz);
    const look = deadzone({ x: pad.axes[2] ?? 0, y: pad.axes[3] ?? 0 }, dz);
    f.aim = len(look) > 0 ? { kind: 'dir', dir: norm(look) } : null;

    // R2 é analógico (0..1): conta como segurado acima do limiar.
    const held = pad.buttons.map((b, i) => (i === BTN.R2 ? b.value > GAME.input.triggerThreshold : b.pressed));
    const pressed = (i: number) => held[i] && !this.prev[i];

    f.areaHeld = held[BTN.R1] ?? false;
    f.singleHeld = held[BTN.R2] ?? false;
    for (const [btn, slot] of FACE_TO_SLOT) if (pressed(btn)) f.slotPressed = slot;
    // O botão de face sempre se declara também como básico/esquiva;
    // resolveCommand (core/input.ts) é quem ignora isso com gatilho segurado.
    f.basicPressed = pressed(BTN.SQUARE);
    f.dashPressed = pressed(BTN.CROSS);

    this.activity = len(f.move) > 0 || f.aim !== null || held.some(Boolean);
    this.prev = held;
    return f;
  }
}
```

### 1.7 `InputManager`: último dispositivo usado

```ts
// src/input/InputManager.ts
// POR QUE: o jogador pode largar o controle e pegar o mouse no meio da fase;
// a HUD precisa mostrar os ícones certos e o jogo não pode misturar os dois.
// ESTRATÉGIA: o dispositivo que teve input por último vira o "ativo" (§2.4,
// regra 6); só o quadro dele vai para a regra do Core.
import { ModifierLatch, resolveCommand, type Command, type InputFrame, type SpecialSet } from '../core/input';
import type { GamepadInput } from './gamepad';
import type { KeyboardMouseInput } from './keyboardMouse';

export type Device = 'keyboardMouse' | 'gamepad';

export class InputManager {
  device: Device = 'keyboardMouse';
  modifier: SpecialSet | null = null; // gatilho que vale agora (a HUD acende o losango dele)
  private latch = new ModifierLatch();

  constructor(private km: KeyboardMouseInput, private pad: GamepadInput) {}

  // Uma vez por quadro: lê os dois dispositivos e devolve o quadro e o comando do ativo.
  poll(): { frame: InputFrame; command: Command } {
    const kmFrame = this.km.poll();
    const padFrame = this.pad.poll();
    if (this.pad.activity && this.device !== 'gamepad') this.switchTo('gamepad');
    else if (this.km.activity && !this.pad.activity && this.device !== 'keyboardMouse') this.switchTo('keyboardMouse');

    const frame = this.device === 'gamepad' ? padFrame : kmFrame;
    this.modifier = this.latch.update(frame.areaHeld, frame.singleHeld);
    return { frame, command: resolveCommand(frame, this.modifier) };
  }

  // Esquece o gatilho do dispositivo antigo ao trocar.
  private switchTo(d: Device): void {
    this.device = d;
    this.latch.reset();
  }
}
```

### ✅ Checkpoint da Fase 1
- `npm test` passa os 8 testes de `core/input.test.ts`.
- (Teste rápido no navegador, opcional) com um `console.log(input.poll().command)` num `requestAnimationFrame`: □ imprime `{ kind: 'basic' }`; R1 + □ imprime `{ kind: 'special', set: 'area', slot: 2 }`; botão esquerdo do mouse + 4 imprime `{ kind: 'special', set: 'single', slot: 3 }`.

#### Problemas comuns
- **O controle não aparece (`getGamepads()` só tem `null`):** por privacidade, o navegador só expõe o controle depois que um botão dele é apertado com a página em foco. Aperte qualquer botão.
- **Os botões estão trocados ou R2 não funciona:** o controle não está no "standard mapping" (`pad.mapping !== 'standard'`), comum com DualShock por Bluetooth no Firefox ou com adaptadores genéricos. Teste no Chrome; se continuar, registre o modelo e trate como **Em aberto** (tela de remapeamento).
- **Segurar o botão esquerdo e depois o direito do mouse não muda nada:** se você trocou `mousedown` por `pointerdown`, o segundo botão não gera evento (o navegador manda só `pointermove`). Use `mousedown`/`mouseup`.

Próxima fase: **Herói, Movimento e Câmera** — o loop do jogo, o herói andando e mirando, e a câmera.

---

# Parte 5 — Implementação Web: Fase 2 (Herói, Movimento e Câmera)

## Fase 2 — Herói, Movimento e Câmera

> Objetivo desta fase: o herói anda com o analógico/WASD, olha para o mouse ou para o analógico direito, esquiva, e a câmera o segue dentro da sala.

### 2.1 Salas (só o tamanho, por enquanto)

```ts
// src/config/stage.ts
// POR QUE: a fase é uma fileira de salas da mesma altura, rolando para a direita (§5, placeholder).
// ESTRATÉGIA: cada sala só diz a largura e as ondas; a posição x sai da soma
// das larguras anteriores, então reordenar salas é mexer nesta lista.
import type { EnemyKind } from './gameConfig';

export interface Wave { kind: EnemyKind; count: number }
export interface RoomDef { width: number; waves: Wave[][] } // cada onda pode misturar tipos

export const ROOM_HEIGHT = 480;

export const STAGE: RoomDef[] = [
  { width: 900, waves: [[{ kind: 'grunt', count: 3 }]] },
  { width: 1000, waves: [[{ kind: 'grunt', count: 4 }], [{ kind: 'grunt', count: 5 }]] },
  { width: 1000, waves: [[{ kind: 'grunt', count: 3 }, { kind: 'brute', count: 1 }], [{ kind: 'brute', count: 2 }]] },
  { width: 1100, waves: [[{ kind: 'boss', count: 1 }]] },
];

// x da borda esquerda da sala i.
export const roomX = (i: number): number => STAGE.slice(0, i).reduce((s, r) => s + r.width, 0);
```

### 2.2 `Game` (herói e movimento)

Este é o arquivo do estado do jogo. Nesta fase ele só tem o herói; as Fases 3 e 4 completam os métodos marcados.

```ts
// src/game/Game.ts
// POR QUE: o estado do jogo (herói, inimigos, sala atual) num lugar só, sem
// saber de canvas nem de dispositivo; recebe o quadro de input já resolvido.
// ESTRATÉGIA: update(dt) roda uma vez por quadro: aplica o comando, move o
// herói, prende-o dentro dos limites da sala e (Fases 3 e 4) resolve combate e salas.
import { GAME } from '../config/gameConfig';
import { ROOM_HEIGHT, roomX, STAGE } from '../config/stage';
import type { Command, InputFrame } from '../core/input';
import { add, clampLen, len, norm, scale, type Vec2 } from '../core/vec';

export interface Hero {
  pos: Vec2;
  facing: Vec2;   // direção da mira, tamanho 1
  hp: number;
  invuln: number; // segundos de invulnerabilidade restantes
  dashTime: number;
  dashDir: Vec2;
}

export interface Rect { x: number; y: number; w: number; h: number }

export class Game {
  hero: Hero;
  roomIndex = 0;

  constructor() {
    this.hero = this.newHero();
  }

  // Herói novo, na entrada da sala atual.
  private newHero(): Hero {
    return {
      pos: { x: roomX(this.roomIndex) + 60, y: ROOM_HEIGHT / 2 },
      facing: { x: 1, y: 0 }, hp: GAME.hero.maxHp, invuln: 0, dashTime: 0, dashDir: { x: 1, y: 0 },
    };
  }

  // Retângulo onde o herói pode andar agora (a Fase 4 abre a porta para a próxima sala).
  bounds(): Rect {
    return { x: roomX(this.roomIndex), y: 0, w: STAGE[this.roomIndex].width, h: ROOM_HEIGHT };
  }

  // Um quadro de jogo. aimDir já vem convertido para o mundo pelo main.ts.
  update(dt: number, frame: InputFrame, command: Command, aimDir: Vec2 | null): void {
    const h = this.hero;
    h.invuln = Math.max(0, h.invuln - dt);

    // Mira: analógico direito/mouse; sem mira, olha para onde anda (§2.5).
    if (aimDir && len(aimDir) > 0) h.facing = norm(aimDir);
    else if (len(frame.move) > 0) h.facing = norm(frame.move);

    if (command) this.execute(command, frame);

    // Esquiva tem velocidade própria; fora dela, anda com o input (no máximo velocidade cheia).
    if (h.dashTime > 0) {
      h.dashTime -= dt;
      h.pos = add(h.pos, scale(h.dashDir, GAME.hero.dashSpeed * dt));
    } else {
      h.pos = add(h.pos, scale(clampLen(frame.move, 1), GAME.hero.speed * dt));
    }
    h.pos = clampInside(h.pos, this.bounds(), GAME.hero.radius);
  }

  // Executa um comando do Core. A Fase 3 acrescenta ataque básico e especiais.
  private execute(c: NonNullable<Command>, frame: InputFrame): void {
    if (c.kind === 'dash') this.dash(frame);
  }

  // Esquiva na direção do movimento (ou da mira, parado), invulnerável enquanto dura.
  private dash(frame: InputFrame): void {
    const h = this.hero;
    h.dashTime = GAME.hero.dashTime;
    h.dashDir = len(frame.move) > 0 ? norm(frame.move) : h.facing;
    h.invuln = Math.max(h.invuln, GAME.hero.dashTime);
  }
}

// Prende um círculo de raio r dentro do retângulo.
export function clampInside(p: Vec2, r: Rect, radius: number): Vec2 {
  return {
    x: Math.min(r.x + r.w - radius, Math.max(r.x + radius, p.x)),
    y: Math.min(r.y + r.h - radius, Math.max(r.y + radius, p.y)),
  };
}
```

> A esquiva ainda não tem recarga: ela entra junto com as outras na Fase 3.

### 2.3 Câmera

```ts
// src/render/camera.ts
// POR QUE: a fase é maior que a tela; a câmera segue o herói sem mostrar o lado de fora da sala.
// ESTRATÉGIA: a câmera é só o canto superior esquerdo da tela no mundo.
// Converter mundo↔tela é somar/subtrair esse canto (sem zoom no MVP).
import type { Rect } from '../game/Game';
import type { Vec2 } from '../core/vec';

export class Camera {
  x = 0;
  y = 0;
  constructor(private w: number, private h: number) {}

  // Centraliza no alvo, presa dentro dos limites (se o limite for menor que a tela, centraliza nele).
  follow(target: Vec2, b: Rect): void {
    this.x = b.w <= this.w ? b.x + (b.w - this.w) / 2 : Math.min(b.x + b.w - this.w, Math.max(b.x, target.x - this.w / 2));
    this.y = b.h <= this.h ? b.y + (b.h - this.h) / 2 : Math.min(b.y + b.h - this.h, Math.max(b.y, target.y - this.h / 2));
  }

  // Ponto da tela (mouse) para o mundo.
  toWorld(p: Vec2): Vec2 {
    return { x: p.x + this.x, y: p.y + this.y };
  }
}
```

### 2.4 Desenho

```ts
// src/render/renderer.ts
// POR QUE: até existir arte (§7), tudo é forma simples; o desenho só lê o estado.
// ESTRATÉGIA: translada o contexto pela câmera e desenha em coordenadas do mundo.
// As Fases 3 e 4 acrescentam inimigos, portas e efeitos de golpe.
import { GAME } from '../config/gameConfig';
import { ROOM_HEIGHT, roomX, STAGE } from '../config/stage';
import type { Game } from '../game/Game';
import type { Camera } from './camera';

export function render(ctx: CanvasRenderingContext2D, game: Game, cam: Camera): void {
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, GAME.view.width, GAME.view.height);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Salas: chão e contorno.
  STAGE.forEach((room, i) => {
    ctx.fillStyle = i % 2 ? '#2a2a33' : '#26262e';
    ctx.fillRect(roomX(i), 0, room.width, ROOM_HEIGHT);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(roomX(i), 0, room.width, ROOM_HEIGHT);
  });

  // Herói: círculo, com um traço na direção da mira; pisca quando invulnerável.
  const h = game.hero;
  ctx.globalAlpha = h.invuln > 0 && Math.floor(performance.now() / 60) % 2 ? 0.4 : 1;
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.arc(h.pos.x, h.pos.y, GAME.hero.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(h.pos.x, h.pos.y);
  ctx.lineTo(h.pos.x + h.facing.x * 24, h.pos.y + h.facing.y * 24);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}
```

### 2.5 O loop (`main.ts`)

```ts
// src/main.ts
// POR QUE: junta tudo: lê o input, atualiza o jogo, desenha; uma vez por quadro do monitor.
// ESTRATÉGIA: requestAnimationFrame com dt em segundos, limitado a 50 ms para
// o jogo não "teleportar" depois de a aba ficar em segundo plano.
import { GAME } from './config/gameConfig';
import { len, norm, sub, type Vec2 } from './core/vec';
import { Game } from './game/Game';
import { GamepadInput } from './input/gamepad';
import { InputManager } from './input/InputManager';
import { KeyboardMouseInput } from './input/keyboardMouse';
import { Camera } from './render/camera';
import { render } from './render/renderer';

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const ctx = canvas.getContext('2d')!;
const input = new InputManager(new KeyboardMouseInput(canvas), new GamepadInput());
const camera = new Camera(GAME.view.width, GAME.view.height);
const game = new Game();

let last = performance.now();
function tick(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const { frame, command } = input.poll();
  camera.follow(game.hero.pos, game.bounds());

  // Mouse: direção do herói até o cursor no mundo. Analógico: a direção já vem pronta.
  let aimDir: Vec2 | null = null;
  if (frame.aim?.kind === 'dir') aimDir = frame.aim.dir;
  else if (frame.aim?.kind === 'point') {
    const d = sub(camera.toWorld(frame.aim.screen), game.hero.pos);
    if (len(d) > 1) aimDir = norm(d); // cursor em cima do herói: mantém a mira anterior
  }

  game.update(dt, frame, command, aimDir);
  render(ctx, game, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### ✅ Checkpoint da Fase 2
- O herói (círculo azul) anda com WASD e com o analógico esquerdo; na diagonal não fica mais rápido.
- Com o mouse, o traço branco aponta para o cursor; com o controle, aponta para o analógico direito ou, solto, para onde o herói anda.
- Shift / X fazem uma esquiva curta em que o herói pisca.
- O herói não sai da primeira sala e a câmera segue sem mostrar o lado de fora.

#### Problemas comuns
- **Com o controle, o herói anda sozinho devagar:** o analógico tem folga ("drift"). Aumente `GAME.input.stickDeadzone` (0,25 → 0,3).
- **A mira com mouse fica deslocada:** o canvas é esticado pelo CSS; confira se `toCanvas` (Fase 1) usa `getBoundingClientRect()` e as dimensões lógicas do canvas.

Próxima fase: **Combate** — ataque básico, os 8 especiais e as recargas.

---

# Parte 6 — Implementação Web: Fase 3 (Combate: Básico e Especiais)

## Fase 3 — Combate: Básico e Especiais

> Objetivo desta fase: □/Espaço dá o golpe básico, os 8 especiais disparam com suas formas e recargas, e o especial individual escolhe o alvo pela mira. Os alvos ainda são inimigos parados, criados na Fase 4; aqui as regras são testadas.

### 3.1 Os especiais

```ts
// src/config/specials.ts
// POR QUE: os 8 especiais são dados, não código: trocar um especial é editar esta tabela (§3.2, placeholder).
// ESTRATÉGIA: cada especial tem uma forma; formas de área acertam todos dentro,
// 'single' acerta o inimigo mais alinhado com a mira. A ordem do array é a do slot: X, △, □, ○.
import type { SpecialSet } from '../core/input';

export type Shape =
  | { kind: 'aroundHero'; radius: number }               // círculo em volta do herói
  | { kind: 'cone'; range: number; halfAngle: number }   // cone à frente
  | { kind: 'atAim'; distance: number; radius: number }  // círculo à frente, a `distance` do herói
  | { kind: 'single'; range: number };                   // um alvo só

export interface SpecialDef { id: string; name: string; damage: number; cooldown: number; shape: Shape }

export const SPECIALS: Record<SpecialSet, readonly SpecialDef[]> = {
  area: [ // R1 / botão direito do mouse
    { id: 'giro', name: 'Giro', damage: 20, cooldown: 4, shape: { kind: 'aroundHero', radius: 90 } },
    { id: 'leque', name: 'Leque', damage: 25, cooldown: 5, shape: { kind: 'cone', range: 160, halfAngle: Math.PI / 4 } },
    { id: 'impacto', name: 'Impacto', damage: 30, cooldown: 7, shape: { kind: 'atAim', distance: 140, radius: 70 } },
    { id: 'tremor', name: 'Tremor', damage: 40, cooldown: 12, shape: { kind: 'aroundHero', radius: 160 } },
  ],
  single: [ // R2 / botão esquerdo do mouse
    { id: 'estocada', name: 'Estocada', damage: 35, cooldown: 3, shape: { kind: 'single', range: 70 } },
    { id: 'disparo', name: 'Disparo', damage: 30, cooldown: 4, shape: { kind: 'single', range: 320 } },
    { id: 'golpe-pesado', name: 'Golpe Pesado', damage: 55, cooldown: 8, shape: { kind: 'single', range: 90 } },
    { id: 'execucao', name: 'Execução', damage: 80, cooldown: 14, shape: { kind: 'single', range: 90 } },
  ],
};
```

### 3.2 Recargas

```ts
// src/core/cooldowns.ts
// POR QUE: cada especial tem a sua recarga (§2.3), e o básico e a esquiva também.
// ESTRATÉGIA: um mapa id → segundos restantes; quem não está no mapa está pronto.
export class Cooldowns {
  private left = new Map<string, number>();

  // Desconta o tempo do quadro; quem chega a zero sai do mapa (fica pronto).
  tick(dt: number): void {
    for (const [id, t] of this.left) {
      if (t - dt <= 0) this.left.delete(id);
      else this.left.set(id, t - dt);
    }
  }
  ready(id: string): boolean { return !this.left.has(id); }
  start(id: string, seconds: number): void { this.left.set(id, seconds); }
  remaining(id: string): number { return this.left.get(id) ?? 0; }
  clear(): void { this.left.clear(); }
}
```

### 3.3 Alvos

```ts
// src/core/targeting.ts
// POR QUE: decidir quem um golpe acerta é regra de jogo, e regra fica no Core, testada.
// ESTRATÉGIA: funções puras que recebem a origem, a direção da mira (tamanho 1) e a
// lista de alvos; um alvo é qualquer coisa com posição e raio (o raio conta: acertar a borda vale).
import type { Shape } from '../config/specials';
import { add, dist, dot, len, norm, scale, sub, type Vec2 } from './vec';

export interface Target { pos: Vec2; radius: number }

// Todos os alvos dentro de uma forma de área.
export function areaTargets<T extends Target>(shape: Shape, origin: Vec2, facing: Vec2, targets: readonly T[]): T[] {
  switch (shape.kind) {
    case 'aroundHero':
      return targets.filter((t) => dist(t.pos, origin) <= shape.radius + t.radius);
    case 'atAim': {
      const center = add(origin, scale(facing, shape.distance));
      return targets.filter((t) => dist(t.pos, center) <= shape.radius + t.radius);
    }
    case 'cone':
      return targets.filter((t) => {
        const d = sub(t.pos, origin);
        const l = len(d);
        if (l > shape.range + t.radius) return false;
        return l < 1e-6 || dot(norm(d), facing) >= Math.cos(shape.halfAngle);
      });
    case 'single':
      return []; // não é área: use singleTarget
  }
}

// O alvo mais alinhado com a mira, dentro do alcance e do cone de busca (§2.5). Empate: o mais perto.
export function singleTarget<T extends Target>(origin: Vec2, facing: Vec2, range: number, halfAngle: number, targets: readonly T[]): T | null {
  let best: T | null = null;
  let bestAngle = Infinity;
  let bestDist = Infinity;
  for (const t of targets) {
    const d = sub(t.pos, origin);
    const l = len(d);
    if (l > range + t.radius) continue;
    const angle = l < 1e-6 ? 0 : Math.acos(Math.max(-1, Math.min(1, dot(norm(d), facing))));
    if (angle > halfAngle) continue;
    if (angle < bestAngle - 1e-6 || (Math.abs(angle - bestAngle) <= 1e-6 && l < bestDist)) {
      best = t; bestAngle = angle; bestDist = l;
    }
  }
  return best;
}
```

```ts
// src/core/targeting.test.ts
import { describe, expect, it } from 'vitest';
import { Cooldowns } from './cooldowns';
import { areaTargets, singleTarget } from './targeting';

const at = (x: number, y: number) => ({ pos: { x, y }, radius: 10 });
const right = { x: 1, y: 0 };

describe('areaTargets', () => {
  it('círculo em volta do herói pega todos perto, em qualquer direção', () => {
    const ts = [at(50, 0), at(-50, 0), at(300, 0)];
    expect(areaTargets({ kind: 'aroundHero', radius: 90 }, { x: 0, y: 0 }, right, ts)).toHaveLength(2);
  });
  it('cone ignora quem está atrás', () => {
    const ts = [at(100, 0), at(-100, 0)];
    expect(areaTargets({ kind: 'cone', range: 160, halfAngle: Math.PI / 4 }, { x: 0, y: 0 }, right, ts)).toEqual([ts[0]]);
  });
});

describe('singleTarget', () => {
  it('prefere o mais alinhado com a mira, não o mais perto', () => {
    const ts = [at(40, 30), at(200, 0)];
    expect(singleTarget({ x: 0, y: 0 }, right, 320, Math.PI / 5, ts)).toBe(ts[1]);
  });
  it('sem ninguém no alcance, não há alvo', () => {
    expect(singleTarget({ x: 0, y: 0 }, right, 70, Math.PI / 5, [at(200, 0)])).toBeNull();
  });
});

describe('Cooldowns', () => {
  it('fica pronto depois do tempo', () => {
    const c = new Cooldowns();
    c.start('giro', 4);
    c.tick(3.9);
    expect(c.ready('giro')).toBe(false);
    c.tick(0.2);
    expect(c.ready('giro')).toBe(true);
  });
});
```

### 3.4 Combate no `Game`

Acrescente ao `Game.ts` da Fase 2 os campos, imports e métodos abaixo. Os inimigos (`Enemy`) são criados na Fase 4; até lá a lista fica vazia, mas o código já compila e os golpes aparecem como efeito na tela.

```ts
// src/game/Game.ts — acréscimos da Fase 3
import { SPECIALS, type Shape } from '../config/specials';
import { Cooldowns } from '../core/cooldowns';
import { areaTargets, singleTarget } from '../core/targeting';
import type { EnemyKind } from '../config/gameConfig';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  pos: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
  attackCd: number;  // segundos até poder bater de novo
  hurtFlash: number; // segundos piscando depois de levar golpe
}

// Um golpe desenhado por alguns décimos de segundo (só visual).
export interface Effect { shape: Shape; origin: Vec2; facing: Vec2; target: Vec2 | null; time: number }

// Dentro da classe Game:
//   enemies: Enemy[] = [];
//   effects: Effect[] = [];
//   cooldowns = new Cooldowns();
```

Troque o `execute` da Fase 2 por este, e acrescente os métodos abaixo dele:

```ts
  // Executa um comando do Core: básico, esquiva ou um dos 8 especiais.
  private execute(c: NonNullable<Command>, frame: InputFrame): void {
    const h = this.hero;
    const cd = this.cooldowns;
    switch (c.kind) {
      case 'dash':
        if (!cd.ready('dash')) return;
        cd.start('dash', GAME.hero.dashCooldown);
        this.dash(frame);
        return;
      case 'basic': {
        if (!cd.ready('basic')) return;
        cd.start('basic', GAME.basic.cooldown);
        const shape: Shape = { kind: 'cone', range: GAME.basic.range, halfAngle: GAME.basic.halfAngle };
        this.hit(areaTargets(shape, h.pos, h.facing, this.enemies), GAME.basic.damage);
        this.effects.push({ shape, origin: h.pos, facing: h.facing, target: null, time: 0.12 });
        return;
      }
      case 'special': {
        const def = SPECIALS[c.set][c.slot];
        if (!cd.ready(def.id)) return; // §2.4, regra 4: em recarga não faz nada
        if (def.shape.kind === 'single') {
          const t = singleTarget(h.pos, h.facing, def.shape.range, GAME.combat.singleAimHalfAngle, this.enemies);
          if (!t) return; // §2.4, regra 5: sem alvo não gasta a recarga
          this.hit([t], def.damage);
          this.effects.push({ shape: def.shape, origin: h.pos, facing: h.facing, target: t.pos, time: 0.2 });
        } else {
          this.hit(areaTargets(def.shape, h.pos, h.facing, this.enemies), def.damage);
          this.effects.push({ shape: def.shape, origin: h.pos, facing: h.facing, target: null, time: 0.25 });
        }
        cd.start(def.id, def.cooldown);
        return;
      }
    }
  }

  // Aplica dano e tira da lista quem morreu.
  private hit(targets: Enemy[], damage: number): void {
    for (const e of targets) {
      e.hp -= damage;
      e.hurtFlash = 0.1;
    }
    this.enemies = this.enemies.filter((e) => e.hp > 0);
  }
```

No começo do `update`, logo depois de `h.invuln = ...`, desconte as recargas e o tempo dos efeitos:

```ts
    this.cooldowns.tick(dt);
    for (const fx of this.effects) fx.time -= dt;
    this.effects = this.effects.filter((fx) => fx.time > 0);
```

### 3.5 Desenhar os golpes

Em `renderer.ts`, antes do `ctx.restore()`, desenhe os efeitos:

```ts
  // Golpes: a forma do especial, transparente, por alguns décimos de segundo.
  for (const fx of game.effects) {
    ctx.globalAlpha = Math.min(1, fx.time * 5) * 0.5;
    ctx.fillStyle = fx.shape.kind === 'single' ? '#ffd54f' : '#ff7043';
    ctx.beginPath();
    const s = fx.shape;
    if (s.kind === 'aroundHero') ctx.arc(fx.origin.x, fx.origin.y, s.radius, 0, Math.PI * 2);
    else if (s.kind === 'atAim') ctx.arc(fx.origin.x + fx.facing.x * s.distance, fx.origin.y + fx.facing.y * s.distance, s.radius, 0, Math.PI * 2);
    else if (s.kind === 'cone') {
      const a = Math.atan2(fx.facing.y, fx.facing.x);
      ctx.moveTo(fx.origin.x, fx.origin.y);
      ctx.arc(fx.origin.x, fx.origin.y, s.range, a - s.halfAngle, a + s.halfAngle);
      ctx.closePath();
    } else if (fx.target) {
      // Individual: uma linha grossa até o alvo e um círculo nele.
      ctx.arc(fx.target.x, fx.target.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.moveTo(fx.origin.x, fx.origin.y);
      ctx.lineTo(fx.target.x, fx.target.y);
      ctx.stroke();
      ctx.lineWidth = 1;
      continue;
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
```

### ✅ Checkpoint da Fase 3
- `npm test` passa também os testes de `targeting.test.ts`.
- □ / Espaço desenha um cone curto à frente; apertar repetido respeita o intervalo de 0,35 s.
- R1 + X / mouse direito + 1 desenha o círculo do Giro; R1 + △ o cone; R1 + □ o círculo à frente; R1 + ○ o círculo grande. Repetir antes da recarga não desenha nada.
- R2 + qualquer botão / mouse esquerdo + 1–4 **não** desenha nada (ainda não há inimigos: sem alvo não dispara, §2.4 regra 5).
- Segurando R1, apertar □ dispara o Impacto e **não** o golpe básico.

#### Problemas comuns
- **O especial dispara também o básico:** algum código está chamando o ataque básico direto pelo botão, sem passar por `resolveCommand`. Todo golpe precisa sair do `Command` do `InputManager`.

Próxima fase: **Inimigos, Salas e Chefe** — os inimigos, as ondas, as portas e o fim da fase.

---

# Parte 7 — Implementação Web: Fase 4 (Inimigos, Salas e Chefe)

## Fase 4 — Inimigos, Salas e Chefe

> Objetivo desta fase: a fase linear do §5 jogável do começo ao fim: ondas por sala, porta que tranca, chefe, vitória e recomeço da sala ao morrer.

### 4.1 Estado da fase no `Game`

Acrescente à classe `Game`:

```ts
  waveIndex = 0;
  cleared = false;   // a sala atual já foi vencida (a porta está aberta)
  state: 'playing' | 'victory' = 'playing';
  private nextId = 1;
```

No `constructor`, depois de criar o herói, chame `this.spawnWave();`.

Troque o `bounds()` da Fase 2: com a sala vencida, o limite vai até o fim da próxima sala (a porta abriu).

```ts
  // Onde o herói pode andar: a sala atual; vencida, a próxima também (§5).
  bounds(): Rect {
    const i = this.roomIndex;
    const w = STAGE[i].width + (this.cleared && i + 1 < STAGE.length ? STAGE[i + 1].width : 0);
    return { x: roomX(i), y: 0, w, h: ROOM_HEIGHT };
  }
```

### 4.2 Ondas, inimigos e progresso

```ts
  // Cria os inimigos da onda atual na metade direita da sala, longe da entrada.
  private spawnWave(): void {
    const room = STAGE[this.roomIndex];
    const x0 = roomX(this.roomIndex);
    for (const { kind, count } of room.waves[this.waveIndex]) {
      const def = GAME.enemies[kind];
      for (let n = 0; n < count; n++) {
        this.enemies.push({
          id: this.nextId++, kind, radius: def.radius, hp: def.hp, maxHp: def.hp, attackCd: def.attackCooldown, hurtFlash: 0,
          pos: { x: x0 + room.width * (0.55 + Math.random() * 0.4), y: def.radius + Math.random() * (ROOM_HEIGHT - 2 * def.radius) },
        });
      }
    }
  }

  // Inimigos andam até o herói e batem por contato, com intervalo (§4, placeholder).
  private updateEnemies(dt: number): void {
    const h = this.hero;
    for (const e of this.enemies) {
      const def = GAME.enemies[e.kind];
      e.attackCd = Math.max(0, e.attackCd - dt);
      e.hurtFlash = Math.max(0, e.hurtFlash - dt);
      const d = sub(h.pos, e.pos);
      const l = len(d);
      const reach = e.radius + GAME.hero.radius;
      if (l > reach) {
        e.pos = add(e.pos, scale(norm(d), Math.min(def.speed * dt, l - reach)));
      } else if (e.attackCd === 0) {
        e.attackCd = def.attackCooldown;
        if (h.invuln === 0) {
          h.hp -= def.contactDamage;
          h.invuln = GAME.hero.hurtInvuln;
        }
      }
    }
  }

  // Onda vencida → próxima onda; última onda → sala vencida; entrar na próxima sala → novas ondas.
  private updateProgress(): void {
    const h = this.hero;
    if (h.hp <= 0) return this.restartRoom();
    const room = STAGE[this.roomIndex];
    if (!this.cleared && this.enemies.length === 0) {
      if (this.waveIndex + 1 < room.waves.length) {
        this.waveIndex++;
        this.spawnWave();
      } else {
        this.cleared = true;
        if (this.roomIndex === STAGE.length - 1) this.state = 'victory';
      }
    }
    const next = this.roomIndex + 1;
    // Só conta como "entrou" com o herói inteiro do lado de lá da porta.
    if (this.cleared && next < STAGE.length && h.pos.x > roomX(next) + GAME.hero.radius * 2) {
      this.roomIndex = next;
      this.waveIndex = 0;
      this.cleared = false;
      this.spawnWave();
    }
  }

  // §6, proposta: morrer recomeça a sala atual; as anteriores continuam vencidas.
  private restartRoom(): void {
    this.enemies = [];
    this.effects = [];
    this.cooldowns.clear();
    this.waveIndex = 0;
    this.cleared = false;
    this.hero = this.newHero();
    this.spawnWave();
  }
```

> Acrescente `sub` ao import de `../core/vec` no topo de `Game.ts`.

No `update`, coloque no começo `if (this.state !== 'playing') return;` e, no fim (depois do `clampInside`), chame:

```ts
    this.updateEnemies(dt);
    this.updateProgress();
```

### 4.3 Desenhar inimigos e porta

Em `renderer.ts`, depois das salas e antes do herói:

```ts
  // Porta trancada: barra vermelha na saída da sala atual.
  if (!game.cleared && game.roomIndex + 1 < STAGE.length) {
    ctx.fillStyle = '#c62828';
    ctx.fillRect(roomX(game.roomIndex + 1) - 4, ROOM_HEIGHT / 2 - 60, 8, 120);
  }

  // Inimigos: círculos com barra de vida; brancos por um instante ao levar golpe.
  for (const e of game.enemies) {
    ctx.fillStyle = e.hurtFlash > 0 ? '#fff' : e.kind === 'boss' ? '#8e24aa' : e.kind === 'brute' ? '#e65100' : '#9e9d24';
    ctx.beginPath();
    ctx.arc(e.pos.x, e.pos.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(e.pos.x - e.radius, e.pos.y - e.radius - 8, e.radius * 2, 4);
    ctx.fillStyle = '#e53935';
    ctx.fillRect(e.pos.x - e.radius, e.pos.y - e.radius - 8, (e.radius * 2 * e.hp) / e.maxHp, 4);
  }
```

### ✅ Checkpoint da Fase 4
- Na sala 1 aparecem 3 capangas que vêm até o herói e tiram vida por contato.
- A porta vermelha some quando a última onda morre; andar para a direita entra na sala 2 e chama a primeira onda dela.
- R2 + botão de face agora acerta o inimigo mais alinhado com a mira (linha amarela até ele).
- Morrer recomeça a sala atual com vida cheia; as salas anteriores não voltam.
- Vencer o chefe da sala 4 para o jogo (`state === 'victory'`; a mensagem entra na Fase 5).

#### Problemas comuns
- **Os inimigos se empilham num ponto só:** esperado no MVP, eles não se empurram. Separação entre inimigos é polimento (Fase 6).
- **O herói "volta" para a sala anterior depois de entrar na nova:** o `bounds()` muda para a sala nova assim que `roomIndex` sobe; se o herói não estiver totalmente dentro, o `clampInside` o empurra. A margem `GAME.hero.radius * 2` em `updateProgress` evita isso; não a remova.

Próxima fase: **HUD** — vida, a barra cruzada dos especiais e as mensagens de fim.

---

# Parte 8 — Implementação Web: Fase 5 (HUD)

## Fase 5 — HUD

> Objetivo desta fase: a HUD do §8: vida, a barra cruzada com os 8 especiais e suas recargas, o losango do gatilho segurado aceso e os ícones do dispositivo ativo.

### 5.1 `hud.ts`

```ts
// src/ui/hud.ts
// POR QUE: o jogador precisa ver, antes de apertar, o que cada botão faz com o gatilho segurado (§8).
// ESTRATÉGIA: desenha em coordenadas de tela, depois do mundo. Cada conjunto de
// especiais é um losango de 4 slots na posição do botão no controle; o losango
// do gatilho segurado cresce e acende. Os rótulos mudam com o dispositivo ativo.
import { GAME } from '../config/gameConfig';
import { SPECIALS } from '../config/specials';
import type { SpecialSet } from '../core/input';
import type { Game } from '../game/Game';
import type { InputManager } from '../input/InputManager';

// Posição de cada slot no losango (X embaixo, △ em cima, □ à esquerda, ○ à direita).
const SLOT_OFFSET = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
const PAD_GLYPH = ['X', '△', '□', '○'];
const KEY_GLYPH = ['1', '2', '3', '4'];
const SET_LABEL: Record<SpecialSet, [string, string]> = {
  area: ['R1 · Área', 'Mouse Dir. · Área'],
  single: ['R2 · Individual', 'Mouse Esq. · Individual'],
};

export function drawHud(ctx: CanvasRenderingContext2D, game: Game, input: InputManager): void {
  const { width: W, height: H } = GAME.view;
  const pad = input.device === 'gamepad';

  // Vida.
  ctx.fillStyle = '#000a';
  ctx.fillRect(16, 16, 204, 20);
  ctx.fillStyle = '#43a047';
  ctx.fillRect(18, 18, (200 * Math.max(0, game.hero.hp)) / GAME.hero.maxHp, 16);

  // Os dois losangos.
  drawSet(ctx, 'area', W / 2 - 150, H - 70, input.modifier === 'area', pad, game);
  drawSet(ctx, 'single', W / 2 + 150, H - 70, input.modifier === 'single', pad, game);

  if (game.state === 'victory') {
    ctx.fillStyle = '#000a';
    ctx.fillRect(0, H / 2 - 40, W, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Fase concluída!', W / 2, H / 2 + 11);
  }
}

// Um losango: 4 slots com nome, botão e recarga.
function drawSet(ctx: CanvasRenderingContext2D, set: SpecialSet, cx: number, cy: number, active: boolean, pad: boolean, game: Game): void {
  const scale = active ? 1.25 : 1;
  const gap = 34 * scale;
  const r = 20 * scale;
  ctx.globalAlpha = active ? 1 : 0.7;
  ctx.textAlign = 'center';

  ctx.fillStyle = active ? '#fff' : '#aaa';
  ctx.font = '12px sans-serif';
  ctx.fillText(SET_LABEL[set][pad ? 0 : 1], cx, cy - gap - r - 8);

  SPECIALS[set].forEach((def, slot) => {
    const x = cx + SLOT_OFFSET[slot].x * gap;
    const y = cy + SLOT_OFFSET[slot].y * gap;
    // Fundo do slot.
    ctx.fillStyle = active ? (set === 'area' ? '#bf360c' : '#f9a825') : '#333';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Recarga: um "relógio" escuro que some no sentido horário.
    const left = game.cooldowns.remaining(def.id);
    if (left > 0) {
      ctx.fillStyle = '#000b';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (left / def.cooldown));
      ctx.closePath();
      ctx.fill();
    }
    // Botão e nome.
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(14 * scale)}px sans-serif`;
    ctx.fillText((pad ? PAD_GLYPH : KEY_GLYPH)[slot], x, y + 5 * scale);
    if (active) {
      ctx.font = '10px sans-serif';
      ctx.fillText(def.name, x, y + r + 11);
    }
  });
  ctx.globalAlpha = 1;
}
```

Em `main.ts`, importe `drawHud` e chame-o logo depois de `render(...)`:

```ts
  drawHud(ctx, game, input);
```

### ✅ Checkpoint da Fase 5
- A barra de vida diminui ao levar dano e volta cheia ao recomeçar a sala.
- Sem gatilho, os dois losangos aparecem pequenos e apagados; segurando R1 (ou o botão direito), o da esquerda cresce, acende e mostra os nomes.
- Depois de usar um especial, o slot dele escurece e clareia no sentido horário até ficar pronto.
- Tocar no teclado/mouse troca os rótulos para 1–4 e "Mouse Dir./Esq."; apertar um botão do controle troca para X/△/□/○ e R1/R2.
- Vencer o chefe mostra "Fase concluída!".

Próxima fase: **Build, Deploy e Próximos Passos**.

---

# Parte 9 — Implementação Web: Fase 6 (Build, Deploy e Próximos Passos)

## Fase 6 — Build, Deploy e Próximos Passos

> Objetivo desta fase: o MVP publicado num endereço que abre no navegador, e a lista do que vem depois.

### 6.1 Build

```bash
npm test
npm run build      # gera dist/
npm run preview    # serve dist/ em http://localhost:4173 para conferir
```

### 6.2 Deploy

O `dist/` é estático e pode ir para qualquer hospedagem de arquivos (GitHub Pages, itch.io como "HTML", Netlify). Se for publicado numa subpasta (ex.: `https://usuario.github.io/projeto-gatilho/`), configure o `base` do Vite:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
export default defineConfig({ base: './' }); // caminhos relativos: funciona em qualquer subpasta
```

> A Gamepad API só funciona em página servida por **HTTPS** (ou `localhost`) em navegadores recentes. GitHub Pages e itch.io já servem em HTTPS.

### 6.3 Testar com controles diferentes

| Controle | O que conferir |
|---|---|
| DualSense / DualShock 4 (USB) | Ordem X/△/□/○ e R1/R2 batendo com a HUD |
| DualSense / DualShock 4 (Bluetooth) | `pad.mapping === 'standard'` no Chrome e no Firefox |
| Xbox | A/Y/X/B no lugar de X/△/□/○; RB/RT no lugar de R1/R2 |

### 6.4 Próximos passos (fora do MVP)

Tudo aqui depende de decisões **Em aberto** do §13:

- Ícones de botão de verdade e rótulos Xbox (A/Y/X/B) quando o controle for de Xbox (`pad.id` contém "Xbox"/"XInput").
- Janela de tolerância para "botão antes do gatilho" (§2.4).
- Combo do ataque básico, efeitos dos especiais (empurrão, atordoamento), tempo de execução.
- Inimigos à distância e padrões do chefe.
- Separação entre inimigos (um empurrar o outro).
- Arte, áudio, telas de título/pausa/fim e remapeamento de botões.
- Escolha/desbloqueio dos especiais por slot.

### ✅ Checkpoint da Fase 6
- `npm run build` termina sem erro e `npm run preview` roda o jogo inteiro.
- O endereço publicado abre o jogo, o controle é reconhecido depois de apertar um botão e a fase vai do começo ao chefe.

---

# Parte 10 — Guia de Implementação Unity (porte)

> Guia fase a fase para portar o MVP para Unity 6, para o caso de o jogo sair do navegador (Steam, console) ou de o estúdio querer tudo na mesma engine. A versão web (Partes 2 a 9) continua sendo a primeira versão e a referência de comportamento: as regras do §2.4, os nomes e os números são os mesmos.
>
> **Em aberto:** se e quando o porte acontece. Este guia não substitui a versão web. O build **WebGL** da Unity também roda no navegador (Fase 6).

## Convenções

- **Nomes no projeto em inglês, comentários em português.** Cada classe começa com `// POR QUE:` e `// ESTRATÉGIA:`, e cada método tem um comentário curto acima dele.
- **Escala:** 1 unidade da Unity = 32 pixels da versão web. Os números da web estão convertidos nos ScriptableObjects (ex.: velocidade 220 px/s ≈ 6,9 un/s).
- **Eixos:** topdown no plano XY, com +Y para cima na tela. Na web +y é para baixo, mas não é preciso inverter nada: o Input System já entrega o analógico e o WASD com +Y para cima.
- **Namespaces:**
  - `Gatilho.Core`: regras puras (input → comando, recargas, alvos). Não tem `MonoBehaviour`.
  - `Gatilho.Config`: ScriptableObjects (`GameConfig`, `SpecialDef`, `EnemyDef`).
  - `Gatilho.Controls`, `Gatilho.Gameplay`, `Gatilho.UI`: dispositivos, jogo e HUD.
- **Campos do Inspector:** `[SerializeField] private` com `_camelCase`. **Dados de ScriptableObject:** campos públicos `camelCase`.

---

# Parte 11 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: um projeto Unity 6 2D com o Input System ligado, a física 2D sem gravidade (é topdown) e as pastas e camadas prontas.

### 0.1 Instalar e criar

1. No Unity Hub, instale o **Unity 6 (6000.x)** com o módulo **Web Build Support** (para o build WebGL da Fase 6).
2. **New project** → template **Universal 2D** → nome `ProjetoGatilho`.
3. **Window → Package Manager**: confira que **Input System** está instalado (nos templates do Unity 6 ele já vem). Se não, instale.
4. **Edit → Project Settings → Player → Other Settings → Active Input Handling**: **Input System Package (New)**. A Unity reinicia.

### 0.2 Física 2D topdown

1. **Project Settings → Physics 2D → Gravity**: `X = 0, Y = 0` (vista de cima: nada cai).
2. **Project Settings → Tags and Layers**, crie as camadas: `Hero`, `Enemy`, `Wall`.
3. **Physics 2D → Layer Collision Matrix**: **desmarque** `Hero × Enemy`. O dano de contato é por distância (Fase 4); assim os inimigos não empurram o herói, mas continuam batendo entre si e nas paredes.

### 0.3 Pastas

```
Assets/_Project/
  Scripts/
    Core/        InputRules.cs, Cooldowns.cs, Targeting.cs  (+ Gatilho.Core.asmdef)
    Config/      GameConfig.cs, SpecialDef.cs, EnemyDef.cs
    Controls/    GameInput.cs
    Gameplay/    Health.cs, HeroMotor.cs, HeroCombat.cs, HitEffect.cs, Enemy.cs, Room.cs, StageManager.cs, CameraFollow.cs
    UI/          HealthBar.cs, SlotView.cs, CrossHotbar.cs, VictoryBanner.cs
  Tests/EditMode/
  Data/          GameConfig.asset, Specials/, Enemies/
  Input/         GatilhoControls.inputactions
  Prefabs/
  Scenes/        Stage1.unity
```

> A pasta de input se chama `Controls` (namespace `Gatilho.Controls`) e não `Input`: um namespace `Input` esconderia a classe `UnityEngine.Input` de quem estiver dentro de `Gatilho.*`.

### 0.4 Assembly do Core

1. Em `Scripts/Core`, **Create → Scripting → Assembly Definition**, nome `Gatilho.Core`. Assim as regras puras compilam separadas e podem ser testadas (Fase 1).
2. O resto dos scripts fica sem `.asmdef` (no assembly padrão), que enxerga o `Gatilho.Core` sozinho.

### ✅ Checkpoint da Fase 0
- O projeto abre sem erros no Console.
- `Physics 2D → Gravity` está em zero e `Hero × Enemy` desmarcado na matriz.
- As camadas `Hero`, `Enemy` e `Wall` existem.

#### Problemas comuns
- **Erro "You are trying to read Input using the UnityEngine.Input class, but you have switched active Input handling to Input System package":** algum script de exemplo usa `Input.GetKey`. Apague-o; o jogo só lê input pelo `GameInput` (Fase 1).

Próxima fase: **Input System** — as ações do controle e do teclado/mouse e a regra do §2.4.

---

# Parte 12 — Implementação Unity: Fase 1 (Input System)

## Fase 1 — Input System

> Objetivo desta fase: a mesma regra da versão web (§2.4): gatilho segurado transforma botão de face em especial; sem gatilho, □/Espaço é ataque básico. Testada no Test Runner.

### 1.1 As ações

Em `Assets/_Project/Input`, **Create → Input Actions**, nome `GatilhoControls`. Abra, crie o Action Map **`Gameplay`** e as ações:

| Ação | Tipo | Controle | Teclado e mouse |
|---|---|---|---|
| `Move` | Value / Vector2 | `<Gamepad>/leftStick` | composto **Up/Down/Left/Right**: W/S/A/D |
| `Look` | Value / Vector2 | `<Gamepad>/rightStick` | — |
| `Point` | Value / Vector2 | — | `<Mouse>/position` |
| `ModArea` | Button | `<Gamepad>/rightShoulder` (R1) | `<Mouse>/rightButton` |
| `ModSingle` | Button | `<Gamepad>/rightTrigger` (R2) | `<Mouse>/leftButton` |
| `Slot1` | Button | `<Gamepad>/buttonSouth` (X) | `<Keyboard>/1` |
| `Slot2` | Button | `<Gamepad>/buttonNorth` (△) | `<Keyboard>/2` |
| `Slot3` | Button | `<Gamepad>/buttonWest` (□) | `<Keyboard>/3` |
| `Slot4` | Button | `<Gamepad>/buttonEast` (○) | `<Keyboard>/4` |
| `Basic` | Button | `<Gamepad>/buttonWest` (□) | `<Keyboard>/space` |
| `Dash` | Button | `<Gamepad>/buttonSouth` (X) | `<Keyboard>/leftShift` |

Clique em **Save Asset**.

> **Por que □ está em duas ações (`Slot3` e `Basic`)?** É de propósito, igual à versão web: o dispositivo só diz "□ foi apertado"; quem decide se isso é ataque básico ou especial é a regra do Core (1.2). O Input System tem um composto "Button With One Modifier", mas com ele o □ dispararia o básico **e** o especial ao mesmo tempo.
>
> `buttonSouth/North/West/East` são as posições físicas: no controle de Xbox viram A/Y/X/B sem mudar nada.

### 1.2 A regra (Core)

```csharp
// Assets/_Project/Scripts/Core/InputRules.cs
// POR QUE: o mesmo botão (□) é ataque básico sozinho e especial com gatilho (§2.4).
// Essa decisão é a regra central do jogo e precisa ser igual no controle e no PC,
// então mora no Core, sem saber de que dispositivo veio o input.
// ESTRATÉGIA: o GameInput (1.4) preenche um InputFrame "burro" (o que está
// segurado e o que foi apertado neste quadro). ModifierLatch decide qual gatilho
// vale e InputRules.Resolve transforma o quadro num Command só.
using UnityEngine;

namespace Gatilho.Core
{
    // Os dois conjuntos de especiais (§2.3): R1/mouse direito = área, R2/mouse esquerdo = individual.
    public enum SpecialSet { Area, Single }

    public enum CommandKind { None, Basic, Dash, Special }

    // O que o jogador mandou fazer neste quadro (no máximo uma coisa).
    // "readonly struct": um valor pequeno, copiado em vez de alocado (não gera lixo por quadro).
    public readonly struct Command
    {
        public readonly CommandKind Kind;
        public readonly SpecialSet Set;
        public readonly int Slot; // 0..3 = X/1, △/2, □/3, ○/4

        public Command(CommandKind kind, SpecialSet set = SpecialSet.Area, int slot = -1)
        {
            Kind = kind;
            Set = set;
            Slot = slot;
        }

        public static readonly Command None = new Command(CommandKind.None);

        // Texto legível no Debug.Log.
        public override string ToString() => Kind == CommandKind.Special ? $"Special {Set} {Slot}" : Kind.ToString();
    }

    // O estado do input num quadro, já igual para controle e teclado/mouse.
    public struct InputFrame
    {
        public Vector2 move;        // -1..1, tamanho no máximo 1
        public Vector2? aimDir;     // direção da mira no mundo (tamanho 1), ou null sem mira
        public bool areaHeld;       // R1 ou botão direito do mouse
        public bool singleHeld;     // R2 ou botão esquerdo do mouse
        public int slotPressed;     // botão de face/tecla 1–4 apertado NESTE quadro, ou -1
        public bool basicPressed;   // □ ou Espaço apertado neste quadro
        public bool dashPressed;    // X ou Shift apertado neste quadro
    }

    // POR QUE: com R1 e R2 apertados juntos, precisa haver uma resposta fixa (§2.4, regra 2).
    // ESTRATÉGIA: guarda o gatilho atual; ele vale enquanto estiver segurado.
    public class ModifierLatch
    {
        private SpecialSet? _current; // "?" = pode ser null (nenhum gatilho)

        // Chamado uma vez por quadro; devolve o gatilho que vale agora.
        public SpecialSet? Update(bool areaHeld, bool singleHeld)
        {
            if (_current.HasValue && IsHeld(_current.Value, areaHeld, singleHeld)) return _current;
            _current = areaHeld ? SpecialSet.Area : singleHeld ? SpecialSet.Single : (SpecialSet?)null;
            return _current;
        }

        // Esquece o gatilho (ao trocar de dispositivo).
        public void Reset() => _current = null;

        private static bool IsHeld(SpecialSet s, bool areaHeld, bool singleHeld) => s == SpecialSet.Area ? areaHeld : singleHeld;
    }

    public static class InputRules
    {
        // A regra central (§2.4, regra 1): com gatilho, botão de face é especial e nada mais.
        public static Command Resolve(in InputFrame f, SpecialSet? modifier)
        {
            if (modifier.HasValue)
                return f.slotPressed >= 0 ? new Command(CommandKind.Special, modifier.Value, f.slotPressed) : Command.None;
            if (f.basicPressed) return new Command(CommandKind.Basic);
            if (f.dashPressed) return new Command(CommandKind.Dash);
            return Command.None;
        }
    }
}
```

### 1.3 Testes da regra

1. **Window → General → Test Runner → EditMode → Create EditMode Test Assembly Folder** dentro de `Assets/_Project/Tests/EditMode`.
2. Selecione o `.asmdef` criado e, em **Assembly Definition References**, acrescente `Gatilho.Core`. Clique em **Apply**.

```csharp
// Assets/_Project/Tests/EditMode/InputRulesTests.cs
// POR QUE: a regra do §2.4 é o que diferencia o jogo; um teste pega na hora se alguém a quebrar.
// ESTRATÉGIA: testes de EditMode rodam sem abrir cena nem apertar Play (só código puro do Core).
using Gatilho.Core;
using NUnit.Framework;

public class InputRulesTests
{
    // □ no controle: slot 2 e ataque básico ao mesmo tempo; quem decide é a regra.
    private static InputFrame Square() => new InputFrame { slotPressed = 2, basicPressed = true };

    [Test]
    public void SquareAloneIsBasic()
    {
        Assert.AreEqual(CommandKind.Basic, InputRules.Resolve(Square(), null).Kind);
    }

    [Test]
    public void R1PlusSquareIsAreaSpecial3()
    {
        Command c = InputRules.Resolve(Square(), SpecialSet.Area);
        Assert.AreEqual(CommandKind.Special, c.Kind);
        Assert.AreEqual(SpecialSet.Area, c.Set);
        Assert.AreEqual(2, c.Slot);
    }

    [Test]
    public void DigitWithoutMouseButtonDoesNothing()
    {
        Assert.AreEqual(CommandKind.None, InputRules.Resolve(new InputFrame { slotPressed = 3 }, null).Kind);
    }

    [Test]
    public void FirstTriggerKeepsPriority()
    {
        var latch = new ModifierLatch();
        latch.Update(true, false);
        Assert.AreEqual(SpecialSet.Area, latch.Update(true, true));
        Assert.AreEqual(SpecialSet.Single, latch.Update(false, true));
    }
}
```

> No teste `DigitWithoutMouseButtonDoesNothing`, `new InputFrame { slotPressed = 3 }` deixa `basicPressed` e `dashPressed` em `false` (o padrão de um `struct`).

### 1.4 `GameInput`

```csharp
// Assets/_Project/Scripts/Controls/GameInput.cs
// POR QUE: um ponto só lê o controle, o teclado e o mouse; o resto do jogo só
// pergunta "qual o quadro?" e "qual o comando?" (Frame e Command).
// ESTRATÉGIA: roda antes dos outros scripts (DefaultExecutionOrder negativo),
// monta o InputFrame com as ações do GatilhoControls, descobre o último
// dispositivo usado (§2.4, regra 6) e aplica a regra do Core.
using Gatilho.Core;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Gatilho.Controls
{
    [DefaultExecutionOrder(-100)]
    public class GameInput : MonoBehaviour
    {
        public enum Device { KeyboardMouse, Gamepad }

        [SerializeField] private InputActionAsset _actions;
        [SerializeField] private Transform _hero;   // para a mira do mouse: direção herói → cursor
        [SerializeField] private Camera _camera;

        public InputFrame Frame { get; private set; }
        public Command Command { get; private set; }
        public SpecialSet? Modifier { get; private set; } // gatilho que vale agora (a HUD acende o dele)
        public Device ActiveDevice { get; private set; } = Device.KeyboardMouse;

        private InputAction _move, _look, _point, _modArea, _modSingle, _basic, _dash;
        private InputAction[] _slots;
        private InputAction[] _deviceActions; // ações que dizem qual dispositivo está em uso
        private readonly ModifierLatch _latch = new ModifierLatch();

        // Busca as ações pelo nome uma vez só ("true" = erro claro se o nome estiver errado).
        private void Awake()
        {
            InputActionMap map = _actions.FindActionMap("Gameplay", true);
            _move = map.FindAction("Move", true);
            _look = map.FindAction("Look", true);
            _point = map.FindAction("Point", true);
            _modArea = map.FindAction("ModArea", true);
            _modSingle = map.FindAction("ModSingle", true);
            _basic = map.FindAction("Basic", true);
            _dash = map.FindAction("Dash", true);
            _slots = new[] { map.FindAction("Slot1", true), map.FindAction("Slot2", true), map.FindAction("Slot3", true), map.FindAction("Slot4", true) };
            _deviceActions = new[] { _move, _look, _modArea, _modSingle, _basic, _dash, _slots[0], _slots[1], _slots[2], _slots[3] };
        }

        // Ações do Input System só leem input enquanto estão ligadas.
        private void OnEnable() => _actions.Enable();
        private void OnDisable() => _actions.Disable();

        // Uma vez por quadro, antes de todos: monta o quadro e resolve o comando.
        private void Update()
        {
            UpdateDevice();
            var f = new InputFrame
            {
                move = Vector2.ClampMagnitude(_move.ReadValue<Vector2>(), 1f), // diagonal do WASD não anda mais rápido
                aimDir = ReadAim(),
                areaHeld = _modArea.IsPressed(),
                singleHeld = _modSingle.IsPressed(),
                slotPressed = -1,
                basicPressed = _basic.WasPressedThisFrame(),
                dashPressed = _dash.WasPressedThisFrame(),
            };
            for (int i = 0; i < _slots.Length; i++)
                if (_slots[i].WasPressedThisFrame()) f.slotPressed = i;

            Frame = f;
            Modifier = _latch.Update(f.areaHeld, f.singleHeld);
            Command = InputRules.Resolve(f, Modifier);
        }

        // O dispositivo da ação em uso vira o ativo; mexer o mouse também conta como teclado/mouse.
        private void UpdateDevice()
        {
            foreach (InputAction a in _deviceActions)
            {
                InputControl c = a.activeControl; // o controle físico que está acionando a ação agora
                if (c == null || !a.IsInProgress()) continue;
                SetDevice(c.device is Gamepad ? Device.Gamepad : Device.KeyboardMouse);
                return;
            }
            Mouse mouse = Mouse.current;
            if (mouse != null && mouse.delta.ReadValue().sqrMagnitude > 0.01f) SetDevice(Device.KeyboardMouse);
        }

        // Ao trocar de dispositivo, esquece o gatilho do antigo.
        private void SetDevice(Device d)
        {
            if (d == ActiveDevice) return;
            ActiveDevice = d;
            _latch.Reset();
        }

        // Controle: analógico direito (solto = sem mira). Mouse: do herói até o cursor no mundo.
        private Vector2? ReadAim()
        {
            if (ActiveDevice == Device.Gamepad)
            {
                Vector2 look = _look.ReadValue<Vector2>();
                return look.sqrMagnitude > 0.0001f ? look.normalized : (Vector2?)null;
            }
            Vector2 world = _camera.ScreenToWorldPoint(_point.ReadValue<Vector2>());
            Vector2 d = world - (Vector2)_hero.position;
            return d.sqrMagnitude > 0.01f ? d.normalized : (Vector2?)null;
        }
    }
}
```

### 1.5 Na cena

1. Crie a cena `Scenes/Stage1`. Crie um GameObject vazio `Input` e adicione o `GameInput`.
2. Arraste `GatilhoControls` para **Actions** e a `Main Camera` para **Camera**. **Hero** fica para a Fase 2.
3. (Teste rápido, opcional) num script de teste, `Debug.Log(input.Command)` quando `Command.Kind != CommandKind.None`.

### ✅ Checkpoint da Fase 1
- O Test Runner (EditMode) passa os 4 testes.
- Com o log de teste: □ imprime `Basic`; R1 + □ imprime `Special Area 2`; botão esquerdo do mouse + 4 imprime `Special Single 3`; X imprime `Dash`.

#### Problemas comuns
- **Com R1 segurado, □ não faz nada:** em **Project Settings → Input System Package**, a opção de consumo de input por atalhos ("Enable Input Consumption"/"Shortcut Keys Consume Input") está ligada e o `Slot3` "come" o □. Desligue-a; a regra de prioridade é do Core.
- **R2 só conta se apertar até o fim (ou ao mínimo toque):** o ponto de acionamento do gatilho é o `Default Button Press Point` (0,5) em **Project Settings → Input System Package**. Ajuste ali ou numa interação **Press** na ligação do R2.

Próxima fase: **Herói e Movimento** — vida, movimento, mira, esquiva e câmera.

---

# Parte 13 — Implementação Unity: Fase 2 (Herói e Movimento)

## Fase 2 — Herói e Movimento

> Objetivo desta fase: o herói anda, mira, esquiva sem atravessar paredes, e a câmera o segue dentro da sala.

### 2.1 Configuração

```csharp
// Assets/_Project/Scripts/Config/GameConfig.cs
// POR QUE: os números de movimento e combate num asset só; balancear é mexer no Inspector (§11).
// ESTRATÉGIA: um ScriptableObject é um arquivo de dados no projeto (Create → Gatilho → Game Config).
// Valores = os da versão web divididos por 32 (1 unidade = 32 px). Ângulos em graus.
using UnityEngine;

namespace Gatilho.Config
{
    [CreateAssetMenu(menuName = "Gatilho/Game Config")]
    public class GameConfig : ScriptableObject
    {
        [Header("Herói")]
        public float heroSpeed = 6.9f;
        public float heroRadius = 0.44f;

        [Header("Esquiva")]
        public float dashSpeed = 18.75f;
        public float dashTime = 0.15f;
        public float dashCooldown = 0.6f;

        [Header("Ataque básico")]
        public int basicDamage = 10;
        public float basicRange = 1.25f;
        public float basicHalfAngleDeg = 45f;
        public float basicCooldown = 0.35f;

        [Header("Especial individual")]
        public float singleAimHalfAngleDeg = 35f; // cone da busca de alvo (§2.5)
    }
}
```

Crie o asset em `Data/GameConfig.asset`. A vida (100) e a invulnerabilidade ao levar dano (0,5 s) ficam no componente `Health` do herói (2.2), porque o mesmo componente serve aos inimigos.

### 2.2 Vida

```csharp
// Assets/_Project/Scripts/Gameplay/Health.cs
// POR QUE: herói e inimigos levam dano, morrem e (o herói) ficam invulneráveis um instante.
// ESTRATÉGIA: um componente só para os dois; quem se importa (HUD, sala, inimigo)
// assina os eventos Changed e Died em vez de perguntar a cada quadro.
using System;
using UnityEngine;

namespace Gatilho.Gameplay
{
    public class Health : MonoBehaviour
    {
        [SerializeField] private int _max = 100;
        [SerializeField] private float _hurtInvuln = 0.5f; // herói: 0,5; inimigos: 0

        public int Current { get; private set; }
        public int Max => _max;
        public bool IsInvulnerable => Time.time < _invulnUntil;

        public event Action Changed;
        public event Action<Health> Died;

        private float _invulnUntil;

        // Awake roda quando o objeto nasce, antes do primeiro Update.
        private void Awake() => Current = _max;

        // Define a vida máxima e enche (inimigos, a partir do EnemyDef).
        public void Init(int max)
        {
            _max = max;
            ResetFull();
        }

        // Vida cheia e sem invulnerabilidade (recomeçar a sala).
        public void ResetFull()
        {
            Current = _max;
            _invulnUntil = 0f;
            Changed?.Invoke();
        }

        // Tira vida, a menos que já esteja morto ou invulnerável.
        public void TakeDamage(int amount)
        {
            if (Current <= 0 || IsInvulnerable) return;
            Current = Mathf.Max(0, Current - amount);
            if (_hurtInvuln > 0f) _invulnUntil = Time.time + _hurtInvuln;
            Changed?.Invoke();
            if (Current == 0) Died?.Invoke(this);
        }

        // Invulnerável por alguns segundos (esquiva).
        public void MakeInvulnerable(float seconds) => _invulnUntil = Mathf.Max(_invulnUntil, Time.time + seconds);
    }
}
```

### 2.3 Movimento, mira e esquiva

```csharp
// Assets/_Project/Scripts/Gameplay/HeroMotor.cs
// POR QUE: mover o herói pela física faz as paredes segurarem ele sem código extra.
// ESTRATÉGIA: Update lê o input e decide (mira, esquiva); FixedUpdate, que roda
// no passo da física, só aplica a velocidade no Rigidbody2D.
using Gatilho.Config;
using Gatilho.Controls;
using Gatilho.Core;
using UnityEngine;

namespace Gatilho.Gameplay
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class HeroMotor : MonoBehaviour
    {
        [SerializeField] private GameInput _input;
        [SerializeField] private GameConfig _config;
        [SerializeField] private Health _health;

        // Direção da mira (tamanho 1); usada pelo combate.
        public Vector2 Facing { get; private set; } = Vector2.right;

        private Rigidbody2D _rb;
        private float _dashTime;
        private float _dashCdLeft;
        private Vector2 _dashDir;

        private void Awake() => _rb = GetComponent<Rigidbody2D>();

        // Mira (§2.5) e início da esquiva.
        private void Update()
        {
            InputFrame f = _input.Frame;
            if (f.aimDir.HasValue) Facing = f.aimDir.Value;
            else if (f.move.sqrMagnitude > 0.0001f) Facing = f.move.normalized;

            _dashCdLeft -= Time.deltaTime;
            if (_input.Command.Kind == CommandKind.Dash && _dashCdLeft <= 0f)
            {
                _dashCdLeft = _config.dashCooldown;
                _dashTime = _config.dashTime;
                _dashDir = f.move.sqrMagnitude > 0.0001f ? f.move.normalized : Facing;
                _health.MakeInvulnerable(_config.dashTime);
            }
        }

        // Velocidade da esquiva ou do andar, no passo da física.
        private void FixedUpdate()
        {
            if (_dashTime > 0f)
            {
                _dashTime -= Time.fixedDeltaTime;
                _rb.linearVelocity = _dashDir * _config.dashSpeed;
            }
            else
            {
                _rb.linearVelocity = _input.Frame.move * _config.heroSpeed;
            }
        }

        // Põe o herói num ponto, parado (recomeçar a sala).
        public void Teleport(Vector2 position)
        {
            _rb.position = position;
            transform.position = position;
            _rb.linearVelocity = Vector2.zero;
            _dashTime = 0f;
        }
    }
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Se o projeto rodar em 2022 LTS, troque por `rb.velocity` (mesma coisa, nome antigo).

### 2.4 Câmera

```csharp
// Assets/_Project/Scripts/Gameplay/CameraFollow.cs
// POR QUE: a fase é maior que a tela; a câmera segue o herói sem mostrar o lado de fora da sala.
// ESTRATÉGIA: LateUpdate roda depois de todo mundo se mexer; centraliza no herói
// e prende dentro de Bounds (que o StageManager troca a cada sala, Fase 4).
using UnityEngine;

namespace Gatilho.Gameplay
{
    [RequireComponent(typeof(Camera))]
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private Transform _target;
        public Rect Bounds { get; set; } = new Rect(-100f, -100f, 200f, 200f);

        private Camera _cam;

        private void Awake() => _cam = GetComponent<Camera>();

        // Câmera ortográfica: metade da altura visível = orthographicSize.
        private void LateUpdate()
        {
            float halfH = _cam.orthographicSize;
            float halfW = halfH * _cam.aspect;
            Vector2 p = _target.position;
            float x = Bounds.width <= halfW * 2f ? Bounds.center.x : Mathf.Clamp(p.x, Bounds.xMin + halfW, Bounds.xMax - halfW);
            float y = Bounds.height <= halfH * 2f ? Bounds.center.y : Mathf.Clamp(p.y, Bounds.yMin + halfH, Bounds.yMax - halfH);
            transform.position = new Vector3(x, y, transform.position.z);
        }
    }
}
```

### 2.5 Montar o herói e uma sala de teste

1. **Herói:** GameObject `Hero`, camada `Hero`. Componentes: **Sprite Renderer** (sprite *Circle* de `2D → Sprites`, cor azul, escala 0,88), **Rigidbody2D** (Body Type *Dynamic*, Gravity Scale 0, *Freeze Rotation Z*, Interpolate *Interpolate*, Collision Detection *Continuous*: a esquiva é rápida), **Circle Collider 2D**, **Health** (Max 100, Hurt Invuln 0,5), **HeroMotor** (arraste `Input`, `GameConfig` e o próprio `Health`).
2. No `GameInput`, arraste o `Hero` para **Hero**.
3. **Câmera:** `Main Camera` ortográfica, **Size 8,44** (540 px ÷ 32 ÷ 2). Adicione **CameraFollow** com o `Hero` em **Target**.
4. **Paredes de teste:** 4 GameObjects com **Box Collider 2D** na camada `Wall` formando um retângulo de 28 × 15 unidades em volta da origem.

### ✅ Checkpoint da Fase 2
- O herói anda com WASD e com o analógico esquerdo, sem ficar mais rápido na diagonal, e para nas paredes.
- Shift / X fazem uma esquiva curta; repetir antes de 0,6 s não faz nada.
- (Com um `Debug.DrawRay(transform.position, Facing)` temporário) a mira aponta para o mouse ou para o analógico direito.

#### Problemas comuns
- **O herói atravessa a parede na esquiva:** o Rigidbody2D está com Collision Detection *Discrete*. Use *Continuous*.
- **A mira com mouse aponta errado:** a câmera não é ortográfica ou o campo **Camera** do `GameInput` está vazio.

Próxima fase: **Combate** — ataque básico, os 8 especiais e as recargas.

---

# Parte 14 — Implementação Unity: Fase 3 (Combate)

## Fase 3 — Combate

> Objetivo desta fase: o ataque básico e os 8 especiais com as mesmas formas, alvos e recargas da versão web (Parte 6).

### 3.1 Recargas e alvos (Core)

```csharp
// Assets/_Project/Scripts/Core/Cooldowns.cs
// POR QUE: cada especial tem a sua recarga (§2.3), e o básico também.
// ESTRATÉGIA: um dicionário id → segundos restantes; quem não está nele está pronto.
using System.Collections.Generic;

namespace Gatilho.Core
{
    public class Cooldowns
    {
        private readonly Dictionary<string, float> _left = new Dictionary<string, float>();
        private readonly List<string> _keys = new List<string>(); // cópia das chaves: não dá para mudar um dicionário enquanto o percorre

        // Desconta o tempo do quadro; quem chega a zero sai (fica pronto).
        public void Tick(float dt)
        {
            _keys.Clear();
            _keys.AddRange(_left.Keys);
            foreach (string id in _keys)
            {
                float t = _left[id] - dt;
                if (t <= 0f) _left.Remove(id);
                else _left[id] = t;
            }
        }

        public bool Ready(string id) => !_left.ContainsKey(id);
        public void Start(string id, float seconds) => _left[id] = seconds;
        public float Remaining(string id) => _left.TryGetValue(id, out float t) ? t : 0f;
        public void Clear() => _left.Clear();
    }
}
```

```csharp
// Assets/_Project/Scripts/Core/Targeting.cs
// POR QUE: decidir quem um golpe acerta é regra de jogo; fica no Core, igual à web (core/targeting.ts).
// ESTRATÉGIA: funções puras sobre qualquer coisa que tenha posição e raio (ITarget).
// O raio conta: acertar a borda do inimigo vale.
using System.Collections.Generic;
using UnityEngine;

namespace Gatilho.Core
{
    public enum ShapeKind { AroundHero, Cone, AtAim, Single }

    // A forma de um golpe. [Serializable] faz ela aparecer editável no Inspector.
    [System.Serializable]
    public struct Shape
    {
        public ShapeKind kind;
        public float radius;        // AroundHero, AtAim
        public float range;         // Cone, Single
        public float halfAngleDeg;  // Cone
        public float distance;      // AtAim: distância do centro até o herói
    }

    // Algo que pode ser acertado.
    public interface ITarget
    {
        Vector2 Position { get; }
        float Radius { get; }
    }

    public static class Targeting
    {
        // O alvo está dentro da forma de área?
        public static bool InArea(in Shape s, Vector2 origin, Vector2 facing, ITarget t)
        {
            switch (s.kind)
            {
                case ShapeKind.AroundHero:
                    return Vector2.Distance(t.Position, origin) <= s.radius + t.Radius;
                case ShapeKind.AtAim:
                    return Vector2.Distance(t.Position, origin + facing * s.distance) <= s.radius + t.Radius;
                case ShapeKind.Cone:
                {
                    Vector2 d = t.Position - origin;
                    float l = d.magnitude;
                    if (l > s.range + t.Radius) return false;
                    return l < 1e-4f || Vector2.Angle(facing, d) <= s.halfAngleDeg;
                }
                default:
                    return false; // Single não é área: use SingleTarget
            }
        }

        // Todos os alvos dentro da forma (lista nova: pode ser percorrida enquanto alvos morrem).
        public static List<T> AreaTargets<T>(in Shape s, Vector2 origin, Vector2 facing, IEnumerable<T> targets) where T : ITarget
        {
            var hits = new List<T>();
            foreach (T t in targets)
                if (InArea(s, origin, facing, t)) hits.Add(t);
            return hits;
        }

        // O alvo mais alinhado com a mira, no alcance e no cone de busca (§2.5). Empate: o mais perto.
        public static T SingleTarget<T>(Vector2 origin, Vector2 facing, float range, float halfAngleDeg, IEnumerable<T> targets) where T : class, ITarget
        {
            T best = null;
            float bestAngle = float.MaxValue;
            float bestDist = float.MaxValue;
            foreach (T t in targets)
            {
                Vector2 d = t.Position - origin;
                float l = d.magnitude;
                if (l > range + t.Radius) continue;
                float a = l < 1e-4f ? 0f : Vector2.Angle(facing, d);
                if (a > halfAngleDeg) continue;
                if (a < bestAngle - 0.01f || (Mathf.Abs(a - bestAngle) <= 0.01f && l < bestDist))
                {
                    best = t;
                    bestAngle = a;
                    bestDist = l;
                }
            }
            return best;
        }
    }
}
```

### 3.2 Os especiais como assets

```csharp
// Assets/_Project/Scripts/Config/SpecialDef.cs
// POR QUE: os 8 especiais são dados, não código (§3.2): trocar um especial é editar um asset.
// ESTRATÉGIA: um asset por especial (Create → Gatilho → Special); o nome do arquivo é o id da recarga.
using Gatilho.Core;
using UnityEngine;

namespace Gatilho.Config
{
    [CreateAssetMenu(menuName = "Gatilho/Special")]
    public class SpecialDef : ScriptableObject
    {
        public string displayName;
        public int damage;
        public float cooldown;
        public Shape shape;

        public string Id => name; // nome do asset
    }
}
```

Crie os 8 assets em `Data/Specials/` com os valores do §3.2 em unidades (px ÷ 32):

| Asset | Shape | Valores | Dano | Recarga |
|---|---|---|---|---|
| `Giro` | AroundHero | radius 2,8 | 20 | 4 |
| `Leque` | Cone | range 5, halfAngleDeg 45 | 25 | 5 |
| `Impacto` | AtAim | distance 4,4, radius 2,2 | 30 | 7 |
| `Tremor` | AroundHero | radius 5 | 40 | 12 |
| `Estocada` | Single | range 2,2 | 35 | 3 |
| `Disparo` | Single | range 10 | 30 | 4 |
| `GolpePesado` | Single | range 2,8 | 55 | 8 |
| `Execucao` | Single | range 2,8 | 80 | 14 |

### 3.3 Efeito visual

```csharp
// Assets/_Project/Scripts/Gameplay/HitEffect.cs
// POR QUE: até existir arte (§7), um círculo que some mostra onde o golpe pegou.
// ESTRATÉGIA: prefab com um SpriteRenderer de círculo; aparece, desbota e se destrói.
using UnityEngine;

namespace Gatilho.Gameplay
{
    public class HitEffect : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer _sprite;
        [SerializeField] private float _life = 0.25f;

        private float _t;

        // Posiciona, dimensiona e pinta o efeito.
        public void Show(Vector2 center, float diameter, Color color)
        {
            transform.position = center;
            transform.localScale = Vector3.one * diameter;
            _sprite.color = color;
            _t = _life;
        }

        // Desbota até sumir.
        private void Update()
        {
            _t -= Time.deltaTime;
            Color c = _sprite.color;
            c.a = Mathf.Clamp01(_t / _life) * 0.5f;
            _sprite.color = c;
            if (_t <= 0f) Destroy(gameObject);
        }
    }
}
```

Crie o prefab `Prefabs/HitEffect`: GameObject com **Sprite Renderer** (sprite *Circle*, Order in Layer 10) e **HitEffect** apontando para ele.

### 3.4 `HeroCombat`

O `HeroCombat` usa `Enemy.All`, que é criado na Fase 4. Para compilar já nesta fase, crie um `Enemy.cs` provisório só com a lista e o `ITarget`, e troque-o pelo completo na Fase 4:

```csharp
// Assets/_Project/Scripts/Gameplay/Enemy.cs — PROVISÓRIO (a Fase 4 substitui o arquivo inteiro)
using System.Collections.Generic;
using Gatilho.Core;
using UnityEngine;

namespace Gatilho.Gameplay
{
    public class Enemy : MonoBehaviour, ITarget
    {
        public static readonly List<Enemy> All = new List<Enemy>();
        public Health Health => GetComponent<Health>();
        public Vector2 Position => transform.position;
        public float Radius => 0.4f;
    }
}
```

```csharp
// Assets/_Project/Scripts/Gameplay/HeroCombat.cs
// POR QUE: transforma os comandos do Core (Basic, Special) em dano nos inimigos.
// ESTRATÉGIA: a cada quadro desconta as recargas e lê o Command do GameInput.
// A esquiva fica no HeroMotor; aqui só golpes. As regras 4 e 5 do §2.4 (em recarga
// ou sem alvo não faz nada) ficam aqui, iguais à versão web.
using System.Collections.Generic;
using Gatilho.Config;
using Gatilho.Controls;
using Gatilho.Core;
using UnityEngine;

namespace Gatilho.Gameplay
{
    public class HeroCombat : MonoBehaviour
    {
        [SerializeField] private GameInput _input;
        [SerializeField] private HeroMotor _motor;
        [SerializeField] private GameConfig _config;
        [SerializeField] private HitEffect _effectPrefab;
        [SerializeField] private SpecialDef[] _area = new SpecialDef[4];   // R1: X, △, □, ○
        [SerializeField] private SpecialDef[] _single = new SpecialDef[4]; // R2: X, △, □, ○

        private static readonly Color AreaColor = new Color(1f, 0.44f, 0.26f);
        private static readonly Color SingleColor = new Color(1f, 0.84f, 0.31f);

        public Cooldowns Cooldowns { get; } = new Cooldowns();

        private Vector2 Origin => transform.position;

        // O especial de um slot (a HUD usa para mostrar nome e recarga).
        public SpecialDef GetSpecial(SpecialSet set, int slot) => (set == SpecialSet.Area ? _area : _single)[slot];

        // Recargas e o comando deste quadro.
        private void Update()
        {
            Cooldowns.Tick(Time.deltaTime);
            Command c = _input.Command;
            if (c.Kind == CommandKind.Basic) Basic();
            else if (c.Kind == CommandKind.Special) Special(GetSpecial(c.Set, c.Slot));
        }

        // □ / Espaço: cone curto à frente.
        private void Basic()
        {
            if (!Cooldowns.Ready("basic")) return;
            Cooldowns.Start("basic", _config.basicCooldown);
            var shape = new Shape { kind = ShapeKind.Cone, range = _config.basicRange, halfAngleDeg = _config.basicHalfAngleDeg };
            Hit(Targeting.AreaTargets(shape, Origin, _motor.Facing, Enemy.All), _config.basicDamage);
            ShowEffect(shape, null, AreaColor);
        }

        // Um dos 8 especiais.
        private void Special(SpecialDef def)
        {
            if (def == null || !Cooldowns.Ready(def.Id)) return; // §2.4, regra 4
            if (def.shape.kind == ShapeKind.Single)
            {
                Enemy t = Targeting.SingleTarget(Origin, _motor.Facing, def.shape.range, _config.singleAimHalfAngleDeg, Enemy.All);
                if (t == null) return; // §2.4, regra 5: sem alvo não gasta a recarga
                ShowEffect(def.shape, t.Position, SingleColor);
                Hit(new List<Enemy> { t }, def.damage);
            }
            else
            {
                Hit(Targeting.AreaTargets(def.shape, Origin, _motor.Facing, Enemy.All), def.damage);
                ShowEffect(def.shape, null, AreaColor);
            }
            Cooldowns.Start(def.Id, def.cooldown);
        }

        // Aplica o dano (quem morre se destrói no fim do quadro).
        private static void Hit(List<Enemy> targets, int damage)
        {
            foreach (Enemy e in targets) e.Health.TakeDamage(damage);
        }

        // Um círculo aproximando a forma do golpe (placeholder até existir arte).
        private void ShowEffect(in Shape s, Vector2? target, Color color)
        {
            Vector2 f = _motor.Facing;
            Vector2 center;
            float diameter;
            switch (s.kind)
            {
                case ShapeKind.AroundHero: center = Origin; diameter = s.radius * 2f; break;
                case ShapeKind.AtAim: center = Origin + f * s.distance; diameter = s.radius * 2f; break;
                case ShapeKind.Cone: center = Origin + f * (s.range * 0.5f); diameter = s.range; break;
                default: center = target ?? Origin; diameter = 1.4f; break;
            }
            Instantiate(_effectPrefab).Show(center, diameter, color);
        }
    }
}
```

No `Hero`, adicione **HeroCombat**: arraste `Input`, o próprio `HeroMotor`, `GameConfig`, o prefab `HitEffect` e os 8 assets nos arrays (**Area**: Giro, Leque, Impacto, Tremor; **Single**: Estocada, Disparo, GolpePesado, Execucao).

### ✅ Checkpoint da Fase 3
- □ / Espaço mostra um círculo laranja curto à frente; R1 + X/△/□/○ (ou mouse direito + 1–4) mostra os 4 especiais de área.
- Repetir um especial antes da recarga não mostra nada.
- R2 + botão (ou mouse esquerdo + 1–4) não faz nada sem inimigos (§2.4, regra 5).
- Segurando R1, □ dispara o Impacto e **não** o golpe básico.

#### Problemas comuns
- **`NullReferenceException` no `HeroCombat` ao apertar um especial:** um dos 8 slots dos arrays está vazio no Inspector, ou o prefab `HitEffect` não foi arrastado.

Próxima fase: **Inimigos, Salas e Chefe** — a fase linear jogável do começo ao fim.

---

# Parte 15 — Implementação Unity: Fase 4 (Inimigos, Salas e Chefe)

## Fase 4 — Inimigos, Salas e Chefe

> Objetivo desta fase: as 4 salas do §5 com ondas, portas que trancam, chefe, vitória e recomeço da sala ao morrer.

### 4.1 Tipos de inimigo

```csharp
// Assets/_Project/Scripts/Config/EnemyDef.cs
// POR QUE: capanga, brutamontes e chefe são o mesmo inimigo com números diferentes (§4, placeholder).
// ESTRATÉGIA: um asset por tipo; o mesmo prefab de inimigo lê o asset ao nascer.
using UnityEngine;

namespace Gatilho.Config
{
    [CreateAssetMenu(menuName = "Gatilho/Enemy")]
    public class EnemyDef : ScriptableObject
    {
        public int maxHp = 30;
        public float radius = 0.38f;
        public float speed = 2.8f;
        public int contactDamage = 10;
        public float attackCooldown = 1f;
        public Color color = Color.yellow;
    }
}
```

| Asset (`Data/Enemies/`) | maxHp | radius | speed | contactDamage | attackCooldown |
|---|---|---|---|---|---|
| `Grunt` (capanga) | 30 | 0,38 | 2,8 | 10 | 1 |
| `Brute` (brutamontes) | 90 | 0,56 | 1,9 | 20 | 1,5 |
| `Boss` (chefe) | 600 | 1 | 2,2 | 25 | 1,2 |

### 4.2 `Enemy`

Substitua o `Enemy.cs` provisório da Fase 3:

```csharp
// Assets/_Project/Scripts/Gameplay/Enemy.cs
// POR QUE: o inimigo do MVP anda até o herói e bate por contato (§4, placeholder).
// ESTRATÉGIA: a lista estática All guarda os inimigos vivos para o HeroCombat
// procurar alvos sem física; o movimento é pelo Rigidbody2D (inimigos se
// empurram entre si) e o dano de contato é por distância (Hero × Enemy não colidem).
using System.Collections.Generic;
using Gatilho.Config;
using Gatilho.Core;
using UnityEngine;

namespace Gatilho.Gameplay
{
    [RequireComponent(typeof(Rigidbody2D), typeof(Health))]
    public class Enemy : MonoBehaviour, ITarget
    {
        public static readonly List<Enemy> All = new List<Enemy>();

        [SerializeField] private SpriteRenderer _sprite;

        public EnemyDef Def { get; private set; }
        public Health Health { get; private set; }
        public Vector2 Position => _rb.position;
        public float Radius => Def.radius;

        private Rigidbody2D _rb;
        private Health _heroHealth;
        private Transform _hero;
        private float _heroRadius;
        private float _attackCd;
        private float _flash;

        // Pega os componentes e se destrói ao morrer.
        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            Health = GetComponent<Health>();
            Health.Changed += () => _flash = 0.1f;
            Health.Died += _ => Destroy(gameObject);
        }

        // OnEnable/OnDisable: entra e sai da lista de vivos (Destroy chama OnDisable).
        private void OnEnable() => All.Add(this);
        private void OnDisable() => All.Remove(this);

        // Chamado pela sala logo depois de criar o inimigo.
        public void Init(EnemyDef def, Health hero, float heroRadius)
        {
            Def = def;
            _heroHealth = hero;
            _hero = hero.transform;
            _heroRadius = heroRadius;
            _attackCd = def.attackCooldown;
            Health.Init(def.maxHp);
            _flash = 0f; // Init dispara Changed; não é golpe
            transform.localScale = Vector3.one * (def.radius * 2f); // prefab tem 1 unidade de diâmetro
            _sprite.color = def.color;
        }

        // Dano de contato com intervalo, e o "pisca branco" ao levar golpe.
        private void Update()
        {
            if (Def == null) return;
            _attackCd -= Time.deltaTime;
            _flash -= Time.deltaTime;
            _sprite.color = _flash > 0f ? Color.white : Def.color;
            float reach = Def.radius + _heroRadius;
            if (_attackCd <= 0f && Vector2.Distance(_rb.position, _hero.position) <= reach + 0.05f)
            {
                _attackCd = Def.attackCooldown;
                _heroHealth.TakeDamage(Def.contactDamage);
            }
        }

        // Anda até encostar no herói.
        private void FixedUpdate()
        {
            if (Def == null) return;
            Vector2 d = (Vector2)_hero.position - _rb.position;
            _rb.linearVelocity = d.magnitude > Def.radius + _heroRadius ? d.normalized * Def.speed : Vector2.zero;
        }
    }
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Em 2022 LTS, troque por `rb.velocity`.

Prefab `Prefabs/Enemy`: camada `Enemy`, **Sprite Renderer** (*Circle*, escala 1), **Rigidbody2D** (*Dynamic*, Gravity Scale 0, *Freeze Rotation Z*), **Circle Collider 2D** (raio 0,5), **Health** (Hurt Invuln **0**: inimigos não ficam invulneráveis) e **Enemy** (arraste o Sprite Renderer).

### 4.3 `Room`

```csharp
// Assets/_Project/Scripts/Gameplay/Room.cs
// POR QUE: cada sala tranca, solta ondas e abre quando a última morre (§5).
// ESTRATÉGIA: a sala só sabe o próprio retângulo, as ondas e as portas; quem
// manda começar e recomeçar é o StageManager. Ela avisa por evento quando é vencida.
using System;
using System.Collections.Generic;
using Gatilho.Config;
using UnityEngine;

namespace Gatilho.Gameplay
{
    public class Room : MonoBehaviour
    {
        [Serializable] public class SpawnGroup { public EnemyDef enemy; public int count = 1; }
        [Serializable] public class Wave { public List<SpawnGroup> groups = new List<SpawnGroup>(); }

        [SerializeField] private Vector2 _size = new Vector2(28f, 15f);  // interior da sala, em unidades
        [SerializeField] private List<Wave> _waves = new List<Wave>();
        [SerializeField] private GameObject _exitDoor;   // tranca a saída até a sala ser vencida
        [SerializeField] private GameObject _entryDoor;  // opcional: tranca a volta para a sala anterior
        [SerializeField] private Enemy _enemyPrefab;

        public Rect Bounds => new Rect((Vector2)transform.position - _size * 0.5f, _size);
        public bool Cleared { get; private set; }
        public event Action<Room> RoomCleared;

        private readonly List<Enemy> _alive = new List<Enemy>();
        private Health _hero;
        private float _heroRadius;
        private int _wave;

        // Começa (ou recomeça) a sala: portas fechadas e primeira onda.
        public void Begin(Health hero, float heroRadius)
        {
            _hero = hero;
            _heroRadius = heroRadius;
            _wave = 0;
            Cleared = false;
            if (_exitDoor) _exitDoor.SetActive(true);
            if (_entryDoor) _entryDoor.SetActive(true);
            Spawn();
        }

        // Some com os inimigos vivos (o herói morreu).
        public void Clear()
        {
            foreach (Enemy e in _alive) if (e) Destroy(e.gameObject);
            _alive.Clear();
        }

        // Cria a onda atual na metade direita da sala, longe da entrada.
        private void Spawn()
        {
            Rect b = Bounds;
            foreach (SpawnGroup g in _waves[_wave].groups)
            {
                for (int i = 0; i < g.count; i++)
                {
                    var pos = new Vector2(
                        UnityEngine.Random.Range(b.xMin + b.width * 0.55f, b.xMax - g.enemy.radius),
                        UnityEngine.Random.Range(b.yMin + g.enemy.radius, b.yMax - g.enemy.radius));
                    Enemy e = Instantiate(_enemyPrefab, pos, Quaternion.identity, transform);
                    e.Init(g.enemy, _hero, _heroRadius);
                    e.Health.Died += OnEnemyDied;
                    _alive.Add(e);
                }
            }
        }

        // Onda vazia → próxima onda; sem ondas → sala vencida, porta aberta.
        private void OnEnemyDied(Health h)
        {
            _alive.Remove(h.GetComponent<Enemy>());
            if (_alive.Count > 0) return;
            _wave++;
            if (_wave < _waves.Count)
            {
                Spawn();
                return;
            }
            Cleared = true;
            if (_exitDoor) _exitDoor.SetActive(false);
            RoomCleared?.Invoke(this);
        }

        // Desenha o retângulo da sala na Scene View (só no Editor).
        private void OnDrawGizmos()
        {
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireCube(transform.position, _size);
        }
    }
}
```

> `UnityEngine.Random` vem escrito por extenso porque `using System;` também traz um `System.Random`.

### 4.4 `StageManager`

```csharp
// Assets/_Project/Scripts/Gameplay/StageManager.cs
// POR QUE: alguém precisa saber em que sala o herói está, trocar de sala,
// recomeçar ao morrer (§6, proposta) e declarar a vitória.
// ESTRATÉGIA: mesma lógica de Game.updateProgress da versão web: com a sala
// vencida, a câmera solta até a próxima; o herói entra nela quando passa
// inteiro da borda (margem de 2 raios).
using System;
using System.Collections.Generic;
using Gatilho.Config;
using UnityEngine;

namespace Gatilho.Gameplay
{
    public class StageManager : MonoBehaviour
    {
        [SerializeField] private List<Room> _rooms = new List<Room>(); // da esquerda para a direita
        [SerializeField] private Health _heroHealth;
        [SerializeField] private HeroMotor _heroMotor;
        [SerializeField] private HeroCombat _heroCombat;
        [SerializeField] private CameraFollow _camera;
        [SerializeField] private GameConfig _config;

        public int RoomIndex { get; private set; }
        public bool Victory { get; private set; }
        public event Action VictoryReached;

        private Room Current => _rooms[RoomIndex];
        private Room Next => RoomIndex + 1 < _rooms.Count ? _rooms[RoomIndex + 1] : null;

        // Liga os eventos e começa a primeira sala.
        private void Start()
        {
            _heroHealth.Died += _ => RestartRoom();
            foreach (Room r in _rooms) r.RoomCleared += OnRoomCleared;
            Current.Begin(_heroHealth, _config.heroRadius);
            _camera.Bounds = Current.Bounds;
        }

        // Entrar na próxima sala quando o herói passa inteiro da porta.
        private void Update()
        {
            if (Victory || !Current.Cleared || Next == null) return;
            if (_heroMotor.transform.position.x > Next.Bounds.xMin + _config.heroRadius * 2f)
            {
                RoomIndex++;
                Current.Begin(_heroHealth, _config.heroRadius);
                _camera.Bounds = Current.Bounds;
            }
        }

        // Sala vencida: a câmera alcança a próxima; se era a última, vitória.
        private void OnRoomCleared(Room room)
        {
            if (room != Current) return;
            if (Next == null)
            {
                Victory = true;
                Time.timeScale = 0f; // congela o jogo atrás da mensagem de vitória
                VictoryReached?.Invoke();
                return;
            }
            Rect a = Current.Bounds, b = Next.Bounds;
            _camera.Bounds = Rect.MinMaxRect(Mathf.Min(a.xMin, b.xMin), Mathf.Min(a.yMin, b.yMin), Mathf.Max(a.xMax, b.xMax), Mathf.Max(a.yMax, b.yMax));
        }

        // Morreu: a sala atual recomeça; as anteriores continuam vencidas.
        private void RestartRoom()
        {
            Current.Clear();
            Rect b = Current.Bounds;
            _heroMotor.Teleport(new Vector2(b.xMin + 2f, b.center.y));
            _heroHealth.ResetFull();
            _heroCombat.Cooldowns.Clear();
            Current.Begin(_heroHealth, _config.heroRadius);
        }
    }
}
```

### 4.5 Montar a fase

1. Crie 4 GameObjects `Room1`..`Room4`, com o componente **Room**, lado a lado em `y = 0`. Larguras (campo **Size**) e posições x do centro, em unidades: 28,1 (x = 14,05), 31,25 (x = 43,73), 31,25 (x = 74,98), 34,4 (x = 107,8); altura 15 em todas.
2. **Paredes:** em volta de cada sala, Box Colliders 2D na camada `Wall`. A parede da direita de cada sala (menos a última) tem um vão de 3,75 unidades no meio; um GameObject `ExitDoor` com Box Collider 2D e Sprite vermelho fecha o vão: arraste-o para **Exit Door**. Opcional: um `EntryDoor` no vão da esquerda das salas 2–4.
3. **Ondas** (§5, placeholder): Room1 = [3 Grunt]; Room2 = [4 Grunt], [5 Grunt]; Room3 = [3 Grunt + 1 Brute], [2 Brute]; Room4 = [1 Boss].
4. Arraste o prefab `Enemy` para **Enemy Prefab** em cada sala.
5. Posicione o `Hero` perto da borda esquerda da Room1.
6. GameObject `Stage` com **StageManager**: as 4 salas em ordem, o `Health`, `HeroMotor` e `HeroCombat` do herói, a `Main Camera` (CameraFollow) e o `GameConfig`.

### ✅ Checkpoint da Fase 4
- Ao dar Play, 3 capangas aparecem na Room1 e vêm até o herói; encostar tira vida.
- A porta vermelha some quando a última onda morre; a câmera libera a próxima sala; entrar nela chama a primeira onda.
- R2 + botão acerta o inimigo mais alinhado com a mira.
- Morrer recomeça a sala atual com vida cheia e sem recargas.
- Vencer o chefe da Room4 congela o jogo (`Victory = true`).

#### Problemas comuns
- **Os inimigos empurram o herói ou o herói não leva dano:** confira a matriz de colisão da Fase 0 (`Hero × Enemy` desmarcado) e se o prefab `Enemy` está na camada `Enemy`.
- **Ao trocar de cena por código no futuro, o jogo continua congelado:** a vitória põe `Time.timeScale = 0`; volte para `1` antes de carregar outra cena.

Próxima fase: **HUD** — vida, a barra cruzada e a mensagem de vitória.

---

# Parte 16 — Implementação Unity: Fase 5 (HUD)

## Fase 5 — HUD

> Objetivo desta fase: a mesma HUD da web (§8) em uGUI: vida, os dois losangos de especiais com recarga, o losango do gatilho segurado aceso e os rótulos do dispositivo ativo.

### 5.1 Vida

```csharp
// Assets/_Project/Scripts/UI/HealthBar.cs
// POR QUE: mostrar a vida do herói (§8).
// ESTRATÉGIA: uma Image com Image Type "Filled" (horizontal); fillAmount vai de 0 a 1.
// Só atualiza quando a vida muda (evento Changed), não a cada quadro.
using Gatilho.Gameplay;
using UnityEngine;
using UnityEngine.UI;

namespace Gatilho.UI
{
    public class HealthBar : MonoBehaviour
    {
        [SerializeField] private Health _health;
        [SerializeField] private Image _fill;

        private void OnEnable() => _health.Changed += Refresh;
        private void OnDisable() => _health.Changed -= Refresh;

        // Start roda depois de todos os Awake: a vida do herói já está preenchida.
        private void Start() => Refresh();

        private void Refresh() => _fill.fillAmount = (float)_health.Current / _health.Max;
    }
}
```

### 5.2 Slots e barra cruzada

```csharp
// Assets/_Project/Scripts/UI/SlotView.cs
// POR QUE: um slot da barra cruzada: botão, nome do especial e a recarga.
// ESTRATÉGIA: a recarga é uma Image escura com Image Type "Filled" / "Radial 360";
// fillAmount = fração da recarga que falta.
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Gatilho.UI
{
    public class SlotView : MonoBehaviour
    {
        [SerializeField] private Image _background;
        [SerializeField] private Image _cooldown;
        [SerializeField] private TMP_Text _glyph;
        [SerializeField] private TMP_Text _name;

        // Atualiza tudo do slot de uma vez.
        public void Show(string glyph, string specialName, float cooldownFraction, bool active, Color activeColor)
        {
            _glyph.text = glyph;
            _name.text = specialName;
            _name.enabled = active; // o nome só aparece com o gatilho segurado
            _cooldown.fillAmount = cooldownFraction;
            _background.color = active ? activeColor : new Color(0.2f, 0.2f, 0.2f);
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/UI/CrossHotbar.cs
// POR QUE: o jogador precisa ver, antes de apertar, o que cada botão faz com o gatilho segurado (§8).
// ESTRATÉGIA: dois grupos de 4 SlotViews montados em losango no Canvas (X embaixo,
// △ em cima, □ à esquerda, ○ à direita). O grupo do gatilho segurado cresce;
// os rótulos mudam com o dispositivo ativo do GameInput.
using Gatilho.Config;
using Gatilho.Controls;
using Gatilho.Core;
using Gatilho.Gameplay;
using TMPro;
using UnityEngine;

namespace Gatilho.UI
{
    public class CrossHotbar : MonoBehaviour
    {
        [SerializeField] private GameInput _input;
        [SerializeField] private HeroCombat _combat;
        [SerializeField] private RectTransform _areaGroup;
        [SerializeField] private RectTransform _singleGroup;
        [SerializeField] private SlotView[] _areaSlots = new SlotView[4];   // ordem: X, △, □, ○
        [SerializeField] private SlotView[] _singleSlots = new SlotView[4];
        [SerializeField] private TMP_Text _areaLabel;
        [SerializeField] private TMP_Text _singleLabel;

        private static readonly string[] PadGlyphs = { "X", "△", "□", "○" };
        private static readonly string[] KeyGlyphs = { "1", "2", "3", "4" };
        private static readonly Color AreaColor = new Color(0.75f, 0.21f, 0.05f);
        private static readonly Color SingleColor = new Color(0.98f, 0.66f, 0.15f);

        // Redesenha a barra a cada quadro (8 slots: barato).
        private void Update()
        {
            bool pad = _input.ActiveDevice == GameInput.Device.Gamepad;
            _areaLabel.text = pad ? "R1 · Área" : "Mouse Dir. · Área";
            _singleLabel.text = pad ? "R2 · Individual" : "Mouse Esq. · Individual";
            DrawGroup(SpecialSet.Area, _areaGroup, _areaSlots, pad, AreaColor);
            DrawGroup(SpecialSet.Single, _singleGroup, _singleSlots, pad, SingleColor);
        }

        // Um losango: escala do grupo e os 4 slots.
        private void DrawGroup(SpecialSet set, RectTransform group, SlotView[] slots, bool pad, Color color)
        {
            bool active = _input.Modifier == set;
            group.localScale = Vector3.one * (active ? 1.25f : 1f);
            for (int i = 0; i < 4; i++)
            {
                SpecialDef def = _combat.GetSpecial(set, i);
                float fraction = def.cooldown > 0f ? _combat.Cooldowns.Remaining(def.Id) / def.cooldown : 0f;
                slots[i].Show((pad ? PadGlyphs : KeyGlyphs)[i], def.displayName, fraction, active, color);
            }
        }
    }
}
```

```csharp
// Assets/_Project/Scripts/UI/VictoryBanner.cs
// POR QUE: avisar que a fase acabou (§6).
// ESTRATÉGIA: um painel desligado que o evento VictoryReached liga.
using Gatilho.Gameplay;
using UnityEngine;

namespace Gatilho.UI
{
    public class VictoryBanner : MonoBehaviour
    {
        [SerializeField] private StageManager _stage;
        [SerializeField] private GameObject _panel; // "Fase concluída!"

        private void Awake() => _panel.SetActive(false);
        private void OnEnable() => _stage.VictoryReached += Show;
        private void OnDisable() => _stage.VictoryReached -= Show;

        private void Show() => _panel.SetActive(true);
    }
}
```

### 5.3 Montar o Canvas

1. **GameObject → UI → Canvas** (Render Mode *Screen Space – Overlay*, Canvas Scaler *Scale With Screen Size*, 960 × 540). Aceite importar o **TMP Essentials** quando pedir.
2. **Vida:** no canto superior esquerdo, uma Image de fundo preta e, dentro, uma Image verde com *Image Type: Filled*, *Fill Method: Horizontal*. Adicione **HealthBar** com o `Health` do herói.
3. **Slot:** um prefab com uma Image de fundo circular, uma Image filha preta semitransparente (*Filled*, *Radial 360*, *Fill Origin: Top*, *Clockwise*) para a recarga, um TMP para o botão e um TMP abaixo para o nome. Adicione **SlotView** ligando os quatro.
4. **Grupos:** dois RectTransforms na parte de baixo (x = −150 e +150 a partir do centro), cada um com 4 slots em losango (X em (0, −34), △ em (0, 34), □ em (−34, 0), ○ em (34, 0)) e um TMP de rótulo em cima.
5. GameObject **CrossHotbar** ligando `GameInput`, `HeroCombat`, os grupos, os 8 slots na ordem X, △, □, ○ e os dois rótulos.
6. **Vitória:** um painel "Fase concluída!" (filho de um GameObject sempre ligado) e um **VictoryBanner** nesse GameObject, com o `StageManager` e o painel.

### ✅ Checkpoint da Fase 5
- A barra de vida cai ao levar dano e volta cheia ao recomeçar a sala.
- Segurar R1 (ou o botão direito do mouse) aumenta o losango da esquerda e mostra os nomes; R2 (ou o esquerdo) faz o mesmo no da direita.
- Depois de um especial, o slot escurece e clareia no sentido horário.
- Mexer o mouse troca os rótulos para 1–4 e "Mouse Dir./Esq."; apertar o controle troca para X/△/□/○ e R1/R2.
- Vencer o chefe mostra "Fase concluída!".

#### Problemas comuns
- **△, □ e ○ aparecem como quadradinhos vazios:** a fonte padrão do TextMeshPro (LiberationSans SDF) não tem esses símbolos. Crie um *Font Asset* de uma fonte que os tenha (**Window → TextMeshPro → Font Asset Creator**, incluindo os caracteres `△□○`) ou troque os rótulos por sprites de botão.

Próxima fase: **Build WebGL e Próximos Passos**.

---

# Parte 17 — Implementação Unity: Fase 6 (Build WebGL e Próximos Passos)

## Fase 6 — Build WebGL e Próximos Passos

> Objetivo desta fase: o porte rodando no navegador, com controle, como a versão web.

### 6.1 Build

1. **File → Build Profiles** → **Web** → **Switch Platform**. Adicione a cena `Stage1` em **Scene List**.
2. **Player Settings → Publishing Settings**: *Compression Format* **Gzip** e **Decompression Fallback** ligado (hospedagens como GitHub Pages e itch.io não mandam os cabeçalhos de compressão da Unity).
3. **Build** numa pasta `Build/Web` e teste com **Build And Run** (a Unity abre um servidor local; abrir o `index.html` direto do disco não funciona).

### 6.2 Controle e mouse no navegador

- O Input System lê controles no WebGL pela Gamepad API do navegador: valem as mesmas regras da versão web (apertar um botão do controle com a página em foco para ele aparecer; HTTPS ou `localhost`).
- O botão direito do mouse é gatilho: se o menu do navegador aparecer sobre o jogo, acrescente `oncontextmenu="event.preventDefault()"` no `<canvas>` do `index.html` gerado (ou num WebGL Template próprio, para não perder a mudança no próximo build).

### 6.3 Próximos passos

Os mesmos da versão web (Parte 9, §6.4), mais:

- Sprites de botão por plataforma (PlayStation/Xbox) no lugar dos rótulos de texto.
- Builds nativos (Windows/Steam, console) se a decisão de plataforma do §1 mudar.

### ✅ Checkpoint da Fase 6
- O build Web abre no navegador, o controle é reconhecido depois de apertar um botão e a fase vai do começo ao chefe.
- R1/R2 + botões de face e mouse + 1–4 funcionam como no Editor; o botão direito do mouse não abre menu.

#### Problemas comuns
- **O controle funciona no Editor mas não no navegador:** o navegador não entregou o controle como "standard" e o Input System o vê como `Joystick`, não `Gamepad`, então as ligações `<Gamepad>/...` não pegam. Teste no Chrome por USB; se persistir, registre o modelo (tela de remapeamento está **Em aberto**).
- **Tela preta com erro de "Content-Encoding":** a hospedagem não manda o cabeçalho de gzip. Ligue **Decompression Fallback** (6.1) e faça o build de novo.
