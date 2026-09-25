# Sem backend: Android Auto Backup no lugar de cloud save

O Star Expedition Co. 1.0 não tem servidor de jogo, conta de jogador nem cloud save (Google Play Games Saved Games). O progresso vive num único arquivo JSON local, e a troca de celular é coberta pelo **Android Auto Backup**, que copia a pasta de dados do app para o Google Drive do jogador e a restaura na reinstalação. Decidimos assim para manter a 1.0 sem custo de servidor e sem integração com Play Games. Isso vale mesmo com IAP: as compras não consumíveis (Ad-Free, Founder Pack) são recuperadas da própria Google Play ao reinstalar, então não dependem do save.

## Consequences

- O relógio do aparelho é a única fonte de tempo dos timers de Expedition. Se o relógio andar para trás, os timers congelam. Se andar para frente, a trapaça é tolerada: o jogo é single-player e sem ranking.
- O Auto Backup do Android roda cerca de 1× por dia e só com Wi-Fi e carregador. Quem troca de celular pode perder até ~24 h de progresso. Aceito para a 1.0.
- Adicionar cloud save depois exige resolver conflitos entre saves: o formato do save já nasce versionado para isso.
