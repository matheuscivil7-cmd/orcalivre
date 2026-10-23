"""Robô do OrçaLivre: boletim de custos da CDHU (SP).

A CDHU publica o boletim em PDF. Este robô usa a extração aberta mantida em
github.com/kayque-soares/sinapi-sp-dados (que confere cada serviço contra o custo oficial)
e grava dados/cdhu/<versão>/cat.json no formato do OrçaLivre, só quando sai versão nova.
"""
import json, os, sys, urllib.request, datetime

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.environ.get("ORCALIVRE_DADOS", os.path.join(RAIZ, "dados"))
FONTE = "https://raw.githubusercontent.com/kayque-soares/sinapi-sp-dados/main/cdhu"


def baixar(rel):
    with urllib.request.urlopen(f"{FONTE}/{rel}", timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def tipo(cl, u):
    x = (cl or "").upper()
    if "MAO DE OBRA" in x or "MÃO DE OBRA" in x: return "MO"
    if "EQUIP" in x: return "EQ"
    if "MATERIAL" in x: return "MAT"
    if "SERVI" in x: return "SV"
    return "OUT" if x else "MAT"


def limpo(v):
    return None if v in (None, 0, 0.0) else round(float(v), 2)


def main():
    idx = baixar("index.json")
    v = max(idx["versoes"], key=lambda x: x["versao"])
    ver = v["versao"]
    destino = os.path.join(DADOS, "cdhu", str(ver), "cat.json")
    man_path = os.path.join(DADOS, "bases.json")
    man = json.load(open(man_path, encoding="utf-8")) if os.path.exists(man_path) else {}
    if os.path.exists(destino) and man.get("cdhu", {}).get("versao") == ver:
        print(f"CDHU {ver} já está no site."); return
    meta = baixar(f"{ver}/meta.json"); ins = baixar(f"{ver}/insumos.json"); comp = baixar(f"{ver}/composicoes.json"); est = baixar(f"{ver}/estrutura.json")
    if len(ins) < 1000 or len(comp) < 1000:
        sys.exit("ERRO: boletim CDHU com poucos itens; nada foi gravado.")
    itens = {}
    for x in est:
        itens.setdefault(x["c"], []).extend([x["t"], x["i"], x["k"]])
    grupos, gi = [], {}
    def g(n):
        if n not in gi: gi[n] = len(grupos); grupos.append(n)
        return gi[n]
    cat = {"m": meta["competencia"], "versao": ver,
           "ins": [[x["c"], x["d"], x["u"], tipo(x.get("cl"), x["u"]), limpo(x.get("p"))] for x in ins],
           "comp": [[x["c"], x["d"], x["u"], g(x.get("gn") or x.get("g") or ""), limpo(x.get("p")), itens.get(x["c"], [])] for x in comp],
           "g": grupos}
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        json.dump(cat, f, ensure_ascii=False, separators=(",", ":"))
    man["cdhu"] = {"versao": ver, "competencia": meta["competencia"], "data_base": meta.get("data_base", ""),
                   "leis_sociais": meta.get("leis_sociais"), "fonte": "CDHU – Boletim Referencial de Custos (SP)"}
    man["gerado"] = datetime.date.today().isoformat()
    with open(man_path, "w", encoding="utf-8") as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    print(f"CDHU {ver} ({meta.get('data_base','')}): {len(ins)} insumos, {len(comp)} composições.")


if __name__ == "__main__":
    main()
