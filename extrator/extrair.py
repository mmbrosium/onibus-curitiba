"""
Extrator de linhas do GTFS de Curitiba.

O QUE FAZ: lê o arquivo bruto 'routes.txt' (que vem dentro do GTFS da
URBS) e gera um 'dados/linhas.json' enxuto, só com o que o app precisa.

POR QUE EXISTE: o GTFS cru tem ~78 MB e milhões de linhas. Jogar isso
num site estático trava o celular. Então a gente "mastiga" o dado aqui
no PC e cospe um arquivo pequeno. Esse passo é o coração do projeto —
é o mesmo princípio dos seus extratores (reduzir base gigante ao que
importa).

COMO RODAR (a partir da raiz do projeto):
    python extrator/extrair.py feed

...onde 'feed' é a pasta com o GTFS descompactado.
"""

import csv
import json
import sys
from pathlib import Path


def extrair_linhas(pasta_feed: Path) -> list[dict]:
    """Lê routes.txt e devolve uma lista de linhas no formato {id, nome}."""
    arquivo = pasta_feed / "routes.txt"
    linhas = []

    # newline="" é a forma recomendada de abrir CSV em Python
    with open(arquivo, encoding="utf-8", newline="") as f:
        leitor = csv.DictReader(f)  # cada linha do CSV vira um dicionário
        for linha in leitor:
            linhas.append({
                "id": linha["route_id"],
                "nome": linha["route_long_name"],
            })

    # ordena por nome, pra lista ficar amigável de ler
    linhas.sort(key=lambda l: l["nome"])
    return linhas


def main():
    # pega o caminho do feed da linha de comando (ou assume "feed")
    pasta_feed = Path(sys.argv[1] if len(sys.argv) > 1 else "feed")

    linhas = extrair_linhas(pasta_feed)

    destino = Path("dados")
    destino.mkdir(exist_ok=True)  # cria a pasta dados/ se não existir

    saida = destino / "linhas.json"
    with open(saida, "w", encoding="utf-8") as f:
        # ensure_ascii=False mantém os acentos (Botânico, não Botânico)
        json.dump(linhas, f, ensure_ascii=False, indent=2)

    print(f"Pronto! {len(linhas)} linhas salvas em {saida}")


if __name__ == "__main__":
    main()
