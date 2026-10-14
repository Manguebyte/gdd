# Última Entrega — sprites PixelLab

Arte do [`UltimaEntrega.md`](../../UltimaEntrega.md) (Direção de arte): pixel art de alta resolução, entregador com cerca de 64 px de altura, paleta da superfície em cinza, ferrugem e verde doentio, bunkers em dourado, branco e mármore, e monstros vistos em parte, com olhos demais. O estilo foi aprovado no teste de 2026-10-14 (`_preview/teste_estilo.png`), com a roupa do entregador trocada para amarelo. Visão geral do lote: `_preview/lote1.png`.

## O que existe

| Pasta | Conteúdo | Tamanho |
|---|---|---|
| `chars/` | `entregador` (parado, de lado, virado para a direita), `entregador_andando_0..7` (caminhada), `entregador_pulo`, `entregador_agachado` e `colega_sem_capacete` (o gancho final, virado para a esquerda) | 48×64 |
| `boxes/` | `comum`, `fragil`, `pesada`, `selada`: os 4 tipos de caixa da demo | 24×24 |
| `monsters/` | `observador` (64×64), `rastejante` (64×64), `coro` (32×32) | |
| `bg/` | `ceu_criatura` (céu com a criatura colossal, camada distante), `ruinas` (silhuetas com fundo transparente, camada do meio), `bunker` (interior do Bunker Aurum), `deposito` (o hub), `cena_referencia` (a cena do teste de estilo) | 256×144 |
| `tiles/` | `superficie` e `bunker`: tilesets de plataforma (Wang de cantos, 16 tiles de 32 px). Nos `.json`, o sólido é o canto **lower**, e o **upper** é o vazio | 32 px |
| `props/` | `carro_destrocado` (cobertura), `porta_bunker` (destino da entrega), `banca_mercado` (mercado paralelo), `capsula_clone` (ponto de controle), `fragmento_asteroide` | 48 a 96 px |

Ids do PixelLab em `pixellab-assets.json`.

## Receita
- **Referências de estilo:**
  - Telas grandes: Pro Flash com `style_image` = cena aprovada (`4d675f09-4f97-56f7-b6ff-1f3e3a6d90fe`, 256×144).
  - Objetos e poses: o entregador amarelo (`26f315f5-a558-5f29-9186-7aed2d7490ae`, 48×64). A referência precisa caber na tela pedida.
- **Caminhada:** `animate_image` sobre o entregador, 8 quadros.
- **Tilesets:** `create_sidescroller_tileset` com 32 px. As cores vieram erradas (tijolo arroxeado na superfície, borda roxa no bunker). `python _tools/recolor_tiles.py` corrige a partir de `tiles/_raw/`.

## Pendências
1. **Animações que faltam:** pulo e agachar em vários quadros, os monstros (o protótipo anima em código: flutuação, patrulha, piscar) e as caixas quebrando.
2. **Os 2 tipos de caixa fora da demo:** refrigerada e viva.
3. **Clientes e bilionários** para a tela de entrega.
4. **Variações de cenário por faixa de loucura acumulada** (Abalado, Fraturado, Perdido). Hoje o protótipo aplica esses efeitos em código.
