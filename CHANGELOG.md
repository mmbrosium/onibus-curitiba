# Changelog — Ônibus Curitiba

Formato baseado em "Keep a Changelog".

## [0.10.0] — 2026-10-30
### Adicionado
- **Setas de sentido (verde)** sobre o trecho usado de cada linha, mostrando pra onde a viagem segue.
  Elas **invertem** quando você troca de aba: na **Ida** descem o mapa (rumo ao centro), na **Volta** sobem (rumo a casa).
- **Trecho a pé (azul pontilhado)** ligando a sua **localização atual** ao ponto de embarque
  (Erasto na Ida, Tubo Rui Barbosa na Volta), com **tempo estimado** no passo de ~5,5 km/h.

### Observação
- O trecho a pé é em **linha reta** por enquanto (aproximação). O caminho rua-a-rua de verdade
  (roteador de pedestre) entra depois. Se Casa/Trabalho estiver definido, o a-pé usa esse ponto.

## [0.9.0] — 2026-10-29
### Mudança de layout
- **Tela unificada**: o **mapa** virou a faixa de cima (visível nas duas abas, Ida e Volta) e o
  **trajeto** passo a passo a faixa de baixo. As duas são **gaveta** — recolhem/expandem pra focar
  no que você quer.
- A aba separada "Mapa" saiu: o mapa agora é compartilhado pelas duas abas (mesmo traçado; o que
  muda é o sentido descrito no passo a passo).

### Adicionado
- Barra de **Casa / Trabalho** no topo. Vem **vazia**; você preenche o endereço, ele é **salvo no
  navegador** (localStorage) e vira um **pino no mapa** (geocodificado na base aberta do OpenStreetMap).

### Observação
- Por enquanto o endereço só marca o pino no mapa — ainda **não recalcula a rota** (quais linhas/pontos)
  a partir dele; isso é o roteador, próximo passo. O trajeto segue o fixo (Rui Barbosa → Cabral → Erasto).

## [0.8.0] — 2026-10-29
### Adicionado
- **Contraste no mapa**: cada traçado ganhou um **contorno branco** (técnica de mapa de metrô)
  que separa a linha do fundo e das outras linhas. A cor real da linha (vermelhão/laranja) não mudou.
- **Pino com o número** de cada linha no mapa — identifica qual é qual sem precisar tocar.
- **Gaveta da linha**: toca no traçado (ou no número) e sobe uma gaveta com os detalhes
  (número, nome, tipo, sentido); toca de novo ou pra fora pra fechar. A linha tocada fica
  destacada no mapa e as outras apagam.

### Planejado (próximo)
- Layout unificado: mapa em cima + trajeto embaixo numa tela só; casa/trabalho no topo.
- Mapa em dois modos: detalhado (atual) e resumido (padrão).

## [0.7.0] — 2026-10-29
### Melhorado (mapa "sério")
- O traçado agora usa os **shapes reais** do GTFS (casados a cada linha por proximidade),
  então **segue as ruas** em vez de ligar paradas em linha reta (não corta mais quarteirões/parques).
- Cada linha é desenhada em **duas partes**: o **trecho que você usa** em linha cheia e o
  **resto do percurso** (que o ônibus faz, mas você não pega) em **pontilhado**.

### Corrigido
- Ponto da **casa** estava caindo na Praça Rui Barbosa (a busca "Erasto Gaertner" pegava uma
  plataforma de lá); agora aponta pra Av. Erasto Gaertner, no Bacacheri.

### Pendente (v0.8)
- Trecho a pé em azul e layout novo (mapa grande + trajeto embaixo), que dependem de
  configurar as coordenadas exatas de casa/trabalho.

## [0.6.0] — 2026-10-28
### Adicionado
- Nova aba **Mapa**: desenha o traçado do trajeto (troncal 203 em vermelho, alimentadoras em laranja),
  marca os pontos-chave (Rui Barbosa, Terminal Cabral, casa/Erasto) e mostra a **sua localização atual**
  (ponto azul, via GPS do navegador — pede permissão).
- Novo extrator `extrair_mapa.py`, que gera `dados/mapa.json` (traçado via pontos de parada).
- Biblioteca de mapa **Leaflet embutida no repo** (`libs/leaflet/`) — não depende de CDN externo.

### Nota
- O traçado é montado ligando os pontos de parada (o feed não liga os "shapes" às linhas), então segue
  a forma da rota, não a curva exata da rua. O mapa-base vem do OpenStreetMap.

## [0.5.0] — 2026-10-28
### Adicionado
- A Volta agora **calcula a partir de "saio do trabalho às agora"**: estima a chegada no
  tubo Rui Barbosa, no Terminal Cabral e em casa (tempos com "~" são estimados).
- Seletor de hora passou a **funcionar no mouse**: setas ▲▼, scroll de 1 em 1, sem selecionar texto.

### Corrigido
- **São João (213)** no lugar do **Colina Verde (211)** nas alimentadoras da Volta — o Colina
  não passa perto de casa (faz outro trajeto); o São João sai do Cabral e passa na Erasto.

## [0.4.0] — 2026-10-28
### Mudança estrutural (a "virada da fiação")
- Os horários **saíram do código** e agora moram em `dados/trajeto.json`, gerado
  pelo novo extrator `extrair_trajeto.py`. O app passou a **ler** esse arquivo.
- App separado em arquivos de verdade: `index.html` + `css/estilo.css` + `js/app.js`.
- `index.html` virou o **Meu trajeto** (Ida/Volta); a busca das 309 linhas foi para
  `linhas.html`.

### Corrigido
- "Próxima saída" pegava um ônibus de madrugada por engano em alguns horários —
  agora a lista é ordenada pela hora real antes de escolher a próxima.

### Atenção
- O app agora precisa ser aberto pela **URL do GitHub Pages**, não pelo arquivo solto.

## [0.3.0] — 2026-10-27
- Aba **Ida** (casa → trabalho) montada.

## [0.2.3] — 2026-10-27
- Cor dos numerais por tipo (troncal vermelho / alimentadora laranja); seletor com
  5 horários visíveis; tema roxo meia-noite com mais contraste.

## [0.2.2] — 2026-10-27
- Seletor com 3 visíveis, horas/minutos circulares, "vai-um" mais liso.

## [0.2.1] — 2026-10-27
- Seletor de hora em painel, com "vai-um"; engrenagem com o changelog no app.

## [0.2.0] — 2026-10-27
- 3 abas (Ida/Volta/Consolidado); Volta dinâmica na hora atual; seletor em rolo;
  correção do Solar 00:15 (último da frota, não o primeiro).

## [0.1.0] — 2026-10-27
- App base: busca das 309 linhas + extrator Python; primeiro protótipo da Volta.

---
## Planejado
- **Perto:** Consolidado; minimapa com o traçado das linhas (shapes).
- **Médio:** busca livre de origem/destino.
- **Longe:** tempo real (GPS) e linhas metropolitanas (Metrocard/Pinhais) — dependem de dado que ainda não temos.
