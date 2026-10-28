# Changelog — Ônibus Curitiba

Formato baseado em "Keep a Changelog".

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
