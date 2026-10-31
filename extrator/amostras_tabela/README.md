# Amostras sintéticas — getTabelaLinha (URBS)

Exemplos **sintéticos** (não são dados reais da URBS) no schema oficial do
endpoint `getTabelaLinha`, só pra documentar o formato e testar o parser
`extrair_tabela.py` enquanto a chave do WebService não chega.

Campos: `HORA` (HH:MM de passagem), `PONTO` (ponto de regulação),
`DIA` (1=útil, 2=sáb, 3=dom, 4=feriado), `Num`, `TABELA` (distingue o sentido).

Rodar:
    python extrator/extrair_tabela.py --linhas 212 203 --from-dir extrator/amostras_tabela --out dados/horarios_ida.json
