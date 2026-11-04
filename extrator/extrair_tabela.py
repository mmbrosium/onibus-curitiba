"""
Parser da getTabelaLinha (WebService da URBS) -> horários da IDA.

Por que este arquivo existe
---------------------------
O GTFS aberto só traz o horário de SAÍDA do terminal de origem de cada viagem;
os pontos do meio (Cabral, Rui Barbosa, Erasto) vêm em branco. Por isso a Volta
é exata (embarque no Cabral, que é a origem da alimentadora) e a Ida não dá pra
cravar só com o GTFS — o embarque da Ida é no meio da linha nas duas pernas.

A fonte certa pra Ida é a "fita" da URBS: o endpoint getTabelaLinha, que dá o
horário de passagem nos PONTOS DE REGULAÇÃO de cada linha.

Formato da resposta (documentação oficial do WebService — Transporte Coletivo):
  getTabelaLinha(linha="NNN") -> lista de registros:
    { "HORA": "HH:MM", "PONTO": "<nome do ponto de regulação>",
      "DIA": "1"|"2"|"3"|"4", "Num": "<n>", "TABELA": "<n>" }
  DIA: 1=dia útil, 2=sábado, 3=domingo, 4=feriado.
  NÃO há campo de sentido — o sentido é distinguido pela TABELA.

Como rodar
----------
  # Agora (sem chave): processa JSONs já baixados (um por linha), ex. amostras.
  python extrator/extrair_tabela.py --from-dir amostras_tabela --out dados/horarios_ida.json

  # Quando a chave chegar: baixa do WebService e processa.
  # (o formato exato do parâmetro de credencial vem no documento que acompanha
  #  a chave da URBS; está isolado em baixa_tabela() pra ligar numa linha só.)
  python extrator/extrair_tabela.py --linhas 203 250 212 214 213 --out dados/horarios_ida.json
"""

import argparse
import json
import sys
from pathlib import Path

# Pra cada linha, qual trecho do nome do PONTO identifica o embarque da IDA.
# (ajustável quando a gente vir os nomes reais dos pontos de regulação da URBS)
EMBARQUE_IDA = {
    "212": "Erasto",   # alimentadora: embarca perto de casa, sentido Cabral
    "214": "Erasto",
    "213": "Erasto",
    "203": "Cabral",   # troncal: embarca no Cabral, sentido centro (Rui Barbosa)
    "250": "Cabral",
}

DIAS = {"1": "util", "2": "sabado", "3": "domingo", "4": "feriado"}


def _reg(registros):
    """Normaliza: aceita lista direta ou dict que embrulha a lista; chaves em maiúscula."""
    if isinstance(registros, dict):
        for k in ("tabela", "TABELA", "registros", "data", "result"):
            if isinstance(registros.get(k), list):
                registros = registros[k]
                break
        else:
            registros = [registros]
    saida = []
    for r in registros:
        saida.append({str(k).upper(): v for k, v in r.items()})
    return saida


def grade_por_ponto(registros, dia="1"):
    """-> { nome_do_ponto: [HH:MM, ...] ordenado e único } para o tipo de dia."""
    out = {}
    for r in _reg(registros):
        if str(r.get("DIA", "1")) != dia:
            continue
        ponto = (r.get("PONTO") or "").strip()
        hora = (r.get("HORA") or "").strip()[:5]
        if not ponto or not hora:
            continue
        out.setdefault(ponto, set()).add(hora)
    return {p: sorted(h) for p, h in out.items()}


def horarios_embarque(registros, fragmento, dia="1"):
    """Horários nos pontos cujo nome contém `fragmento` (ex.: 'Erasto', 'Cabral')."""
    grade = grade_por_ponto(registros, dia)
    horas = set()
    pontos = []
    for ponto, hs in grade.items():
        if fragmento.lower() in ponto.lower():
            horas.update(hs)
            pontos.append(ponto)
    return sorted(horas), pontos


def baixa_tabela(linha, chave=None):
    """Baixa getTabelaLinha do WebService da URBS.
    Liga quando a chave chegar: o formato do parâmetro de credencial vem no
    documento da URBS. Em produção isso roda num proxy (a chave não vai pro
    navegador). Por ora levanta erro explicando.
    """
    raise NotImplementedError(
        "Sem chave ainda. Rode com --from-dir usando JSONs baixados, "
        "ou plugue aqui a chamada autenticada quando a URBS liberar a chave."
    )


def processa(linhas, carregar, dia="1"):
    """carregar(linha) -> registros. Devolve o dict pronto pro app."""
    saida = {"meta": {"fonte": "URBS getTabelaLinha", "dia": DIAS.get(dia, dia)},
             "linhas": []}
    for ln in linhas:
        frag = EMBARQUE_IDA.get(ln, "Cabral")
        registros = carregar(ln)
        horas, pontos = horarios_embarque(registros, frag, dia)
        saida["linhas"].append({
            "linha": ln, "embarque": frag, "pontos_casados": pontos,
            "saidas": horas,
        })
    return saida


def main(argv=None):
    ap = argparse.ArgumentParser(description="Parser da getTabelaLinha -> horários da Ida")
    ap.add_argument("--linhas", nargs="+", default=list(EMBARQUE_IDA))
    ap.add_argument("--from-dir", help="pasta com <linha>.json já baixados")
    ap.add_argument("--dia", default="1", help="1=útil 2=sáb 3=dom 4=feriado")
    ap.add_argument("--out", default="dados/horarios_ida.json")
    a = ap.parse_args(argv)

    if a.from_dir:
        base = Path(a.from_dir)
        def carregar(ln):
            p = base / f"{ln}.json"
            if not p.exists():
                raise FileNotFoundError(f"não achei {p}")
            return json.loads(p.read_text(encoding="utf-8"))
    else:
        def carregar(ln):
            return baixa_tabela(ln)

    resultado = processa(a.linhas, carregar, a.dia)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    for l in resultado["linhas"]:
        print(f"  {l['linha']} (embarque ~{l['embarque']}): {len(l['saidas'])} horários "
              f"| pontos: {l['pontos_casados'] or '— nenhum casou'}")
    print(f"Gerado: {out}")


if __name__ == "__main__":
    main()
