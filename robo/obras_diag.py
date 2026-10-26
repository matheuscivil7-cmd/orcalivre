import urllib.request, urllib.parse, re, html, time, sys, os
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diag'; os.makedirs(OUT, exist_ok=True); LOG = open(OUT + '/busca.txt', 'w')
def P(*a):
    print(*a); print(*a, file=LOG); LOG.flush()
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9"}
def get(u):
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25) as r: return r.status, r.read(900000).decode("utf8", "replace")
    except Exception as e: return str(e)[:80], ""
qs = ['"Suzano" portal de fornecedores', 'Mantiqueira Brasil site oficial', 'Cotrijal fornecedores']
eng = {
 "bing": lambda q: "https://www.bing.com/search?" + urllib.parse.urlencode({"q": q, "setlang": "pt-BR", "cc": "BR"}),
 "ddg_html": lambda q: "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": q, "kl": "br-pt"}),
 "ddg_lite": lambda q: "https://lite.duckduckgo.com/lite/?" + urllib.parse.urlencode({"q": q, "kl": "br-pt"}),
 "mojeek": lambda q: "https://www.mojeek.com/search?" + urllib.parse.urlencode({"q": q}),
 "yahoo": lambda q: "https://search.yahoo.com/search?" + urllib.parse.urlencode({"p": q}),
 "startpage": lambda q: "https://www.startpage.com/do/search?" + urllib.parse.urlencode({"q": q}),
}
for q in qs:
    for n, f in eng.items():
        st, h = get(f(q))
        links = [u for u in re.findall(r'href="(https?://[^"]+)"', h) if not re.search(r"bing\.|microsoft|duckduckgo|mojeek|yahoo|startpage|yimg|w3\.org|schema\.org", u)]
        P(n, q[:30], st, len(h), "captcha" if re.search(r"captcha|unusual traffic|anomaly|challenge", h, re.I) else "", links[:5])
        time.sleep(1.5)
