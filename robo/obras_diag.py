import urllib.request, urllib.parse, sys, os
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diag'; os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9"}
for n, u in [("ddg_html", "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": "Cotrijal fornecedores", "kl": "br-pt"})),
             ("ddg_lite", "https://lite.duckduckgo.com/lite/?" + urllib.parse.urlencode({"q": "Cotrijal fornecedores", "kl": "br-pt"})),
             ("ddg_post", None)]:
    try:
        if u: req = urllib.request.Request(u, headers=UA)
        else: req = urllib.request.Request("https://html.duckduckgo.com/html/", data=urllib.parse.urlencode({"q": "Cotrijal fornecedores", "kl": "br-pt"}).encode(), headers={**UA, "Content-Type": "application/x-www-form-urlencoded", "Referer": "https://html.duckduckgo.com/"})
        with urllib.request.urlopen(req, timeout=25) as r: open(f"{OUT}/{n}.html", "wb").write(r.read())
    except Exception as e: open(f"{OUT}/{n}.html", "w").write(str(e))
