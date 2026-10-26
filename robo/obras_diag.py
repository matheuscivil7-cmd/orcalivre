import urllib.request, json, sys, os, re, io, collections
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diag'; os.makedirs(OUT, exist_ok=True)
import subprocess; subprocess.run([sys.executable, "-m", "pip", "install", "-q", "openpyxl"])
import openpyxl
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120) as r: return r.read(), r.geturl(), r.headers.get("content-type")
rep = {}
pg, _, _ = get("https://prefeitura.sp.gov.br/web/licenciamento/w/servicos/331597")
links = re.findall(r'href="([^"]+(?:xlsx|-xlsx)[^"]*)"', pg.decode("utf8", "replace"))
rep["links_2026"] = [l for l in links if "2026" in l]
for u in ["https://prefeitura.sp.gov.br/documents/d/licenciamento/agosto_2026_ad-xlsx"]:
    try:
        b, fu, ct = get(u); rep["final"] = fu; rep["ct"] = ct; rep["bytes"] = len(b)
        wb = openpyxl.load_workbook(io.BytesIO(b), read_only=True)
        for ws in wb.worksheets[:3]:
            rows = list(ws.iter_rows(values_only=True))
            rep[ws.title] = {"n": len(rows), "head": [list(map(str, r)) for r in rows[:8]]}
            # find header row
            hi = next((i for i, r in enumerate(rows[:15]) if sum(1 for c in r if c) >= 5), 0)
            hdr = [str(c) for c in rows[hi]]
            rep[ws.title]["hdr"] = hdr
            cnt = {}
            for ci, h in enumerate(hdr):
                vals = collections.Counter(str(r[ci])[:60] for r in rows[hi + 1:] if ci < len(r))
                if len(vals) < 60: cnt[h] = vals.most_common(25)
                else: cnt[h] = ["(muitos) ex:"] + [k for k, _ in vals.most_common(5)]
            rep[ws.title]["valores"] = cnt
    except Exception as e: rep["erro"] = str(e)
json.dump(rep, open(OUT + "/alvaras.json", "w"), ensure_ascii=False, indent=1, default=str)
