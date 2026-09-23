# GDD — DiceAndBlood

> Documento vivo. Rascunho inicial — a refinar conforme prototipagem. Vários pontos centrais da mecânica de combate ainda estão em discussão com o time (ver marcações **Em aberto**) — os valores usados no Guia de Implementação Unity (Parte 2) são placeholders de MVP, não decisões fechadas.

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-2--implementação-unity-fase-0-setup-do-projeto)
3. [Parte 3 — Implementação Unity: Fase 1 (Tabuleiro 8x8)](#parte-3--implementação-unity-fase-1-tabuleiro-8x8)
4. [Parte 4 — Implementação Unity: Fase 2 (Unidades e Turnos)](#parte-4--implementação-unity-fase-2-unidades-e-turnos)
5. [Parte 5 — Implementação Unity: Fase 3 (Movimento por Dado)](#parte-5--implementação-unity-fase-3-movimento-por-dado)
6. [Parte 6 — Implementação Unity: Fase 4 (Combate e Parry)](#parte-6--implementação-unity-fase-4-combate-e-parry)
7. [Parte 7 — Implementação Unity: Fase 5 (Monstros e IA)](#parte-7--implementação-unity-fase-5-monstros-e-ia)
8. [Parte 8 — Implementação Unity: Fase 6 (HUD e Input Touch)](#parte-8--implementação-unity-fase-6-hud-e-input-touch)
9. [Parte 9 — Implementação Unity: Fase 7 (Firebase Leaderboard)](#parte-9--implementação-unity-fase-7-firebase-leaderboard)
10. [Parte 10 — Implementação Unity: Fase 8 (Build e Próximos Passos)](#parte-10--implementação-unity-fase-8-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Gênero:** RPG tático, com estrutura de progressão roguelike.
- **Dimensão:** 2D, pixel art estilo 8-bit/16-bit.
- **Plataforma-alvo:** **Definido** — Mobile (Android/iOS).
- **Câmera/perspectiva:** Topdown, tabuleiro de batalha em grid 8x8 visto de cima.
- **Pilar de design:** **Em aberto** — em discussão com o time. Candidato descartado por ora: "dados maiores dão poder, mas roubam controle" (ecoava demais o pilar da franquia Rally). Precisa de uma frase própria que capture a sensação central pretendida (tensão de mesa de RPG? sorte crua? controle tático apesar do dado? etc.).
- **Fantasia central:** **Em aberto** — depende do pilar acima.

## 2. Mecânica Principal

### 2.1 Tabuleiro
- **Definido:** grid de batalha 8x8, visto de cima (topdown), uma unidade por casa.

### 2.2 Movimento — baseado em dado
- **Definido:** o alcance de movimento de uma unidade no turno é determinado rolando um dado (não é um número fixo de casas).
- **Em aberto:** qual dado cada unidade rola (fixo pra todas? varia por classe/velocidade? evolui com nível?). Placeholder de MVP: todas as unidades rolam **1d6** de alcance de movimento (ver Parte 5).

### 2.3 Ataque e habilidades — roll-under
- **Definido:** ações ofensivas são resolvidas por **roll-under**: rola-se um dado e a ação é bem-sucedida se o resultado for **igual ou menor** que um valor-alvo do personagem (em vez do d20-contra-Defesa do D&D clássico).
- **Em aberto:**
  - Qual dado (d6 a d20) cada habilidade usa — ideia original é que o tamanho do dado varie conforme o risco/poder da ação, mas isso não está fechado nem foi validado.
  - Se a **margem** do sucesso importa (ex.: quanto mais baixo que o alvo, mais dano) ou se é binário (acertou/não acertou, dano fixo por arma/habilidade).
  - Nomes e faixa de valores dos atributos usados como alvo (ex.: um atributo tipo "Ataque").
  - Placeholder de MVP (ver Parte 6): ataque básico rola **1d20** contra `Ataque do atacante − Defesa efetiva do alvo`; dano é um valor fixo por golpe.

### 2.4 Parry
- **Definido:** parry é uma **ação ativa no turno** — o jogador escolhe usá-la no lugar de mover ou atacar, e ela concede um bônus de defesa até o começo do próximo turno da unidade.
- **Em aberto:** valor exato do bônus, se tem custo/recurso associado (ex.: usos limitados por combate), e se afeta só o próximo ataque recebido ou todos até o fim do turno seguinte.

## 3. Regras e Sistemas

- **Definido:** estrutura de progressão é **roguelike** — runs curtas, permadeath, geração procedural de tabuleiros e monstros entre runs, com desbloqueios (personagens/habilidades/dados) entre runs.
- **Em aberto:**
  - Geração procedural (algoritmo, variedade de biomas) — não existe no MVP, que usa 1 tabuleiro fixo (ver Parte 8).
  - O que exatamente é perdido num permadeath (a unidade só, ou a run inteira) — MVP tem 1 herói só, então a distinção ainda não se aplica; volta a importar quando houver grupo.
  - Meta-progressão entre runs: o que desbloqueia e como.
  - Ordem de turno/iniciativa: se é por dado (ex.: d20 de iniciativa por unidade) ou fixa. Placeholder de MVP: ordem fixa — todas as unidades do jogador agem, depois todas as inimigas (ver Parte 4).
  - Condição de vitória em combate além de "eliminar todos os inimigos do tabuleiro" (ex.: extração, objetivo por sala) — não definido.
  - Crítico/fumble (equivalente a natural 20 / natural 1) — não definido se existe.
  - Terrenos/obstáculos especiais no tabuleiro além de "bloqueia passagem".

## 4. Estilo Visual

- **Definido:** pixel art, estética 8-bit/16-bit.
- **Em aberto:** paleta, referências visuais diretas, tema/ambientação da primeira run.

## 5. HUD / UI

- **Definido:** interface pensada para toque (mobile) — seleção de unidade e de casa/alvo por tap, sem depender de mouse/hover.
- **Definido:** precisa existir feedback visual da rolagem de dado (o jogador tem que ver o dado sendo "rolado" e o resultado, não só o efeito final) e destaque das casas alcançáveis / alvos válidos.
- **Em aberto:** forma exata do feedback de rolagem (animação de dado 3D-like em pixel art? número grande na tela? efeito sonoro só?).

## 6. Áudio

- **Em aberto** — nada definido ainda.

## 7. Backend / Serviços

- **Definido:** leaderboard/ranking de runs via **Firebase** (Firestore + autenticação anônima), seguindo o mesmo padrão de dados já usado na franquia Rally (`/leaderboards/{jogo}/...`).
- **Definido:** sem multiplayer no MVP.
- **Em aberto:** qual é exatamente a métrica de "score" de uma run (andar alcançado? inimigos derrotados? tempo de sobrevivência? combinação?) — a estrutura de dados proposta na Parte 9 usa um campo `score` genérico até isso ser decidido.

## 8. Escopo do MVP

**Definido — mínimo enxuto, só para provar o loop central (movimento por dado + combate roll-under + parry):**
- 1 herói jogável.
- 2 a 3 tipos de monstro.
- 1 tabuleiro/bioma (fixo, não gerado proceduralmente).
- Leaderboard de runs no Firebase.

**Em aberto / pós-MVP:**
- Geração procedural de tabuleiros e monstros.
- Grupo de heróis (mais de 1 personagem jogável por run).
- Meta-progressão entre runs.
- Variação de dado por habilidade/risco, crítico/fumble, dano por margem.
- Multiplayer.

## 9. Riscos / Em aberto

Lista consolidada de tudo que ainda não foi decidido, para revisão rápida com o time:

1. Pilar de design / fantasia central (§1).
2. Mapeamento de dado por ação (qual dado, se varia por risco/poder) (§2.3).
3. Se a margem do roll-under afeta o resultado (dano/efeito) (§2.3).
4. Nomes e faixa de valores dos atributos dos personagens (§2.3).
5. Valor exato e custo do bônus de parry (§2.4).
6. Algoritmo/critérios de geração procedural de tabuleiros e monstros (§3).
7. Regras de permadeath com grupo (§3).
8. Ordem de turno/iniciativa (§3).
9. Condições de vitória além de eliminar todos os inimigos (§3).
10. Existência de crítico/fumble (§3).
11. Terrenos especiais além de bloqueio de passagem (§3).
12. Referências visuais/paleta (§4).
13. Forma do feedback visual de rolagem de dado (§5).
14. Direção de áudio (§6).
15. Métrica exata de "score" de uma run para o leaderboard (§7).

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*

---

# Parte 2 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: projeto Unity criado, configurado para mobile (2D), com a estrutura de pastas e pacotes necessários para as fases seguintes.

### 0.1 Criar o projeto

1. No Unity Hub, crie um projeto novo com o template **2D (URP)** — URP ajuda no desempenho em mobile comparado ao pipeline built-in.
2. Em **File > Build Settings**, troque a plataforma para **Android** ou **iOS** (o que for testar primeiro) e clique em **Switch Platform**.
3. Em **Edit > Project Settings > Player**, defina orientação de tela (retrato ou paisagem — **Em aberto**, decidir antes desta etapa em produção real; para o MVP, escolha retrato, mais comum em RPGs táticos mobile).

### 0.2 Estrutura de pastas

Crie em `Assets/_Project/`:
```
Assets/_Project/
  Scripts/
    Core/
    Board/
    Units/
    Turns/
    Combat/
    AI/
    UI/
    Firebase/
  Sprites/
  Prefabs/
  Scenes/
  Tilemaps/
```

### 0.3 Pacotes (Package Manager)

Instale:
- **2D Tilemap Editor** — para montar o tabuleiro 8x8.
- **2D Pixel Perfect** — para manter a nitidez do pixel art em diferentes resoluções de tela mobile.
- **TextMeshPro** (importe os TMP Essentials quando solicitado) — textos de UI (vida, atributos, resultado de dado).
- Input via toque: `Input.GetMouseButtonDown`/`Input.mousePosition` já funcionam com toque único em builds mobile sem pacote adicional — não é necessário o pacote **Input System** para o MVP (ver Fase 6). Se o jogo evoluir para multitoque/gestos, reavaliar.
- Firebase (Firestore + Auth) só é necessário a partir da Fase 7 — não instale ainda para não carregar o projeto sem necessidade nas fases anteriores.

### 0.4 Câmera

1. Configure a `Main Camera` como **Orthographic**, olhando de cima para o plano XY do tabuleiro (mesma convenção topdown 2D usada no resto do estúdio).
2. Ajuste o `Orthographic Size` para enquadrar o grid 8x8 inteiro mais a UI ao redor — valor exato depende do tamanho de tile escolhido na Fase 1.

> Nota: este jogo é **tático por turnos em grid**, não usa física de movimento em tempo real — não é necessário `Rigidbody2D` nas unidades. Movimento é feito por interpolação de posição (ver Fase 3), não por forças físicas.

### ✅ Checkpoint da Fase 0
- Projeto abre no Unity, plataforma de build está em Android ou iOS.
- Estrutura de pastas criada em `Assets/_Project/`.
- Pacotes 2D Tilemap Editor, 2D Pixel Perfect e TextMeshPro instalados.
- Câmera configurada como Orthographic, topdown.

Próxima fase: **Fase 1 (Tabuleiro 8x8)** — cria o grid de batalha e o script que mapeia coordenadas de tabuleiro para posições no mundo.

---

# Parte 3 — Implementação Unity: Fase 1 (Tabuleiro 8x8)

## Fase 1 — Tabuleiro 8x8

> Objetivo desta fase: um tabuleiro 8x8 visível em cena, com um script central (`GridManager`) que sabe quais casas existem, quais estão ocupadas/bloqueadas, e converte entre coordenadas de grid e posições no mundo.

### 1.1 Cena e Tilemap

1. Crie uma nova cena `Assets/_Project/Scenes/Battle.unity`.
2. Adicione um `Grid` (GameObject > 2D Object > Tilemap > Rectangular) com uma `Tilemap` filha chamada `Ground` para o chão do tabuleiro.
3. Pinte manualmente 8x8 tiles de chão (para o MVP, o tabuleiro é fixo — geração procedural fica para pós-MVP, ver Parte 1 §3).
4. Opcional: adicione uma segunda `Tilemap` chamada `Obstacles` para tiles que bloqueiam passagem.

### 1.2 Script: `GridManager.cs`

Crie em `Assets/_Project/Scripts/Board/GridManager.cs`:

```csharp
using System.Collections.Generic;
using UnityEngine;

public class GridManager : MonoBehaviour
{
    public static GridManager Instance { get; private set; }

    [SerializeField] private int width = 8;
    [SerializeField] private int height = 8;
    [SerializeField] private float tileSize = 1f;
    [SerializeField] private Vector3 origin = Vector3.zero;

    private readonly Dictionary<Vector2Int, Unit> _occupants = new();
    private readonly HashSet<Vector2Int> _obstacles = new();

    public int Width => width;
    public int Height => height;

    private void Awake()
    {
        Instance = this;
    }

    public bool InBounds(Vector2Int cell) =>
        cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height;

    public bool IsBlocked(Vector2Int cell) =>
        _obstacles.Contains(cell) || _occupants.ContainsKey(cell);

    public void SetObstacle(Vector2Int cell, bool blocked)
    {
        if (blocked) _obstacles.Add(cell);
        else _obstacles.Remove(cell);
    }

    public void PlaceUnit(Unit unit, Vector2Int cell)
    {
        _occupants[cell] = unit;
        unit.Cell = cell;
        unit.transform.position = CellToWorld(cell);
    }

    public void MoveUnit(Unit unit, Vector2Int newCell)
    {
        _occupants.Remove(unit.Cell);
        _occupants[newCell] = unit;
        unit.Cell = newCell;
    }

    public Unit GetUnitAt(Vector2Int cell) =>
        _occupants.TryGetValue(cell, out var unit) ? unit : null;

    public Vector3 CellToWorld(Vector2Int cell) =>
        origin + new Vector3(cell.x * tileSize, cell.y * tileSize, 0f);

    public Vector2Int WorldToCell(Vector3 world)
    {
        Vector3 local = world - origin;
        return new Vector2Int(
            Mathf.RoundToInt(local.x / tileSize),
            Mathf.RoundToInt(local.y / tileSize));
    }
}
```

### 1.3 Configurar no Inspector

1. Crie um GameObject vazio `GridManager` na cena `Battle` e arraste o script.
2. Ajuste `width`/`height` para 8/8, `tileSize` igual ao tamanho de célula usado na Tilemap, e `origin` para a posição do canto (0,0) do tabuleiro no mundo.

### ✅ Checkpoint da Fase 1
- Tabuleiro 8x8 visível na cena `Battle`.
- `GridManager.Instance.CellToWorld(new Vector2Int(0,0))` retorna a posição correta do canto do tabuleiro (testável via um script temporário ou breakpoint).
- `InBounds`/`IsBlocked` respondem corretamente para células dentro e fora do grid.

#### Problemas comuns
- **Unidades aparecem deslocadas do tile:** confira se `tileSize` do `GridManager` bate exatamente com o `Cell Size` do componente `Grid` da Tilemap.

Próxima fase: **Fase 2 (Unidades e Turnos)** — define o modelo de dados das unidades e a ordem de turnos.

---

# Parte 4 — Implementação Unity: Fase 2 (Unidades e Turnos)

## Fase 2 — Unidades e Turnos

> Objetivo desta fase: unidades (heróis e monstros) existem como componentes com atributos, e um `TurnManager` alterna turnos entre elas.

### 2.1 Script: `Unit.cs`

Crie em `Assets/_Project/Scripts/Units/Unit.cs`:

```csharp
using UnityEngine;

public enum UnitFaction { Player, Enemy }

public class Unit : MonoBehaviour
{
    public string UnitName;
    public UnitFaction Faction;
    public Vector2Int Cell;

    [Header("Atributos (placeholder de MVP — ver Parte 1 §2/§9, Em aberto)")]
    public int Vida = 10;
    public int Ataque = 12;   // valor-alvo para o roll-under de ataque
    public int Defesa = 2;    // reduz o valor-alvo do atacante enquanto Parry ativo

    private int _parryBonus;

    public bool IsAlive => Vida > 0;
    public int DefesaEfetiva => Defesa + _parryBonus;

    public void ApplyParry(int bonus) => _parryBonus = bonus;
    public void ClearParry() => _parryBonus = 0;

    public void TakeDamage(int amount) => Vida = Mathf.Max(0, Vida - amount);
}
```

### 2.2 Script: `TurnManager.cs`

> **Em aberto:** a ordem de turno "correta" (iniciativa por dado vs. fixa) não está decidida — ver Parte 1 §3. Este script implementa o placeholder de MVP: todas as unidades do jogador agem, depois todas as inimigas, em loop.

Crie em `Assets/_Project/Scripts/Turns/TurnManager.cs`:

```csharp
using System.Collections.Generic;
using UnityEngine;

public class TurnManager : MonoBehaviour
{
    public static TurnManager Instance { get; private set; }

    [SerializeField] private List<Unit> playerUnits = new();
    [SerializeField] private List<Unit> enemyUnits = new();

    private int _turnIndex;
    private bool _isPlayerPhase = true;

    public Unit CurrentUnit { get; private set; }

    private void Awake() => Instance = this;
    private void Start() => StartPlayerPhase();

    private void StartPlayerPhase()
    {
        _isPlayerPhase = true;
        _turnIndex = 0;
        AdvanceToNextLivingUnit();
    }

    public void EndCurrentUnitTurn()
    {
        CurrentUnit?.ClearParry();
        _turnIndex++;
        AdvanceToNextLivingUnit();
    }

    private void AdvanceToNextLivingUnit()
    {
        var list = _isPlayerPhase ? playerUnits : enemyUnits;

        while (_turnIndex < list.Count && !list[_turnIndex].IsAlive)
            _turnIndex++;

        if (_turnIndex >= list.Count)
        {
            if (_isPlayerPhase)
            {
                _isPlayerPhase = false;
                _turnIndex = 0;
                AdvanceToNextLivingUnit();
            }
            else
            {
                StartPlayerPhase();
            }
            return;
        }

        CurrentUnit = list[_turnIndex];

        if (!_isPlayerPhase)
            EnemyAI.TakeTurn(CurrentUnit, this); // implementado na Fase 5
    }
}
```

### 2.3 Configurar no Inspector

1. Crie um prefab simples de unidade (`SpriteRenderer` + `Unit`) em `Assets/_Project/Prefabs/`.
2. Posicione 1 herói e 2-3 monstros na cena `Battle` (ver escopo do MVP, Parte 1 §8), cada um com o componente `Unit` configurado (`Faction`, atributos).
3. Crie um GameObject `TurnManager` e arraste as unidades para as listas `playerUnits`/`enemyUnits`.
4. Chame `GridManager.Instance.PlaceUnit(unit, cell)` para cada unidade ao iniciar a cena (pode ser feito num script de bootstrap simples da cena de batalha).

### ✅ Checkpoint da Fase 2
- Ao entrar em Play Mode, `TurnManager.Instance.CurrentUnit` começa apontando para a primeira unidade do jogador viva.
- Chamar `EndCurrentUnitTurn()` manualmente (via um botão de debug temporário) avança corretamente entre unidades do jogador, depois inimigas, depois volta ao jogador.

Próxima fase: **Fase 3 (Movimento por Dado)** — implementa a rolagem de dado que define o alcance de movimento e o deslocamento da unidade pelo tabuleiro.

---

# Parte 5 — Implementação Unity: Fase 3 (Movimento por Dado)

## Fase 3 — Movimento por Dado

> Objetivo desta fase: ao mover, a unidade rola um dado para descobrir seu alcance no turno, as casas alcançáveis dentro desse alcance ficam destacadas, e a unidade se desloca até a casa escolhida.

### 3.1 Script: `Dice.cs`

Crie em `Assets/_Project/Scripts/Core/Dice.cs`:

```csharp
using UnityEngine;

public static class Dice
{
    public static int Roll(int sides) => Random.Range(1, sides + 1);

    public static int RollSum(int count, int sides)
    {
        int total = 0;
        for (int i = 0; i < count; i++) total += Roll(sides);
        return total;
    }
}
```

### 3.2 Script: `MovementController.cs`

> **Em aberto:** o dado de movimento é fixo (`1d6`) para todas as unidades neste placeholder de MVP — variar por classe/velocidade é uma decisão pendente (Parte 1 §2.2).

Crie em `Assets/_Project/Scripts/Board/MovementController.cs`:

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class MovementController : MonoBehaviour
{
    [SerializeField] private int movementDieSides = 6; // placeholder — Em aberto (Parte 1 §2.2)
    [SerializeField] private float moveSpeed = 4f;

    public int RollMovementRange() => Dice.Roll(movementDieSides);

    public HashSet<Vector2Int> GetReachableCells(Vector2Int origin, int range)
    {
        var visited = new Dictionary<Vector2Int, int> { [origin] = 0 };
        var frontier = new Queue<Vector2Int>();
        frontier.Enqueue(origin);

        Vector2Int[] directions = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };

        while (frontier.Count > 0)
        {
            var current = frontier.Dequeue();
            int cost = visited[current];
            if (cost >= range) continue;

            foreach (var dir in directions)
            {
                var next = current + dir;
                if (!GridManager.Instance.InBounds(next)) continue;
                if (GridManager.Instance.IsBlocked(next)) continue;
                if (visited.ContainsKey(next)) continue;

                visited[next] = cost + 1;
                frontier.Enqueue(next);
            }
        }

        visited.Remove(origin);
        return new HashSet<Vector2Int>(visited.Keys);
    }

    public IEnumerator MoveUnitTo(Unit unit, Vector2Int destination)
    {
        Vector3 start = unit.transform.position;
        Vector3 end = GridManager.Instance.CellToWorld(destination);
        float duration = Vector3.Distance(start, end) / moveSpeed;
        float t = 0f;

        while (t < duration)
        {
            t += Time.deltaTime;
            unit.transform.position = Vector3.Lerp(start, end, duration > 0 ? t / duration : 1f);
            yield return null;
        }

        unit.transform.position = end;
        GridManager.Instance.MoveUnit(unit, destination);
    }
}
```

### 3.3 Destaque das casas alcançáveis

1. Crie um prefab simples `TileHighlight` (um `SpriteRenderer` semi-transparente do tamanho de 1 tile).
2. Ao ser a vez de uma unidade do jogador, chame `movement.RollMovementRange()`, depois `movement.GetReachableCells(unit.Cell, range)`, e instancie um `TileHighlight` em cada célula retornada (`GridManager.Instance.CellToWorld(cell)`).
3. Ao tocar numa casa destacada (ver Fase 6 para o input de toque), chame `StartCoroutine(movement.MoveUnitTo(unit, cellTocada))` e remova os destaques.

### ✅ Checkpoint da Fase 3
- Ao iniciar o turno de uma unidade do jogador, um número de dado é sorteado (1 a 6) e exatamente essa quantidade de "passos" de casas fica destacada ao redor da unidade, respeitando obstáculos.
- Tocar numa casa destacada move a unidade suavemente até lá e ela passa a ocupar a nova célula no `GridManager`.

#### Problemas comuns
- **Unidade "atravessa" obstáculos:** confira se `SetObstacle` foi chamado para as células corretas antes do flood fill — `GetReachableCells` só bloqueia o que está registrado em `_obstacles`/`_occupants`.

Próxima fase: **Fase 4 (Combate e Parry)** — implementa a resolução de ataque por roll-under e a ação de parry.

---

# Parte 6 — Implementação Unity: Fase 4 (Combate e Parry)

## Fase 4 — Combate e Parry

> Objetivo desta fase: uma unidade consegue atacar outra (resolução por roll-under contra Ataque/Defesa) e usar parry como ação alternativa no turno.

### 4.1 Script: `CombatSystem.cs`

> **Em aberto:** o dado de ataque é fixo (`1d20`) e o dano é um valor fixo neste placeholder — variar o dado por habilidade/risco e escalar dano pela margem do roll são decisões pendentes (Parte 1 §2.3).

Crie em `Assets/_Project/Scripts/Combat/CombatSystem.cs`:

```csharp
using UnityEngine;

public static class CombatSystem
{
    private const int AttackDieSides = 20; // placeholder — Em aberto (Parte 1 §2.3)
    private const int BaseDamage = 3;      // placeholder — Em aberto (Parte 1 §2.3)
    private const int DefaultParryBonus = 3; // placeholder — Em aberto (Parte 1 §2.4)

    public struct AttackResult
    {
        public bool Hit;
        public int Roll;
        public int Target;
        public int Damage;
    }

    public static AttackResult ResolveAttack(Unit attacker, Unit defender)
    {
        int target = Mathf.Max(1, attacker.Ataque - defender.DefesaEfetiva);
        int roll = Dice.Roll(AttackDieSides);
        bool hit = roll <= target;

        var result = new AttackResult { Roll = roll, Target = target, Hit = hit };

        if (hit)
        {
            result.Damage = BaseDamage;
            defender.TakeDamage(BaseDamage);
        }

        return result;
    }

    public static void ResolveParry(Unit unit, int bonus = DefaultParryBonus)
    {
        unit.ApplyParry(bonus);
    }
}
```

### 4.2 Fluxo de turno do jogador (ataque vs. parry vs. mover)

1. No início do turno de uma unidade do jogador, apresente 3 opções (ver UI na Fase 6): **Mover**, **Atacar**, **Parry**.
2. **Atacar:** ao tocar num inimigo adjacente/alcançável, chame `CombatSystem.ResolveAttack(unitAtual, inimigoAlvo)` e mostre o resultado (`Roll`, `Target`, `Hit`, `Damage`) na UI antes de encerrar o turno.
3. **Parry:** chame `CombatSystem.ResolveParry(unitAtual)` e encerre o turno — o bônus é limpo automaticamente no início do próximo turno da unidade (`Unit.ClearParry()`, já chamado por `TurnManager.EndCurrentUnitTurn()`).
4. Após qualquer ação, chame `TurnManager.Instance.EndCurrentUnitTurn()`.

### ✅ Checkpoint da Fase 4
- Atacar uma unidade com `Ataque` alto contra um alvo com `Defesa` baixa acerta na maioria das tentativas (estatisticamente, já que o alvo do roll-under fica alto); o inverso falha na maioria das vezes.
- Usar Parry antes de um ataque inimigo reduz visivelmente a chance de acerto do atacante (o `target` do `ResolveAttack` cai, porque `DefesaEfetiva` subiu).
- `Vida` da unidade atingida cai corretamente e `IsAlive` vira `false` ao chegar a 0.

Próxima fase: **Fase 5 (Monstros e IA)** — dá aos monstros um comportamento automático de movimento e ataque.

---

# Parte 7 — Implementação Unity: Fase 5 (Monstros e IA)

## Fase 5 — Monstros e IA

> Objetivo desta fase: no turno de uma unidade inimiga, ela decide sozinha se ataca (se estiver adjacente a um herói) ou se aproxima do herói vivo mais próximo usando o mesmo sistema de movimento por dado da Fase 3.

### 5.1 Script: `EnemyAI.cs`

> **Em aberto:** este é o comportamento mínimo do MVP (perseguir o alvo mais próximo e atacar se adjacente) — comportamentos diferentes por tipo de monstro (Parte 1 §3) ainda não foram desenhados.

Crie em `Assets/_Project/Scripts/AI/EnemyAI.cs`:

```csharp
using System.Collections;
using UnityEngine;

public static class EnemyAI
{
    public static void TakeTurn(Unit enemy, TurnManager turnManager)
    {
        var movement = Object.FindFirstObjectByType<MovementController>();
        var allUnits = Object.FindObjectsByType<Unit>(FindObjectsSortMode.None);

        Unit nearest = null;
        int bestDistance = int.MaxValue;

        foreach (var unit in allUnits)
        {
            if (unit.Faction != UnitFaction.Player || !unit.IsAlive) continue;

            int dist = Mathf.Abs(unit.Cell.x - enemy.Cell.x) + Mathf.Abs(unit.Cell.y - enemy.Cell.y);
            if (dist < bestDistance)
            {
                bestDistance = dist;
                nearest = unit;
            }
        }

        if (nearest == null)
        {
            turnManager.EndCurrentUnitTurn();
            return;
        }

        if (bestDistance == 1)
        {
            CombatSystem.ResolveAttack(enemy, nearest);
            turnManager.EndCurrentUnitTurn();
            return;
        }

        int range = movement.RollMovementRange();
        var reachable = movement.GetReachableCells(enemy.Cell, range);

        Vector2Int bestCell = enemy.Cell;
        int bestCellDistance = bestDistance;

        foreach (var cell in reachable)
        {
            int dist = Mathf.Abs(nearest.Cell.x - cell.x) + Mathf.Abs(nearest.Cell.y - cell.y);
            if (dist < bestCellDistance)
            {
                bestCellDistance = dist;
                bestCell = cell;
            }
        }

        enemy.StartCoroutine(MoveThenEndTurn(movement, enemy, bestCell, turnManager));
    }

    private static IEnumerator MoveThenEndTurn(
        MovementController movement, Unit enemy, Vector2Int destination, TurnManager turnManager)
    {
        yield return movement.MoveUnitTo(enemy, destination);
        turnManager.EndCurrentUnitTurn();
    }
}
```

### 5.2 Configurar os 2-3 monstros do MVP

1. Duplique o prefab de unidade criado na Fase 2, ajuste `Faction = Enemy` e dê valores diferentes de `Ataque`/`Defesa`/`Vida` para cada tipo de monstro (ver Parte 1 §8 — 2 a 3 tipos no MVP).
2. Nenhuma configuração adicional é necessária — `TurnManager` já chama `EnemyAI.TakeTurn` automaticamente para unidades da fase inimiga (Fase 2, §2.2).

### ✅ Checkpoint da Fase 5
- Ao encerrar o turno do último herói, os monstros agem automaticamente em sequência sem travar o jogo.
- Um monstro adjacente a um herói ataca em vez de se mover.
- Um monstro longe do herói mais próximo se move para reduzir a distância, respeitando obstáculos.

#### Problemas comuns
- **`FindFirstObjectByType`/`FindObjectsByType` retornam null/vazio:** confira se `MovementController` e as `Unit` já existem na cena antes do primeiro turno inimigo (ordem de inicialização — evite chamar `TakeTurn` no mesmo frame em que as unidades são instanciadas).

Próxima fase: **Fase 6 (HUD e Input Touch)** — conecta tudo isso a uma interface tocável em tela de celular.

---

# Parte 8 — Implementação Unity: Fase 6 (HUD e Input Touch)

## Fase 6 — HUD e Input Touch

> Objetivo desta fase: o jogador consegue jogar inteiramente por toque — selecionar ação (Mover/Atacar/Parry), tocar numa casa/alvo, e ver o resultado da rolagem de dado na tela.

### 6.1 Script: `TileSelector.cs`

Crie em `Assets/_Project/Scripts/UI/TileSelector.cs`:

```csharp
using UnityEngine;

public class TileSelector : MonoBehaviour
{
    [SerializeField] private Camera mainCamera;

    public event System.Action<Vector2Int> OnCellTapped;

    private void Update()
    {
        if (!Input.GetMouseButtonDown(0)) return; // toque único mapeia para botão 0 em builds mobile

        Vector3 worldPoint = mainCamera.ScreenToWorldPoint(Input.mousePosition);
        Vector2Int cell = GridManager.Instance.WorldToCell(worldPoint);

        if (GridManager.Instance.InBounds(cell))
            OnCellTapped?.Invoke(cell);
    }
}
```

### 6.2 Canvas de ação e resultado de dado

1. Crie um `Canvas` (Screen Space - Overlay) com 3 botões: **Mover**, **Atacar**, **Parry** — visíveis só durante o turno de uma unidade do jogador.
2. Adicione um texto TextMeshPro `DiceResultText`, escondido por padrão.
3. Ao resolver uma rolagem (movimento ou ataque), preencha `DiceResultText` com o resultado (ex.: `"Rolou 14 (alvo ≤ 12) — Errou"`) e deixe visível por um tempo curto antes de continuar o fluxo. A forma final desse feedback (animação de dado, etc.) é **Em aberto** (Parte 1 §5) — este texto simples é o placeholder de MVP.

### 6.3 Ligar tudo (`BattleController.cs`)

Crie em `Assets/_Project/Scripts/UI/BattleController.cs` um script que:
1. Escuta `TileSelector.OnCellTapped`.
2. Mantém um estado (`Idle`, `AwaitingMoveTarget`, `AwaitingAttackTarget`) conforme o botão de ação apertado.
3. Em `AwaitingMoveTarget`, se a célula tocada estiver entre as `reachableCells` calculadas na Fase 3, chama `MovementController.MoveUnitTo`.
4. Em `AwaitingAttackTarget`, se a célula tocada tiver um `Unit` inimigo adjacente/alcançável, chama `CombatSystem.ResolveAttack`.
5. No botão **Parry**, chama `CombatSystem.ResolveParry` diretamente (não precisa de alvo).
6. Em qualquer um dos três casos, ao final chama `TurnManager.Instance.EndCurrentUnitTurn()`.

> Este script é o "cérebro" que junta as Fases 2 a 6 — por ser específico de fluxo de UI e não introduzir mecânica nova, fica a critério da implementação exata (não há um único jeito "certo" de organizar esse estado; uma máquina de estados simples como descrita acima é suficiente pro MVP).

### ✅ Checkpoint da Fase 6
- É possível jogar um combate inteiro só tocando na tela de um celular/emulador: selecionar ação, tocar no alvo/casa, ver o resultado da rolagem, até vencer ou perder.
- Botões de ação somem durante o turno dos inimigos e voltam a aparecer no turno seguinte do jogador.

Próxima fase: **Fase 7 (Firebase Leaderboard)** — registra o resultado da run num ranking online.

---

# Parte 9 — Implementação Unity: Fase 7 (Firebase Leaderboard)

## Fase 7 — Firebase Leaderboard

> Objetivo desta fase: ao fim de uma run (vitória ou derrota), o resultado é enviado a um leaderboard no Firestore, seguindo o mesmo padrão de auth anônima já usado na franquia Rally.

### 7.1 Bootstrap do Firebase

Como o alvo de plataforma aqui é **Mobile** (Android/iOS), use o caminho de **SDK nativo** (não a variante WebGL) — reaproveite o script `FirebaseBootstrap.cs` já documentado em `RallySurvive.md`, [Parte 12 §5.4](RallySurvive.md#parte-12--implementação-unity-fase-5-firebase-leaderboard), sem reescrevê-lo: mesma inicialização de `FirebaseApp`/`FirebaseAuth` (login anônimo), só muda o projeto Firebase apontado (crie um projeto Firebase próprio para DiceAndBlood, ou uma segunda app dentro do mesmo projeto do estúdio — **Em aberto**, decisão de infraestrutura fora do escopo deste GDD).

### 7.2 Script: `LeaderboardService.cs`

> **Em aberto:** a métrica de `score` da run ainda não foi decidida (Parte 1 §7/§9) — o campo abaixo é genérico (`int Score`) até isso ser fechado.

Crie em `Assets/_Project/Scripts/Firebase/LeaderboardService.cs`, adaptando a estrutura de `LeaderboardService.cs` da Rally (mesmo padrão de `SubmitTime`/`GetTopTimes`, trocado para `SubmitRun`/`GetTopRuns` e o caminho de dados do jogo):

```csharp
using System.Collections.Generic;
using System.Threading.Tasks;
using Firebase.Firestore;

public struct RunEntry
{
    public string Nome;
    public int Score;
    public string Data;
}

public static class LeaderboardService
{
    private const string GameId = "diceandblood";

    public static async Task SubmitRun(string modo, int score, string playerName)
    {
        if (!FirebaseBootstrap.IsReady) return;

        string uid = FirebaseBootstrap.Auth.CurrentUser.UserId;
        DocumentReference docRef = FirebaseBootstrap.Db
            .Collection("leaderboards")
            .Document(GameId)
            .Collection(modo)
            .Document(uid);

        var snapshot = await docRef.GetSnapshotAsync();
        if (snapshot.Exists && snapshot.GetValue<int>("score") >= score)
            return; // só sobrescreve se o novo score for melhor

        await docRef.SetAsync(new Dictionary<string, object>
        {
            { "score", score },
            { "nome", playerName },
            { "data", System.DateTime.UtcNow.ToString("o") },
        });
    }

    public static async Task<List<RunEntry>> GetTopRuns(string modo, int limit = 10)
    {
        var result = new List<RunEntry>();
        if (!FirebaseBootstrap.IsReady) return result;

        Query query = FirebaseBootstrap.Db
            .Collection("leaderboards")
            .Document(GameId)
            .Collection(modo)
            .OrderByDescending("score")
            .Limit(limit);

        var snapshot = await query.GetSnapshotAsync();
        foreach (var doc in snapshot.Documents)
        {
            result.Add(new RunEntry
            {
                Nome = doc.GetValue<string>("nome"),
                Score = doc.GetValue<int>("score"),
                Data = doc.GetValue<string>("data"),
            });
        }

        return result;
    }
}
```

Estrutura de dados resultante:
```
/leaderboards/diceandblood/{modo}/{uid} → { score, nome, data }
```

### 7.3 Disparar o envio

Ao fim de uma run (herói morreu, ou objetivo de vitória do MVP foi cumprido — eliminar todos os monstros do tabuleiro fixo), chame:

```csharp
await LeaderboardService.SubmitRun("padrao", scoreDaRun, nomeDoJogador);
```

O valor de `"padrao"` no lugar de `modo` é um placeholder — só passa a fazer sentido ter mais de um modo quando houver mais de um tipo de run (**Em aberto**, pós-MVP).

### ✅ Checkpoint da Fase 7
- Ao terminar uma run no dispositivo/emulador, um documento aparece em `leaderboards/diceandblood/padrao/{uid}` no Firebase Console.
- `LeaderboardService.GetTopRuns("padrao")` retorna a lista ordenada por `score`.

#### Problemas comuns
- **`PERMISSION_DENIED` ao escrever:** confira se `FirebaseBootstrap.IsReady` já é `true` (login anônimo concluído) antes de chamar `SubmitRun` — mesma causa raiz documentada na Rally.

Próxima fase: **Fase 8 (Build e Próximos Passos)** — gera o build mobile e lista o que fica para depois do MVP.

---

# Parte 10 — Implementação Unity: Fase 8 (Build e Próximos Passos)

## Fase 8 — Build e Próximos Passos

> Objetivo desta fase: gerar um build mobile jogável do MVP e deixar registrado o que fica para depois.

### 8.1 Build

1. Em **File > Build Settings**, confirme a plataforma (Android ou iOS) e adicione a cena `Battle` à lista de cenas do build.
2. Configure `Player Settings` mínimos: ícone, nome do pacote/bundle, versão.
3. Gere o build e teste num dispositivo físico ou emulador — toque é diferente de mouse em detalhes de precisão/latência, então vale testar fora do Editor.

### ✅ Checklist do MVP
- [ ] Tabuleiro 8x8 fixo carrega com 1 herói e 2-3 monstros posicionados.
- [ ] Movimento por dado funciona (rolagem, destaque de casas, deslocamento por toque).
- [ ] Ataque por roll-under funciona (rolagem, acerto/erro, dano).
- [ ] Parry funciona (bônus de defesa aplicado e limpo corretamente).
- [ ] Monstros agem automaticamente (perseguir/atacar) no turno deles.
- [ ] Derrota do herói e vitória (eliminar todos os monstros) encerram a run.
- [ ] Resultado da run é enviado ao leaderboard no Firestore.

### 8.2 Próximos passos (pós-MVP, todos **Em aberto** — ver Parte 1 §8/§9)
- Fechar o pilar de design e a fantasia central com o time.
- Decidir o mapeamento de dado por ação (risco/poder) e se a margem do roll-under afeta o resultado.
- Geração procedural de tabuleiros e monstros entre runs.
- Grupo de heróis (mais de 1 personagem jogável) e regras de permadeath por unidade.
- Meta-progressão entre runs (desbloqueios).
- Crítico/fumble, terrenos especiais, ordem de turno por iniciativa.
- Definir a métrica de `score` da run e, se fizer sentido, múltiplos modos de leaderboard.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
