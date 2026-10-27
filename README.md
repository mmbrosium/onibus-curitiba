# Ônibus Curitiba

App simples pra consultar as linhas de ônibus de Curitiba, pensado pra
usar no celular. Feito em HTML, CSS e JavaScript puro (sem framework),
com um extrator de dados em Python.

## A ideia

O dado oficial de transporte de Curitiba vem no formato **GTFS** — um
pacote de ~78 MB com milhões de registros. Pesado demais pra um site
abrir no celular. Por isso o projeto tem duas partes:

1. **Extrator (Python)** — roda no PC, lê o GTFS bruto e gera arquivos
   pequenos em `dados/` só com o que o app precisa.
2. **App (HTML/CSS/JS)** — abre no navegador, carrega esses arquivos
   leves e mostra tudo rápido.

## Estrutura

```
.
├── index.html          # a página
├── css/estilo.css      # visual
├── js/app.js           # lógica da tela
├── dados/linhas.json   # dado enxuto (gerado pelo extrator)
└── extrator/
    └── extrair.py      # gera dados/linhas.json a partir do GTFS
```

## Como atualizar os dados

1. Baixe o GTFS de Curitiba e descompacte numa pasta `feed/`:
   https://github.com/benaytms/urbs-gtfs/releases/download/latest/gtfs_curitiba.zip
2. Na raiz do projeto, rode:
   ```
   python extrator/extrair.py feed
   ```
3. Ele regenera `dados/linhas.json`.

## Roadmap

- [x] Fase 0 — listar e buscar as linhas
- [ ] Fase 1 — montar trajeto origem → destino pelo horário tabelado
- [ ] Fase 2 — posição dos ônibus em tempo real
- [ ] Fase 3 — desvio inteligente de trânsito

## Créditos dos dados

Dados de linhas da URBS (Urbanização de Curitiba S/A), via feed GTFS
não-oficial mantido pela comunidade a partir dos dados abertos do
C3SL/UFPR.
