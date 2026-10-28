"""
Extrai os dados do MEU TRAJETO a partir do GTFS da URBS.

O que gera: dados/trajeto.json — com a grade de saídas das alimentadoras
do Terminal Cabral (as linhas da Volta) e um cabeçalho com a validade
do feed. É esse arquivo que o app lê; os horários NÃO ficam mais
escritos à mão dentro do HTML.

Como rodar (na raiz do projeto, com o GTFS descompactado numa pasta):
    python extrator/extrair_trajeto.py feed
"""

import csv
import json
import sys
from pathlib import Path
from collections import defaultdict

feed = Path(sys.argv[1] if len(sys.argv) > 1 else "feed")

# linhas alimentadoras da Volta e seus nomes
ALIMENTADORAS = {"212": "Solar", "214": "Tingui", "211": "Colina Verde"}

# nomes das paradas
nome = {}
with open(feed / "stops.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        nome[r["stop_id"]] = r["stop_name"]

# trips das alimentadoras em dia útil
trip_rota = {}
with open(feed / "trips.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        if r["route_id"] in ALIMENTADORAS and r["service_id"] == "dias_uteis":
            trip_rota[r["trip_id"]] = r["route_id"]

# saídas do Terminal Cabral (parada de origem, stop_sequence == 1)
saidas = defaultdict(set)
with open(feed / "stop_times.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        t = r["trip_id"]
        if t in trip_rota and r["stop_sequence"] == "1":
            if "Terminal Cabral" in nome.get(r["stop_id"], ""):
                saidas[trip_rota[t]].add((r["arrival_time"] or r["departure_time"])[:5])

# validade do feed
meta = {"gerado_em": "", "feed_inicio": "", "feed_fim": ""}
with open(feed / "feed_info.txt", encoding="utf-8", newline="") as f:
    info = next(csv.DictReader(f))
    meta["feed_inicio"] = info.get("feed_start_date", "")
    meta["feed_fim"] = info.get("feed_end_date", "")

import datetime
meta["gerado_em"] = datetime.date.today().isoformat()

trajeto = {
    "meta": meta,
    "horarios_cabral": [
        {"linha": rt, "nome": ALIMENTADORAS[rt], "tipo": "alimentadora",
         "saidas": sorted(saidas[rt])}
        for rt in ALIMENTADORAS if rt in saidas
    ],
}

destino = Path("dados")
destino.mkdir(exist_ok=True)
(destino / "trajeto.json").write_text(
    json.dumps(trajeto, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"Pronto! Validade do feed: {meta['feed_inicio']}–{meta['feed_fim']}")
for h in trajeto["horarios_cabral"]:
    print(f"  {h['linha']} {h['nome']}: {len(h['saidas'])} saídas")
