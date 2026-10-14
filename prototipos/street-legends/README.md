# Street Legends — protótipo web

Corrida de rua com exploração livre, eventos pela cidade e perseguição policial. Abra `index.html`, de preferência por um servidor HTTP local para permitir as pinturas dos carros. Física em `../rally-core/`, arte em `../../Sprites/StreetLegends/`.

## Como jogar

1. Clique em **Explorar a cidade**.
2. Procure largadas no minimapa: **ciano = sprint**, **laranja = circuito**.
3. Aproxime-se e pressione **E** ou toque no botão do evento.
4. Passe pelos checkpoints em ordem. Circuitos exigem **duas voltas**.
5. Na chegada, envie seu tempo e clique em **Continuar na cidade**. A perseguição continua se ainda houver viaturas.
6. Fique **10 segundos sem contato visual**, usando distância e prédios para despistar.

**Controles:** W/seta para cima acelera; A/D ou setas laterais esterçam; S/seta para baixo e espaço freiam. Mouse ou arrastar o dedo também dirigem. **G** abre a garagem na exploração sem perseguição. **ESC** abandona o evento e volta à exploração; na exploração, abre o menu. **Shift+R** reinicia o evento selecionado.

## Cidade e eventos

- Quadras de tamanhos variados: centro antigo, distrito comercial, Jardins e porto industrial.
- Casas recuadas e áreas verdes nos Jardins; comércio com pátios abertos; galpões maiores no porto; parques com caminhos e lagos decorativos.
- Avenida e Porto: sprints com chegada em outro ponto da cidade.
- Centro e Jardins: circuitos de duas voltas, com chegada na largada.
- Marcadores no mundo e minimapa, indicação do bairro e HUD de volta/perseguição.

A malha principal continua ortogonal; a variação vem das dimensões das quadras, ocupação dos lotes e espaços livres. Os lagos são decoração. Ainda não há trânsito civil em movimento ou adversários de corrida.

## Polícia e progressão

Explorar sem perseguição não gera viaturas automaticamente. Corridas atraem a primeira após 8 segundos; reforços chegam a cada 25 segundos, até seis. A perseguição permanece depois da corrida. Viaturas seguem cruzamentos e tentam interceptar diretamente quando não há prédios bloqueando o caminho.

Uma viatura dentro de 3 unidades por 2 segundos seguidos causa captura e multa de até $75, sem saldo negativo. Voltar à cidade após captura encerra a perseguição.

Corridas dão dinheiro para motor, suspensão, freios, pintura e neon. Carteira, upgrades, desbloqueios e rankings ficam em `localStorage`; o save anterior foi preservado. Como as rotas mudaram, tempos anteriores podem não ser comparáveis.

## Desenvolvimento

Na URL: `#avenida`, `#centro`, `#porto`, `#jardins` entram no evento; `#sempolicia` desliga viaturas; `#rico` inicia com $5000; `#reset` apaga o save. Combine opções com vírgulas.

```sh
node --check prototipos/street-legends/game.js
node prototipos/street-legends/smoke-test.cjs
```

O teste usa DOM/canvas simulados e a física real do core. Verifica exploração, largada por proximidade, checkpoints acessíveis, duas voltas, recompensa, perseguição após chegada, fuga, pausa da garagem e retorno após captura. Não substitui avaliação visual e de dirigibilidade no navegador.
