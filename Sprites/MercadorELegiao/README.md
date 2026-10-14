# Mercador & Legião — sprites PixelLab

Arte do MVP descrito em `tutorial-mvp-completo-unity.md` (o jogo ainda não tem GDD, então não há direção de arte escrita). Direção aprovada no teste de 2026-10-14 (`_style-test/cena.png`): pixel art de fantasia medieval aconchegante, madeira e pedra quentes, luz de vela, contorno escuro. Visão geral: `_preview/lote1.png`.

## O que existe

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `heroes/` | `guerreiro`, `ladino`, `mago` — as 3 `HeroClass` | 48×48 |
| `npcs/` | `ferreiro` (Forja/`CraftingManager`) e `cliente` (loja/`EconomyManager`) | 48×48 |
| `monsters/` | `slime`, `goblin`, `lobo` | 32×32 |
| `items/` | Equipamento dos 5 `EquipSlot`: `elmo` (Cabeça), `peitoral` (Peito), `espada` (MãoPrincipal), `escudo` (OffHand), `amuleto` (Acessório); materiais `minerio_ferro`, `couro`, `madeira`; `pocao_vida`; `moedas_ouro` | 32×32 |
| `map/mapa_regioes.png` | Mapa das regiões para mandar heróis em quests | 256×144 |

Ids do PixelLab em `pixellab-assets.json`.

## Receita
- Pro Flash, sem fundo, com `style_image` do asset aprovado do mesmo tamanho: guerreiro (`c0a33d59-5457-52eb-8f50-9b5c03e8e422`) para personagens 48×48, slime (`89ef1277-e217-5e34-80f9-8b914f9977bc`) para monstros, espada (`3c886af8-af5a-53eb-b0a9-543f4f47f237`) para ícones. Mapa/cenas: a cena aprovada (`75621811-a848-5332-b56b-c4eef0d5bf99`).

## Pendências
1. Retratos (`HeroData.portrait`) em close, se a UI pedir algo maior que o sprite inteiro.
2. Fundo da loja/forja como cenário de UI e mais monstros por região.
3. Animações (se o combate deixar de ser só simulado).
