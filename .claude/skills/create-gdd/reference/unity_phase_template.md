# Parte {{N}} — Implementação Unity: Fase {{X}} ({{Nome da Fase}})

## Fase {{X}} — {{Nome da Fase}}

> Objetivo desta fase: {{uma frase dizendo o que vai existir/funcionar ao final dela}}.

### {{X}}.1 {{Primeiro passo}}

1. ...
2. ...

### {{X}}.2 {{Segundo passo — ex.: script principal da fase}}

```csharp
// Caminho sugerido: Assets/_Project/Scripts/{{Pasta}}/{{NomeDoScript}}.cs
using UnityEngine;

public class {{NomeDoScript}} : MonoBehaviour
{
    // implementação real e completa, não pseudocódigo
}
```

> ⚠️ Nota de versão: `rb.linearVelocity` é o nome usado no Unity 6 / 2023.x+. Se o
> projeto rodar em 2022 LTS, troque por `rb.velocity` (mesma coisa, nome antigo).
> (Incluir só se a fase mexer com Rigidbody2D.)

### {{X}}.3 Configurar no Inspector

1. ...

### ✅ Checkpoint da Fase {{X}}
- {{critério objetivo de que funcionou — algo que dá pra observar no Editor/Play Mode}}
- ...

#### Problemas comuns
- **{{sintoma}}:** {{causa provável e como resolver}}.

Próxima fase: **{{nome da próxima fase}}** — {{o que ela vai adicionar}}.

---
