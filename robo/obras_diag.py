import urllib.request, urllib.parse, json, sys, os, re
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diag'; os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0"}
rep = {}
def get(u, n=20_000_000):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: return r.read(n).decode("utf8", "replace")
W = "http://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs"
cap = get(W + "?service=WFS&version=2.0.0&request=GetCapabilities")
names = re.findall(r"<Name>([^<]+)</Name>", cap)
rep["cands"] = [n for n in names if re.search(r"pgv|valor|zonea|zona_|bairro|distrito|subpref|uso|padrao|alvar|aprova|ocupa", n, re.I)]
def feat(ly, extra=""):
    try:
        j = json.loads(get(W + "?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&count=2&typeNames=" + ly + extra))
        return [f["properties"] for f in j.get("features", [])]
    except Exception as e: return str(e)[:200]
rep["lote_cidadao"] = feat("geoportal:lote_cidadao")
for ly in rep["cands"][:14]: rep["ex " + ly] = feat(ly)
# filtro por SQL 120.194.0005
for cql in ["cd_setor_fiscal='120' AND cd_quadra_fiscal='194' AND cd_lote='0005'", "cd_setor_fiscal='120' AND cd_quadra_fiscal='194'"]:
    rep["cql " + cql] = feat("geoportal:lote_cidadao", "&CQL_FILTER=" + urllib.parse.quote(cql))
json.dump(rep, open(OUT + "/geo2.json", "w"), ensure_ascii=False, indent=1)
