# Ônibus Curitiba

App pra consultar o transporte de Curitiba, pensado pro celular. Feito em
HTML, CSS e JavaScript puro (sem framework), com extratores em Python.

Duas telas:
- **Meu trajeto** (`index.html`) — o caminho casa ⇄ trabalho, com Ida e Volta,
  baldeação, 1 passagem, e os horários reais das alimentadoras.
- **Todas as linhas** (`linhas.html`) — busca entre as 309 linhas da cidade.

## A arquitetura (importante)

O dado oficial vem no formato **GTFS** (~78 MB). Pesado demais pro celular.
Por isso o projeto separa **dados** de **código**:

1. **Extratores (Python)** rodam no PC, leem o GTFS e geram arquivos pequenos
   em `dados/` (`linhas.json`, `trajeto.json`).
2. **O app (HTML/CSS/JS)** só *lê* esses arquivos. Nenhum horário fica escrito
   dentro do código — quando a URBS atualiza o feed, roda-se o extrator de novo
   e o app reflete sozinho.

```
.
├── index.html          # Meu trajeto
├── linhas.html         # Busca das 309 linhas
├── css/estilo.css
├── js/app.js           # lógica do Meu trajeto (lê dados/trajeto.json)
├── js/linhas.js        # lógica da busca   (lê dados/linhas.json)
├── dados/
│   ├── trajeto.json    # horários das alimentadoras (gerado)
│   └── linhas.json     # as 309 linhas (gerado)
└── extrator/
    ├── extrair.py          # gera dados/linhas.json
    └── extrair_trajeto.py  # gera dados/trajeto.json
```

## ⚠️ Como abrir

Como o app **busca** os arquivos de dados, ele precisa ser servido por HTTP —
**abra pela URL do GitHub Pages** (`https://mmbrosium.github.io/onibus-curitiba/`),
não abrindo o arquivo solto no celular (o navegador bloqueia a busca em `file://`).

## Atualizar os dados

1. Baixe e descompacte o GTFS numa pasta `feed/`:
   https://github.com/benaytms/urbs-gtfs/releases/download/latest/gtfs_curitiba.zip
2. Rode os extratores:
   ```
   python extrator/extrair.py feed
   python extrator/extrair_trajeto.py feed
   ```
3. Suba os `dados/*.json` atualizados.

## Roadmap
- [x] Busca das linhas · Volta · Ida · fiação real (extrator → JSON → app)
- [ ] Consolidado (ida + volta num resumo)
- [ ] Minimapa com o traçado das linhas
- [ ] Busca livre de origem/destino
- [ ] Tempo real (GPS) e linhas metropolitanas

## Créditos
Dados da URBS (Curitiba), via feed GTFS mantido pela comunidade a partir dos
dados abertos do C3SL/UFPR.
