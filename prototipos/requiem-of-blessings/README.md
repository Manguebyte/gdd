# Requiem of Blessings — protótipo web (JavaScript)

Versão jogável em HTML/JS puro do MVP sugerido no [`RequiemOfBlessings.md`](../../RequiemOfBlessings.md) (§10), usando a arte do SpriteCook em [`Sprites/RequiemOfBlessings/`](../../Sprites/RequiemOfBlessings/) direto do lugar. Abra `index.html` no navegador.

## O que tem
- **Batalha ativa (§3.1):** turno do jogador com Pedra e um item (Elixir de HP / de Benção, 3 de cada) antes do ataque final. No turno inimigo, cada golpe vem com o Slash FX: arco largo branco-amarelado (Telegrafado: Esquiva com janela larga ou Parry com janela curta, que contra-ataca) ou arco fino vermelho (Ataque Rápido: só Sequência de Desvio, dano proporcional aos toques errados). Tocar cedo demais conta como erro.
- **Habilidades (§3.2/§3.4):** 3 fixas, uma por categoria (Dano Elevado, Área, Aleatório), todas com barra de precisão (0,5× a 1,5×) e custo em Benção Divina (começa em 1, +1 por turno, máx. 5).
- **Escudos (§3.3), Quebra (§3.7), Recuperação (§3.8), Queima (§3.9)**, com as regras do GDD: só Dano Elevado quebra monstros; quebrado = perde o turno e fica vulnerável (+50%) até o próximo ataque do jogador; 3+ hits num golpe deixam o atacante ofegante.
- **Mundo 1 "Catedral em Ruínas":** 7 masmorras de 2 ondas, a 7ª com o Bispo Caído (2 fases, invulnerável na transição aos 50%).
- **Acampamento (§4/§6.1):** Força, Vitalidade e Conhecimento com `Custo(N) = 20 × 1,12^(N−1)`; Tochas (5, +1 a cada 10 min pelo relógio, também com o jogo fechado; vídeo simulado dá +1).
- **Almas Perdidas (§5.1):** quem mata o herói guarda as Almas da expedição e volta brilhando na mesma onda; morrer de novo antes de recuperá-las apaga.
- **Visão Divina (§5.2):** ×3 na vitória, com o anúncio simulado. Save no `localStorage`.

## Valores que o GDD não fixa (escolhas do protótipo)
HP/Ataque/Defesa-base do herói (100/10/2), stats dos inimigos e escala de +15% por masmorra, janelas de reação (esquiva 420 ms, parry 170 ms antes do impacto), multiplicador do Ataque Rápido (1,5×), limiar de dano da Recuperação (50% do HP máximo do alvo), chance de Ataque Rápido por masmorra (8% → 38%). Tudo fica no objeto `B` e nas tabelas no topo do `game.js`.

## O que ficou de fora
Árvore de Conhecimento das Almas e loadout (o Conhecimento das Almas é contado mas não gasto), Forja de Gemas e Bomba, Missões Diárias, mundos 2–6 e NG+, anúncios reais, nuvem/Firebase, áudio.

## Controles e atalhos
Mouse/toque em tudo. Teclado: `Q` pedra, `W`/`E` elixires, `A` atacar, `1`–`3` habilidades, `Espaço`/`J` esquiva, `K` parry; tocar num inimigo troca o alvo.
Na URL: `#rich` (+2000 Almas), `#unlock` (libera as 7 masmorras), `#d1`…`#d7` (entra direto na masmorra), `#reset` (apaga o save).
