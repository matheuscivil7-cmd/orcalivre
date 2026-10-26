"""Diagnóstico das fontes públicas para o radar de obras privadas. Salva amostras em OUT."""
import json, os, sys, urllib.request, urllib.parse, ssl, traceback
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/diag"
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (OrcaLivre robo)"}

def get(url, n=4_000_000):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.status, dict(r.headers), r.read(n)

def salva(nome, txt):
    open(f"{OUT}/{nome}", "w", encoding="utf8").write(txt if isinstance(txt, str) else txt.decode("utf8", "replace"))

def tenta(nome, fn):
    try:
        fn(); print("OK", nome)
    except Exception as e:
        print("ERRO", nome, e); salva(nome + ".erro.txt", traceback.format_exc())

def ckan(base, ds, nome):
    s, h, b = get(f"{base}/api/3/action/package_show?id={ds}")
    pk = json.loads(b); salva(nome + "_package.json", json.dumps(pk, ensure_ascii=False, indent=1)[:200000])
    for r in pk["result"]["resources"]:
        rid = r["id"]
        try:
            s, h, b = get(f"{base}/api/3/action/datastore_search?resource_id={rid}&limit=5")
            salva(f"{nome}_ds_{rid[:8]}.json", b)
        except Exception as e:
            salva(f"{nome}_ds_{rid[:8]}.erro.txt", str(e) + "\n" + r.get("url", ""))
        if r.get("url", "").lower().endswith(".csv"):
            try:
                s, h, b = get(r["url"], 60000); salva(f"{nome}_csv_{rid[:8]}.txt", b)
            except Exception as e:
                salva(f"{nome}_csv_{rid[:8]}.erro.txt", str(e))

tenta("bndes", lambda: ckan("https://dadosabertos.bndes.gov.br", "operacoes-financiamento", "bndes"))
tenta("aneel", lambda: ckan("https://dadosabertos.aneel.gov.br", "siga-sistema-de-informacoes-de-geracao-da-aneel", "aneel"))
tenta("ibama", lambda: ckan("https://dadosabertos.ibama.gov.br", "licencas-ambientais-emitidas", "ibama"))

def news():
    for q in ["investimento nova fábrica", "construção centro de distribuição investimento", "data center construção investimento milhões"]:
        u = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:30d", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"})
        s, h, b = get(u); salva("news_" + q.split()[0] + ".xml", b)
tenta("news", news)

def brasilapi():
    s, h, b = get("https://brasilapi.com.br/api/cnpj/v1/11421994000136")
    salva("brasilapi.json", json.dumps({"headers": h, "body": json.loads(b)}, ensure_ascii=False, indent=1))
tenta("brasilapi", brasilapi)

def minhareceita():
    s, h, b = get("https://minhareceita.org/11421994000136")
    salva("minhareceita.json", json.dumps({"headers": h, "body": json.loads(b)}, ensure_ascii=False, indent=1))
tenta("minhareceita", minhareceita)
