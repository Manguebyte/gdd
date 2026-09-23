# GDD — "PROTOCOLO ECTOPLASMA" (título provisório)
*Documento de Design de Jogo v0.1*

---

## 1. Visão Geral / Pitch

Em um futuro próximo, a humanidade descobriu uma tecnologia capaz de detectar e capturar fantasmas. O plasma ectoplasmático extraído deles virou a base de uma nova indústria tecnológica — mas o preço social foi alto: bairros "contaminados" perderam valor imobiliário, viraram zonas abandonadas, e surgiram empresas de "limpeza" especializadas em exterminar essas presenças.

Você é um operador dessas empresas. Sua função: escolher zonas contaminadas no mapa da cidade, entrar nelas, sugar o plasma dos fantasmas com sua arma, evitar (ou não) confrontar o dilema moral por trás do trabalho, e progredir tecnologicamente até limpar toda a cidade — só para descobrir, no final, que talvez estivesse destruindo memórias de pessoas que um dia foram amadas.

**Gênero:** Ação top-down com gestão/seleção de missões via mapa, pixel art.
**Plataforma-alvo:** PC (Steam/itch.io), possível expansão mobile depois do MVP.
**Referência visual:** ângulo tipo Stardew Valley (top-down com leve inclinação que revela o personagem).
**Tom:** Começa como um "job simulator" satírico/capitalista, termina em tragédia reflexiva.

---

## 2. Pilares de Design

1. **Tensão risco x recompensa na escolha de missão** — o jogador vê o mapa da cidade e decide, mas o risco é visual, não garantido (ele pode errar o julgamento).
2. **Combate tátil e de resistência** — sugar plasma é um ato de paciência e risco: soltar cedo demais = perder progresso.
3. **Progressão tangível** — cada casa limpa gera upgrade, criando um loop viciante de "mais uma antes de dormir".
4. **Crítica silenciosa** — a mecânica em si é divertida e capitalista (upgrade, upgrade, upgrade), mas a narrativa vai minando essa alegria aos poucos.

---

## 3. Narrativa e Lore

### 3.1 Contexto do mundo
- A tecnologia de detecção espectral ("Detector-E") foi criada há poucos anos.
- O plasma ectoplasmático movimenta uma nova bolha econômica (baterias, eletrônicos, energia).
- Bairros com muitos fantasmas ("Zonas-C", de "Contaminadas") sofreram desvalorização imobiliária.
- Surgiram empresas de limpeza espectral — sua empregadora é uma delas, competindo com concorrentes (pode ser só lore, sem necessidade de outras empresas jogáveis).

### 3.2 Arco narrativo
- **Ato 1 (Tutorial/primeiros bairros):** Tom leve, quase corporativo — "limpe as casas, ganhe upgrades, ajude a cidade a se revalorizar". O jogador é recompensado e a mecânica de sucção é ensinada como puramente instrumental.
- **Ato 2 (meio do jogo):** Pequenas pistas textuais — bilhetes, fotos, áudios encontrados nas casas — sugerem que os fantasmas têm memórias, relações, nomes. Talvez algum NPC (um morador antigo, um ativista) questione o trabalho do jogador.
- **Ato 3 (final):** Ao limpar a última zona, uma cutscene/texto revela que era possível **se comunicar** com os fantasmas — existia uma tecnologia alternativa (comunicação, não extração) que a empresa escondeu por ser menos lucrativa. O jogador vê o que "poderia ter sido": os fantasmas eram entes queridos de moradores, e a cidade escolheu destruição e capitalismo em vez de contato.
- **Final:** tela de cidade "limpa" mas vazia — sem calor humano, um comentário visual/sonoro de vitória vazia.

*Sugestão: considerar um final alternativo/oculto onde o jogador escolhe não sugar uma das últimas casas (ou usa uma "opção de comunicação" desbloqueada tardiamente) — recompensa narrativa para quem prestou atenção nas pistas.*

---

## 4. Estilo Visual e Áudio

- **Arte:** Pixel art, paleta urbana (cinzas, neon publicitário nas zonas "limpas", verde/roxo etérico nas zonas contaminadas).
- **Câmera:** Top-down com leve perspectiva (como Stardew Valley) — permite ver sprite do personagem e prédios com fachada.
- **Contraste visual:** bairros limpos = cores vivas, movimento de pedestres; bairros contaminados = cores dessaturadas, névoa ectoplasmática, sprites de fantasmas semitransparentes.
- **Áudio:** trilha corporativa/lo-fi nas fases iniciais (elevator music irônica), que vai se tornando mais melancólica/ambiente conforme a narrativa avança.

---

## 5. Core Loop

```
[Mapa da Cidade] 
   → Escolher bairro/imóvel contaminado
   → Ver nível de ameaça (referência visual de força vs seu upgrade atual)
   → Entrar na cena da casa/rua (gameplay top-down)
   → Sugar fantasmas (combate) + usar armadilhas
   → Casa 100% limpa → volta ao mapa
   → Gastar plasma coletado em upgrades
   → Repetir até cidade 100% limpa
```

---

## 6. Mecânicas Principais

### 6.1 Mapa da Cidade (Hub)
- Cena única mostrando bairros/imóveis como ícones/quadrantes no mapa.
- Cada imóvel tem um **indicador de nível de ameaça** (ex.: ícone de caveira com 1 a 5 "pips", ou cor: verde/amarelo/vermelho/roxo).
- O jogador pode entrar em qualquer imóvel a qualquer momento — não há bloqueio rígido, só risco.
- Sugestão: se o nível de ameaça for muito acima do upgrade do jogador, os fantasmas podem ter ataques que o jogador ainda não consegue evitar, ou a barra de plasma deles regenera mais rápido que a capacidade de sucção — ou seja, a "dificuldade alta" se traduz em números de jogo, não em bloqueio artificial.
- Progresso visual: bairros limpos mudam de aparência no mapa (cor de volta ao normal, ícones de "valorizado").

### 6.2 Combate — Sucção de Plasma
- Botão direito do mouse: **segurar** para mirar e sugar.
- Barra de plasma do fantasma se esvazia enquanto o botão é segurado e a mira permanece nele.
- Se o jogador soltar o botão antes de zerar a barra, o plasma do fantasma **regenera** com o tempo (pressão de decisão: continuar arriscando ou recuar).
- Fantasmas podem se mover, fugir, ou atacar o jogador enquanto estão sendo sugados (dependendo do tipo/nível), criando tensão de manter a mira.
- Considerar: sistema de "estabilidade de mira" — se o jogador se move enquanto suga, a sucção é interrompida ou fica mais lenta (recompensa ficar parado, arriscando receber dano).

### 6.3 Armadilhas
- O jogador pode posicionar armadilhas no ambiente antes ou durante a limpeza.
- Duas variantes possíveis (podem coexistir):
  - **Armadilha de suporte:** atrai o fantasma ou reduz sua velocidade/regeneração, facilitando a sucção manual.
  - **Armadilha autônoma:** suga sozinha, mais lentamente que o jogador, útil para "descuidar" de uma área enquanto foca em outra ameaça.
- Armadilhas consomem recursos (compradas/craftadas com plasma) — cria decisão econômica: gastar plasma em armadilhas ou em upgrades de arma.

### 6.4 Upgrades
- Após cada casa 100% limpa, o jogador acessa uma tela/menu de upgrade.
- Sugestões de árvore de upgrade:
  - **Velocidade de sucção** (arma principal)
  - **Capacidade de plasma armazenado** (quanto pode carregar antes de precisar "descarregar"/vender)
  - **Resistência a contra-ataques** (menos dano recebido de fantasmas)
  - **Alcance de mira**
  - **Armadilhas** (mais armadilhas simultâneas, upgrades específicos de armadilha)
  - **Upgrades "de história"** — desbloqueiam a possibilidade de ouvir/ler memórias do fantasma antes de sugá-lo (conecta mecânica a narrativa).

### 6.5 Condição de Vitória
- Jogo termina quando 100% dos imóveis/bairros da cidade estão limpos.
- Dispara sequência final narrativa (ver seção 3.2).

---

## 7. Tipos de Fantasmas (sugestão inicial)

| Tipo | Comportamento | Dificuldade |
|---|---|---|
| Errante | Parado ou movimento lento, sem ataque | Baixa |
| Assombrado | Foge quando mirado, exige reposicionamento | Média |
| Poltergeist | Ataca objetos do cenário contra o jogador | Média-Alta |
| Residual (boss de bairro) | Grande reserva de plasma, múltiplas fases, pode exigir armadilhas + sucção combinadas | Alta |

*Cada tipo pode ter uma "memória" associada (item colecionável/lore) que reforça o tema central.*

---

## 8. UI/UX

- **Tela de mapa:** ícones de bairro com indicador de ameaça, filtro por "limpo/contaminado", contador de progresso total da cidade.
- **HUD em gameplay:** barra de plasma do jogador (energia/estamina de sucção), barra de plasma de cada fantasma mirado, contador de armadilhas disponíveis.
- **Tela de upgrade:** árvore simples, estilo "loja", usando o plasma coletado como moeda.

---

## 9. Escopo de MVP (sugestão)

Para um protótipo jogável rápido:
1. 1 bairro do mapa com 3-4 imóveis.
2. 1 tipo de fantasma (Errante) + 1 boss simples (Residual).
3. Mecânica de sucção funcional (botão direito, barra, regeneração ao soltar).
4. 1 tipo de armadilha (autônoma simples).
5. Upgrade único: velocidade de sucção (para validar o loop de progressão).
6. Sem narrativa completa — só o gancho inicial e um teaser do final.

---

## 10. Roteiro de Implementação em Unity (visão geral)

Considerando que você está começando com Unity, sugiro dividir o desenvolvimento em fases, similar aos outros projetos:

1. **Fase 1 — Setup e movimentação do personagem** (top-down controller, câmera com ângulo Stardew-like).
2. **Fase 2 — Cena de mapa da cidade** (UI de seleção de bairro, transição de cena).
3. **Fase 3 — Sistema de mira e sucção** (input do botão direito, barra de plasma do fantasma, regeneração).
4. **Fase 4 — IA básica de fantasma** (parado, fuga, ataque simples).
5. **Fase 5 — Sistema de armadilhas** (spawn, funcionamento autônomo/suporte).
6. **Fase 6 — Sistema de upgrades e economia de plasma** (persistência entre cenas, ScriptableObjects para upgrades).
7. **Fase 7 — Narrativa e final** (sistema de diálogo/lore simples, cutscene final).

Posso detalhar qualquer uma dessas fases em um tutorial passo a passo de Unity, como fiz nos seus outros projetos, se você quiser.

---

## 11. Passo a Passo Detalhado de Implementação em Unity

> Escrito para quem está começando com Unity agora. Nomes de pastas, GameObjects, scripts, variáveis e funções em inglês (convenção padrão da engine/comunidade), explicações em português.

### 11.0 Estrutura de Pastas (Project window)

Crie essa estrutura dentro de `Assets/` antes de começar:

```
Assets/
 ├─ _Scenes/
 │   ├─ CityMapScene
 │   └─ HouseScene (uma cena "genérica" que vai carregar layouts diferentes, ou uma por bairro)
 ├─ Scripts/
 │   ├─ Player/
 │   ├─ Ghosts/
 │   ├─ Traps/
 │   ├─ Map/
 │   ├─ Upgrades/
 │   ├─ Managers/
 │   └─ UI/
 ├─ Prefabs/
 │   ├─ Player/
 │   ├─ Ghosts/
 │   ├─ Traps/
 │   └─ UI/
 ├─ Sprites/
 ├─ Animations/
 ├─ ScriptableObjects/
 │   ├─ GhostData/
 │   ├─ UpgradeData/
 │   └─ NeighborhoodData/
 └─ Audio/
```

Isso evita a bagunça mais comum de projeto iniciante (tudo solto na raiz de Assets).

---

### 11.1 Fase 1 — Setup do Projeto e Movimentação do Personagem

**Objetivo:** ter um personagem 2D andando pela cena com visual "top-down anguloso" tipo Stardew Valley.

1. Crie um novo projeto 2D (Universal 2D Template).
2. Nota importante sobre o "ângulo": em jogos como Stardew Valley, a câmera é ortográfica e olha reto de cima, mas os **sprites são desenhados com perspectiva 3/4** (você vê o topo da cabeça e o rosto ao mesmo tempo). Ou seja, o "ângulo" vem da arte, não da câmera. Você não precisa inclinar a câmera — mantenha a Main Camera com projeção `Orthographic`, olhando reto para baixo no eixo Z.
3. Crie um GameObject vazio chamado `Player`.
4. Adicione os componentes:
   - `Sprite Renderer` (com o sprite do personagem)
   - `Rigidbody2D` (Body Type: `Dynamic`, Gravity Scale: `0`, para não cair)
   - `Collider2D` (ex: `CapsuleCollider2D`)
5. Crie a pasta `Scripts/Player/` e o script `PlayerMovement.cs`.

```csharp
using UnityEngine;

public class PlayerMovement : MonoBehaviour
{
    public float moveSpeed = 5f;

    private Rigidbody2D rb;
    private Vector2 moveInput;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        // Le o input do teclado (WASD ou setas)
        moveInput.x = Input.GetAxisRaw("Horizontal");
        moveInput.y = Input.GetAxisRaw("Vertical");
        moveInput.Normalize(); // evita andar mais rapido na diagonal
    }

    void FixedUpdate()
    {
        rb.MovePosition(rb.position + moveInput * moveSpeed * Time.fixedDeltaTime);
    }
}
```

6. Arraste esse script para o GameObject `Player`.
7. Crie um GameObject `Main Camera` (já vem por padrão) e adicione um script simples `CameraFollow.cs` na pasta `Scripts/Player/` para seguir o jogador:

```csharp
using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    public Transform target; // arraste o Player aqui no Inspector
    public float smoothSpeed = 5f;
    public Vector3 offset = new Vector3(0, 0, -10);

    void LateUpdate()
    {
        if (target == null) return;
        Vector3 desiredPosition = target.position + offset;
        transform.position = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed * Time.deltaTime);
    }
}
```

8. Teste: apertar Play e mover o personagem com WASD.

---

### 11.2 Fase 2 — Cena do Mapa da Cidade (Hub)

**Objetivo:** uma cena separada (`CityMapScene`) com ícones clicáveis representando os bairros/imóveis.

1. Crie a cena `CityMapScene` dentro de `_Scenes/`.
2. Crie um `Canvas` (UI > Canvas).
3. Dentro do Canvas, crie um botão para cada imóvel: `Button (Neighborhood)`, renomeie para algo como `Button_House01`.
4. Crie a pasta `ScriptableObjects/NeighborhoodData/` e um script `NeighborhoodData.cs` em `Scripts/Map/`:

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewNeighborhood", menuName = "Data/NeighborhoodData")]
public class NeighborhoodData : ScriptableObject
{
    public string neighborhoodName;
    public int threatLevel; // 1 a 5, por exemplo
    public bool isCleaned;
    public string sceneToLoad; // nome da cena da casa correspondente
}
```

Isso permite criar um "arquivo de dados" por bairro direto no Editor (botão direito na pasta > Create > Data > NeighborhoodData), sem precisar programar cada bairro na unha.

5. Crie o script `MapButton.cs` em `Scripts/Map/` e coloque em cada botão:

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class MapButton : MonoBehaviour
{
    public NeighborhoodData data;
    public Image threatIcon; // referencia a um icone de ameaca no botao

    void Start()
    {
        UpdateVisual();
        GetComponent<Button>().onClick.AddListener(OnClick);
    }

    void UpdateVisual()
    {
        // aqui voce pode trocar a cor/sprite do threatIcon
        // dependendo de data.threatLevel e data.isCleaned
    }

    void OnClick()
    {
        SceneManager.LoadScene(data.sceneToLoad);
    }
}
```

6. Crie um `NeighborhoodData` asset para cada imóvel e arraste no campo `data` de cada botão correspondente no Inspector.

---

### 11.3 Fase 3 — Mira e Sucção de Plasma (mecânica principal)

**Objetivo:** segurar botão direito do mouse, mirar no fantasma, esvaziar a barra de plasma dele.

1. No fantasma, crie o script `Ghost.cs` em `Scripts/Ghosts/`:

```csharp
using UnityEngine;

public class Ghost : MonoBehaviour
{
    public float maxPlasma = 100f;
    public float currentPlasma;
    public float regenRate = 5f; // quanto plasma recupera por segundo quando nao esta sendo sugado

    private bool isBeingDrained = false;

    void Awake()
    {
        currentPlasma = maxPlasma;
    }

    void Update()
    {
        if (!isBeingDrained && currentPlasma < maxPlasma)
        {
            currentPlasma += regenRate * Time.deltaTime;
            currentPlasma = Mathf.Min(currentPlasma, maxPlasma);
        }

        isBeingDrained = false; // reseta a cada frame, quem suga precisa "avisar" todo frame
    }

    public void Drain(float amount)
    {
        isBeingDrained = true;
        currentPlasma -= amount;

        if (currentPlasma <= 0)
        {
            currentPlasma = 0;
            Die();
        }
    }

    void Die()
    {
        // aqui entra: dropar plasma coletavel, tocar animacao, destruir o objeto
        Destroy(gameObject);
    }
}
```

2. No `Player`, crie o script `PlayerSuction.cs` em `Scripts/Player/`:

```csharp
using UnityEngine;

public class PlayerSuction : MonoBehaviour
{
    public float drainRate = 20f; // plasma sugado por segundo
    public float suctionRange = 5f;
    public LayerMask ghostLayer; // configure uma Layer chamada "Ghost" no Editor

    void Update()
    {
        if (Input.GetMouseButton(1)) // botao direito segurado
        {
            TryDrainGhostUnderMouse();
        }
    }

    void TryDrainGhostUnderMouse()
    {
        Vector2 mouseWorldPos = Camera.main.ScreenToWorldPoint(Input.mousePosition);
        Vector2 direction = (mouseWorldPos - (Vector2)transform.position).normalized;

        RaycastHit2D hit = Physics2D.Raycast(transform.position, direction, suctionRange, ghostLayer);

        if (hit.collider != null)
        {
            Ghost ghost = hit.collider.GetComponent<Ghost>();
            if (ghost != null)
            {
                ghost.Drain(drainRate * Time.deltaTime);
            }
        }
    }
}
```

3. Configure uma `Layer` chamada `Ghost` (Inspector > Layer > Add Layer) e atribua essa layer a todos os prefabs de fantasma. No script `PlayerSuction`, arraste essa layer no campo `Ghost Layer`.
4. Para a barra de plasma visual acima do fantasma, crie um `Canvas` do tipo `World Space` como filho do fantasma, com uma `Image` (Fill Amount) representando `currentPlasma / maxPlasma`. Isso pode ficar num script `GhostPlasmaBar.cs` separado que só lê os valores do `Ghost.cs` e atualiza o preenchimento da imagem.

---

### 11.4 Fase 4 — IA Básica de Fantasma

**Objetivo:** fantasma reagir ao jogador (parado, fugindo, ou atacando), sem precisar de sistemas complexos.

1. Crie o script `GhostAI.cs` em `Scripts/Ghosts/` com uma máquina de estados simples usando um `enum`:

```csharp
using UnityEngine;

public enum GhostState { Idle, Flee, Attack }

public class GhostAI : MonoBehaviour
{
    public GhostState currentState = GhostState.Idle;
    public float fleeSpeed = 2f;
    public Transform player;

    void Update()
    {
        switch (currentState)
        {
            case GhostState.Idle:
                // nao faz nada, so fica parado
                break;

            case GhostState.Flee:
                Flee();
                break;

            case GhostState.Attack:
                // logica de ataque especifica de cada tipo de fantasma
                break;
        }
    }

    void Flee()
    {
        if (player == null) return;
        Vector2 direction = ((Vector2)transform.position - (Vector2)player.position).normalized;
        transform.position += (Vector3)(direction * fleeSpeed * Time.deltaTime);
    }
}
```

2. Comece com o tipo `Errante` (estado `Idle` fixo) para validar o loop, depois evolua para `Assombrado` (`Flee`) e `Poltergeist` (`Attack`).

---

### 11.5 Fase 5 — Armadilhas

1. Crie o script `TrapBase.cs` em `Scripts/Traps/`:

```csharp
using UnityEngine;

public class TrapBase : MonoBehaviour
{
    public float drainRate = 5f;
    public float range = 2f;
    public LayerMask ghostLayer;

    void Update()
    {
        Collider2D[] hits = Physics2D.OverlapCircleAll(transform.position, range, ghostLayer);
        foreach (var hit in hits)
        {
            Ghost ghost = hit.GetComponent<Ghost>();
            if (ghost != null)
            {
                ghost.Drain(drainRate * Time.deltaTime);
            }
        }
    }
}
```

2. Crie o prefab `Trap_Basic` em `Prefabs/Traps/` com esse script anexado.
3. Crie um script `TrapPlacer.cs` no `Player` (ou em um `Managers/`) que instancia o prefab no clique do mouse (por exemplo, botão do meio, ou uma tecla dedicada), respeitando um limite de armadilhas simultâneas e um custo em plasma.

---

### 11.6 Fase 6 — Upgrades e Economia de Plasma

1. Crie um `GameManager.cs` em `Scripts/Managers/`, como um Singleton persistente entre cenas (guarda o plasma total do jogador e o progresso da cidade):

```csharp
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;

    public float totalPlasma;

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void AddPlasma(float amount)
    {
        totalPlasma += amount;
    }

    public bool SpendPlasma(float amount)
    {
        if (totalPlasma >= amount)
        {
            totalPlasma -= amount;
            return true;
        }
        return false;
    }
}
```

2. Coloque esse script em um GameObject vazio chamado `GameManager` na primeira cena do jogo (ele vai sobreviver às trocas de cena).
3. Crie `UpgradeData.cs` em `Scripts/Upgrades/` como `ScriptableObject`:

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "NewUpgrade", menuName = "Data/UpgradeData")]
public class UpgradeData : ScriptableObject
{
    public string upgradeName;
    public float cost;
    public float valueIncrease; // ex: quanto aumenta o drainRate
}
```

4. Crie um script `UpgradeManager.cs` que lê uma lista de `UpgradeData`, mostra botões numa tela de upgrade, e ao clicar chama `GameManager.Instance.SpendPlasma()` e aplica o `valueIncrease` no `PlayerSuction`.

---

### 11.7 Fase 7 — Narrativa e Final

1. Para os bilhetes/memórias encontrados nas casas: um script simples `LoreTrigger.cs` (com `OnTriggerEnter2D`) que abre um painel de UI com texto, usando um `TextMeshProUGUI`.
2. Para o final do jogo: um script `GameEndManager.cs` em `Scripts/Managers/` que verifica se todos os `NeighborhoodData.isCleaned` estão `true` e, se sim, carrega uma cena `EndingScene` com o texto/cutscene final.
3. Cutscene simples pode ser feita só com UI (fade de tela + textos sequenciais), sem precisar da ferramenta Timeline no início — mais fácil para quem está aprendendo.

---

### 11.8 Ordem sugerida de aprendizado

Se você nunca fez nada disso em Unity, sugiro seguir exatamente essa ordem (cada fase só depende da anterior):

1. Fase 1 (movimento) → já dá pra "sentir" o jogo.
2. Fase 3 (sucção), usando 1 fantasma parado direto na cena de teste, sem IA ainda.
3. Fase 4 (IA), voltando pro fantasma já existente.
4. Fase 2 (mapa da cidade), quando já tiver 1 cena de casa jogável pra conectar.
5. Fase 6 (upgrades/economia).
6. Fase 5 (armadilhas).
7. Fase 7 (narrativa/final), por último, quando o resto já estiver rodando.

Se quiser, posso pegar qualquer uma dessas fases e detalhar ainda mais (por exemplo, como configurar a barra de plasma visual passo a passo no Inspector, ou como fazer o Poltergeist atacar).

---

## 12. Pontos em Aberto (para decidirmos juntos)

- Nome final do jogo.
- Se o jogador controla um único personagem fixo ou pode customizar/trocar de operador.
- Se existe narrativa ramificada (finais múltiplos) ou um único final fixo.
- Se haverá NPCs vivos na cidade (moradores, outras empresas concorrentes) ou o foco fica 100% nas casas/fantasmas.
- Duração alvo do jogo (quantos bairros/imóveis no total).
