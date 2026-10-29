"""
Extrai o traçado do trajeto para o mapa → dados/mapa.json.

Agora usa os SHAPES reais do GTFS (o desenho que segue a rua), casados a cada
linha por proximidade das paradas — assim o traçado não "corta" quarteirões.
Para cada linha também marca onde começa e termina o TRECHO que a gente usa,
pra o app desenhar sólido nesse trecho e pontilhado no resto da linha.

Rodar: python extrator/extrair_mapa.py feed
"""

import csv
import json
import sys
from pathlib import Path
from collections import defaultdict

feed = Path(sys.argv[1] if len(sys.argv) > 1 else "feed")

shapes = defaultdict(list)
with open(feed / "shapes.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        shapes[r["shape_id"]].append((float(r["shape_pt_lat"]), float(r["shape_pt_lon"])))

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

ROTAS = ["203", "212", "214", "213"]
interesse = set()
for rt in ROTAS:
    interesse.update(trips_por_rota[rt])
seqs = defaultdict(list)
with open(feed / "stop_times.txt", encoding="utf-8", newline="") as f:
    for r in csv.DictReader(f):
        if r["trip_id"] in interesse:
            seqs[r["trip_id"]].append((int(r["stop_sequence"]), r["stop_id"]))


def paradas_de(rt, cond):
    for t in trips_por_rota[rt]:
        lst = sorted(seqs.get(t, []))
        if not lst:
            continue
        o = stops.get(lst[0][1], ("", "", ""))[2]
        d = stops.get(lst[-1][1], ("", "", ""))[2]
        if cond(o, d):
            return [stops[s][:2] for _, s in lst if s in stops]
    return None


def melhor_shape(paradas):
    lats = [p[0] for p in paradas]; lons = [p[1] for p in paradas]
    bb = (min(lats) - 0.008, max(lats) + 0.008, min(lons) - 0.008, max(lons) + 0.008)
    amostra = paradas[::2]
    melhor = (1e9, None)
    for sid, pts in shapes.items():
        if not any(bb[0] <= la <= bb[1] and bb[2] <= lo <= bb[3] for la, lo in pts[::8]):
            continue
        sp = pts[::3]
        tot = sum(min((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 for q in sp) for p in amostra)
        m = tot / len(amostra)
        if m < melhor[0]:
            melhor = (m, sid)
    return shapes[melhor[1]] if melhor[1] else paradas


def idx_perto(shape, coord):
    best, bi = 1e9, 0
    for i, p in enumerate(shape):
        d = (p[0] - coord[0]) ** 2 + (p[1] - coord[1]) ** 2
        if d < best:
            best, bi = d, i
    return bi


def acha(sub):
    for sid, (la, lo, nm) in stops.items():
        if sub in nm:
            return (la, lo)
    return None


RUI = acha("Praça Rui Barbosa")
CABRAL = acha("Terminal Cabral")
CASA = acha("Prefeito Erasto Gaertner")   # parada na Av. Erasto Gaertner (Bacacheri), não a plataforma da Rui Barbosa

# (rota, tipo, condição de sentido, coord de embarque, coord de desembarque)
PLANO = [
    ("203", "tronco", lambda o, d: "Capão Raso" in o and "Santa Cândida" in d, RUI, CABRAL),
    ("212", "alim", lambda o, d: "Terminal Cabral" in o, CABRAL, CASA),
    ("214", "alim", lambda o, d: "Terminal Cabral" in o, CABRAL, CASA),
    ("213", "alim", lambda o, d: "Terminal Cabral" in o, CABRAL, CASA),
]

linhas = []
for rt, tipo, cond, emb, des in PLANO:
    par = paradas_de(rt, cond)
    if not par:
        continue
    shp = melhor_shape(par)
    i_emb = idx_perto(shp, emb)
    i_des = idx_perto(shp, des)
    linhas.append({
        "linha": rt, "nome": route_nome.get(rt), "tipo": tipo,
        "shape": [[a, b] for a, b in shp],
        "i_emb": min(i_emb, i_des), "i_des": max(i_emb, i_des),
    })

pontos = []
for label, coord in [("Tubo Rui Barbosa", RUI), ("Terminal Cabral", CABRAL), ("Casa (Erasto/Bacacheri)", CASA)]:
    if coord:
        pontos.append({"nome": label, "lat": coord[0], "lon": coord[1]})

out = {"linhas": linhas, "pontos": pontos}
Path("dados").mkdir(exist_ok=True)
Path("dados/mapa.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
print("linhas:", [(l["linha"], len(l["shape"]), "pts; usa", l["i_des"] - l["i_emb"], "trechos") for l in linhas])
print("pontos:", [(p["nome"], round(p["lat"], 4), round(p["lon"], 4)) for p in pontos])
