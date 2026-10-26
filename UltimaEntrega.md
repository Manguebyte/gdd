# Última Entrega — GDD (título provisório)

**Versão:** 0.1.0 · [histórico](#histórico-de-versões)

Oct 4, 2026 · @Abraão Alves Vila NOVA

## Visão geral

Última Entrega é um plataforma 2D sidescroller de horror psicológico: você é um entregador que carrega caixas empilhadas nas costas por um mundo destruído por uma criatura cósmica, levando suprimentos para bilionários trancados em bunkers.

| Item | Definição |
| --- | --- |
| Gênero | Plataforma 2D com horror psicológico e escolhas narrativas |
| Estúdio | Manguebyte |
| Engine | Unity 6 (URP 2D) |
| Plataformas alvo | PC (Steam) primeiro; consoles depois |
| Idiomas | Português, inglês e francês |
| Escopo deste documento | Jogo completo + plano de uma demo funcional (vertical slice jogável, não protótipo) |

**Pilares de design**

1. **Cuidado é a habilidade central.** Equilibrar a pilha e evitar os monstros recompensa paciência; pressa custa caixas e sanidade.
2. **O horror está na mente.** Monstros não atacam fisicamente: a proximidade corrói a sanidade, e o mundo muda conforme o entregador enlouquece.
3. **O trabalho como tema.** Cada mecânica reforça a crítica: o pobre (clone) paga com o corpo e a mente o conforto de quem causou o apocalipse.
4. **Escolhas com custo.** Lealdade aos bilionários ou ao mercado paralelo define o final, e nenhum final é limpo.

## Loop principal

O jogador repete um ciclo de entrega em que cada escolha de carga e de rota alimenta três medidores: créditos, lealdade e loucura acumulada.

&#91;embedded content: loop principal · 6 etapas\]

O momento central é atravessar a fase: quanto mais caixas, mais pagamento e mais instabilidade; quanto mais rápido, menos exposição aos monstros, mas mais risco de derrubar a pilha. Uma fase da demo deve durar de 5 a 10 minutos.

## Mecânicas: movimento e pilha de caixas

O entregador é ágil sem carga e fica progressivamente mais pesado e instável a cada caixa; a pilha é um objeto físico que reage a tudo o que ele faz.

**Movimento do entregador**

- Andar, correr (segurar botão) e agachar. Correr aumenta a oscilação da pilha.
- Pulo com altura variável, coyote time (0,1 s) e jump buffer (0,1 s) para o controle parecer justo mesmo com a pilha.
- Escalar bordas baixas e descer escadas. Sem pulo duplo nem dash: o jogo é sobre cautela, não acrobacia.
- Cada caixa reduz velocidade e altura de pulo pelo peso total (ver tabela).

**Pilha de caixas**

- Cada caixa é um Rigidbody2D ligado à de baixo por uma junta com tolerância de ângulo. A base é presa a um ponto nas costas do entregador.
- A pilha inclina com aceleração, frenagem, aterrissagem e impacto. Passou do ângulo limite, a junta quebra e a caixa cai com física real.
- O jogador pode compensar a inclinação com um eixo de equilíbrio (gatilhos ou Q/E), inclinando o corpo para o lado oposto.
- Caixa caída pode ser recolhida se ainda estiver acessível. Caixa que cai em abismo ou em zona de monstro está perdida.
- Agachar parado por 1 s estabiliza a pilha (zera a oscilação), mas o tempo parado conta exposição se houver monstro por perto.

**Tipos de caixa**

| Tipo | Peso | Comportamento | Pagamento |
| --- | --- | --- | --- |
| Comum (comida enlatada) | 1 | Estável | Base |
| Frágil (vinho, vidro) | 1 | Quebra com impacto acima do limite, mesmo sem cair | Alto |
| Pesada (peças de máquina) | 3 | Muito estável, mas reduz muito o pulo | Alto |
| Refrigerada | 2 | Tem tempo limite; atrasos reduzem o pagamento | Médio |
| Selada (tecnologia suspeita) | 2 | Pode ser aberta; abrir revela conteúdo e quebra o lacre | Variável |
| Viva | 1 | Se mexe sozinha e desequilibra a pilha periodicamente | Muito alto |

**Valores iniciais para ajuste (tuning)**

- Velocidade base: 7 u/s; perde 6% por ponto de peso, mínimo 3,5 u/s.
- Altura de pulo base: 3,2 u; perde 5% por ponto de peso, mínimo 1,6 u.
- Ângulo de quebra da junta: 35° na caixa de baixo, 25° nas de cima.
- Limite da pilha na demo: 6 caixas.

## Sistema de loucura

A loucura tem duas camadas: a aguda, que sobe perto dos monstros e mata se encher; e a acumulada, que cresce com o progresso e a exposição e transforma o mundo de forma permanente.

**Loucura aguda (0 a 100, por fase)**

- Cada monstro emite uma aura com raio e intensidade próprios. Dentro dela, a loucura aguda sobe por segundo, mais rápido quanto mais perto.
- Ver o monstro diretamente (linha de visão livre) multiplica o ganho por 1,5. Esconder-se atrás de cobertura reduz.
- Fora de qualquer aura, a aguda cai 8 por segundo após 2 s de atraso.
- Ao chegar a 100: o entregador morre de colapso mental. Na lore, um novo clone é ativado no último ponto de controle.

**Loucura acumulada (0 a 100, por campanha)**

- Sobe por dois caminhos: um valor fixo ao completar cada fase e uma fração de toda a loucura aguda sofrida na fase.
- Nunca diminui na campanha normal. Ela é a cicatriz do entregador.
- Amplifica a aguda: o ganho de loucura aguda é multiplicado por (1 + acumulada / 100). Com 60 de acumulada, os monstros afetam 60% mais rápido.
- Define o estado do mundo e influencia os finais.

**Faixas de loucura acumulada**

| Faixa | Estado | O que muda |
| --- | --- | --- |
| 0 a 24 | Lúcido | Mundo devastado, mas coerente |
| 25 a 49 | Abalado | Sussurros, cores dessaturadas, sombras que se mexem no fundo |
| 50 a 74 | Fraturado | Plataformas falsas, clientes com falas estranhas, visões de outros clones |
| 75 a 100 | Perdido | Arquitetura distorcida, monstros falsos, o diário de entregas fica ilegível |

**Efeitos da loucura aguda no controle (enquanto sobe)**

- Acima de 40: vinheta, batimento cardíaco, leve tremor de câmera.
- Acima de 60: a pilha parece oscilar mais na tela do que na física (balanço visual falso), e sons de passos falsos.
- Acima de 80: atraso de entrada de 50 ms, aberração cromática e alucinações rápidas de caixas caindo.

**Leitura diegética:** não há barra na tela por padrão. A loucura aparece na respiração do personagem, no áudio, na tela e no diário de entregas. Uma opção de acessibilidade mostra um medidor numérico.

## Mundo e lore

Os bilionários causaram o fim do mundo minerando asteroides, se trancaram em bunkers e fabricam clones para fazer o trabalho sujo na superfície e servir de estoque de órgãos.

**A origem**

- Um consórcio de bilionários cria a tecnologia de mineração de asteroides e vende a promessa de riqueza infinita vinda do espaço.
- Em um dos asteroides, as máquinas acordam uma criatura milenar do universo. Ela vem para a Terra junto com o minério.
- A presença da criatura enlouquece e transforma quem fica exposto. Suas crias e ecos se espalham pela superfície: são os monstros das fases.
- Os bilionários, que tinham bunkers prontos, sobrevivem. A versão oficial deles é que ninguém mais sobreviveu.

**Os entregadores**

- O jogador acredita ser um trabalhador pobre contratado pelos bunkers para fazer entregas de comida, tecnologia e luxo.
- Na verdade, os entregadores são clones fabricados com duas funções: fazer entregas e doar órgãos para os bilionários.
- Isso explica a morte no jogo: quando um entregador colapsa, outro clone é ativado.
- A revelação acontece aos poucos (ver Narrativa).

**A superfície e o mercado paralelo**

- Existe uma comunidade escondida na superfície, oculta pela versão oficial. Ela mantém um mercado paralelo ilegal que compra as cargas desviadas.
- Proposta: a comunidade é formada por clones que descobriram a verdade e fugiram antes de virar estoque de órgãos. Isso dá motivação pessoal à revolta.

**Pistas espalhadas no cenário**

- Fragmentos de asteroide caídos, logos da mineradora em ruínas, propagandas antigas sobre riqueza do espaço.
- Outros entregadores com o mesmo rosto do jogador, um código no pulso, exames médicos de rotina entre fases.
- Clientes comentando que o entregador parece saudável ou perguntando pelo tipo sanguíneo.

## Narrativa, escolhas e finais

A história é contada pelo cenário, pelos clientes e por poucas escolhas grandes; o final é definido pela lealdade (bilionários ou mercado paralelo) e modulado pela loucura acumulada.

**Estrutura em três atos**

1. **Serviço:** o entregador acredita no sistema. Entregas simples, clientes excêntricos, primeiros monstros. Primeiro contato com o mercado paralelo, que oferece comprar uma caixa.
2. **Suspeita:** pacotes selados de tecnologia, outros entregadores com o mesmo rosto, exames médicos. O jogador descobre que algumas peças servem para construir uma espaçonave.
3. **Verdade:** a revelação de que os entregadores são clones e estoque de órgãos, e a escolha final entre ajudar a fuga ou abrir o bunker para a superfície.

**Escolhas**

- **Pequenas (somam pontos de lealdade):** vender uma caixa no mercado paralelo, abrir pacotes selados, ajudar outros entregadores, aceitar entregas extras dos bunkers.
- **Grandes (4 a 6 na campanha):** momentos de decisão explícita, como entregar ou desviar as peças da espaçonave, ou trocar peças com a superfície.
- Escolhas mudam diálogos, clientes e eventos, mas reaproveitam as mesmas fases para manter o escopo viável.

**Finais**

- **Lealdade aos bilionários:** eles terminam a espaçonave e fogem do planeta. O entregador fica.
- **Lealdade à superfície:** quem trocou peças com o mercado paralelo dá à comunidade os meios de invadir um bunker.

&#91;embedded content: matriz de finais · lealdade × loucura acumulada\]

A loucura acumulada não cria novos finais, só muda o que o entregador percebe neles, o que permite quatro variações com duas sequências finais base.

## Economia, clientes e mercado paralelo

O dinheiro oficial mal cobre o necessário, o que empurra o entregador para cargas maiores, rotas arriscadas e o mercado paralelo.

**Moedas**

- **Créditos de bunker:** pagamento oficial por entrega. Compram equipamento no depósito.
- **Escambo da superfície:** o mercado paralelo paga em itens raros (calmantes, mapas de rota, peças de equipamento), não em créditos.

**Pagamento por entrega**

- Valor base da caixa × condição (intacta, amassada, quebrada) × tempo (refrigeradas) × avaliação do cliente.
- Avaliação de 1 a 5 estrelas. Abaixo de 3 estrelas na média, o depósito corta pedidos melhores.

**Clientes**

- Cada bunker tem um bilionário com nome, personalidade e pedidos absurdos (vinho raro, peças de servidor, um animal de estimação).
- Clientes reagem à entrega com falas que mudam conforme a loucura acumulada e a lealdade.
- Caixa faltando ou lacre violado é percebida, reduz a avaliação e soma suspeita.

**Mercado paralelo**

- Pontos de troca escondidos nas fases, fora da rota principal.
- Vender uma caixa paga mais que entregá-la, aumenta a lealdade à superfície e a suspeita dos bilionários.
- Suspeita alta gera eventos: inspeções no depósito, entregas armadilha, cortes no pagamento.

**Equipamento (compra no depósito)**

| Item | Efeito |
| --- | --- |
| Arnês reforçado | Aumenta o ângulo de quebra da pilha |
| Botas com amortecedor | Reduz o impacto na aterrissagem |
| Fones abafadores | Reduz o ganho de loucura aguda pelo som |
| Calmante (consumível) | Reduz a loucura aguda na hora; uso frequente aumenta a acumulada |

## Conteúdo da demo

A demo cobre o Ato 1 inteiro: depósito como hub, 4 fases jogáveis, 3 tipos de monstro, 4 tipos de caixa, mercado paralelo, loucura completa e um gancho de história no final. Duração alvo: 40 a 60 minutos.

**Hub: o depósito**

- Terminal de pedidos, loja de equipamento, armário com o diário de entregas e a cápsula de ativação de clones (não explicada no Ato 1).
- Outros entregadores circulando, sempre com capacete. Na última visita da demo, um deles tira o capacete.

**Fases**

| Fase | Cenário | Ensina | Monstro novo | Caixas |
| --- | --- | --- | --- | --- |
| 1. Primeira rota | Avenida desabada | Movimento, equilíbrio, entrega | Nenhum (só sombras) | Comum |
| 2. Viaduto | Estruturas quebradas e vento | Pulo com carga, recolher caixas caídas | Observador | Comum, frágil |
| 3. Cratera | Zona de impacto de fragmento | Rotas alternativas, primeiro ponto de troca do mercado paralelo | Rastejante | Pesada, selada |
| 4. Bunker Aurum | Descida até um bunker de luxo | Tudo junto, escolha grande da demo | Coro | Todas da demo |

**Monstros da demo**

| Monstro | Comportamento | Como evitar |
| --- | --- | --- |
| Observador | Fica parado; aura grande que só pesa com linha de visão | Passar atrás de cobertura |
| Rastejante | Patrulha uma área devagar; aura média | Esperar a janela da patrulha, pegar rota alternativa |
| Coro | Vários pequenos que somam auras e se aproximam do barulho | Andar devagar, não deixar caixas caírem (barulho atrai) |

**Escolha grande da demo**

Na fase 4, o cliente do Bunker Aurum pede peças seladas. Um contato do mercado paralelo oferece trocá-las. A escolha muda a cena final da demo e fica salva para o jogo completo.

**Gancho final:** de volta ao depósito, o entregador vê um colega sem capacete com o mesmo rosto que o seu. Tela preta, título do jogo.

## Direção de arte, áudio e UI

O visual contrapõe o cinza sujo da superfície ao luxo frio dos bunkers, e a loucura é a camada que deforma os dois.

**Arte**

- Pixel art de alta resolução (sprites de 64 px de altura para o entregador) com iluminação 2D do URP para sombras e lanternas.
- Paleta da superfície: cinzas, ferrugem e um verde doentio perto dos fragmentos. Bunkers: dourado, branco e mármore.
- Monstros desenhados para serem vistos parcialmente: silhuetas, olhos em excesso, formas que não fecham.
- Assets gerados: `Sprites/UltimaEntrega/` (PixelLab, estilo aprovado em 2026-10-14, com o entregador de roupa amarela): entregador parado, andando, pulando e agachado, os 4 tipos de caixa da demo, Observador, Rastejante e Coro, fundos (céu com a criatura, ruínas, Bunker Aurum, depósito), tilesets de plataforma da superfície e do bunker e os objetos das fases. Receita e pendências no `README.md` da pasta. Protótipo jogável do MVP em `prototipos/ultima-entrega/`.
- Parallax de 4 a 5 camadas, com a camada mais distante mostrando a criatura colossal em algumas fases.

**Áudio**

- Trilha minimalista com drones; a trilha se desafina conforme a loucura acumulada sobe.
- Cada monstro tem uma assinatura sonora que entrega a presença antes de ser visto.
- Caixas têm sons diferentes por tipo (vidro, metal, algo vivo) para o jogador ouvir a pilha.
- Mixer com snapshots de loucura: filtro passa-baixa, sussurros e batimento cardíaco.

**UI diegética**

- Sem HUD fixo. Pedidos e créditos aparecem num relógio de pulso que o jogador consulta com um botão.
- Diário de entregas no hub: registro de cada entrega, que fica rabiscado e ilegível com a loucura alta.
- Opções de acessibilidade: medidor numérico de loucura, redução de tremor de tela e de efeitos de distorção, legenda para sons de monstros.

## Histórico de versões

- **0.1.0** (2026-10-26): início do versionamento; marca o estado do GDD e do protótipo neste dia.

## Unity: setup e arquitetura

O projeto usa Unity 6 com URP 2D, sistemas desacoplados por eventos em ScriptableObjects e dados de jogo (caixas, monstros, pedidos) em assets editáveis por designers sem tocar em código.

**Criação do projeto**

1. Unity Hub → New Project → template **Universal 2D** (Unity 6 LTS).
2. Package Manager: instalar **Input System**, **Cinemachine**, **2D Tilemap Extras**, **2D Pixel Perfect** (já no URP), **Localization**, **Addressables** e **TextMeshPro**.
3. Project Settings → Player → Active Input Handling = **Input System Package (New)**.
4. Project Settings → Physics 2D: Gravity Y = -30 (pulo mais firme), Default Contact Offset = 0.005, e uma matriz de colisão com as camadas abaixo.
5. Project Settings → Time: Fixed Timestep = 0.01 (100 Hz) para a física da pilha ficar estável.
6. Câmera: Pixel Perfect Camera (Assets PPU = 32) + Cinemachine Camera com Follow e Confiner 2D por fase.

**Camadas (Layers)**

| Camada | Uso |
| --- | --- |
| Ground | Tilemaps e plataformas sólidas |
| Player | Entregador |
| Box | Caixas da pilha e caixas soltas |
| Monster | Corpo dos monstros (sem colisão com o jogador) |
| Occluder | Coberturas que bloqueiam linha de visão |
| Interactable | Clientes, terminais, pontos de troca |

Matriz: Box colide com Ground e Box; Box não colide com Player (a pilha é presa por junta, não por contato); Monster não colide com nada além de Ground.

**Estrutura de pastas**

```
Assets/_Game/
  Art/            Sprites, Tilesets, Animations, Materials
  Audio/          Music, SFX, Mixer
  Data/           Boxes, Monsters, Orders, Clients, Events
  Prefabs/        Player, Boxes, Monsters, Interactables, UI
  Scenes/         Boot, Depot, Level_01..04, Ending_Demo
  Scripts/
    Core/         GameEvents, GameState, SaveSystem, SceneLoader
    Player/       CourierController, CourierInput, BalanceInput
    Stack/        BoxStack, BoxItem, BoxData
    Sanity/       SanitySystem, MonsterAura, SanityEffects
    Monsters/     MonsterBrain, ObserverMonster, CrawlerMonster, ChoirMonster
    Delivery/     OrderData, DeliveryManager, DeliveryPoint, BlackMarketPoint
    Narrative/    ChoiceManager, DialogueRunner, WorldStateSwitcher
    UI/           WristDevice, DeliveryJournal, PauseMenu
```

**Arquitetura**

- **Dados em ScriptableObjects:** `BoxData`, `MonsterData`, `OrderData`, `ClientData`. Designers criam variações pelo menu Create.
- **Estado global:** `GameState` (ScriptableObject) guarda créditos, loucura acumulada, lealdade, suspeita, flags narrativas. Persistido em JSON pelo `SaveSystem`.
- **Eventos:** uma classe estática `GameEvents` com eventos C# (`OnBoxLost`, `OnDeliveryCompleted`, `OnSanityCollapse`, `OnChoiceMade`). Sistemas escutam em vez de se referenciar diretamente.
- **Cenas:** `Boot` carrega o estado e o áudio persistente; `Depot` é o hub; cada fase é uma cena carregada pelo `SceneLoader`.
- **Loucura no mundo:** `WorldStateSwitcher` lê a faixa de loucura acumulada e ativa variações de objetos, Volume de pós-processamento e snapshot de áudio.

## Unity: scripts principais

Os scripts abaixo formam a base jogável da demo: núcleo, entregador, pilha, loucura, monstros, entregas e fases. Todos usam as APIs do Unity 6 (`linearVelocity`, Input System, Cinemachine 3) e os valores numéricos são pontos de partida para ajuste no Play Mode.

**Regras do projeto para estes scripts**

- Entregador e caixas com escala 1: o lado para onde o personagem olha é feito com `SpriteRenderer.flipX`, nunca com escala negativa, para não inverter as âncoras da pilha.
- Caixas têm um filho `Visual` com o SpriteRenderer, usado pelo balanço visual falso da loucura.
- Todo script que assina `GameEvents` cancela a assinatura em `OnDisable`.

### Núcleo

`GameEvents.cs`: barramento de eventos global, limpo ao entrar no Play Mode (funciona com Domain Reload desligado).

```csharp
using System;
using UnityEngine;

public static class GameEvents
{
    public static event Action<BoxItem> BoxLost;
    public static event Action<BoxItem> BoxBroken;
    public static event Action<Vector2, float> Noise;      // posição, volume 0..1
    public static event Action SanityCollapse;
    public static event Action<OrderData, int> DeliveryCompleted;
    public static event Action<string> ChoiceMade;

    public static void RaiseBoxLost(BoxItem b) => BoxLost?.Invoke(b);
    public static void RaiseBoxBroken(BoxItem b) => BoxBroken?.Invoke(b);
    public static void RaiseNoise(Vector2 pos, float volume) => Noise?.Invoke(pos, volume);
    public static void RaiseSanityCollapse() => SanityCollapse?.Invoke();
    public static void RaiseDeliveryCompleted(OrderData o, int pay) => DeliveryCompleted?.Invoke(o, pay);
    public static void RaiseChoiceMade(string id) => ChoiceMade?.Invoke(id);

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
    static void ResetAll()
    {
        BoxLost = null; BoxBroken = null; Noise = null;
        SanityCollapse = null; DeliveryCompleted = null; ChoiceMade = null;
    }
}
```

`GameState.cs`: estado da campanha num ScriptableObject (crie um asset em `Data/GameState`).

```csharp
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(menuName = "Ultima Entrega/Game State")]
public class GameState : ScriptableObject
{
    public int credits;
    [Range(0f, 100f)] public float accumulatedMadness;
    public int loyalty;          // > 0 bilionários, < 0 superfície
    public int suspicion;
    public int cloneNumber = 1;
    public List<string> flags = new();
    public List<string> barterItems = new();

    public int MadnessBand =>
        accumulatedMadness < 25f ? 0 :
        accumulatedMadness < 50f ? 1 :
        accumulatedMadness < 75f ? 2 : 3;

    public bool HasFlag(string f) => flags.Contains(f);
    public void SetFlag(string f) { if (!flags.Contains(f)) flags.Add(f); }

    public void ResetForNewGame()
    {
        credits = 0; accumulatedMadness = 0f; loyalty = 0; suspicion = 0; cloneNumber = 1;
        flags.Clear(); barterItems.Clear();
    }
}
```

`SaveSystem.cs` e `GameBootstrap.cs` (este fica na cena `Boot`).

```csharp
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class SaveSystem
{
    static string FilePath => Path.Combine(Application.persistentDataPath, "save.json");

    public static void Save(GameState s) => File.WriteAllText(FilePath, JsonUtility.ToJson(s));

    public static bool Load(GameState s)
    {
        if (!File.Exists(FilePath)) return false;
        JsonUtility.FromJsonOverwrite(File.ReadAllText(FilePath), s);
        return true;
    }

    public static void Delete() { if (File.Exists(FilePath)) File.Delete(FilePath); }
}

public class GameBootstrap : MonoBehaviour
{
    [SerializeField] GameState state;
    [SerializeField] string firstScene = "Depot";

    void Start()
    {
        // O asset guarda valores do Play Mode anterior no editor: sempre resetar antes de carregar.
        state.ResetForNewGame();
        SaveSystem.Load(state);
        SceneManager.LoadScene(firstScene);
    }
}
```

`IInteractable.cs`

```csharp
public interface IInteractable
{
    void Interact(CourierController courier);
}
```

Quando um bloco trouxer mais de uma classe, separe cada `MonoBehaviour` e `ScriptableObject` num arquivo com o mesmo nome da classe; o Unity exige isso para anexar componentes e criar assets.

### Caixas e pilha

`BoxData.cs`: definição de cada tipo de caixa (crie um asset por tipo em `Data/Boxes`).

```csharp
using UnityEngine;

public enum BoxKind { Common, Fragile, Heavy, Refrigerated, Sealed, Living }

[CreateAssetMenu(menuName = "Ultima Entrega/Box Data")]
public class BoxData : ScriptableObject
{
    public string id;
    public string displayName;
    public BoxKind kind;
    [Min(1)] public int weight = 1;
    public int basePayout = 10;
    public BoxItem prefab;

    [Header("Frágil")] public float breakImpactSpeed = 6f;
    [Header("Refrigerada")] public float timeLimit = 180f;
    [Header("Viva")] public Vector2 wobbleInterval = new(2f, 5f);
    public float wobbleKick = 3f;                 // rad/s por empurrão
}
```

`BoxItem.cs`: a caixa física. Fica solta no mundo, presa na pilha por uma `HingeJoint2D` ou quebrada.

```csharp
using System.Collections;
using UnityEngine;

[RequireComponent(typeof(Rigidbody2D), typeof(BoxCollider2D))]
public class BoxItem : MonoBehaviour, IInteractable
{
    public enum State { Loose, OnStack, Broken }
    public static float FakeWobble;               // graus, definido por SanityEffects

    [SerializeField] BoxData data;
    [SerializeField] Transform visual;            // filho com o SpriteRenderer
    [SerializeField] GameObject breakFx;

    public BoxData Data => data;
    public State Current { get; private set; } = State.Loose;
    public float Condition { get; private set; } = 1f;
    public bool SealBroken { get; private set; }
    public float Age => Time.time - createdAt;
    public Rigidbody2D Body { get; private set; }
    public float HalfHeight { get; private set; }

    HingeJoint2D joint;
    float createdAt, wobbleSeed;

    void Awake()
    {
        Body = GetComponent<Rigidbody2D>();
        HalfHeight = GetComponent<BoxCollider2D>().size.y * 0.5f;
        Body.mass = 0.2f * data.weight;
        createdAt = Time.time;
        wobbleSeed = Random.value * 10f;
    }

    public void AttachTo(Rigidbody2D below, Vector2 belowTopLocal, float limitDegrees)
    {
        joint = gameObject.AddComponent<HingeJoint2D>();
        joint.autoConfigureConnectedAnchor = false;
        joint.connectedBody = below;
        joint.anchor = new Vector2(0f, -HalfHeight);
        joint.connectedAnchor = belowTopLocal;
        joint.enableCollision = false;
        joint.useLimits = true;
        joint.limits = new JointAngleLimits2D { min = -limitDegrees, max = limitDegrees };
        Current = State.OnStack;
        if (data.kind == BoxKind.Living) StartCoroutine(LivingWobble());
    }

    public void Detach()
    {
        if (joint) Destroy(joint);
        joint = null;
        if (Current == State.OnStack) Current = State.Loose;
    }

    public void Break()
    {
        if (Current == State.Broken) return;
        Detach();
        Current = State.Broken;
        Condition = 0f;
        GameEvents.RaiseBoxBroken(this);
        GameEvents.RaiseNoise(transform.position, 1f);
        if (breakFx) Instantiate(breakFx, transform.position, Quaternion.identity);
        Destroy(gameObject);
    }

    public void OpenSeal() { if (data.kind == BoxKind.Sealed) SealBroken = true; }

    public void Interact(CourierController courier)
    {
        if (Current == State.Loose) courier.Stack.TryAdd(this);
    }

    void OnCollisionEnter2D(Collision2D hit)
    {
        if (Current != State.Loose) return;
        float speed = hit.relativeVelocity.magnitude;
        if (speed < 2f) return;
        GameEvents.RaiseNoise(transform.position, Mathf.Clamp01(speed / 10f));
        if (data.kind == BoxKind.Fragile && speed > data.breakImpactSpeed) { Break(); return; }
        Condition = Mathf.Max(0.25f, Condition - speed * 0.03f);
    }

    void LateUpdate()
    {
        if (!visual) return;
        float angle = Current == State.OnStack ? Mathf.Sin(Time.time * 3f + wobbleSeed) * FakeWobble : 0f;
        visual.localRotation = Quaternion.Euler(0f, 0f, angle);
    }

    IEnumerator LivingWobble()
    {
        while (Current == State.OnStack)
        {
            yield return new WaitForSeconds(Random.Range(data.wobbleInterval.x, data.wobbleInterval.y));
            if (Current != State.OnStack) yield break;
            float dir = Random.value < 0.5f ? -1f : 1f;
            Body.AddTorque(dir * data.wobbleKick * Body.inertia, ForceMode2D.Impulse);
        }
    }
}
```

`BoxStack.cs`: fica no entregador. Prende as caixas em cadeia, aplica a força que as mantém de pé, o equilíbrio do jogador e quebra a pilha quando o ângulo passa do limite. A ordem importa: só a caixa do topo sai, então o jogador planeja a pilha pela ordem das entregas.

```csharp
using System.Collections.Generic;
using UnityEngine;

public class BoxStack : MonoBehaviour
{
    [SerializeField] Rigidbody2D carrier;
    [SerializeField] Transform stackBase;         // ponto vazio nas costas do entregador
    [SerializeField] int maxBoxes = 6;
    [Header("Quebra (graus)")]
    [SerializeField] float baseBreakAngle = 35f, upperBreakAngle = 25f;
    [Header("Equilíbrio (rad/s²)")]
    [SerializeField] float uprightStiffness = 120f, uprightDamping = 10f, balanceStrength = 30f;
    [SerializeField] float stabilizeDampingMultiplier = 5f, landingSpinPerSpeed = 0.15f;

    readonly List<BoxItem> boxes = new();
    float balanceInput;
    bool stabilizing;

    public int Count => boxes.Count;
    public BoxItem Top => boxes.Count > 0 ? boxes[^1] : null;
    public int TotalWeight { get { int w = 0; foreach (var b in boxes) w += b.Data.weight; return w; } }

    public void SetBalanceInput(float value) => balanceInput = Mathf.Clamp(value, -1f, 1f);
    public void SetStabilizing(bool value) => stabilizing = value;

    public bool TryAdd(BoxItem box)
    {
        if (boxes.Count >= maxBoxes || box.Current != BoxItem.State.Loose) return false;

        Rigidbody2D below;
        Vector2 topLocal;
        if (boxes.Count == 0)
        {
            below = carrier;
            topLocal = carrier.transform.InverseTransformPoint(stackBase.position);
        }
        else
        {
            below = Top.Body;
            topLocal = new Vector2(0f, Top.HalfHeight);
        }

        Vector2 baseWorld = below.transform.TransformPoint(topLocal);
        Vector2 up = below.transform.up;
        Vector2 pos = baseWorld + up * box.HalfHeight;
        box.Body.position = pos;
        box.Body.rotation = below.rotation;
        box.transform.SetPositionAndRotation(pos, Quaternion.Euler(0f, 0f, below.rotation));
        box.Body.linearVelocity = below.linearVelocity;
        box.Body.angularVelocity = 0f;

        float limit = (boxes.Count == 0 ? baseBreakAngle : upperBreakAngle) + 10f;
        box.AttachTo(below, topLocal, limit);
        boxes.Add(box);
        return true;
    }

    public BoxItem TakeTop()
    {
        BoxItem box = Top;
        if (box == null) return null;
        boxes.RemoveAt(boxes.Count - 1);
        box.Detach();
        return box;
    }

    public List<BoxData> Snapshot()
    {
        var list = new List<BoxData>();
        foreach (var b in boxes) list.Add(b.Data);
        return list;
    }

    public void ClearAll()
    {
        foreach (var b in boxes) if (b) Destroy(b.gameObject);
        boxes.Clear();
    }

    public void ApplyLandingImpact(float fallSpeed)
    {
        for (int i = 0; i < boxes.Count; i++)
        {
            BoxItem box = boxes[i];
            if (box.Data.kind == BoxKind.Fragile && fallSpeed > box.Data.breakImpactSpeed)
            {
                DropFrom(i + 1);
                boxes.RemoveAt(i);
                box.Break();
                return;
            }
            float spin = Random.Range(-1f, 1f) * fallSpeed * landingSpinPerSpeed;
            box.Body.AddTorque(spin * box.Body.inertia, ForceMode2D.Impulse);
        }
    }

    void DropFrom(int index)
    {
        if (index >= boxes.Count) return;
        for (int j = boxes.Count - 1; j >= index; j--)
        {
            boxes[j].Detach();
            GameEvents.RaiseBoxLost(boxes[j]);
        }
        boxes.RemoveRange(index, boxes.Count - index);
    }

    void FixedUpdate()
    {
        for (int i = 0; i < boxes.Count; i++)
        {
            BoxItem box = boxes[i];
            Rigidbody2D below = i == 0 ? carrier : boxes[i - 1].Body;
            float relAngle = Mathf.DeltaAngle(below.rotation, box.Body.rotation);
            float limit = i == 0 ? baseBreakAngle : upperBreakAngle;
            if (Mathf.Abs(relAngle) > limit) { DropFrom(i); return; }

            float relVel = box.Body.angularVelocity - below.angularVelocity;   // graus/s
            float damping = uprightDamping * (stabilizing ? stabilizeDampingMultiplier : 1f);
            float accel = -uprightStiffness * relAngle * Mathf.Deg2Rad
                          - damping * relVel * Mathf.Deg2Rad
                          - balanceInput * balanceStrength;
            int boxesAbove = boxes.Count - 1 - i;
            box.Body.AddTorque(accel * box.Body.inertia * (1 + boxesAbove));
        }
    }
}
```

### Entregador

`CourierController.cs`: movimento com peso, coyote time, jump buffer, pulo variável, estabilizar agachado e atraso de entrada vindo da loucura.

```csharp
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody2D))]
public class CourierController : MonoBehaviour
{
    [Header("Input")]
    [SerializeField] InputActionReference moveAction, jumpAction, runAction, balanceAction;
    [Header("Referências")]
    [SerializeField] BoxStack stack;
    [SerializeField] SanitySystem sanity;
    [SerializeField] SpriteRenderer sprite;
    [SerializeField] Transform groundCheck;
    [SerializeField] Vector2 groundCheckSize = new(0.6f, 0.1f);
    [SerializeField] LayerMask groundMask;
    [Header("Movimento")]
    [SerializeField] float walkSpeed = 4.5f, runSpeed = 7f, acceleration = 40f, deceleration = 50f;
    [SerializeField] float jumpHeight = 3.2f, coyoteTime = 0.1f, jumpBuffer = 0.1f, jumpCut = 0.5f;
    [SerializeField] float speedLossPerWeight = 0.06f, jumpLossPerWeight = 0.05f, minFactor = 0.5f;
    [SerializeField] float crouchStabilizeTime = 1f;

    public BoxStack Stack => stack;
    public Rigidbody2D Body { get; private set; }
    public bool IsGrounded { get; private set; }

    readonly Queue<(float time, Vector2 move)> moveHistory = new();
    Vector2 delayedMove;
    bool runHeld, jumpReleased;
    float lastGroundedTime = -10f, lastJumpPressedTime = -10f, lastVerticalSpeed, crouchTimer;

    void Awake()
    {
        Body = GetComponent<Rigidbody2D>();
        Body.freezeRotation = true;
    }

    void OnEnable()
    {
        moveAction.action.Enable(); jumpAction.action.Enable();
        runAction.action.Enable(); balanceAction.action.Enable();
        jumpAction.action.performed += OnJumpPressed;
        jumpAction.action.canceled += OnJumpReleased;
    }

    void OnDisable()
    {
        jumpAction.action.performed -= OnJumpPressed;
        jumpAction.action.canceled -= OnJumpReleased;
    }

    void OnJumpPressed(InputAction.CallbackContext _) => lastJumpPressedTime = Time.time;
    void OnJumpReleased(InputAction.CallbackContext _) => jumpReleased = true;

    void Update()
    {
        // Atraso de entrada: com a loucura alta, o corpo responde um pouco depois.
        Vector2 raw = moveAction.action.ReadValue<Vector2>();
        moveHistory.Enqueue((Time.time, raw));
        float delay = sanity ? sanity.InputDelay : 0f;
        while (moveHistory.Count > 0 && moveHistory.Peek().time <= Time.time - delay)
            delayedMove = moveHistory.Dequeue().move;

        runHeld = runAction.action.IsPressed();
        stack.SetBalanceInput(balanceAction.action.ReadValue<float>());
        if (Mathf.Abs(delayedMove.x) > 0.1f) sprite.flipX = delayedMove.x < 0f;
    }

    void FixedUpdate()
    {
        bool wasGrounded = IsGrounded;
        IsGrounded = Physics2D.OverlapBox(groundCheck.position, groundCheckSize, 0f, groundMask);
        if (IsGrounded) lastGroundedTime = Time.time;
        if (IsGrounded && !wasGrounded) stack.ApplyLandingImpact(-lastVerticalSpeed);

        int weight = stack.TotalWeight;
        float speedFactor = Mathf.Max(minFactor, 1f - weight * speedLossPerWeight);
        float jumpFactor = Mathf.Max(minFactor, 1f - weight * jumpLossPerWeight);

        Vector2 v = Body.linearVelocity;
        float target = delayedMove.x * (runHeld ? runSpeed : walkSpeed) * speedFactor;
        float rate = Mathf.Abs(target) > 0.01f ? acceleration : deceleration;
        v.x = Mathf.MoveTowards(v.x, target, rate * Time.fixedDeltaTime);

        bool canJump = Time.time - lastGroundedTime <= coyoteTime;
        bool wantsJump = Time.time - lastJumpPressedTime <= jumpBuffer;
        if (canJump && wantsJump)
        {
            float g = Mathf.Abs(Physics2D.gravity.y * Body.gravityScale);
            v.y = Mathf.Sqrt(2f * g * jumpHeight * jumpFactor);
            lastJumpPressedTime = -10f;
            lastGroundedTime = -10f;
        }
        if (jumpReleased)
        {
            if (v.y > 0f) v.y *= jumpCut;
            jumpReleased = false;
        }

        bool crouching = IsGrounded && delayedMove.y < -0.5f && Mathf.Abs(v.x) < 0.1f;
        crouchTimer = crouching ? crouchTimer + Time.fixedDeltaTime : 0f;
        stack.SetStabilizing(crouchTimer >= crouchStabilizeTime);

        lastVerticalSpeed = v.y;
        Body.linearVelocity = v;
    }
}
```

`CourierInteractor.cs`: botão de interagir. Pega a caixa solta ou o ponto de interação mais próximo, ignorando as caixas que já estão na pilha.

```csharp
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;

public class CourierInteractor : MonoBehaviour
{
    [SerializeField] InputActionReference interactAction;
    [SerializeField] CourierController courier;
    [SerializeField] float radius = 1.2f;
    [SerializeField] LayerMask interactMask;      // Interactable + Box

    readonly List<Collider2D> results = new();
    ContactFilter2D filter;

    void Awake()
    {
        filter = new ContactFilter2D { useTriggers = true };
        filter.SetLayerMask(interactMask);
    }

    void OnEnable()
    {
        interactAction.action.Enable();
        interactAction.action.performed += OnInteract;
    }

    void OnDisable() => interactAction.action.performed -= OnInteract;

    void OnInteract(InputAction.CallbackContext _)
    {
        Physics2D.OverlapCircle(transform.position, radius, filter, results);
        IInteractable best = null;
        float bestDist = float.MaxValue;
        foreach (var col in results)
        {
            if (col.TryGetComponent(out BoxItem box) && box.Current != BoxItem.State.Loose) continue;
            if (!col.TryGetComponent(out IInteractable target)) continue;
            float d = ((Vector2)col.transform.position - (Vector2)transform.position).sqrMagnitude;
            if (d < bestDist) { bestDist = d; best = target; }
        }
        best?.Interact(courier);
    }
}
```

### Loucura

`SanitySystem.cs`: fica no entregador. Soma a exposição de todas as auras no quadro, aplica o multiplicador da loucura acumulada e dispara o colapso. Roda depois das auras (`DefaultExecutionOrder`).

```csharp
using UnityEngine;

[DefaultExecutionOrder(100)]
public class SanitySystem : MonoBehaviour
{
    [SerializeField] GameState state;
    [SerializeField] float decayDelay = 2f, decayRate = 8f;
    [SerializeField, Range(0f, 1f)] float exposureToAccumulated = 0.05f;
    [SerializeField] float inputDelayThreshold = 80f, inputDelaySeconds = 0.05f;

    public float Acute { get; private set; }
    public float InputDelay => Acute >= inputDelayThreshold ? inputDelaySeconds : 0f;

    float pendingRate, sinceExposure, exposureThisLevel;
    bool collapsed;

    public void AddExposure(float perSecond) => pendingRate += perSecond;

    void Update()
    {
        if (collapsed) { pendingRate = 0f; return; }

        if (pendingRate > 0f)
        {
            float gain = pendingRate * (1f + state.accumulatedMadness / 100f) * Time.deltaTime;
            Acute += gain;
            exposureThisLevel += gain;
            sinceExposure = 0f;
        }
        else
        {
            sinceExposure += Time.deltaTime;
            if (sinceExposure >= decayDelay) Acute -= decayRate * Time.deltaTime;
        }
        pendingRate = 0f;
        Acute = Mathf.Clamp(Acute, 0f, 100f);

        if (Acute >= 100f)
        {
            collapsed = true;
            GameEvents.RaiseSanityCollapse();
        }
    }

    public void ResetAcute()
    {
        Acute = 0f;
        sinceExposure = 0f;
        collapsed = false;
    }

    // Chamado ao concluir a fase: progresso + parte da exposição viram cicatriz permanente.
    public void CommitLevel(float completionGain)
    {
        state.accumulatedMadness = Mathf.Min(100f,
            state.accumulatedMadness + completionGain + exposureThisLevel * exposureToAccumulated);
        exposureThisLevel = 0f;
    }
}
```

`SanityEffects.cs`: liga a loucura aguda a um Volume de pós-processamento (vinheta, aberração cromática, film grain), ao tremor da câmera, ao batimento cardíaco e ao balanço visual falso das caixas.

```csharp
using UnityEngine;
using UnityEngine.Rendering;
using Unity.Cinemachine;

public class SanityEffects : MonoBehaviour
{
    [SerializeField] SanitySystem sanity;
    [SerializeField] Volume madnessVolume;
    [SerializeField] CinemachineBasicMultiChannelPerlin cameraNoise;
    [SerializeField] AudioSource heartbeat;
    [SerializeField] float maxShake = 1.2f, maxFakeWobble = 6f;

    void Update()
    {
        float a = sanity.Acute;
        float t = Mathf.InverseLerp(40f, 100f, a);
        madnessVolume.weight = t;
        cameraNoise.AmplitudeGain = Mathf.Lerp(0f, maxShake, t);
        heartbeat.volume = Mathf.InverseLerp(30f, 100f, a);
        heartbeat.pitch = Mathf.Lerp(0.9f, 1.6f, a / 100f);
        BoxItem.FakeWobble = Mathf.InverseLerp(60f, 100f, a) * maxFakeWobble;
    }
}
```

`MadnessGate.cs`: liga ou desliga objetos do cenário conforme a faixa de loucura acumulada (plataformas falsas, grafites que mudam, cadáveres que aparecem). Coloque em qualquer objeto da fase.

```csharp
using UnityEngine;

public class MadnessGate : MonoBehaviour
{
    [SerializeField] GameState state;
    [SerializeField, Range(0, 3)] int minBand = 2;
    [SerializeField] bool hideFromBand;           // true: some a partir da faixa

    void Start()
    {
        bool reached = state.MadnessBand >= minBand;
        gameObject.SetActive(hideFromBand ? !reached : reached);
    }
}
```

### Monstros

`MonsterAura.cs`: todo monstro tem uma. Quanto mais perto, maior a exposição; linha de visão livre multiplica, cobertura reduz (ou zera, no Observador).

```csharp
using UnityEngine;

public class MonsterAura : MonoBehaviour
{
    [SerializeField] float radius = 6f, maxPerSecond = 25f;
    [SerializeField] float lineOfSightMultiplier = 1.5f, occludedMultiplier = 0.35f;
    [SerializeField] bool requiresLineOfSight;    // Observador: true
    [SerializeField] LayerMask occluderMask;

    SanitySystem target;

    void Start() => target = FindFirstObjectByType<SanitySystem>();

    void Update()
    {
        if (!target) return;
        Vector2 from = transform.position, to = target.transform.position;
        float dist = Vector2.Distance(from, to);
        if (dist > radius) return;

        float rate = maxPerSecond * (1f - dist / radius);
        bool blocked = Physics2D.Linecast(from, to, occluderMask);
        if (blocked) rate *= requiresLineOfSight ? 0f : occludedMultiplier;
        else rate *= lineOfSightMultiplier;

        if (rate > 0f) target.AddExposure(rate);
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = new Color(0.6f, 0f, 0.8f, 0.4f);
        Gizmos.DrawWireSphere(transform.position, radius);
    }
}
```

`CrawlerMonster.cs` (Rastejante): patrulha entre pontos com pausas, criando janelas de passagem.

```csharp
using UnityEngine;

public class CrawlerMonster : MonoBehaviour
{
    [SerializeField] Transform[] waypoints;
    [SerializeField] float speed = 1.5f, waitTime = 2f;

    int index;
    float waitUntil;

    void Update()
    {
        if (waypoints.Length == 0 || Time.time < waitUntil) return;
        Vector3 goal = waypoints[index].position;
        transform.position = Vector3.MoveTowards(transform.position, goal, speed * Time.deltaTime);
        if ((transform.position - goal).sqrMagnitude < 0.01f)
        {
            index = (index + 1) % waypoints.Length;
            waitUntil = Time.time + waitTime;
        }
    }
}
```

`ChoirMonster.cs` (Coro): cada criatura do grupo vai até o barulho mais recente e depois volta para casa. Várias auras pequenas somadas tornam o grupo perigoso.

```csharp
using UnityEngine;

public class ChoirMonster : MonoBehaviour
{
    [SerializeField] float hearingRange = 12f, speed = 2f, interestDuration = 6f;

    Vector2 home, noiseTarget;
    float interestUntil;

    void Awake() => home = transform.position;
    void OnEnable() => GameEvents.Noise += OnNoise;
    void OnDisable() => GameEvents.Noise -= OnNoise;

    void OnNoise(Vector2 pos, float volume)
    {
        if (Vector2.Distance(pos, transform.position) > hearingRange * volume) return;
        noiseTarget = pos;
        interestUntil = Time.time + interestDuration;
    }

    void Update()
    {
        Vector2 goal = Time.time < interestUntil ? noiseTarget : home;
        transform.position = Vector2.MoveTowards(transform.position, goal, speed * Time.deltaTime);
    }
}
```

O Observador não precisa de script próprio: é um sprite animado parado com `MonsterAura` (raio 10, `requiresLineOfSight` ligado).

### Entregas e mercado paralelo

`ClientData.cs` e `OrderData.cs`: clientes e pedidos como assets (`Data/Clients`, `Data/Orders`).

```csharp
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(menuName = "Ultima Entrega/Client")]
public class ClientData : ScriptableObject
{
    public string displayName;
    public string bunkerName;
    [TextArea] public string[] linesLucid;
    [TextArea] public string[] linesFractured;    // usadas na faixa de loucura 2 ou mais
}

[CreateAssetMenu(menuName = "Ultima Entrega/Order")]
public class OrderData : ScriptableObject
{
    public string id;
    public ClientData client;
    public string deliveryPointId;
    public List<BoxData> boxes = new();
    public float payoutMultiplier = 1f;
}
```

`DeliveryManager.cs`: um por fase. Controla o que falta entregar e calcula o pagamento (condição da caixa, tempo das refrigeradas, lacre violado).

```csharp
using System.Collections.Generic;
using UnityEngine;

public class DeliveryManager : MonoBehaviour
{
    public static DeliveryManager Instance { get; private set; }

    [SerializeField] GameState state;
    [SerializeField] List<OrderData> levelOrders = new();

    readonly Dictionary<string, List<BoxData>> remaining = new();

    void Awake()
    {
        Instance = this;
        foreach (var o in levelOrders) remaining[o.id] = new List<BoxData>(o.boxes);
    }

    public bool AllDelivered => levelOrders.TrueForAll(o => remaining[o.id].Count == 0);

    public int MissingCount
    {
        get { int n = 0; foreach (var o in levelOrders) n += remaining[o.id].Count; return n; }
    }

    public OrderData FindOrder(string pointId) =>
        levelOrders.Find(o => o.deliveryPointId == pointId && remaining[o.id].Count > 0);

    public int Deliver(OrderData order, BoxStack stack)
    {
        var list = remaining[order.id];
        int payout = 0;
        while (stack.Count > 0 && list.Contains(stack.Top.Data))
        {
            BoxItem box = stack.TakeTop();
            list.Remove(box.Data);
            payout += Mathf.RoundToInt(box.Data.basePayout * box.Condition * TimeFactor(box) * order.payoutMultiplier);
            if (box.SealBroken) state.suspicion += 10;
            Destroy(box.gameObject);
        }
        if (payout > 0)
        {
            state.credits += payout;
            state.loyalty += 1;
            GameEvents.RaiseDeliveryCompleted(order, payout);
        }
        return payout;
    }

    static float TimeFactor(BoxItem box)
    {
        if (box.Data.kind != BoxKind.Refrigerated) return 1f;
        float late = Mathf.Max(0f, box.Age - box.Data.timeLimit);
        return Mathf.Clamp(1f - late / box.Data.timeLimit, 0.25f, 1f);
    }
}
```

`DeliveryPoint.cs` e `BlackMarketPoint.cs`: os dois lados da escolha. Ficam na camada `Interactable` com um collider em modo trigger.

```csharp
using UnityEngine;

public class DeliveryPoint : MonoBehaviour, IInteractable
{
    [SerializeField] string pointId;

    public void Interact(CourierController courier)
    {
        OrderData order = DeliveryManager.Instance.FindOrder(pointId);
        if (order == null) return;                 // UI: "nada para este bunker"
        DeliveryManager.Instance.Deliver(order, courier.Stack);
    }
}

public class BlackMarketPoint : MonoBehaviour, IInteractable
{
    [SerializeField] GameState state;
    [SerializeField] string[] barterRewards = { "calmante", "mapa_de_rota" };
    [SerializeField] int loyaltyCost = 3, suspicionGain = 5;

    public void Interact(CourierController courier)
    {
        BoxItem box = courier.Stack.TakeTop();
        if (box == null) return;
        state.loyalty -= loyaltyCost;
        state.suspicion += suspicionGain;
        state.barterItems.Add(barterRewards[Random.Range(0, barterRewards.Length)]);
        state.SetFlag("mercado_paralelo_contato");
        Destroy(box.gameObject);
    }
}
```

### Fases, morte e checkpoints

`LevelManager.cs`: um por fase. No colapso mental, ativa o próximo clone no último checkpoint com a pilha que ele tinha ali. Ao terminar a fase, grava a loucura acumulada e salva.

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LevelManager : MonoBehaviour
{
    [SerializeField] CourierController courier;
    [SerializeField] SanitySystem sanity;
    [SerializeField] GameState state;
    [SerializeField] float levelCompletionMadness = 5f;
    [SerializeField] int suspicionPerMissingBox = 5;
    [SerializeField] float respawnDelay = 1.5f;

    Vector2 checkpointPos;
    List<BoxData> checkpointBoxes = new();

    [SerializeField] List<BoxData> startingBoxes = new();   // carga da fase, de baixo para cima

    void Start()
    {
        foreach (var data in startingBoxes)
            courier.Stack.TryAdd(Instantiate(data.prefab, courier.transform.position, Quaternion.identity));
        SetCheckpoint(courier.transform.position);
    }
    void OnEnable() => GameEvents.SanityCollapse += OnCollapse;
    void OnDisable() => GameEvents.SanityCollapse -= OnCollapse;

    public void SetCheckpoint(Vector2 pos)
    {
        checkpointPos = pos;
        checkpointBoxes = courier.Stack.Snapshot();
    }

    void OnCollapse() => StartCoroutine(Respawn());

    IEnumerator Respawn()
    {
        courier.enabled = false;
        yield return new WaitForSeconds(respawnDelay);   // trocar por fade + animação da cápsula

        courier.Stack.ClearAll();
        courier.Body.position = checkpointPos;
        courier.Body.linearVelocity = Vector2.zero;
        foreach (var data in checkpointBoxes)
        {
            BoxItem box = Instantiate(data.prefab, checkpointPos, Quaternion.identity);
            courier.Stack.TryAdd(box);
        }
        sanity.ResetAcute();
        state.cloneNumber++;
        courier.enabled = true;
    }

    public void CompleteLevel(string nextScene)
    {
        state.suspicion += DeliveryManager.Instance.MissingCount * suspicionPerMissingBox;
        sanity.CommitLevel(levelCompletionMadness);
        SaveSystem.Save(state);
        SceneManager.LoadScene(nextScene);
    }
}
```

`Checkpoint.cs` e `LevelExit.cs`: triggers simples na fase.

```csharp
using UnityEngine;

public class Checkpoint : MonoBehaviour
{
    [SerializeField] LevelManager level;
    bool used;

    void OnTriggerEnter2D(Collider2D other)
    {
        if (used || !other.TryGetComponent(out CourierController _)) return;
        used = true;
        level.SetCheckpoint(transform.position);
    }
}

public class LevelExit : MonoBehaviour
{
    [SerializeField] LevelManager level;
    [SerializeField] string nextScene = "Depot";

    void OnTriggerEnter2D(Collider2D other)
    {
        if (other.TryGetComponent(out CourierController _)) level.CompleteLevel(nextScene);
    }
}
```

### Escolhas

`ChoiceData.cs` e `ChoiceManager.cs`: cada escolha grande é um asset; a UI chama `Apply` com a opção escolhida.

```csharp
using System;
using UnityEngine;

[CreateAssetMenu(menuName = "Ultima Entrega/Choice")]
public class ChoiceData : ScriptableObject
{
    [Serializable]
    public class Option
    {
        public string label;
        public int loyaltyDelta;
        public int suspicionDelta;
        public string flag;
    }

    public string id;
    [TextArea] public string prompt;
    public Option[] options;
}

public class ChoiceManager : MonoBehaviour
{
    [SerializeField] GameState state;

    public void Apply(ChoiceData choice, int optionIndex)
    {
        ChoiceData.Option o = choice.options[optionIndex];
        state.loyalty += o.loyaltyDelta;
        state.suspicion += o.suspicionDelta;
        if (!string.IsNullOrEmpty(o.flag)) state.SetFlag(o.flag);
        state.SetFlag(choice.id);
        GameEvents.RaiseChoiceMade(choice.id);
        SaveSystem.Save(state);
    }
}
```

## Unity: montagem das cenas e roteiro da demo

A demo é construída em seis etapas, cada uma terminando com algo jogável; a regra é não avançar enquanto o critério de saída da etapa não estiver cumprido.

**Prefab do entregador (`Prefabs/Player/Courier`)**

1. Objeto raiz na camada `Player`: `Rigidbody2D` (Dynamic, Mass 10, Gravity Scale 1, Interpolate, Collision Detection Continuous), `CapsuleCollider2D`, `CourierController`, `BoxStack`, `SanitySystem`, `CourierInteractor`.
2. Filhos: `Sprite` (SpriteRenderer + Animator), `GroundCheck` nos pés, `StackBase` nas costas, na altura dos ombros.
3. Input Actions (`Settings/CourierInput.inputactions`): Move (Vector2), Jump, Run, Interact (Button) e Balance (Axis: Q/E e gatilhos LT/RT).
4. Ligar as referências no Inspector e marcar `groundMask` = Ground.

**Prefab de caixa (`Prefabs/Boxes/Box_Common` e variantes)**

1. Raiz na camada `Box`: `Rigidbody2D` (Dynamic, Interpolate), `BoxCollider2D` (1 × 0,8), `BoxItem` com o `BoxData` do tipo.
2. Filho `Visual` com o SpriteRenderer, ligado ao campo `visual`.
3. Um Physics Material 2D com atrito 0,6 e bounciness 0 para as caixas não deslizarem como gelo.

**Cena de fase (`Scenes/Level_XX`)**

1. Grid com Tilemaps: `Ground` (TilemapCollider2D + CompositeCollider2D), `Background`, `Foreground`, e camadas de parallax.
2. Câmera: Main Camera com Pixel Perfect Camera e CinemachineBrain; Cinemachine Camera seguindo o entregador, com Confiner 2D e o componente Basic Multi Channel Perlin (ligado ao `SanityEffects`).
3. Global Volume normal + `MadnessVolume` (vinheta, aberração cromática, film grain, Color Adjustments dessaturado) com peso 0 controlado pelo `SanityEffects`.
4. `LevelManager` e `DeliveryManager` num objeto `_Level`, com os pedidos e a carga inicial da fase.
5. Monstros com `MonsterAura`, coberturas na camada `Occluder`, `DeliveryPoint` e `BlackMarketPoint` na camada `Interactable`, `Checkpoint` a cada 60 a 90 segundos de jogo e `LevelExit` no fim.
6. Objetos com `MadnessGate` para as variações de mundo por faixa de loucura.

**Roteiro de produção**

1. **Sensação do movimento.** Entregador e pilha numa sala de testes cinza. Saída: carregar 4 caixas e atravessar um percurso de pulos é difícil, mas justo, para 3 pessoas que testarem.
2. **Loucura e monstros.** Auras, efeitos, colapso e respawn por clone, com os três monstros em salas de teste. Saída: dá para ler a presença do monstro só pelo som e pela tela.
3. **Entregas e economia.** Pedidos, pontos de entrega, mercado paralelo, depósito como hub com loja e terminal, save. Saída: o loop completo funciona de ponta a ponta com arte provisória.
4. **Fases 1 a 4 em greybox.** Layout de todas as fases com rotas alternativas. Saída: a demo inteira jogável do começo ao fim, entre 40 e 60 minutos.
5. **Arte, áudio e narrativa.** Tilesets, sprites, animações, trilha, falas dos clientes, escolha da fase 4, gancho final e a cena `Ending_Demo` (lê `loyalty` e toca uma de duas sequências via Timeline). Saída: nenhum placeholder visível.
6. **Polimento e build.** Localização (PT, EN, FR), acessibilidade, menus, ajustes de valores, performance e build para Steam. Saída: build estável enviada para playtest externo.

**Riscos principais**

- A física da pilha é o maior risco: se parecer aleatória, o jogo frustra. Por isso a etapa 1 vem primeiro e só termina com playtest.
- Efeitos de loucura podem cansar ou causar enjoo. As opções de acessibilidade entram desde a etapa 2, não no fim.
