# Tutorial Unity — Implementação Completa do MVP
### Projeto: Mercador & Legião | Nível: Iniciante

Este documento continua o tutorial do mapa e fecha **todo o loop do MVP**: Heróis → Quests → Combate → Loot → Crafting → Loja. A ordem dos passos importa — construímos de dentro pra fora (dados → lógica pura → gerenciadores → UI), pra você sempre conseguir testar cada pedaço isoladamente antes de conectar o resto.

---

## 0. Ordem de construção (siga essa sequência)

1. ScriptableObjects (dados) — `HeroData`, `ItemData`, `MonsterData`, `RecipeData`
2. `CombatSimulator` (lógica pura, testável sem UI)
3. `SaveSystem` (persistência em JSON)
4. `QuestManager` (liga timer real + combate + relatório)
5. `CraftingManager` (Ferreiro)
6. `EconomyManager` (loja/NPC cliente)
7. UI de cada painel (Heróis, Quests, Forja, Loja)

Cada seção abaixo segue essa ordem.

---

## 1. ScriptableObjects — os "dados" do jogo

### 1.1 `HeroData.cs`

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewHero", menuName = "Jogo/Heroi")]
public class HeroData : ScriptableObject
{
    public string heroName;
    public HeroClass heroClass;   // enum: Guerreiro, Ladino, Mago
    public Sprite portrait;

    [Header("Atributos primários base")]
    public int baseStrength;
    public int baseAgility;
    public int baseIntelligence;
}

public enum HeroClass { Guerreiro, Ladino, Mago }
```

Isso é o **molde**. O herói de verdade, em jogo (com nível, vida atual, XP, itens equipados), é uma classe C# comum (não ScriptableObject, porque ScriptableObject é pra dados fixos — o estado de um herói muda o tempo todo):

```csharp
[System.Serializable]
public class HeroInstance
{
    public string instanceId;      // ID único (pra salvar/carregar)
    public HeroData baseData;      // Referência ao molde
    public int level = 1;
    public int currentXP = 0;
    public int currentHP;
    public ItemInstance[] equippedItems = new ItemInstance[5]; // Cabeça, Peito, MaoPrincipal, OffHand, Acessorio

    // Atributos secundários calculados (não salvos, recalculados sempre que precisar)
    public int GetPhysicalAttack()
    {
        int baseAtk = baseData.heroClass == HeroClass.Mago ? 0 : baseData.baseStrength * 2;
        int itemBonus = 0;
        foreach (var item in equippedItems)
            if (item != null) itemBonus += item.physicalAttackBonus;
        return baseAtk + itemBonus + (level * 2);
    }

    public int GetDefense()
    {
        int itemBonus = 0;
        foreach (var item in equippedItems)
            if (item != null) itemBonus += item.defenseBonus;
        return itemBonus + (level);
    }

    public float GetCritChance()
    {
        float baseCrit = baseData.baseAgility * 0.01f;
        float itemBonus = 0;
        foreach (var item in equippedItems)
            if (item != null) itemBonus += item.critBonus;
        return Mathf.Clamp01(baseCrit + itemBonus);
    }
}
```

**Por que separar `HeroData` (molde) de `HeroInstance` (herói real)?** Porque você pode ter 5 guerreiros diferentes em jogo, todos vindos do mesmo `HeroData` "Guerreiro Base", mas cada um com nível e itens diferentes. Se você misturasse tudo num `ScriptableObject` só, todos os guerreiros comprados compartilhariam o mesmo nível — o que quebraria o jogo.

### 1.2 `ItemData.cs` (molde) + `ItemInstance` (item real)

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewItem", menuName = "Jogo/Item")]
public class ItemData : ScriptableObject
{
    public string itemName;
    public EquipSlot slot; // enum: Cabeca, Peito, MaoPrincipal, OffHand, Acessorio
    public Sprite icon;
    public int basePhysicalAttack;
    public int baseDefense;
    public float baseCritBonus;
    public int baseSellPrice;
}

public enum EquipSlot { Cabeca, Peito, MaoPrincipal, OffHand, Acessorio }

[System.Serializable]
public class ItemInstance
{
    public string instanceId;
    public ItemData baseData;
    public string suffix;           // Ex: "do Fogo", ou "" se não tiver
    public int physicalAttackBonus;
    public int defenseBonus;
    public float critBonus;
    public int rarity; // 0 = comum, 1 = incomum, 2 = raro
}
```

### 1.3 `MonsterData.cs`

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewMonster", menuName = "Jogo/Monstro")]
public class MonsterData : ScriptableObject
{
    public string monsterName;
    public int hp;
    public int physicalAttack;
    public int defense;
    public float critChance;
}
```

### 1.4 `RecipeData.cs` (pro Ferreiro)

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewRecipe", menuName = "Jogo/Receita")]
public class RecipeData : ScriptableObject
{
    public string recipeName;
    public ItemData resultItem;
    public MaterialCost[] costs;
    public int requiredCraftsmanLevel;
    [Range(0f, 1f)] public float suffixChance;
}

[System.Serializable]
public class MaterialCost
{
    public string materialId; // simplificado: string em vez de outro ScriptableObject, pra reduzir escopo
    public int amount;
}
```

**Ação no Editor:** crie as pastas `Assets/Data/Herois`, `Assets/Data/Itens`, `Assets/Data/Monstros`, `Assets/Data/Receitas` e popule pelo menos: 3 `HeroData` (Guerreiro, Ladino, Mago base), 5 `ItemData`, 3 `MonsterData` (da Mata), 5 `RecipeData`.

---

## 2. `CombatSimulator` — lógica pura, sem `MonoBehaviour`

Essa é a classe mais importante pra testar isolada, porque **não depende de UI nem de cena** — você pode chamar ela de um teste, de um botão de debug, de onde quiser.

```csharp
using System.Collections.Generic;
using UnityEngine;

public static class CombatSimulator
{
    public class CombatResult
    {
        public bool victory;
        public int remainingHP;
        public List<string> log = new List<string>();
    }

    public static CombatResult Simulate(HeroInstance hero, MonsterData monster)
    {
        var result = new CombatResult();
        int heroHP = hero.currentHP;
        int monsterHP = monster.hp;

        for (int turn = 1; turn <= 10; turn++)
        {
            // Turno do herói
            int dmgToMonster = CalculateDamage(hero.GetPhysicalAttack(), monster.defense, hero.GetCritChance());
            monsterHP -= dmgToMonster;
            result.log.Add($"Turno {turn}: Herói causa {dmgToMonster} de dano.");

            if (monsterHP <= 0)
            {
                result.victory = true;
                result.remainingHP = heroHP;
                return result;
            }

            // Turno do monstro
            int dmgToHero = CalculateDamage(monster.physicalAttack, hero.GetDefense(), monster.critChance);
            heroHP -= dmgToHero;
            result.log.Add($"Turno {turn}: Monstro causa {dmgToHero} de dano.");

            if (heroHP <= 0)
            {
                result.victory = false;
                result.remainingHP = 0;
                return result;
            }
        }

        // Acabaram os 10 turnos sem morte — decide por quem está com mais % de vida
        float heroPercent = (float)heroHP / hero.currentHP;
        float monsterPercent = (float)monsterHP / monster.hp;
        result.victory = heroPercent >= monsterPercent;
        result.remainingHP = Mathf.Max(heroHP, 0);
        return result;
    }

    static int CalculateDamage(int attack, int defense, float critChance)
    {
        int baseDamage = Mathf.Max(attack - (defense / 2), 1); // mínimo 1 de dano
        bool isCrit = Random.value < critChance;
        if (isCrit) baseDamage = Mathf.RoundToInt(baseDamage * 1.5f);
        return baseDamage;
    }
}
```

**Como testar isso ANTES de ter qualquer UI:** crie um script temporário `CombatTestRunner.cs`, coloque num objeto vazio na cena, arraste um `HeroData` e um `MonsterData`, e no `Start()` chame `CombatSimulator.Simulate(...)` e dê `Debug.Log` no resultado. Isso é uma prática valiosa pra iniciante: testar lógica isolada antes de complicar com interface.

---

## 3. `SaveSystem` — persistência em JSON

```csharp
using UnityEngine;
using System.IO;

public static class SaveSystem
{
    static string SavePath => Path.Combine(Application.persistentDataPath, "save.json");

    public static void Save(GameState state)
    {
        string json = JsonUtility.ToJson(state, true);
        File.WriteAllText(SavePath, json);
    }

    public static GameState Load()
    {
        if (!File.Exists(SavePath)) return new GameState();
        string json = File.ReadAllText(SavePath);
        return JsonUtility.FromJson<GameState>(json);
    }
}

[System.Serializable]
public class GameState
{
    public int gold = 100;
    public List<HeroInstance> heroes = new List<HeroInstance>();
    public List<ItemInstance> inventory = new List<ItemInstance>();
    public List<ActiveQuest> activeQuests = new List<ActiveQuest>();
    public Dictionary<string, int> craftsmanLevels = new Dictionary<string, int>(); // Nota: JsonUtility não serializa Dictionary — ver aviso abaixo
}
```

**Aviso importante de iniciante:** `JsonUtility` do Unity **não serializa `Dictionary`** diretamente. Pra `craftsmanLevels`, use uma lista de um struct simples (`List<CraftsmanLevelEntry>` com `string id` e `int level`) em vez de `Dictionary`, ou troque `JsonUtility` por `Newtonsoft.Json` (via Package Manager) que lida com dicionários. Pra manter o MVP simples, recomendo a lista.

---

## 4. `ActiveQuest` + `QuestManager`

```csharp
using System;
using UnityEngine;

[System.Serializable]
public class ActiveQuest
{
    public string heroInstanceId;
    public string regionName;
    public string startTimeIso;  // DateTime salvo como string ISO 8601
    public string endTimeIso;
}
```

```csharp
using UnityEngine;
using System;
using System.Collections.Generic;

public class QuestManager : MonoBehaviour
{
    public GameState state; // referência ao estado carregado (viria do SaveSystem no boot do jogo)

    public void StartQuest(HeroInstance hero, RegionData region)
    {
        DateTime start = DateTime.UtcNow;
        DateTime end = start.AddMinutes(region.questDurationMinutes);

        var quest = new ActiveQuest
        {
            heroInstanceId = hero.instanceId,
            regionName = region.regionName,
            startTimeIso = start.ToString("o"),
            endTimeIso = end.ToString("o")
        };
        state.activeQuests.Add(quest);
        SaveSystem.Save(state);
    }

    // Chamado ao abrir o app ou periodicamente, pra resolver quests que já terminaram
    public void CheckCompletedQuests(RegionData[] allRegions)
    {
        DateTime now = DateTime.UtcNow;
        var completed = new List<ActiveQuest>();

        foreach (var quest in state.activeQuests)
        {
            DateTime end = DateTime.Parse(quest.endTimeIso);
            if (now >= end)
                completed.Add(quest);
        }

        foreach (var quest in completed)
        {
            ResolveQuest(quest, allRegions);
            state.activeQuests.Remove(quest);
        }

        if (completed.Count > 0) SaveSystem.Save(state);
    }

    void ResolveQuest(ActiveQuest quest, RegionData[] allRegions)
    {
        RegionData region = Array.Find(allRegions, r => r.regionName == quest.regionName);
        HeroInstance hero = state.heroes.Find(h => h.instanceId == quest.heroInstanceId);
        MonsterData monster = region.possibleMonsters[UnityEngine.Random.Range(0, region.possibleMonsters.Length)];

        var result = CombatSimulator.Simulate(hero, monster);
        hero.currentHP = result.remainingHP;

        if (result.victory)
        {
            hero.currentXP += 20; // valor fixo simples pro MVP
            RollLoot(region);
        }

        // Aqui você dispararia um evento pra UI mostrar o relatório
        Debug.Log($"Quest resolvida: {(result.victory ? "Vitória" : "Derrota")} contra {monster.monsterName}");
    }

    void RollLoot(RegionData region)
    {
        foreach (var entry in region.lootTable)
        {
            if (UnityEngine.Random.value <= entry.dropChance)
            {
                var newItem = new ItemInstance { baseData = entry.item, instanceId = Guid.NewGuid().ToString() };
                state.inventory.Add(newItem);
            }
        }
    }

    // Chamado pelo MapManager quando o jogador escolhe uma região
    public void OpenHeroSelectionFor(RegionData region)
    {
        // Aqui você abriria o painel de UI de seleção de herói,
        // passando `region` e a lista `state.heroes` disponíveis (sem quest ativa)
    }
}
```

**Ponto-chave de aprendizado:** `CheckCompletedQuests` deve ser chamado no `Start()` do jogo (ao abrir o app) — é isso que faz o jogo "processar o tempo que passou offline", que é a mecânica central de um idle game.

---

## 5. `CraftingManager` — Ferreiro

```csharp
using UnityEngine;
using System;

public class CraftingManager : MonoBehaviour
{
    public GameState state;
    public int ferreiroLevel = 1; // simplificado: sem Dictionary, só essa estação no MVP

    public bool CanCraft(RecipeData recipe)
    {
        if (ferreiroLevel < recipe.requiredCraftsmanLevel) return false;
        // checagem de materiais fica simplificada no MVP (ver nota abaixo)
        return true;
    }

    public ItemInstance Craft(RecipeData recipe)
    {
        if (!CanCraft(recipe)) return null;

        var newItem = new ItemInstance
        {
            instanceId = Guid.NewGuid().ToString(),
            baseData = recipe.resultItem,
            physicalAttackBonus = recipe.resultItem.basePhysicalAttack,
            defenseBonus = recipe.resultItem.baseDefense,
            critBonus = recipe.resultItem.baseCritBonus
        };

        if (UnityEngine.Random.value <= recipe.suffixChance)
        {
            ApplySuffix(newItem);
        }

        state.inventory.Add(newItem);
        ferreiroLevel += 1; // sobe de nível a cada craft (regra simplificada do MVP)
        SaveSystem.Save(state);
        return newItem;
    }

    void ApplySuffix(ItemInstance item)
    {
        string[] suffixes = { "do Fogo", "dos Ventos", "da Sombra" };
        item.suffix = suffixes[UnityEngine.Random.Range(0, suffixes.Length)];
        item.physicalAttackBonus += 2;
        item.rarity = 1;
    }
}
```

**Nota de escopo:** a checagem real de materiais (consumir minérios do inventário) fica de fora do MVP mínimo — comece craftando "de graça" pra validar o loop, depois adicione o consumo de `MaterialCost`.

---

## 6. `EconomyManager` — Loja

```csharp
using UnityEngine;

public class EconomyManager : MonoBehaviour
{
    public GameState state;

    public ItemData currentClientWants; // sorteado periodicamente
    public int currentOfferPrice;

    public void GenerateNewClient(ItemData[] possibleWants)
    {
        currentClientWants = possibleWants[Random.Range(0, possibleWants.Length)];
        int variance = Random.Range(-20, 21); // ±20%
        currentOfferPrice = currentClientWants.baseSellPrice + (currentClientWants.baseSellPrice * variance / 100);
    }

    public bool SellItem(ItemInstance item)
    {
        if (item.baseData != currentClientWants) return false;

        state.inventory.Remove(item);
        state.gold += currentOfferPrice;
        SaveSystem.Save(state);
        currentClientWants = null; // cliente satisfeito, vai embora
        return true;
    }
}
```

---

## 7. Conectando tudo na UI (visão geral)

Você já tem o `MapManager` do tutorial anterior. Agora:

1. **Painel de Heróis:** lista `state.heroes`, mostra nível/atributos/itens equipados, botão de equipar (troca item do slot).
2. **Painel de Quests:** ao clicar numa região no mapa, abre lista de heróis sem quest ativa → botão "Enviar" chama `questManager.StartQuest(hero, region)`.
3. **Painel da Forja:** lista `RecipeData` disponíveis (filtradas por `ferreiroLevel`), botão "Criar" chama `craftingManager.Craft(recipe)`.
4. **Painel da Loja:** mostra `currentClientWants` e `currentOfferPrice`, lista o inventário do jogador com botão "Vender" em cada item que bate com o pedido.

Um `GameManager` central (singleton) deve segurar a referência única de `GameState` e ser passado (via Inspector ou `FindObjectOfType`) para os 4 managers acima, garantindo que todos leem/escrevem o mesmo estado.

---

## 8. Checklist de teste do MVP completo

- [ ] Criar um herói de teste direto no `GameState` (via código, no `Start()`) pra não depender de contratação ainda.
- [ ] Rodar `CombatSimulator.Simulate` isolado e conferir os logs no Console.
- [ ] Iniciar uma quest, fechar e reabrir o jogo (ou avançar o relógio do sistema) pra confirmar que `CheckCompletedQuests` resolve corretamente com o app "fechado".
- [ ] Craftar um item e confirmar que ele aparece no inventário salvo.
- [ ] Vender um item pro cliente e confirmar que o ouro aumenta e o item some do inventário.
- [ ] Fechar e abrir o jogo depois de cada passo acima, confirmando que o `SaveSystem` manteve tudo.

Se todos os itens dessa checklist passarem, o loop core inteiro do MVP está funcional — o resto é polimento de UI e conteúdo (mais heróis, itens, regiões).
