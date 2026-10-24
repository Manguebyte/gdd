# Protocolo Ectoplasma — avaliação de acabamento

Data: 24/10/2026.

## Base e limites da avaliação

Inspeção de `game.js`, `style.css`, `index.html`, README do jogo, GDD e assets. Comparação visual da miniatura em `../thumbs/protocolo-ectoplasma.jpg` com `../../Sprites/ProtocoloEctoplasma/_preview/teste_interior.png`. Essas imagens são registros existentes, não capturas novas da versão atual; a miniatura pode anteceder ajustes descritos no README.

O navegador de inspeção estava indisponível. Não houve playtest nesta avaliação, nem validação auditiva, de desempenho ou do balanceamento. Os comportamentos citados abaixo foram identificados no código. As prioridades são julgamento de design a validar em uma pequena versão jogável.

## Diagnóstico

A implementação já tem um ciclo completo de missões, progressão, quatro comportamentos de inimigo, armadilhas, narrativa e feedback de captura/dano. A sensação de protótipo é compatível com uma apresentação que ainda evidencia a reutilização de conteúdo e oferece pouca encenação para os acontecimentos importantes.

A prioridade é dar identidade aos lugares, continuidade à experiência e consequência perceptível ao trabalho do operador. Preservar inicialmente velocidade, sucção, regeneração, custos e dificuldade permite avaliar o efeito do acabamento sem misturá-lo a mudanças de gameplay.

## O que preservar

- Resistência da captura, penalidade ao sugar andando e escolha entre continuar ou evacuar.
- Objetos do próprio cenário arremessados pelo Poltergeist, com antecipação visual.
- Captura com deformação, partículas, pausa de impacto e áudio reativo já implementados.
- Luz do porão e leitura do feixe bloqueado pelas paredes.
- Tom da LimpaCorp: linguagem de produtividade e valorização imobiliária diante de memórias humanas.

## Melhorias em ordem de execução

| Prioridade | Evidência atual | Mudança proposta | Critério de conclusão |
|---|---|---|---|
| P0 | `keydown` encaminha Esc diretamente a `leave('evac')`; sair durante a etapa perde metade da mochila. `blur` apenas limpa os comandos. | Esc abre pausa com Retomar, Controles, Áudio e Evacuar. Explicitar o valor mantido/perdido antes de confirmar a evacuação. Pausar ao perder foco. | Abrir pausa ou trocar de janela não abandona a missão; simulação e temporizadores relevantes ficam suspensos. |
| P0 | O final exibe ao jogador que o “final alternativo da §3.2” está em aberto. | Remover texto de desenvolvimento da experiência e apresentar o final existente com uma sequência visual e sonora curta. | O encerramento entrega uma conclusão sem citar GDD, pendências ou funcionalidades ausentes. |
| P1 | A miniatura mostra grande superfície uniforme de piso, móveis dispersos e arquitetura pouco integrada. As referências têm iluminação localizada e composição mais intencional. | Compor uma casa completa: relações entre móveis, portas/janelas, marcas de uso, pequenos objetos pessoais e áreas de combate legíveis. Reaproveitar os assets existentes antes de encomendar novos. | A casa sugere uma história e funções para os espaços; decoração não altera colisões nem esconde ataques sem decisão explícita. |
| P1 | Os 12 imóveis usam `casa_contaminada.png`; o térreo alterna entre três plantas por índice e todos usam o mesmo porão. | Dar identidade visual aos três imóveis da Vila; depois diferenciar cada bairro por arquitetura, materiais, objetos e iluminação. | É possível distinguir os lugares sem ler seus nomes; os espaços de combate continuam claros. |
| P1 | Introdução, bairro, loja e resultado compartilham uma estrutura genérica de telas. A loja lista melhorias como texto, inclusive valores em pixels. | Criar uma linguagem de terminal corporativo da LimpaCorp: ordens de serviço, catálogo de equipamento, recibo de extração e arquivo de ocorrências. Dar prioridade visual à ação principal de cada tela. | Telas parecem partes da mesma empresa e mostram claramente destino, risco, ganho e próximo passo. Trocar unidades internas por descrições úteis ao jogador. |
| P1 | `enterEtapa()` troca a cena diretamente; compra atualiza a lista; resultado resume a operação em texto. | Introduzir entrada breve com endereço e objetivo, transição de porta, confirmação audiovisual de compra e relatório de missão com contagem de plasma e carimbo. | O jogador percebe chegada, conclusão e upgrade; animações não atrasam repetidamente o ciclo e podem ser aceleradas. |
| P1 | A névoa da etapa diminui, mas a fachada permanece contaminada. O cartão limpo recebe filtro de cor e o bairro ganha um brilho no mapa. | Produzir estados contaminado/limpo para o imóvel de referência; mostrar a transformação no cenário e depois no mapa. | Um antes/depois evidencia o resultado sem depender do contador. A transformação avança de promessa comercial para ausência inquietante conforme a narrativa. |
| P1 | Memórias e bilhetes são salvos, mas não existe tela de consulta. Um único `toast` é sobrescrito por capturas, bilhetes e avisos; limpar a etapa pode substituir a memória da última captura. | Criar arquivo de memórias/bilhetes, separar avisos operacionais de narrativa e dar leitura voluntária em segurança. Vincular pistas importantes ao imóvel e a um objeto reconhecível. | Nenhuma pista depende de ler um aviso durante combate; toda pista descoberta pode ser relida. |
| P2 | Há sons sintetizados de ações, mas não trilha nem uma camada contínua de ambiente. | Criar ambientes para rua, térreo e porão; motivo musical corporativo no hub; evolução discreta para desconforto. Volume independente de música/efeitos e configuração persistente. | Avisos de ataque continuam audíveis; o silêncio após a limpeza é perceptível. Validar ouvindo em sessão real. |
| P2 | Fantasmas usam uma imagem por tipo com flutuação/deformação programada. O README dos assets registra que a caminhada do operador perdeu o bico do aspirador. | Corrigir a continuidade do equipamento e animar estados visuais prioritários: sucção do operador, resistência/ataque dos fantasmas e presença do chefe. | Arma, mão, mochila e origem do feixe permanecem coerentes andando e parado nas oito direções. |
| P2 | O mesmo Residual e a mesma sala de porão sustentam os quatro chefes, com diferentes acompanhantes e ameaça. | Dar a cada chefe nome, composição de arena, som e apresentação associados ao bairro; avaliar variação mecânica somente depois. | Cada confronto é reconhecível visualmente e tem uma chegada e uma conclusão próprias. |

## Direção visual proposta

Usar a contradição central do jogo também na apresentação: equipamento e interface da LimpaCorp limpos, organizados e impessoais; casas gastas, reconhecíveis e cheias de vestígios humanos. Isso dá unidade aos menus e sustenta a narrativa sem exigir exposição constante.

Organizar a cor por função: verde para plasma/sucção, roxo para manifestações, âmbar para presença doméstica e ciano para sistemas corporativos. Preservar contraste suficiente para separar ataques, objetos sólidos e decoração. Evitar aplicar brilho ou partículas uniformemente a tudo.

Na composição dos interiores, começar com um ponto de interesse por cômodo, móveis em conjuntos plausíveis e uma rota clara entre entrada e saída. Manter livre a área necessária ao combate. A referência ilustrada orienta atmosfera e composição; não deve ser copiada literalmente se sua perspectiva prejudicar a navegação top-down.

## Primeiro pacote recomendado: uma ordem de serviço completa

Usar a Casa da Rua das Acácias, 12, como referência de qualidade. Implementar o percurso inteiro: seleção → chegada → rua → térreo → porão → relatório → compra → retorno ao mapa.

1. Resolver pausa/evacuação e retirar texto de desenvolvimento do final.
2. Compor as três etapas dessa casa, mantendo inicialmente suas regras e colisões.
3. Unificar HUD, ordem de serviço, loja e relatório com a identidade da LimpaCorp.
4. Acrescentar transições curtas, confirmação de upgrade e transformação visível da casa.
5. Integrar um bilhete, um objeto pessoal e uma memória ao arquivo consultável.
6. Adicionar ambiente sonoro e corrigir a continuidade visual do aspirador.
7. Fazer um playtest desse percurso e comparar a percepção de acabamento com a versão anterior.

Essa entrega deve ser tratada como uma pequena parte do jogo com qualidade final. Ela define quais assets novos realmente fazem falta e fornece um padrão replicável para os outros imóveis. O esforço relativo concentra-se na composição e produção de variantes visuais; pausa, remoção de texto interno e arquivo de pistas tendem a ser menores, mas precisam de verificação de fluxo e save.

## Validação necessária antes de expandir

- Observar se alguém consegue iniciar, capturar, seguir de etapa, evacuar e comprar sem instrução externa.
- Confirmar que Esc e perda de foco não consomem recursos nem deixam temporizadores de resultado avançando indevidamente.
- Capturar a mesma sala antes/depois da limpeza e verificar se a diferença comunica a transformação proposta.
- Comparar movimento, leitura de ataques e circulação com a versão anterior; acabamento não deve diminuir a clareza.
- Conferir leitura da HUD e menus em diferentes tamanhos de janela; substituir emoji e símbolos inconsistentes por ícones próprios onde fizer diferença.
- Testar arquivo de memórias, persistência, retomada e conclusão da casa sem apagar saves existentes.
- Ouvir captura, ambiente e ataque simultâneos para avaliar hierarquia sonora.
- Pedir ao jogador que descreva onde esteve, o que mudou e qual pista encontrou; isso testa identidade e consequência além de “consegui vencer”.

## Escopo posterior

Novos tipos de fantasma, mais fases, andar superior, NPCs e final alternativo podem ampliar o jogo. A avaliação atual não indica que sejam necessários para a primeira rodada de acabamento. Também não há evidência aqui que justifique trocar de engine.

Antes de grandes adições, avaliar a casa de referência. Se ela já transmitir qualidade final, replicar o padrão na Vila e só então nos demais bairros.
