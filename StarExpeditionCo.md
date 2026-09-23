# GDD — Star Expedition Co.

> Documento vivo. Rascunho inicial — a refinar conforme prototipagem. Nome do jogo é provisório (ver seção 1).

## Índice

1. [Parte 1 — GDD](#parte-1--gdd)
2. [Parte 2 — Implementação Unity: Fase 0 (Setup do Projeto)](#parte-2--implementação-unity-fase-0-setup-do-projeto)
3. [Parte 3 — Implementação Unity: Fase 1 (Sistema de Equipe)](#parte-3--implementação-unity-fase-1-sistema-de-equipe)
4. [Parte 4 — Implementação Unity: Fase 2 (Galáxias e Planetas)](#parte-4--implementação-unity-fase-2-galáxias-e-planetas)
5. [Parte 5 — Implementação Unity: Fase 3 (Timer de Expedição)](#parte-5--implementação-unity-fase-3-timer-de-expedição)
6. [Parte 6 — Implementação Unity: Fase 4 (Itens e Resultado da Expedição)](#parte-6--implementação-unity-fase-4-itens-e-resultado-da-expedição)
7. [Parte 7 — Implementação Unity: Fase 5 (Crafting de Equipamentos)](#parte-7--implementação-unity-fase-5-crafting-de-equipamentos)
8. [Parte 8 — Implementação Unity: Fase 6 (Economia: Loja e Contratação)](#parte-8--implementação-unity-fase-6-economia-loja-e-contratação)
9. [Parte 9 — Implementação Unity: Fase 7 (Save Local)](#parte-9--implementação-unity-fase-7-save-local)
10. [Parte 10 — Implementação Unity: Fase 8 (Build e Próximos Passos)](#parte-10--implementação-unity-fase-8-build-e-próximos-passos)

---

# Parte 1 — GDD

## 1. Visão Geral

- **Gênero:** Gerenciamento de equipe / RPG espacial com resolução idle (mecânica no estilo *RPG Merchant*: escolher, confirmar e esperar).
- **Plataforma-alvo:** **Definido:** Mobile (iOS/Android).
- **Câmera/perspectiva:** o jogo é majoritariamente orientado a menus/UI (telas de base, seleção de expedição, resultado) — não há uma cena de jogo jogável em tempo real durante a exploração em si. **Definido:** existe uma tela de **mapa da galáxia navegável visualmente**, com os planetas posicionados espacialmente (não é uma lista/grade simples).
- **Pilar de design:** montar a equipe certa para o risco certo, mandar para a expedição, e sentir a expectativa/ansiedade da espera real até o resultado — a decisão de investimento (quem mandar, para onde, com o quê) acontece toda *antes* da espera, não durante.
- **Fantasia central:** comandar uma pequena operação de expedições espaciais que cresce até virar uma potência tecnológica — coletando recursos alienígenas, criando equipamentos cada vez mais avançados e expandindo o time contratando novas classes.
- **Referência citada:** *RPG Merchant* (mecânica de escolher configuração → confirmar → esperar resultado).

## 2. Mecânica Principal

Loop central:

1. **Montar equipe** — escolher quais membros (classes RPG) vão para a expedição.
2. **Selecionar planeta/galáxia** — escolher o destino entre os já desbloqueados/disponíveis.
3. **Confirmar expedição** — a equipe é "enviada" e fica indisponível durante a expedição.
4. **Esperar o resultado** — **Definido:** a resolução é por **timer real (idle)**: o jogador espera um tempo real (minutos/horas), inclusive com o app fechado, igual em jogos idle — não há interação durante a espera.
5. **Ver o resultado** — itens/recursos coletados (e possivelmente eventos/baixas, ver seção 8).
6. **Usar os itens coletados** — duas rotas, não mutuamente exclusivas:
   - **Craft** de equipamentos/tecnologias mais modernas (melhoram a equipe).
   - **Venda** da tecnologia coletada por moeda.
7. **Contratar novos membros** com a moeda obtida, expandindo o roster de classes disponíveis.
8. Repetir o loop com uma equipe maior/mais equipada, liberando planetas/galáxias mais arriscados.

- **Definido:** resolução de expedição via timer real, sem interação do jogador durante a espera (idle).
- **Definido:** **múltiplas expedições podem estar ativas ao mesmo tempo**, uma por planeta — o jogador pode mandar equipes diferentes para planetas diferentes em paralelo, mas **nunca duas expedições simultâneas para o mesmo planeta** (precisa esperar a ativa terminar/ser reivindicada antes de mandar outra equipe pra lá). O limite prático de quantas expedições rodam ao mesmo tempo é o tamanho do roster (cada expedição consome de 1 a 3 membros, que ficam indisponíveis para outras).
- **Definido:** o resultado é uma **lista seca de itens obtidos** no MVP (sem log/relato narrativo) — log narrativo estilo *RPG Merchant* clássico fica pós-MVP (ver §13).
- **Definido:** a resolução é **binária** por expedição — sucesso (itens) ou fracasso (nada, e possível perda permanente de um membro) — não há retorno parcial proporcional ao risco. Ver §8 para a regra de perda de membro.

## 3. Sistema de Equipe / Classes RPG

- O jogador administra um **roster** de membros de equipe, cada um pertencente a uma **classe**.
- Cada expedição usa um subconjunto do roster (a "equipe" daquela missão); os membros usados ficam ocupados até a expedição terminar (ou, em caso de perda permanente, para sempre — ver §8).
- **Definido:** roster inicial com **6 classes**, cada uma com um papel/atributo principal que entra na fórmula de resolução da expedição (ver §4 e Parte 6):

  | Classe | Papel / atributo principal |
  |---|---|
  | Explorador/Batedor | Aumenta a **chance de sucesso** da expedição |
  | Engenheiro | Aumenta a **quantidade de itens coletados** |
  | Cientista | Aumenta a **chance de item raro/tier alto** |
  | Guarda | **Reduz o risco efetivo** do planeta (planetas hostis) |
  | Médico | **Reduz a chance de perda permanente** de membro numa falha |
  | Piloto/Navegador | **Reduz a duração** do timer de expedição |

- **Definido:** cada expedição pode levar **de 1 a 3 membros** (slot não cresce com progressão no MVP).
- **Em aberto:** os valores numéricos exatos de bônus por classe (balanceamento fica para playtesting — ver implementação de referência em `CrewClassData`, Parte 3).
- **Pós-MVP (§13):** progressão individual de membro (nível/experiência) além do equipamento que ele carrega.
- **Definido (ver §6):** cada membro tem um **slot de equipamento** — o item craftado é atribuído a um membro específico, não é um upgrade geral da operação.

## 4. Sistema de Expedições (Galáxias e Planetas)

- Estrutura em duas camadas, conforme descrito pelo usuário: **galáxias**, que contêm **planetas** exploráveis.
- Cada planeta define, no mínimo: nível de risco/dificuldade, duração da expedição (tempo real de espera) e uma tabela de recompensas possíveis (loot table de itens).
- O resultado da expedição é calculado ao fim do timer, cruzando os atributos da equipe enviada com o risco do planeta (ver implementação de referência na Parte 6).
- **Definido:** resolução **binária** por expedição — um único cálculo de chance de sucesso (atributos da equipe vs. risco efetivo do planeta), depois um único sorteio decide sucesso ou fracasso (ver §8).
- **Em aberto:** os números exatos da fórmula de chance de sucesso (o mecanismo está definido — ver `ExpeditionResolver`, Parte 6 — mas os valores ficam para playtesting/balanceamento).
- **Definido:** desbloqueio de novas galáxias/planetas é **progressão linear simples** — reivindicar o resultado de uma expedição (sucesso ou fracasso) libera o próximo planeta da galáxia atual; completar o último planeta de uma galáxia libera a próxima galáxia.
- **Definido:** existe uma tela de **mapa navegável visualmente**, com planetas posicionados espacialmente dentro da galáxia (ver §1 e §10).

## 5. Sistema de Itens e Coleta

- Expedições retornam itens coletados no planeta, usados depois em crafting ou vendidos por moeda.
- **Definido:** taxonomia com **3 categorias** de item: **Matéria-prima** (bruta), **Componente** (tecnológico processado) e **Item raro/único**.
- **Definido:** itens da categoria **raro/único têm chance de drop escalando com o risco do planeta** — planetas mais arriscados têm mais chance de soltar itens raros (a classe Cientista também aumenta essa chance, ver §3).

## 6. Sistema de Crafting / Equipamentos

- Itens coletados podem ser combinados (receitas) para criar **equipamentos** — as "tecnologias mais modernas" citadas pelo usuário — que melhoram a equipe.
- **Definido:** o equipamento craftado é atribuído a um **membro específico** (slot de equipamento por personagem, um slot por membro no MVP) — não é um upgrade geral da operação. Ver implementação em `EquipmentManager`, Parte 7.
- **Definido:** a árvore de receitas é **ramificada por tier de tecnologia** — receitas de tier avançado exigem itens/equipamentos obtidos em receitas de tier anterior.
- **Em aberto:** o efeito exato de cada equipamento nos atributos do membro (quais bônus, em que magnitude) — mecanismo de bônus por equipamento está definido na implementação (Parte 6/7), números ficam para playtesting.

## 7. Sistema de Economia e Contratação

- Itens/tecnologia podem ser **vendidos** por moeda in-game em vez de usados em crafting.
- Moeda é usada para **contratar novos membros** (novas instâncias de classes RPG), expandindo o roster do jogador.
- **Definido:** contratação **sempre disponível por classe** — qualquer uma das 6 classes já desbloqueadas pode ser contratada a qualquer momento por um preço fixo/crescente (`CrewClassData.hireCost`). Sem loja rotativa de recrutas no MVP.
- **Definido:** **não há segunda moeda nem monetização** no MVP — só a moeda ganha por venda de tecnologia. Monetização (IAP, ads, moeda premium) fica pós-MVP (ver §13), sem modelo definido ainda.

## 8. Regras e Sistemas

- **Definido:** existe risco real de **perda permanente de membro** (permadeath) numa expedição malsucedida. A chance de perda é reduzida pela classe Médico (§3) e só é sorteada quando a expedição falha.
- **Definido:** o jogo é de **progressão contínua, sem fim fixo** (formato idle/incremental clássico) — não há condição de "vitória" ou fim de conteúdo definida.
- **Definido:** a resolução é **binária** — expedição "sucesso" (entrega itens, sem risco de perda de membro) ou "fracasso" (sem itens, com chance de perda permanente de membro). Não há retorno parcial proporcional ao risco.

## 9. Estilo Visual

- **Definido:** **pixel art**, consistente com a linguagem visual dos outros jogos do estúdio (franquia Rally) — mesmo sendo um projeto conceitualmente separado, o time optou pela mesma direção visual.

## 10. HUD / UI

Telas do MVP, já incorporando as decisões desta seção:

- **Base/Hangar** — visão do roster de equipe (incl. equipamento por membro) e do inventário atual.
- **Mapa da Galáxia** — tela navegável visualmente, planetas posicionados espacialmente; só planetas/galáxias desbloqueados (§4) ficam selecionáveis.
- **Seleção de expedição** — a partir de um planeta no mapa: escolher de 1 a 3 membros da equipe → confirmar.
- **Expedição em andamento** — indicador de tempo restante (timer) por planeta com expedição ativa; como várias podem rodar em paralelo, cada card de planeta no mapa mostra o seu próprio timer.
- **Resultado da expedição** — lista seca de itens obtidos, ou aviso de fracasso (incl. perda de membro, se houver).
- **Crafting** — receitas disponíveis (em árvore por tier), itens necessários, equipamento resultante; ação de equipar o resultado em um membro.
- **Loja/Contratação** — vender itens, contratar novos membros (sempre disponível por classe).

- **Em aberto:** layout/wireframe exato de cada tela (posicionamento de elementos, fluxo de navegação entre telas) — fica para prototipagem visual.

## 11. Áudio

- **Definido:** trilha sonora ambiente espacial, calma — reforça a expectativa/tensão da espera pelo timer de expedição (pilar de design, §1).
- **Em aberto:** efeitos sonoros específicos (UI, conclusão de expedição, crafting, contratação) e o restante da direção sonora além da trilha ambiente.

## 12. Backend / Serviços

- **Definido:** sem backend no MVP. Sem leaderboard, sem autenticação, sem multiplayer — **não** segue o padrão Firebase usado na franquia Rally (`RallySurvive.md`, seção 6 do Core), pois o usuário confirmou que este jogo usa apenas **save local**.
- Progresso (roster, inventário, moeda, expedições ativas) é salvo localmente no dispositivo. Ver implementação de referência na Parte 9.
- **Em aberto:** se o jogo eventualmente precisar de cloud save/sincronização entre dispositivos (ex.: troca de celular), isso fica para uma fase pós-MVP — não incluído aqui.

## 13. Escopo do MVP

O loop descrito nas seções 2–7 **é** o escopo mínimo proposto. O MVP cobre:

- Montar equipe (1 a 3 membros) com os membros disponíveis no roster inicial (6 classes).
- Mapa da galáxia navegável, com planetas desbloqueados progressivamente (linear).
- Timer real de expedição, com **múltiplas expedições simultâneas** (uma por planeta — nunca duas no mesmo planeta ao mesmo tempo), funcionando mesmo com o app fechado.
- Resolução binária: sucesso (lista seca de itens, com chance de item raro escalando por risco) ou fracasso (nada, com chance de perda permanente de membro).
- Craft de equipamento a partir de itens, em árvore por tier de tecnologia.
- Equipar o equipamento craftado em um membro específico (slot por membro).
- Venda de itens/tecnologia por moeda.
- Contratação de novos membros (sempre disponível por classe) com a moeda.
- Save local persistente entre sessões (incl. progresso de desbloqueio e equipamento por membro).

**Pós-MVP / em aberto (não incluir na primeira versão jogável):**
- Notificações push avisando quando uma expedição termina.
- Eventos narrativos/log detalhado durante a resolução da expedição (MVP usa lista seca).
- Progressão individual de membro (nível/experiência).
- Cloud save / sincronização entre dispositivos.
- Monetização (IAP, ads, moeda premium) — sem segunda moeda no MVP.
- Loja rotativa de recrutas (MVP usa contratação sempre disponível por classe).

## 14. Riscos / Em aberto

Lista consolidada do que ainda não foi decidido (tudo o mais já está `**Definido:**` nas seções acima):

- Valores numéricos exatos de balanceamento: bônus de cada classe (§3), fórmula de chance de sucesso (§4), chance de perda de membro (§8), efeito de cada equipamento craftado (§6) — o mecanismo de cada um está definido na implementação (Partes 3, 6 e 7); os números ficam para playtesting.
- Layout/wireframe exato de cada tela e fluxo de navegação entre elas (§10).
- Efeitos sonoros específicos além da trilha ambiente (§11).
- Progressão individual de membro, notificações push, log narrativo de eventos, cloud save, monetização e loja rotativa de recrutas — todos conscientemente fora do MVP (§13), sem desenho definido para quando entrarem.

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*

---

# Parte 2 — Implementação Unity: Fase 0 (Setup do Projeto)

## Fase 0 — Setup do Projeto

> Objetivo desta fase: ter o Unity instalado, o projeto criado para mobile, e a estrutura de pastas pronta antes de escrever qualquer script.

### 0.1 Instalar o Unity

1. Baixe o **Unity Hub** em unity.com/download.
2. Na aba **Installs**, clique **Install Editor** e escolha a versão **LTS mais recente** (Unity 6 LTS ou 2022 LTS).
3. Na tela de módulos, marque **Android Build Support** e/ou **iOS Build Support** (Mac necessário para builds/testes iOS de verdade).

### 0.2 Criar o projeto

1. No Hub, aba **Projects** → **New Project**.
2. Template **2D (Core)** — o jogo é majoritariamente UI/menus, não precisa de URP no MVP.
3. Nome do projeto: `StarExpeditionCo`.
4. **Create Project**.

### 0.3 Estrutura de pastas (dentro de `Assets/`)

```
Assets/
  _Project/
    Scripts/
      Crew/
      Expeditions/
      Items/
      Crafting/
      Economy/
      Save/
      UI/
    Sprites/
      Crew/
      Planets/
      UI/
    ScriptableObjects/
      Classes/
      Planets/
      Galaxies/
      Items/
      Recipes/
    Scenes/
    Prefabs/
```

### 0.4 Criar a primeira cena

1. Em `Assets/_Project/Scenes/`, crie a cena `Base` (a tela principal — hangar/roster).
2. Salve o projeto.

### 0.5 Pacotes necessários (Window → Package Manager)

- **TextMeshPro** — texto de UI (aceite o import de "TMP Essentials" no primeiro uso).
- **Input System** não é estritamente necessário aqui (jogo é UI-driven, `Button.onClick` do uGUI cobre o MVP) — só instale se o time preferir usar o novo Input System por padrão em todos os projetos.

> Este projeto não usa Rigidbody2D/física de movimento — é orientado a UI (Canvas, botões, listas). Por isso as notas de versão `rb.linearVelocity`/`rb.velocity` da franquia Rally não se aplicam aqui.

### 0.6 Configurar o projeto para mobile

1. `File → Build Settings` → selecione **Android** ou **iOS** → **Switch Platform**.
2. `Edit → Project Settings → Player`:
   - **Default Orientation**: defina conforme o layout de UI planejado (ex.: `Portrait` para um jogo de menus mobile — **Em aberto** no GDD, seção 10, então ajuste quando o layout de telas for definido).

### ✅ Checkpoint da Fase 0
- Projeto abre sem erros, plataforma ativa é Android ou iOS.
- Estrutura de pastas criada.
- Cena `Base` existe e está salva.
- TextMeshPro instalado (TMP Essentials importado).

Próxima fase: **Fase 1 (Sistema de Equipe)** — criar os dados de classes/membros e o roster do jogador.

---

# Parte 3 — Implementação Unity: Fase 1 (Sistema de Equipe)

## Fase 1 — Sistema de Equipe

> Objetivo: ter classes de RPG definidas como dados (ScriptableObjects), um roster de membros contratados, e a seleção de equipe para uma expedição.

### 1.1 ScriptableObject de classe

Crie em `Assets/_Project/Scripts/Crew/CrewClassData.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Crew/CrewClassData.cs
using UnityEngine;

[CreateAssetMenu(fileName = "NewCrewClass", menuName = "StarExpeditionCo/Crew Class")]
public class CrewClassData : ScriptableObject
{
    public string classId;
    public string displayName;
    public Sprite icon;

    // GDD §3 — 6 classes definidas, um atributo principal cada. Os valores default abaixo
    // são ponto de partida para playtesting, não balanceamento final.
    [Header("Explorador/Batedor")]
    public int successBonus = 0;             // chance de sucesso da expedição

    [Header("Engenheiro")]
    public int yieldBonus = 0;               // quantidade de itens coletados

    [Header("Cientista")]
    public int rareItemChanceBonus = 0;      // chance de item raro/tier alto

    [Header("Guarda")]
    public int riskReductionBonus = 0;       // reduz o risco efetivo do planeta

    [Header("Médico")]
    public int memberSurvivalBonus = 0;      // reduz chance de perda permanente de membro

    [Header("Piloto/Navegador")]
    public float durationReductionSeconds = 0f; // reduz a duração do timer de expedição

    [Header("Economia")]
    public int hireCost = 100;               // custo em moeda para contratar um membro desta classe
}
```

> Cada classe usa principalmente **um** desses campos (o resto fica em 0) — ex.: o asset
> `Explorador` só preenche `successBonus`, o asset `Guarda` só preenche
> `riskReductionBonus`. Nada impede combinar mais de um campo por classe depois, mas o
> ponto de partida do MVP é 1 atributo por classe (ver tabela da GDD §3).

### 1.2 Instância de membro contratado

Crie em `Assets/_Project/Scripts/Crew/CrewMember.cs` — não é um ScriptableObject (cada membro é uma instância única do jogador, não um asset compartilhado):

```csharp
// Caminho: Assets/_Project/Scripts/Crew/CrewMember.cs
using System;

[Serializable]
public class CrewMember
{
    public string memberId;        // GUID gerado na contratação
    public string classId;         // referencia CrewClassData.classId
    public string displayName;
    public bool isOnExpedition;    // true enquanto estiver ocupado numa expedição ativa
    public string equippedItemId;  // GDD §6 — Definido: 1 slot de equipamento por membro; null = vazio

    public CrewMember(string classId, string displayName)
    {
        this.memberId = Guid.NewGuid().ToString();
        this.classId = classId;
        this.displayName = displayName;
        this.isOnExpedition = false;
        this.equippedItemId = null;
    }
}
```

### 1.3 Gerenciador do roster

Crie em `Assets/_Project/Scripts/Crew/TeamManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Crew/TeamManager.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class TeamManager : MonoBehaviour
{
    public static TeamManager Instance { get; private set; }

    [SerializeField] private List<CrewClassData> availableClasses; // classes desbloqueadas

    public List<CrewMember> Roster { get; private set; } = new List<CrewMember>();

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public CrewClassData GetClassData(string classId)
        => availableClasses.FirstOrDefault(c => c.classId == classId);

    public void AddMember(CrewMember member) => Roster.Add(member);

    // GDD §8 — Definido: perda permanente de membro (permadeath) em expedição malsucedida.
    public void RemoveMember(string memberId) => Roster.RemoveAll(m => m.memberId == memberId);

    public List<CrewMember> GetAvailableMembers()
        => Roster.Where(m => !m.isOnExpedition).ToList();

    public void SetMembersOnExpedition(List<string> memberIds, bool onExpedition)
    {
        foreach (var member in Roster.Where(m => memberIds.Contains(m.memberId)))
            member.isOnExpedition = onExpedition;
    }

    // Usado pelo SaveManager (Parte 9) ao carregar o save.
    public void LoadRoster(List<CrewMember> savedRoster) => Roster = savedRoster ?? new List<CrewMember>();
}
```

### 1.4 Configurar no Inspector

1. Crie os **6 assets de `CrewClassData`** (botão direito na pasta `ScriptableObjects/Classes` → **Create → StarExpeditionCo → Crew Class**), um por classe da tabela do GDD §3:

   | Asset | Campo preenchido | Valor sugerido (ponto de partida) |
   |---|---|---|
   | `Explorador` | `successBonus` | 10 |
   | `Engenheiro` | `yieldBonus` | 1 |
   | `Cientista` | `rareItemChanceBonus` | 15 |
   | `Guarda` | `riskReductionBonus` | 15 |
   | `Medico` | `memberSurvivalBonus` | 20 |
   | `Piloto` | `durationReductionSeconds` | 60 |

   Valores de `hireCost` ficam a seu critério nesta fase (ex.: 100 pra todos) — balanceamento fino é pós-prototipagem.
2. Crie um GameObject vazio `TeamManager` na cena `Base`, adicione o script `TeamManager`, arraste os 6 assets de classe criados para a lista `Available Classes`.

### ✅ Checkpoint da Fase 1
- `TeamManager.Instance` acessível de qualquer script após o Play.
- Chamar `AddMember(new CrewMember("explorador", "Ana"))` manualmente (ex.: via um botão de teste) e ver o membro aparecer em `Roster`.
- `GetAvailableMembers()` não retorna membros marcados `isOnExpedition = true`.
- Chamar `RemoveMember(id)` remove o membro permanentemente de `Roster` (simula a perda por permadeath da Parte 6).

#### Problemas comuns
- **`TeamManager.Instance` nulo em `Start()` de outro script:** ordem de `Awake()` não é garantida entre objetos — prefira acessar `TeamManager.Instance` em `Start()`, não em `Awake()`, de scripts que dependem dele.

Próxima fase: **Fase 2 (Galáxias e Planetas)** — dados de destinos de expedição.

---

# Parte 4 — Implementação Unity: Fase 2 (Galáxias e Planetas)

## Fase 2 — Galáxias e Planetas

> Objetivo: modelar a estrutura Galáxia → Planeta como dados, com risco, duração e tabela de recompensas por planeta.

### 2.1 ScriptableObject de item (referenciado pela loot table)

Crie em `Assets/_Project/Scripts/Items/ItemData.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Items/ItemData.cs
using UnityEngine;

// GDD §5 — Definido: 3 categorias de item.
public enum ItemRarity { RawMaterial, Component, Rare }

[CreateAssetMenu(fileName = "NewItem", menuName = "StarExpeditionCo/Item")]
public class ItemData : ScriptableObject
{
    public string itemId;
    public string displayName;
    public Sprite icon;
    public ItemRarity rarity = ItemRarity.RawMaterial; // GDD §5
    public int sellValue = 10; // moeda ao vender uma unidade (GDD §7)

    [Header("Equipamento (GDD §6 — só preencher se este item for resultado de crafting)")]
    public bool isEquippable = false;
    public int equipSuccessBonus = 0; // bônus aplicado ao membro que equipar este item
    public int equipYieldBonus = 0;   // efeito exato/balanceamento em aberto, ver GDD §6
}
```

### 2.2 Banco de itens em runtime

`ItemStack` (usado pelo inventário e pelo save) guarda só o `itemId`, então qualquer
sistema que precise dos dados completos de um item (ícone, raridade, bônus de
equipamento) precisa resolver o `ItemData` a partir do id. Crie em
`Assets/_Project/Scripts/Items/ItemDatabase.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Items/ItemDatabase.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ItemDatabase : MonoBehaviour
{
    public static ItemDatabase Instance { get; private set; }

    [SerializeField] private List<ItemData> allItems;

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public ItemData GetById(string itemId) => allItems.FirstOrDefault(i => i.itemId == itemId);
}
```

### 2.3 Loot table de um planeta

Crie em `Assets/_Project/Scripts/Expeditions/LootTableEntry.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/LootTableEntry.cs
using System;
using UnityEngine;

[Serializable]
public class LootTableEntry
{
    public ItemData item;
    [Range(0f, 1f)] public float dropChance = 0.5f;
    public int minQuantity = 1;
    public int maxQuantity = 3;
}
```

### 2.4 ScriptableObject de planeta

Crie em `Assets/_Project/Scripts/Expeditions/PlanetData.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/PlanetData.cs
using UnityEngine;

[CreateAssetMenu(fileName = "NewPlanet", menuName = "StarExpeditionCo/Planet")]
public class PlanetData : ScriptableObject
{
    public string planetId;
    public string displayName;
    public Sprite illustration;
    public Vector2 mapPosition; // posição no mapa navegável da galáxia (GDD §1/§10)

    [Header("Expedição")]
    public float expeditionDurationSeconds = 300f; // duração real do timer (GDD §4)
    [Range(0, 100)] public int riskLevel = 10;      // usado na fórmula de sucesso e na raridade de drop (Parte 6)

    [Header("Recompensas")]
    public LootTableEntry[] lootTable;
}
```

### 2.5 ScriptableObject de galáxia

Crie em `Assets/_Project/Scripts/Expeditions/GalaxyData.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/GalaxyData.cs
using UnityEngine;

[CreateAssetMenu(fileName = "NewGalaxy", menuName = "StarExpeditionCo/Galaxy")]
public class GalaxyData : ScriptableObject
{
    public string galaxyId;
    public string displayName;
    public PlanetData[] planets; // ordem do array = ordem de desbloqueio linear (GDD §4)
}
```

> O desbloqueio em si (quais galáxias/planetas já estão liberados pro jogador) **não** é
> um campo no ScriptableObject — é estado de progresso do save, gerenciado pelo
> `ProgressManager` a seguir. O asset só define a ordem.

### 2.6 Progressão de desbloqueio (ProgressManager)

> GDD §4 — Definido: desbloqueio linear. Reivindicar o resultado de uma expedição (sucesso
> ou fracasso) libera o próximo planeta da galáxia atual; completar o último planeta de
> uma galáxia libera a próxima galáxia da lista.

Crie em `Assets/_Project/Scripts/Expeditions/ProgressManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ProgressManager.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ProgressManager : MonoBehaviour
{
    public static ProgressManager Instance { get; private set; }

    [SerializeField] private List<GalaxyData> allGalaxies; // ordem da lista = ordem de desbloqueio

    private HashSet<string> unlockedPlanetIds = new HashSet<string>();
    private HashSet<string> unlockedGalaxyIds = new HashSet<string>();

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void Start()
    {
        // Primeira sessão (nada veio do save ainda): libera a primeira galáxia/planeta.
        if (unlockedGalaxyIds.Count == 0 && allGalaxies.Count > 0)
            UnlockGalaxy(allGalaxies[0]);
    }

    public bool IsGalaxyUnlocked(string galaxyId) => unlockedGalaxyIds.Contains(galaxyId);
    public bool IsPlanetUnlocked(string planetId) => unlockedPlanetIds.Contains(planetId);

    private void UnlockGalaxy(GalaxyData galaxy)
    {
        unlockedGalaxyIds.Add(galaxy.galaxyId);
        if (galaxy.planets.Length > 0)
            unlockedPlanetIds.Add(galaxy.planets[0].planetId);
    }

    /// Chame ao reivindicar o resultado de uma expedição (sucesso OU fracasso — GDD §4).
    public void OnExpeditionClaimed(GalaxyData galaxy, PlanetData completedPlanet)
    {
        int index = System.Array.IndexOf(galaxy.planets, completedPlanet);
        if (index < 0) return;

        if (index + 1 < galaxy.planets.Length)
        {
            unlockedPlanetIds.Add(galaxy.planets[index + 1].planetId);
        }
        else
        {
            int galaxyIndex = allGalaxies.IndexOf(galaxy);
            if (galaxyIndex >= 0 && galaxyIndex + 1 < allGalaxies.Count)
                UnlockGalaxy(allGalaxies[galaxyIndex + 1]);
        }
    }

    /// Busca o planeta e a galáxia que o contém a partir do id — usado pela tela de
    /// resultado (Parte 6) em vez de depender de referências arrastadas manualmente.
    public (GalaxyData galaxy, PlanetData planet) FindPlanetById(string planetId)
    {
        foreach (var galaxy in allGalaxies)
        {
            var planet = galaxy.planets.FirstOrDefault(p => p.planetId == planetId);
            if (planet != null) return (galaxy, planet);
        }
        return (null, null);
    }

    // Usado pelo SaveManager (Parte 9).
    public List<string> GetSerializableUnlockedPlanetIds() => unlockedPlanetIds.ToList();
    public List<string> GetSerializableUnlockedGalaxyIds() => unlockedGalaxyIds.ToList();

    public void LoadFromSave(List<string> planetIds, List<string> galaxyIds)
    {
        unlockedPlanetIds = new HashSet<string>(planetIds ?? new List<string>());
        unlockedGalaxyIds = new HashSet<string>(galaxyIds ?? new List<string>());
    }
}
```

### 2.7 Configurar no Inspector

1. Crie **9 `ItemData`** de teste em `ScriptableObjects/Items`: 3 Matéria-prima, 3 Componente, 3 Item raro/único (`rarity` correspondente) — inclua pelo menos 1 item com `isEquippable = true` pra testar a Fase 5/7.
2. Crie 2-3 `PlanetData` em `ScriptableObjects/Planets` com `riskLevel` crescente, preenchendo a loot table com os itens criados (inclua ao menos 1 entrada de item raro por planeta, pra testar a escala de raridade por risco na Parte 6).
3. Crie 1-2 `GalaxyData` em `ScriptableObjects/Galaxies`, arrastando os planetas na ordem de desbloqueio desejada para a lista `Planets`.
4. Crie um GameObject `ProgressManager` na cena `Base`, adicione o script, arraste as galáxias na ordem de desbloqueio para `All Galaxies`.

### ✅ Checkpoint da Fase 2
- Assets de `GalaxyData` → `PlanetData` → `LootTableEntry` → `ItemData` todos referenciando corretamente entre si no Inspector.
- Nenhuma referência nula ao inspecionar um planeta (loot table preenchida).
- Após o Play, `ProgressManager.Instance.IsGalaxyUnlocked(...)` retorna `true` só para a primeira galáxia, e `IsPlanetUnlocked(...)` só para o primeiro planeta dela.
- Chamar `OnExpeditionClaimed(galaxy, planet)` manualmente com o primeiro planeta libera o segundo (`IsPlanetUnlocked` do segundo planeta vira `true`).

Próxima fase: **Fase 3 (Timer de Expedição)** — o núcleo da mecânica idle: enviar a equipe e calcular o tempo restante mesmo com o app fechado.

---

# Parte 5 — Implementação Unity: Fase 3 (Timer de Expedição)

## Fase 3 — Timer de Expedição Real (Idle)

> Objetivo: implementar o coração do pilar de design (GDD §2) — iniciar uma expedição, e calcular corretamente o tempo restante usando relógio real (`DateTime`), mesmo que o app tenha sido fechado e reaberto no meio da espera.

> ⚠️ Ponto crítico de jogos idle: **nunca** conte o tempo restante com `Time.time`/corrotinas puras — elas zeram quando o app fecha. O timer real precisa ser calculado a partir de um `DateTime` de início salvo em disco (ver Parte 9 — Save Local) comparado com `DateTime.UtcNow` a cada vez que o jogo abre ou a tela é consultada.

### 3.1 Estado de uma expedição ativa

Crie em `Assets/_Project/Scripts/Expeditions/ActiveExpedition.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ActiveExpedition.cs
using System;
using System.Collections.Generic;

[Serializable]
public class ActiveExpedition
{
    public string planetId;
    public List<string> memberIds;
    public string startTimeUtcIso; // DateTime.UtcNow salvo como string ISO 8601
    public float durationSeconds;

    public DateTime StartTimeUtc => DateTime.Parse(startTimeUtcIso).ToUniversalTime();

    public float GetRemainingSeconds()
    {
        var elapsed = (float)(DateTime.UtcNow - StartTimeUtc).TotalSeconds;
        return Mathf_Max0(durationSeconds - elapsed);
    }

    public bool IsComplete() => GetRemainingSeconds() <= 0f;

    private static float Mathf_Max0(float value) => value < 0f ? 0f : value;
}
```

### 3.2 Gerenciador de expedições

Crie em `Assets/_Project/Scripts/Expeditions/ExpeditionManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ExpeditionManager.cs
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class ExpeditionManager : MonoBehaviour
{
    public static ExpeditionManager Instance { get; private set; }

    // GDD §2 — Definido: múltiplas expedições simultâneas são permitidas — uma por
    // planeta. Nunca duas expedições ativas ao mesmo tempo para o MESMO planeta
    // (planetId é a chave natural, já que essa regra o torna único entre as ativas).
    public List<ActiveExpedition> ActiveExpeditions { get; private set; } = new List<ActiveExpedition>();

    [SerializeField] private float minDurationSeconds = 30f; // piso mesmo com muita redução de Piloto

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public bool HasActiveExpeditionForPlanet(string planetId)
        => ActiveExpeditions.Any(e => e.planetId == planetId);

    public ActiveExpedition GetExpeditionForPlanet(string planetId)
        => ActiveExpeditions.FirstOrDefault(e => e.planetId == planetId);

    public void StartExpedition(PlanetData planet, List<CrewMember> team)
    {
        if (HasActiveExpeditionForPlanet(planet.planetId))
        {
            Debug.LogWarning($"Já existe uma expedição em andamento no planeta {planet.planetId}.");
            return;
        }

        var memberIds = team.ConvertAll(m => m.memberId);
        TeamManager.Instance.SetMembersOnExpedition(memberIds, onExpedition: true);

        // Classe Piloto/Navegador reduz a duração (GDD §3).
        float durationReduction = team
            .Select(m => TeamManager.Instance.GetClassData(m.classId))
            .Where(c => c != null)
            .Sum(c => c.durationReductionSeconds);
        float finalDuration = Mathf.Max(minDurationSeconds, planet.expeditionDurationSeconds - durationReduction);

        ActiveExpeditions.Add(new ActiveExpedition
        {
            planetId = planet.planetId,
            memberIds = memberIds,
            startTimeUtcIso = DateTime.UtcNow.ToString("o"), // formato ISO 8601 round-trip
            durationSeconds = finalDuration
        });

        SaveManager.Instance.SaveGame(); // persiste já com o timer iniciado (Parte 9)
    }

    /// Chame isso periodicamente (ex.: a cada frame na tela do planeta, ou ao abrir o app)
    /// para saber se já dá pra resolver o resultado daquele planeta específico.
    public bool IsExpeditionCompleteForPlanet(string planetId)
    {
        var expedition = GetExpeditionForPlanet(planetId);
        return expedition != null && expedition.IsComplete();
    }

    public void ClearExpedition(string planetId)
    {
        var expedition = GetExpeditionForPlanet(planetId);
        if (expedition == null) return;
        TeamManager.Instance.SetMembersOnExpedition(expedition.memberIds, onExpedition: false);
        ActiveExpeditions.Remove(expedition);
        SaveManager.Instance.SaveGame();
    }

    // Usado pelo SaveManager (Parte 9) ao carregar o save.
    public void LoadActiveExpeditions(List<ActiveExpedition> expeditions)
        => ActiveExpeditions = expeditions ?? new List<ActiveExpedition>();
}
```

> A exclusividade "nunca o mesmo planeta duas vezes" vem de graça: como `planetId` só
> entra em `ActiveExpeditions` via `StartExpedition` (que recusa duplicata), ele funciona
> como chave única entre as expedições ativas — não precisa de um Dictionary/lock à parte.
> A exclusividade "um membro não pode estar em duas expedições" continua garantida pelo
> `isOnExpedition` do `CrewMember` (Parte 3), que já é verificado indiretamente: montar
> uma equipe só oferece `GetAvailableMembers()`.

### 3.3 Exibir o tempo restante na UI

> Como agora pode haver várias expedições ativas ao mesmo tempo (uma por planeta), o
> display é **vinculado a um planeta específico** — cada card de planeta no mapa da
> galáxia (GDD §10) instancia o seu.

```csharp
// Caminho: Assets/_Project/Scripts/UI/ExpeditionTimerDisplay.cs
using UnityEngine;
using TMPro;

public class ExpeditionTimerDisplay : MonoBehaviour
{
    [SerializeField] private TMP_Text timeLabel;
    private string planetId;

    public void Bind(string planetId) => this.planetId = planetId;

    void Update()
    {
        if (string.IsNullOrEmpty(planetId)) return;

        var expedition = ExpeditionManager.Instance.GetExpeditionForPlanet(planetId);
        if (expedition == null)
        {
            timeLabel.text = string.Empty; // sem expedição ativa neste planeta
            return;
        }

        float remaining = expedition.GetRemainingSeconds();
        var span = System.TimeSpan.FromSeconds(remaining);
        timeLabel.text = remaining > 0
            ? $"{span.Hours:00}:{span.Minutes:00}:{span.Seconds:00}"
            : "Concluída!";
    }
}
```

### ✅ Checkpoint da Fase 3
- Chamar `StartExpedition` com dois planetas de teste diferentes (duração curta, ex.: 30s cada) e ver os dois labels de tempo contando regressivamente ao mesmo tempo, cada um vinculado (`Bind`) ao seu `planetId`.
- Chamar `StartExpedition` de novo para um planeta que já tem expedição ativa → é recusado (log de aviso), a expedição existente não é substituída.
- Tentar montar uma equipe usando um membro que já está em outra expedição ativa → ele não aparece em `GetAvailableMembers()`.
- Fechar o Editor/app e reabrir antes do tempo acabar → o tempo restante de cada expedição continua correto (calculado por `DateTime`, não zera).
- Após o tempo acabar, `IsExpeditionCompleteForPlanet(planetId)` retorna `true` só para aquele planeta.

#### Problemas comuns
- **Tempo restante "pula" de forma estranha ao reabrir o app:** confira se o dispositivo/emulador não está com o fuso horário ou relógio do sistema incorreto — `DateTime.UtcNow` depende do relógio do SO.
- **`SaveManager.Instance` nulo ao chamar `StartExpedition`:** implemente a Parte 9 (Save Local) antes de testar esta fase fim-a-fim, ou comente temporariamente a linha de save.
- **Duas expedições parecem "brigar" pelo mesmo timer na UI:** confira se cada `ExpeditionTimerDisplay` foi mesmo vinculado (`Bind`) ao `planetId` correto do card — é um erro comum reutilizar a mesma instância de UI para planetas diferentes sem rebindar.

Próxima fase: **Fase 4 (Itens e Resultado da Expedição)** — resolver a expedição completa e entregar os itens.

---

# Parte 6 — Implementação Unity: Fase 4 (Itens e Resultado da Expedição)

## Fase 4 — Itens e Resultado da Expedição

> Objetivo: quando o timer zera, resolver a expedição de forma **binária** (GDD §4/§8) — sucesso entrega itens (com chance de item raro escalando pelo risco do planeta), fracasso não entrega nada e pode custar a perda permanente de um membro (permadeath, GDD §8, reduzido pela classe Médico).

> A fórmula abaixo é um **ponto de partida funcional**, não um valor balanceado — GDD §4/§8 marcam os números exatos como "em aberto" (o mecanismo — binário, com permadeath e raridade por risco — está definido). O objetivo desta fase é ter o mecanismo funcionando, não os números finais.

### 4.1 Inventário do jogador

Crie em `Assets/_Project/Scripts/Items/InventoryManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Items/InventoryManager.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class InventoryManager : MonoBehaviour
{
    public static InventoryManager Instance { get; private set; }

    // itemId -> quantidade
    private Dictionary<string, int> quantities = new Dictionary<string, int>();

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public int GetQuantity(string itemId)
        => quantities.TryGetValue(itemId, out int qty) ? qty : 0;

    public void AddItem(string itemId, int amount)
    {
        quantities[itemId] = GetQuantity(itemId) + amount;
    }

    public bool TryRemoveItem(string itemId, int amount)
    {
        if (GetQuantity(itemId) < amount) return false;
        quantities[itemId] -= amount;
        return true;
    }

    // Usado pelo SaveManager (Parte 9) para serializar/restaurar o estado.
    public List<ItemStack> GetSerializableStacks()
        => quantities.Select(kv => new ItemStack { itemId = kv.Key, quantity = kv.Value }).ToList();

    public void LoadFromStacks(List<ItemStack> stacks)
    {
        quantities.Clear();
        foreach (var stack in stacks) quantities[stack.itemId] = stack.quantity;
    }
}

[System.Serializable]
public class ItemStack
{
    public string itemId;
    public int quantity;
}
```

### 4.2 Resolver a expedição

Crie em `Assets/_Project/Scripts/Expeditions/ExpeditionResolver.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Expeditions/ExpeditionResolver.cs
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public static class ExpeditionResolver
{
    public class Result
    {
        public bool success;
        public List<ItemStack> items = new List<ItemStack>();
        public string lostMemberId; // null se ninguém foi perdido (GDD §8 — permadeath)
    }

    /// Cruza os atributos da equipe (+ equipamento de cada membro) com o risco do planeta,
    /// faz UM sorteio binário de sucesso/fracasso (GDD §4/§8), e resolve as consequências:
    /// sucesso entrega itens (raros escalando com o risco), fracasso pode custar um membro.
    public static Result Resolve(PlanetData planet, List<CrewMember> team)
    {
        int successBonus = 0, yieldBonus = 0, rareItemBonus = 0, riskReduction = 0, survivalBonus = 0;

        foreach (var member in team)
        {
            var classData = TeamManager.Instance.GetClassData(member.classId);
            if (classData != null)
            {
                successBonus += classData.successBonus;
                yieldBonus += classData.yieldBonus;
                rareItemBonus += classData.rareItemChanceBonus;
                riskReduction += classData.riskReductionBonus;
                survivalBonus += classData.memberSurvivalBonus;
            }

            if (!string.IsNullOrEmpty(member.equippedItemId))
            {
                var equipment = ItemDatabase.Instance.GetById(member.equippedItemId);
                if (equipment != null && equipment.isEquippable)
                {
                    successBonus += equipment.equipSuccessBonus;
                    yieldBonus += equipment.equipYieldBonus;
                }
            }
        }

        int effectiveRisk = Mathf.Max(0, planet.riskLevel - riskReduction);

        // Placeholder de balanceamento (GDD §4 "em aberto" nos números — mecanismo binário definido).
        float successChance = Mathf.Clamp01(0.9f - (effectiveRisk / 100f) + (successBonus / 100f));

        var result = new Result { success = Random.value <= successChance };

        if (result.success)
        {
            foreach (var entry in planet.lootTable)
            {
                float dropChance = entry.dropChance;
                if (entry.item.rarity == ItemRarity.Rare)
                {
                    // GDD §5 — Definido: raridade escala com o risco do planeta (+ bônus do Cientista).
                    dropChance *= Mathf.Clamp01((effectiveRisk / 100f) + (rareItemBonus / 100f));
                }

                if (Random.value <= dropChance)
                {
                    int quantity = Random.Range(entry.minQuantity, entry.maxQuantity + 1) + yieldBonus;
                    InventoryManager.Instance.AddItem(entry.item.itemId, quantity);
                    result.items.Add(new ItemStack { itemId = entry.item.itemId, quantity = quantity });
                }
            }
        }
        else
        {
            // GDD §8 — Definido: permadeath na falha, reduzido pela classe Médico.
            float lossChance = Mathf.Clamp01(0.3f - (survivalBonus / 100f));
            if (team.Count > 0 && Random.value <= lossChance)
            {
                var lost = team[Random.Range(0, team.Count)];
                result.lostMemberId = lost.memberId;
                TeamManager.Instance.RemoveMember(lost.memberId);
            }
        }

        return result;
    }
}
```

### 4.3 Fluxo completo na tela de resultado

```csharp
// Caminho: Assets/_Project/Scripts/UI/ExpeditionResultScreen.cs
using System.Linq;
using UnityEngine;

public class ExpeditionResultScreen : MonoBehaviour
{
    // Chamado a partir do card do planeta no mapa da galáxia (GDD §10) — como várias
    // expedições podem estar ativas ao mesmo tempo, esta tela sempre opera sobre UM
    // planeta específico, não sobre "a" expedição atual.
    public void OnClaimResultButtonPressed(string planetId)
    {
        var expedition = ExpeditionManager.Instance.GetExpeditionForPlanet(planetId);
        if (expedition == null || !expedition.IsComplete()) return;

        var (galaxy, planet) = ProgressManager.Instance.FindPlanetById(planetId);
        var team = expedition.memberIds
            .Select(id => TeamManager.Instance.Roster.Find(m => m.memberId == id))
            .Where(m => m != null) // pode já ter sido removido (ver permadeath, ExpeditionResolver)
            .ToList();

        var result = ExpeditionResolver.Resolve(planet, team);
        // TODO: exibir `result.items` na UI (ícone + quantidade por item);
        // se `result.lostMemberId != null`, exibir aviso de perda permanente de membro.

        ProgressManager.Instance.OnExpeditionClaimed(galaxy, planet); // GDD §4 — desbloqueio linear
        ExpeditionManager.Instance.ClearExpedition(planetId);
        SaveManager.Instance.SaveGame();
    }
}
```

### ✅ Checkpoint da Fase 4
- Expedição com sucesso: itens chegam ao `InventoryManager` (confira com `GetQuantity`), e o próximo planeta da galáxia aparece como desbloqueado (`ProgressManager.IsPlanetUnlocked`).
- Expedição com fracasso: nenhum item é adicionado; rode várias vezes com `memberSurvivalBonus = 0` até observar um `result.lostMemberId` não nulo e confirme que o membro sumiu de `TeamManager.Roster`.
- Com duas expedições ativas em planetas diferentes, reivindicar o resultado de uma (`OnClaimResultButtonPressed(planetId)`) não afeta a outra — ela continua em `ActiveExpeditions` normalmente.
- `ClearExpedition(planetId)` libera os membros restantes daquela expedição (`isOnExpedition = false`) e eles voltam a aparecer em `GetAvailableMembers()`.

#### Problemas comuns
- **`ItemDatabase.Instance` ou `ProgressManager.Instance` nulos:** confirme que os GameObjects dessas Fases (2) já existem na cena antes de testar esta fase — todos usam o mesmo padrão de singleton `DontDestroyOnLoad`.
- **Item raro nunca aparece mesmo com risco alto:** confira se o `ItemData` da entrada da loot table está mesmo com `rarity = Rare` — só entradas raras recebem o multiplicador de risco.

Próxima fase: **Fase 5 (Crafting de Equipamentos)** — transformar itens coletados em tecnologia.

---

# Parte 7 — Implementação Unity: Fase 5 (Crafting de Equipamentos)

## Fase 5 — Crafting de Equipamentos

> Objetivo: permitir combinar itens do inventário em equipamentos ("tecnologias mais modernas", GDD §6) via receitas definidas como dados, e equipar o resultado em um membro específico da equipe.

> GDD §6 — Definido: o equipamento craftado é atribuído a um **membro específico** (1 slot por membro no MVP), não é um upgrade geral da operação. O fluxo é em duas etapas: craftar (recipe consome itens, produz um `ItemData` com `isEquippable = true` no inventário) e depois equipar (move esse item do inventário para o slot de um membro).

### 5.1 ScriptableObject de receita

Crie em `Assets/_Project/Scripts/Crafting/RecipeData.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Crafting/RecipeData.cs
using UnityEngine;

[CreateAssetMenu(fileName = "NewRecipe", menuName = "StarExpeditionCo/Recipe")]
public class RecipeData : ScriptableObject
{
    public string recipeId;
    public string displayName;
    public ItemStackRequirement[] requiredItems;
    public ItemData resultItem;
    public int resultQuantity = 1;
}

[System.Serializable]
public class ItemStackRequirement
{
    public ItemData item;
    public int quantity;
}
```

### 5.2 Gerenciador de crafting

Crie em `Assets/_Project/Scripts/Crafting/CraftingManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Crafting/CraftingManager.cs
using UnityEngine;

public class CraftingManager : MonoBehaviour
{
    public bool CanCraft(RecipeData recipe)
    {
        foreach (var req in recipe.requiredItems)
        {
            if (InventoryManager.Instance.GetQuantity(req.item.itemId) < req.quantity)
                return false;
        }
        return true;
    }

    public bool TryCraft(RecipeData recipe)
    {
        if (!CanCraft(recipe)) return false;

        foreach (var req in recipe.requiredItems)
            InventoryManager.Instance.TryRemoveItem(req.item.itemId, req.quantity);

        InventoryManager.Instance.AddItem(recipe.resultItem.itemId, recipe.resultQuantity);
        SaveManager.Instance.SaveGame();
        return true;
    }
}
```

### 5.3 Equipar o resultado em um membro

Crie em `Assets/_Project/Scripts/Crafting/EquipmentManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Crafting/EquipmentManager.cs
using UnityEngine;

public class EquipmentManager : MonoBehaviour
{
    public bool TryEquip(CrewMember member, ItemData equipmentItem)
    {
        if (!equipmentItem.isEquippable) return false;
        if (!InventoryManager.Instance.TryRemoveItem(equipmentItem.itemId, 1)) return false;

        // 1 slot por membro (GDD §6) — se já tinha equipamento, devolve pro inventário (swap).
        if (!string.IsNullOrEmpty(member.equippedItemId))
            InventoryManager.Instance.AddItem(member.equippedItemId, 1);

        member.equippedItemId = equipmentItem.itemId;
        SaveManager.Instance.SaveGame();
        return true;
    }

    public void Unequip(CrewMember member)
    {
        if (string.IsNullOrEmpty(member.equippedItemId)) return;
        InventoryManager.Instance.AddItem(member.equippedItemId, 1);
        member.equippedItemId = null;
        SaveManager.Instance.SaveGame();
    }
}
```

> Os bônus do equipamento (`equipSuccessBonus`/`equipYieldBonus`) só têm efeito quando lidos
> pelo `ExpeditionResolver` (Parte 6) via `member.equippedItemId` — `EquipmentManager` só
> gerencia a posse do item, não recalcula nada sozinho.

### 5.4 Configurar no Inspector

1. Crie 2-3 `RecipeData` de teste em `ScriptableObjects/Recipes`, referenciando itens de Matéria-prima/Componente (Fase 2) como requisito, com um `ItemData` novo — marcado `isEquippable = true` e com algum `equipSuccessBonus`/`equipYieldBonus` — como resultado. Para testar a árvore ramificada por tier (GDD §6), faça pelo menos uma receita avançada exigir o resultado de uma receita anterior como ingrediente.
2. Adicione `CraftingManager` e `EquipmentManager` a um GameObject na cena de crafting/roster.

### ✅ Checkpoint da Fase 5
- Com itens suficientes no inventário, `CanCraft(recipe)` retorna `true` e `TryCraft(recipe)` consome os itens e adiciona o resultado.
- Sem itens suficientes, `TryCraft` retorna `false` e nada é consumido.
- `TryEquip(member, item)` com o equipamento craftado no inventário move o item pro `member.equippedItemId` e remove 1 unidade do inventário.
- Equipar um segundo item no mesmo membro devolve o equipamento anterior ao inventário (swap), sem duplicar nem perder itens.

Próxima fase: **Fase 6 (Economia: Loja e Contratação)** — vender itens e contratar novos membros.

---

# Parte 8 — Implementação Unity: Fase 6 (Economia: Loja e Contratação)

## Fase 6 — Economia: Loja e Contratação

> Objetivo: converter itens em moeda (venda) e usar a moeda para contratar novos membros de equipe (GDD §7).

### 6.1 Moeda do jogador

Crie em `Assets/_Project/Scripts/Economy/CurrencyManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Economy/CurrencyManager.cs
using UnityEngine;

public class CurrencyManager : MonoBehaviour
{
    public static CurrencyManager Instance { get; private set; }

    public int CurrentAmount { get; private set; }

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void Add(int amount) => CurrentAmount += amount;

    public bool TrySpend(int amount)
    {
        if (CurrentAmount < amount) return false;
        CurrentAmount -= amount;
        return true;
    }

    public void SetAmount(int amount) => CurrentAmount = amount; // usado pelo SaveManager (Parte 9)
}
```

### 6.2 Venda de itens

```csharp
// Caminho: Assets/_Project/Scripts/Economy/ShopManager.cs
using UnityEngine;

public class ShopManager : MonoBehaviour
{
    public bool TrySellItem(ItemData item, int quantity)
    {
        if (!InventoryManager.Instance.TryRemoveItem(item.itemId, quantity))
            return false;

        CurrencyManager.Instance.Add(item.sellValue * quantity);
        SaveManager.Instance.SaveGame();
        return true;
    }
}
```

### 6.3 Contratação de novos membros

> GDD §7 — Definido: contratação **sempre disponível por classe** — qualquer uma das 6 classes já desbloqueadas pode ser contratada a qualquer momento por um custo fixo/crescente (`CrewClassData.hireCost`). Sem loja rotativa de recrutas no MVP (fica pós-MVP, GDD §13, se entrar depois).

```csharp
// Caminho: Assets/_Project/Scripts/Economy/HireManager.cs
using UnityEngine;

public class HireManager : MonoBehaviour
{
    public bool TryHire(CrewClassData classData, string chosenName)
    {
        if (!CurrencyManager.Instance.TrySpend(classData.hireCost))
            return false;

        var newMember = new CrewMember(classData.classId, chosenName);
        TeamManager.Instance.AddMember(newMember);
        SaveManager.Instance.SaveGame();
        return true;
    }
}
```

### ✅ Checkpoint da Fase 6
- Vender um item remove a quantidade correta do inventário e credita `sellValue * quantidade` em `CurrencyManager`.
- Contratar um membro sem moeda suficiente falha (`TryHire` retorna `false`) sem debitar nada.
- Contratar com moeda suficiente adiciona o novo membro ao `TeamManager.Roster`.

Próxima fase: **Fase 7 (Save Local)** — persistir todo o estado do jogo (roster, inventário, moeda, expedições ativas) entre sessões.

---

# Parte 9 — Implementação Unity: Fase 7 (Save Local)

## Fase 7 — Save Local

> Objetivo: persistir o estado completo do jogo em disco (sem backend, GDD §12) e restaurá-lo ao abrir o app — incluindo todas as expedições ativas (uma por planeta), para que o timer real (Fase 3) sobreviva a fechar/reabrir o app.

### 7.1 Estrutura de dados do save

Crie em `Assets/_Project/Scripts/Save/SaveData.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Save/SaveData.cs
using System;
using System.Collections.Generic;

[Serializable]
public class SaveData
{
    public List<CrewMember> roster = new List<CrewMember>();          // inclui equippedItemId por membro (GDD §6)
    public List<ItemStack> inventory = new List<ItemStack>();
    public int currency;
    public List<ActiveExpedition> activeExpeditions = new List<ActiveExpedition>(); // uma por planeta (GDD §2)
    public List<string> unlockedPlanetIds = new List<string>();        // GDD §4 — progressão linear
    public List<string> unlockedGalaxyIds = new List<string>();
}
```

### 7.2 Gerenciador de save

Crie em `Assets/_Project/Scripts/Save/SaveManager.cs`:

```csharp
// Caminho: Assets/_Project/Scripts/Save/SaveManager.cs
using System.IO;
using UnityEngine;

public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance { get; private set; }

    private string SavePath => Path.Combine(Application.persistentDataPath, "save.json");

    void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    public void SaveGame()
    {
        var data = new SaveData
        {
            roster = TeamManager.Instance.Roster,
            inventory = InventoryManager.Instance.GetSerializableStacks(),
            currency = CurrencyManager.Instance.CurrentAmount,
            activeExpeditions = ExpeditionManager.Instance.ActiveExpeditions,
            unlockedPlanetIds = ProgressManager.Instance.GetSerializableUnlockedPlanetIds(),
            unlockedGalaxyIds = ProgressManager.Instance.GetSerializableUnlockedGalaxyIds()
        };

        string json = JsonUtility.ToJson(new SaveDataWrapper(data), prettyPrint: true);
        File.WriteAllText(SavePath, json);
    }

    public void LoadGame()
    {
        if (!File.Exists(SavePath)) return; // primeira sessão — nada a carregar

        string json = File.ReadAllText(SavePath);
        var data = JsonUtility.FromJson<SaveDataWrapper>(json).data;

        TeamManager.Instance.LoadRoster(data.roster);
        InventoryManager.Instance.LoadFromStacks(data.inventory);
        CurrencyManager.Instance.SetAmount(data.currency);
        ExpeditionManager.Instance.LoadActiveExpeditions(data.activeExpeditions);
        ProgressManager.Instance.LoadFromSave(data.unlockedPlanetIds, data.unlockedGalaxyIds);
    }
}

// JsonUtility não serializa listas na raiz do JSON diretamente — o wrapper resolve isso.
[System.Serializable]
public class SaveDataWrapper
{
    public SaveData data;
    public SaveDataWrapper(SaveData data) { this.data = data; }
}
```

> `TeamManager.LoadRoster(...)` (Fase 1), `ExpeditionManager.LoadActiveExpeditions(...)` (Fase 3) e `ProgressManager.LoadFromSave(...)` (Fase 2) já foram definidos nas fases correspondentes — esta fase só os chama a partir do save carregado.

### 7.3 Carregar o save ao abrir o jogo

1. Coloque `SaveManager`, `TeamManager`, `InventoryManager`, `CurrencyManager`, `ExpeditionManager`, `ItemDatabase` e `ProgressManager` no mesmo GameObject "Managers" (ou GameObjects separados) na cena inicial, todos com `DontDestroyOnLoad`.
2. Garanta que `SaveManager.Awake()` roda **depois** que os outros managers já setaram seu `Instance` — a ordem de `Awake()` de objetos diferentes na mesma cena não é garantida. Solução simples: defina a ordem de execução em `Edit → Project Settings → Script Execution Order`, colocando `SaveManager` por último; ou chame `LoadGame()` a partir de um `Start()` (que roda depois de todos os `Awake()`) em vez de dentro do próprio `Awake()` do `SaveManager`.

### ✅ Checkpoint da Fase 7
- Jogar uma sessão (contratar membro, iniciar expedições em 2 planetas diferentes ao mesmo tempo, coletar itens, craftar e equipar um item, reivindicar resultado), fechar o Play Mode/app, reabrir → todo o estado (roster com equipamento por membro, inventário, moeda, cada expedição ativa com o tempo restante correto, planetas/galáxias desbloqueados) volta como estava.
- Arquivo `save.json` existe em `Application.persistentDataPath` (no Editor, geralmente `%userprofile%\AppData\LocalLow\<Empresa>\StarExpeditionCo\save.json` no Windows).

#### Problemas comuns
- **Estado não persiste entre sessões do Editor:** confira se `SaveGame()` está de fato sendo chamado após cada ação relevante (contratar, craftar, vender, iniciar/coletar expedição) — não há autosave por tempo nesta implementação.
- **`JsonUtility` retorna campos zerados/nulos:** `JsonUtility` não serializa `Dictionary<>` nem propriedades (`{ get; set; }`) sem backing field exposto — por isso o inventário usa `List<ItemStack>` em vez de `Dictionary` diretamente no save.

Próxima fase: **Fase 8 (Build e Próximos Passos)** — gerar o build mobile e revisar o que falta.

---

# Parte 10 — Implementação Unity: Fase 8 (Build e Próximos Passos)

## Fase 8 — Build e Próximos Passos

> Objetivo: gerar um build mobile jogável do MVP e listar o que fica para depois.

### 8.1 Gerar o build

1. `File → Build Settings` → confirme a plataforma (Android/iOS) e que a cena `Base` está na lista de cenas do build.
2. **Android:** `Player Settings → Other Settings` → defina `Package Name` (formato `com.<estudio>.starexpeditionco`) e `Minimum API Level`. Clique **Build** (ou **Build and Run** com um dispositivo/emulador conectado).
3. **iOS:** `Build` gera um projeto Xcode — abra-o no Xcode (Mac) para assinar e rodar num dispositivo/simulador.

### 8.2 Teste manual do loop completo antes de considerar o MVP pronto

Percorra o loop da seção 2 do GDD de ponta a ponta no build real (não só no Editor):
1. Contratar membro inicial (ou usar roster inicial pré-populado com as 6 classes).
2. No mapa da galáxia, escolher **dois** planetas desbloqueados, montar uma equipe (1 a 3 membros) para cada e iniciar as duas expedições — confirmar que rodam em paralelo, cada uma com seu timer.
3. Tentar iniciar uma segunda expedição no mesmo planeta de uma já ativa → deve ser recusado.
4. Fechar o app, esperar (ou usar uma duração curta de teste), reabrir.
5. Reivindicar o resultado de cada planeta separadamente: se sucesso, ver os itens no inventário e o próximo planeta desbloqueado; se fracasso, confirmar que nada foi entregue (e, eventualmente, testar a perda permanente de um membro).
6. Craftar um equipamento e equipá-lo em um membro.
7. Vender um item.
8. Contratar um novo membro com a moeda obtida.
9. Fechar e reabrir o app novamente — tudo deve persistir, incluindo expedições ainda ativas, desbloqueio de planetas e equipamento por membro.

### ✅ Checkpoint da Fase 8
- Build instala e abre em um dispositivo/emulador real.
- Loop completo (passos 8.2) funciona sem crashes.
- Fechar/reabrir o app em qualquer ponto do loop não perde progresso nem quebra o timer de nenhuma expedição ativa.

### Próximos passos (fora do escopo deste guia)

Ver GDD §13 e §14 para a lista completa de itens em aberto e pós-MVP — a maior parte das
decisões de design já foi fechada (6 classes, slots de equipe, resolução binária,
permadeath, raridade por risco, equipamento por membro, desbloqueio linear, contratação
sempre disponível, mapa navegável, estilo pixel art). O que resta é:
- Balanceamento numérico fino (bônus por classe/equipamento, chance de sucesso, chance de perda de membro) — mecanismo já implementado em `ExpeditionResolver` (Parte 6), valores ficam para playtesting.
- Layout/wireframe visual de cada tela (GDD §10).
- Efeitos sonoros específicos além da trilha ambiente (GDD §11).
- Features conscientemente pós-MVP: notificações push, log narrativo de eventos, progressão individual de membro, cloud save, monetização, loja rotativa de recrutas (GDD §13).

---
*Versão: rascunho inicial — a refinar conforme prototipagem.*
