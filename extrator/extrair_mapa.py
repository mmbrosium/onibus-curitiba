"""
Extrai o traçado (coordenadas) do trajeto para o mapa → dados/mapa.json.

Como o feed não liga o traçado (shapes) à linha, o percurso é montado
ligando as PARADAS de uma viagem de cada linha, na ordem. Fica a forma da
rota (não a curva exata da rua), que já serve pro mapa.

Rodar: python extrator/extrair_mapa.py feed
"""

import csv
import json
import sys
from pathlib import Path
from collections import defaultdict

feed = Path(sys.argv[1] if len(sys.argv) > 1 else "feed")

stops = {}
with open(feed / "stops.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        try:
            stops[r["stop_id"]] = (float(r["stop_lat"]), float(r["stop_lon"]), r["stop_name"])
        except ValueError:
            pass

route_nome = {}
with open(feed / "routes.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        route_nome[r["route_id"]] = r["route_long_name"]

trips_por_rota = defaultdict(list)
with open(feed / "trips.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        if r["service_id"] == "dias_uteis":
            trips_por_rota[r["route_id"]].append(r["trip_id"])

LINHAS = ["203", "212", "214", "213"]
interesse = set()
for rt in LINHAS:
    interesse.update(trips_por_rota[rt])

seqs = defaultdict(list)
with open(feed / "stop_times.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        if r["trip_id"] in interesse:
            seqs[r["trip_id"]].append((int(r["stop_sequence"]), r["stop_id"]))


def escolhe(rt, cond):
    for t in trips_por_rota[rt]:
        lst = sorted(seqs.get(t, []))
        if not lst:
            continue
        o = stops.get(lst[0][1], (0, 0, ""))[2]
        d = stops.get(lst[-1][1], (0, 0, ""))[2]
        if cond(o, d):
            return [stops[s][:2] for _, s in lst if s in stops]
    return None


linhas = []
t = escolhe("203", lambda o, d: "Capão Raso" in o and "Santa Cândida" in d)
if t:
    linhas.append({"linha": "203", "nome": route_nome.get("203"), "tipo": "tronco", "coords": [[a, b] for a, b in t]})
for rt in ["212", "214", "213"]:
    t = escolhe(rt, lambda o, d: "Terminal Cabral" in o)
    if t:
        linhas.append({"linha": rt, "nome": route_nome.get(rt), "tipo": "alim", "coords": [[a, b] for a, b in t]})


def acha(sub):
    for sid, (la, lo, nm) in stops.items():
        if sub in nm:
            return (la, lo)
    return None


pontos = []
for label, sub in [("Tubo Rui Barbosa", "Rui Barbosa"), ("Terminal Cabral", "Terminal Cabral"), ("Casa (Erasto)", "Erasto Gaertner")]:
    a = acha(sub)
    if a:
        pontos.append({"nome": label, "lat": a[0], "lon": a[1]})

out = {"linhas": linhas, "pontos": pontos}
Path("dados").mkdir(exist_ok=True)
Path("dados/mapa.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print("linhas:", [(l["linha"], len(l["coords"]), "pts") for l in linhas])
print("pontos:", [p["nome"] for p in pontos])
