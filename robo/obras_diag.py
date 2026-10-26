import urllib.request, urllib.parse, json, sys, os, re, html, time
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/diag'; os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0", "Accept-Language": "pt-BR"}
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60) as r: return r.read().decode("utf8", "replace")
res = {}
qs = ['"alvará de aprovação"', '"alvará de execução"', '"aprovação e execução"', '"edificação nova"', '"residência unifamiliar"', '"projeto modificativo"', '"reforma" "alvará"', 'deferido "alvará de aprovação"']
for base in ["https://api.queridodiario.ok.org.br/gazettes", "https://queridodiario.ok.org.br/api/gazettes"]:
    for q in qs:
        p = urllib.parse.urlencode({"territory_ids": "3550308", "querystring": q, "published_since": "2026-09-20", "size": 5, "excerpt_size": 1200, "number_of_excerpts": 3, "sort_by": "descending_date"})
        try:
            j = json.loads(get(base + "?" + p))
            res[base[:30] + " " + q] = {"total": j.get("total_gazettes"), "g": [{"date": g.get("date"), "url": g.get("url"), "ex": [re.sub(r"\s+", " ", html.unescape(e)) for e in g.get("excerpts", [])]} for g in j.get("gazettes", [])[:3]]}
        except Exception as e:
            res[base[:30] + " " + q] = str(e)
        time.sleep(1)
json.dump(res, open(OUT + "/sp.json", "w"), ensure_ascii=False, indent=1)
# notícias
import xml.etree.ElementTree as ET
nq = ['escritório de arquitetura residência alto padrão São Paulo', 'casa Jardim Europa arquitetura projeto', 'edifício alto padrão Itaim lançamento VGV', 'empreendimento de luxo Vila Nova Conceição lançamento', 'loja conceito São Paulo projeto arquitetura obra', 'novo prédio corporativo São Paulo Faria Lima construção', 'residência Cidade Jardim projeto arquiteto', 'hotel boutique São Paulo obras']
out = {}
for q in nq:
    try:
        b = get("https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:90d", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"}))
        out[q] = [(it.findtext("title"), it.findtext("pubDate")) for it in ET.fromstring(b).iter("item")][:12]
    except Exception as e: out[q] = str(e)
json.dump(out, open(OUT + "/noticias.json", "w"), ensure_ascii=False, indent=1)
