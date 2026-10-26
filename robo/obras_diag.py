import urllib.request, urllib.parse, json, sys, os, re
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diag'; os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0"}
rep = {}
def get(u, n=3_000_000):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=90) as r: return r.read(n).decode("utf8", "replace"), r.headers.get("content-type"), r.headers.get("content-length")
W = "http://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs"
try:
    cap, _, _ = get(W + "?service=WFS&version=2.0.0&request=GetCapabilities", 20_000_000)
    names = re.findall(r"<Name>([^<]+)</Name>", cap)
    rep["layers"] = [n for n in names if re.search(r"lote|iptu|fiscal|edif|alvar|licenc|constru", n, re.I)]
    rep["n_layers"] = len(names)
except Exception as e: rep["cap_err"] = str(e)
for ly in rep.get("layers", [])[:8]:
    try:
        d, _, _ = get(W + "?service=WFS&version=2.0.0&request=DescribeFeatureType&typeNames=" + ly)
        rep["desc_" + ly] = re.findall(r'name="([^"]+)" type="([^"]+)"', d)[:60]
        f, _, _ = get(W + "?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&count=1&typeNames=" + ly)
        j = json.loads(f); rep["ex_" + ly] = j["features"][0]["properties"] if j.get("features") else None
    except Exception as e: rep["err_" + ly] = str(e)[:200]
for u in ["https://download.geosampa.prefeitura.sp.gov.br/PaginasPublicas/downloadArquivo.aspx?orig=DownloadCamadas&arq=21_Cadastro%5C%5CIPTU%5C%5CCSV%5C%5CIPTU_2025&arqTipo=CSV",
          "http://geosampa.prefeitura.sp.gov.br/PaginasPublicas/downloadArquivo.aspx?orig=DownloadCamadas&arq=21_Cadastro%5C%5CIPTU%5C%5CCSV%5C%5CIPTU_2025&arqTipo=CSV",
          "https://geosampa.prefeitura.sp.gov.br/PaginasPublicas/downloadIfr.aspx?orig=DownloadCamadas&arq=21_Cadastro%5C%5CIPTU%5C%5CCSV&arqTipo=CSV"]:
    try:
        t, ct, cl = get(u, 4000); rep["dl " + u[:90]] = [ct, cl, t[:600]]
    except Exception as e: rep["dl " + u[:90]] = str(e)[:200]
json.dump(rep, open(OUT + "/geo.json", "w"), ensure_ascii=False, indent=1)
