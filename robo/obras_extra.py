"""Radar de obras privadas · recursos extras do robô:
  - matéria completa: decodifica os links do Google Notícias e lê o texto da notícia (em paralelo);
  - Diários Oficiais municipais (API do Querido Diário): alvarás, licenças de instalação e aprovações de projeto;
  - cruzamento entre fontes (notícias x BNDES x ANEEL x diários) para herdar CNPJ e somar evidências;
  - nota de confiabilidade (0 a 100) com os motivos;
  - canais de compra da empresa: site, portal de fornecedores e e-mails corporativos de compras/suprimentos.
Só usa fontes públicas e gratuitas. Não coleta dados pessoais de contato."""
import json, os, re, time, html, urllib.request, urllib.parse, hashlib, unicodedata
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9"}
HOJE = datetime.now(timezone.utc).date()
UFS = set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())

def norm(s): return re.sub(r"[^A-Z0-9 ]+", " ", unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().upper()).strip()
def hid(*p): return hashlib.sha1("|".join(map(str, p)).encode()).hexdigest()[:12]

def get(url, n=3_000_000, timeout=25):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
        return r.read(n).decode("utf8", "replace"), r.geturl()

# ------------------------------------------------------------------ matéria completa
def decodifica_google(itens):
    """Troca links news.google.com pelo link original da matéria (googlenewsdecoder)."""
    g = [x for x in itens if "news.google.com" in (x.get("link") or "")]
    if not g: return
    try:
        from googlenewsdecoder import gnewsdecoder
    except Exception as e:
        print("decoder indisponível:", e); return
    ok = 0
    for i in range(0, len(g), 20):
        lote = g[i:i + 20]
        try:
            res = gnewsdecoder([x["link"] for x in lote], interval=1)
            for x, r in zip(lote, res):
                if r.get("success") and r.get("decoded_url"): x["link"] = r["decoded_url"]; ok += 1
        except Exception as e:
            print("decoder lote", i, e)
        time.sleep(1)
    print(f"links do Google Notícias decodificados: {ok}/{len(g)}")

def texto_artigo(url, limite=2600):
    if not url or "news.google.com" in url: return ""
    try:
        h, _ = get(url, 1_500_000)
        h = re.sub(r"(?is)<(script|style|noscript|svg|nav|footer|header|aside|form)[^>]*>.*?</\1>", " ", h)
        md = re.search(r'<meta[^>]+(?:property|name)="(?:og:description|description)"[^>]+content="([^"]+)"', h)
        ps = [html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", p))).strip() for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>", h)]
        ps = [p for p in ps if len(p) > 60 and not re.search(r"(?i)cookies|assine|newsletter|todos os direitos|leia também|publicidade", p)]
        t = ((html.unescape(md.group(1)) + " ") if md else "") + " ".join(ps)
        return t[:limite]
    except Exception:
        return ""

def enriquecer(itens):
    """Decodifica os links e lê o começo de cada matéria em paralelo (até 2.600 caracteres)."""
    decodifica_google(itens)
    with ThreadPoolExecutor(10) as ex:
        textos = list(ex.map(lambda x: texto_artigo(x.get("link")), itens))
    n = 0
    for x, t in zip(itens, textos):
        if t:
            x["resumo"] = ((x.get("resumo") or "") + " " + t).strip()[:2800]; n += 1
    print(f"matérias lidas: {n}/{len(itens)}")

# ------------------------------------------------------------------ Diários Oficiais (Querido Diário)
QD_URLS = ["https://api.queridodiario.ok.org.br/gazettes", "https://queridodiario.ok.org.br/api/gazettes"]
QD_CONSULTAS = [
    '"alvará de construção" galpão', '"alvará de construção" "centro de distribuição"', '"alvará de construção" indústria',
    '"alvará de construção" condomínio', '"alvará de construção" edifício', '"alvará de construção" hospital',
    '"licença de instalação" fábrica', '"licença de instalação" galpão', '"licença de instalação" indústria',
    '"aprovação de projeto" galpão', '"aprovação de projeto" condomínio', '"alvará de execução" edificação',
    '"licença prévia" "unidade industrial"', '"habite-se" galpão',
]
def diarios(dias=45):
    desde = (HOJE - timedelta(days=dias)).isoformat(); out = {}
    for q in QD_CONSULTAS:
        p = urllib.parse.urlencode({"querystring": q, "published_since": desde, "size": 60, "excerpt_size": 700, "number_of_excerpts": 2, "sort_by": "descending_date"})
        j = None
        for base in QD_URLS:
            try:
                t, _ = get(base + "?" + p, timeout=60); j = json.loads(t); break
            except Exception as e:
                print("querido diário", base.split("/")[2], q, e)
        if j is None: continue
        for g in j.get("gazettes", []):
            cid, uf, data = g.get("territory_name"), (g.get("state_code") or "").upper(), (g.get("date") or "")[:10]
            for ex in (g.get("excerpts") or [])[:2]:
                ex = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", ex or ""))).strip()
                if len(ex) < 80: continue
                k = "D" + hid(g.get("url"), ex[:120])
                out[k] = {"id": k, "titulo": f"Diário Oficial de {cid}/{uf} — {data}", "resumo": f"[Publicação oficial do município de {cid}/{uf}] {ex}",
                          "link": g.get("url") or g.get("txt_url"), "veiculo": f"Diário Oficial de {cid}", "data": data or HOJE.isoformat(), "cidade": cid, "uf": uf if uf in UFS else None}
        time.sleep(1)
    print("diários: trechos encontrados", len(out))
    return list(out.values())

# ------------------------------------------------------------------ cruzamento entre fontes
STOP = set("S A SA LTDA EIRELI ME EPP HOLDING PARTICIPACOES PARTICIPACAO DO DA DE DOS DAS E BRASIL BRAZIL INDUSTRIA INDUSTRIAL COMERCIO COMERCIAL GRUPO CIA COMPANHIA EMPREENDIMENTOS EMPREENDIMENTO SPE".split())
def chave_empresa(nome):
    t = [w for w in norm(nome).split() if w not in STOP and len(w) > 1]
    return " ".join(t[:2]) if t else ""

def cruzar(obras):
    """Empresas citadas nas notícias e diários herdam o CNPJ achado no BNDES/ANEEL (quando único)
    e cada obra registra quantas outras fontes falam da mesma empresa no mesmo estado."""
    cnpjs, cont = {}, {}
    for o in obras:
        k = chave_empresa(o.get("empresa"))
        if not k: continue
        if o.get("cnpj"): cnpjs.setdefault(k, set()).add(o["cnpj"][:8])
        cont.setdefault((k, o.get("uf")), set()).add(o.get("origem"))
    base = {}
    for o in obras:
        if o.get("cnpj"): base.setdefault(o["cnpj"][:8], o["cnpj"])
    herd = 0
    for o in obras:
        k = chave_empresa(o.get("empresa"))
        if not k: continue
        if not o.get("cnpj") and len(cnpjs.get(k, ())) == 1:
            raiz = next(iter(cnpjs[k])); o["cnpj"] = base.get(raiz); o["cnpj_herdado"] = True; herd += 1
        outras = cont.get((k, o.get("uf")), set()) - {o.get("origem")}
        if outras: o["cruzado"] = sorted(outras)
    print("CNPJ herdado por cruzamento:", herd)

# ------------------------------------------------------------------ confiabilidade
BASE = {"noticia": 30, "diario": 55, "bndes": 70, "aneel": 75}
def confianca(obras):
    for o in obras:
        s = BASE.get(o.get("origem"), 30); m = []
        veic = {f.get("veiculo") for f in o.get("fontes", []) if f.get("veiculo")}
        if o.get("origem") == "noticia":
            extra = min(20, 10 * (len(veic) - 1)) if len(veic) > 1 else 0
            if extra: s += extra; m.append(f"{len(veic)} veículos diferentes")
            else: m.append("uma única matéria")
        else: m.append({"diario": "publicação oficial do município", "bndes": "financiamento contratado no BNDES", "aneel": "registro oficial na ANEEL"}.get(o.get("origem"), ""))
        if o.get("cruzado"): s += 10; m.append("confirmada por outra fonte: " + ", ".join(o["cruzado"]))
        if o.get("cnpj"): s += 8; m.append("CNPJ identificado" + (" por cruzamento" if o.get("cnpj_herdado") else ""))
        if o.get("cidade"): s += 4
        else: m.append("sem cidade")
        if o.get("valor"): s += 4
        if not o.get("empresa"): s -= 12; m.append("empresa não identificada")
        try:
            if (HOJE - datetime.fromisoformat(str(o.get("atualizado"))[:10]).date()).days > 365 and o.get("origem") != "aneel": s -= 10; m.append("informação com mais de 1 ano")
        except Exception: pass
        o["conf"] = max(5, min(100, s)); o["conf_motivos"] = [x for x in m if x]

# ------------------------------------------------------------------ canais de compra da empresa
RUIM = re.compile(r"(linkedin|facebook|instagram|youtube|twitter|x\.com|glassdoor|indeed|reclameaqui|jusbrasil|econodata|cnpj|casadosdados|empresas?aqui|solutudo|guiamais|wikipedia|google\.|bing\.|gov\.br|consultasocio|serasa|infojobs|vagas|catho|apontador|telelistas|escavador|b2b|cnae|speedio|brasilapi|receitaws|dnb\.com|zoominfo|bloomberg)", re.I)
FORN = re.compile(r"(fornecedor|supplier|suprimento|compras|procurement|purchas|seja[-_ ]um|cadastro[-_ ]de[-_ ]forn|vendor|sourcing|parceir)", re.I)
MAIL_OK = re.compile(r"^(compras?|suprimentos?|fornecedor(es)?|supplier|suppliers|procurement|purchas\w*|cadastro\w*|vendor\w*|sourcing|comercial|contato|sac|faleconosco|engenharia|obras|projetos?|expansao|investimentos?)[\w.\-]*@", re.I)

class Bloqueado(Exception): pass

def busca_web(q):
    """Resultados (url, título) da versão HTML do DuckDuckGo (o Bing devolve captcha para robôs)."""
    h, _ = get("https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": q, "kl": "br-pt"}), 900_000)
    if "anomaly-modal" in h or "anomaly.js" in h: raise Bloqueado()
    res = []
    for m in re.finditer(r'class="result__a" href="([^"]+)"[^>]*>(.*?)</a>', h, re.S):
        u = html.unescape(m.group(1)); mm = re.search(r"uddg=([^&]+)", u)
        res.append((urllib.parse.unquote(mm.group(1)) if mm else u, re.sub(r"<[^>]+>", "", html.unescape(m.group(2)))))
    return res[:10]

def dominio(u):
    try: return urllib.parse.urlparse(u).hostname.replace("www.", "")
    except Exception: return ""

def emails_de(url, dom):
    try: h, _ = get(url, 800_000, timeout=20)
    except Exception: return []
    achados = set(m.lower() for m in re.findall(r"[\w.\-+]+@[\w\-]+(?:\.[\w\-]+)+", h))
    base = dom.split(".")[0] if dom else ""
    return sorted(e for e in achados if MAIL_OK.match(e) and (not base or base in e.split("@")[1]) and not e.endswith((".png", ".jpg", ".svg", ".webp")))[:4]

def canais(nome):
    tok = [w.lower() for w in chave_empresa(nome).split() if len(w) > 3] or [w.lower() for w in chave_empresa(nome).split() if len(w) > 2]
    site = forn = ""
    for q in (f"{nome} fornecedores", f"{nome} site oficial"):
        for u, t in busca_web(q):
            d = dominio(u)
            if not d or RUIM.search(d) or not any(x in d.replace("-", "") for x in tok): continue
            if not forn and FORN.search(u + " " + t): forn = u
            if not site: site = "https://" + d
        time.sleep(3)
        if site: break
    mails = []
    if forn: mails += emails_de(forn, dominio(forn))
    if site and len(mails) < 2:
        for p in ("", "/contato", "/fale-conosco", "/fornecedores"):
            mails += [m for m in emails_de(site + p, dominio(site)) if m not in mails]
            if len(mails) >= 3: break
    return {"site": site or None, "fornecedores": forn or None, "emails": mails[:4], "verificado": HOJE.isoformat(), "v": 2}

def fornecedores(obras, arq, maximo=120, minutos=35):
    cache = json.load(open(arq)) if os.path.exists(arq) else {}
    achou = lambda c: c.get("site") or c.get("fornecedores") or c.get("emails")
    lim_ok, lim_vazio = (HOJE - timedelta(days=60)).isoformat(), (HOJE - timedelta(days=10)).isoformat()
    def vencido(c):
        if not c or c.get("v") != 2: return True
        return c.get("verificado", "") < (lim_ok if achou(c) else lim_vazio)
    emp = {}
    for o in obras:
        if not o.get("empresa") or o.get("origem") == "aneel" and not o.get("valor"): continue
        k = chave_empresa(o["empresa"])
        if not k: continue
        peso = (o.get("valor") or 0) + o.get("conf", 0) * 1e6
        if k not in emp or peso > emp[k][1]: emp[k] = (o["empresa"], peso)
    fila = [(k, n) for k, (n, p) in sorted(emp.items(), key=lambda x: -x[1][1]) if vencido(cache.get(k))][:maximo]
    print(f"canais de compra: {len(fila)} empresas para pesquisar ({len(cache)} no cache)")
    fim, ok, pausas = time.time() + minutos * 60, 0, 0
    for i, (k, n) in enumerate(fila):
        if time.time() > fim: print("  canais: tempo esgotado, continua amanhã"); break
        try:
            c = canais(n); cache[k] = c; ok += bool(achou(c))
        except Bloqueado:
            pausas += 1; print("  busca bloqueada temporariamente; pausa")
            if pausas > 2: break
            time.sleep(90)
        except Exception as e: print("canais", n, e)
        if i % 20 == 19: print(f"  canais: {i + 1}/{len(fila)}, {ok} com canal")
    print(f"canais de compra: {ok} empresas com canal encontrado nesta rodada")
    json.dump(cache, open(arq, "w"), ensure_ascii=False, separators=(",", ":"))
    for o in obras:
        c = cache.get(chave_empresa(o.get("empresa")))
        if c and achou(c):
            o["canais"] = {k: v for k, v in c.items() if k not in ("verificado", "v") and v}
