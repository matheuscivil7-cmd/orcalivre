"""Radar de obras privadas do OrçaLivre.
Reúne, todo dia, obras privadas de grande porte a partir de fontes públicas:
  1. notícias de investimento (Google Notícias e Bing Notícias), estruturadas por IA (função obras-ia);
  2. financiamentos do BNDES (operações não automáticas, clientes privados, R$ 10 mi ou mais);
  3. usinas de geração em construção ou com construção não iniciada (ANEEL/SIGA, 5 MW ou mais);
  4. Diários Oficiais municipais (Querido Diário): alvarás, licenças de instalação e aprovações de projeto.
Depois cruza as fontes, dá uma nota de confiabilidade e busca os canais de compra públicos de cada empresa
(site, portal de fornecedores, e-mails corporativos) — ver robo/obras_extra.py.
Saída: dados/obras/obras.json (lido pelo site) e dados/obras/cache_noticias.json (memória da IA)."""
import json, os, re, sys, time, hashlib, html, unicodedata, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import obras_extra as X

DIR = "dados/obras"; os.makedirs(DIR, exist_ok=True)
OUT, CACHE = f"{DIR}/obras.json", f"{DIR}/cache_noticias.json"
IA = "https://caexsyimhdwshrwcetok.supabase.co/functions/v1/obras-ia"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9"}
HOJE = datetime.now(timezone.utc).date()
DIAS_NOTICIA = 120
MAX_NOVAS = int(os.environ.get("MAX_NOVAS", "450"))
CARGA_INICIAL = "2026-10-26"  # na primeira coleta tudo entrou no mesmo dia; usa a data da própria fonte
UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split()

def get(url, n=8_000_000, tent=3):
    for t in range(tent):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                return r.read(n), r.geturl()
        except Exception as e:
            if t == tent - 1: raise
            time.sleep(2 + 3 * t)

def norm(s): return re.sub(r"[^A-Z0-9 ]+", " ", unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().upper()).strip()
def hid(*p): return hashlib.sha1("|".join(map(str, p)).encode()).hexdigest()[:12]
def num(s):
    try: return float(str(s).replace(".", "").replace(",", ".")) if isinstance(s, str) else float(s)
    except Exception: return None

# ------------------------------------------------------------------ 1. notícias
CONSULTAS = [
    "investimento nova fábrica", "construção de nova fábrica milhões", "ampliação de fábrica investimento milhões",
    "construção centro de distribuição investimento", "galpão logístico construção investimento", "condomínio logístico obras início",
    "data center construção investimento", "construção de hospital privado investimento", "novo shopping construção investimento",
    "construção de hotel investimento milhões", "lançamento empreendimento imobiliário VGV milhões", "incorporadora lança torre residencial VGV",
    "usina construção investimento bilhões", "planta industrial implantação investimento", "obras começam nova unidade investimento",
    "pedra fundamental fábrica", "licença de instalação nova fábrica", "terminal portuário privado investimento obras",
    "frigorífico nova unidade investimento", "fábrica de celulose investimento", "centro de pesquisa construção investimento empresa",
]

def rss_google(q):
    u = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:60d", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"})
    b, _ = get(u); out = []
    for it in ET.fromstring(b).iter("item"):
        t = html.unescape(it.findtext("title") or ""); src = it.findtext("source") or ""
        if src and t.endswith(" - " + src): t = t[: -len(src) - 3]
        out.append({"titulo": t.strip(), "link": it.findtext("link"), "veiculo": src, "data": it.findtext("pubDate"), "resumo": ""})
    return out

def rss_bing(q):
    u = "https://www.bing.com/news/search?" + urllib.parse.urlencode({"q": q, "format": "rss", "setlang": "pt-BR", "cc": "BR", "qft": 'interval="9"'})
    b, _ = get(u); out = []
    for it in ET.fromstring(b).iter("item"):
        link = it.findtext("link") or ""
        m = re.search(r"[?&]url=([^&]+)", link)
        if m: link = urllib.parse.unquote(m.group(1))
        src = ""
        for ch in it:
            if ch.tag.endswith("Source"): src = ch.text or ""
        out.append({"titulo": html.unescape(it.findtext("title") or "").strip(), "link": link, "veiculo": src, "data": it.findtext("pubDate"),
                    "resumo": re.sub(r"<[^>]+>", " ", html.unescape(it.findtext("description") or "")).strip()})
    return out

def data_iso(s):
    for f in ("%a, %d %b %Y %H:%M:%S %Z", "%a, %d %b %Y %H:%M:%S %z"):
        try: return datetime.strptime(s, f).date().isoformat()
        except Exception: pass
    return HOJE.isoformat()

def texto_artigo(url):
    """Primeiros parágrafos do artigo (melhora cidade/UF/valor). Só para links diretos."""
    if not url or "news.google.com" in url: return ""
    try:
        b, _ = get(url, 1_500_000, tent=1); h = b.decode("utf8", "replace")
        md = re.search(r'<meta[^>]+(?:property|name)="(?:og:description|description)"[^>]+content="([^"]+)"', h)
        ps = [re.sub(r"<[^>]+>", " ", p) for p in re.findall(r"<p[^>]*>(.*?)</p>", h, re.S)]
        ps = [html.unescape(re.sub(r"\s+", " ", p)).strip() for p in ps]
        ps = [p for p in ps if len(p) > 80][:6]
        return ((html.unescape(md.group(1)) + " ") if md else "") + " ".join(ps)
    except Exception:
        return ""

def chama_ia(lote):
    body = json.dumps({"itens": lote}).encode()
    for t in range(3):
        try:
            req = urllib.request.Request(IA, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=150) as r: return json.loads(r.read()).get("itens", [])
        except urllib.error.HTTPError as e:
            msg = e.read()[:200]; print("IA HTTP", e.code, msg)
            if e.code == 429: return None
        except Exception as e:
            print("IA erro", e)
        time.sleep(5 + 10 * t)
    return []

def noticias(cache, extras=()):
    vistos = {}
    for q in CONSULTAS:
        for fn in (rss_bing, rss_google):
            try:
                for it in fn(q):
                    if not it["titulo"]: continue
                    k = hid(norm(it["titulo"])[:90])
                    if k in vistos and vistos[k]["resumo"]: continue
                    it["data"] = data_iso(it["data"] or ""); it["id"] = k; vistos[k] = it
            except Exception as e:
                print("rss", fn.__name__, q, e)
            time.sleep(0.6)
    lim = (HOJE - timedelta(days=DIAS_NOTICIA)).isoformat()
    itens = [x for x in vistos.values() if x["data"] >= lim]
    novos = [x for x in itens if x["id"] not in cache][:MAX_NOVAS]
    dn = [x for x in extras if x["id"] not in cache][:200]
    print(f"notícias: {len(itens)} no período, {len(novos)} novas para a IA; diários: {len(dn)} trechos novos")
    try: X.enriquecer(novos)   # decodifica os links do Google Notícias e lê a matéria completa
    except Exception as e: print("enriquecer", e)
    novos += dn
    for i in range(0, len(novos), 20):
        lote = novos[i:i + 20]
        res = chama_ia([{"id": x["id"], "titulo": x["titulo"], "resumo": x["resumo"][:2800], "data": x["data"]} for x in lote])
        if res is None: print("limite diário da IA atingido"); break
        por = {str(r.get("id")): r for r in res if isinstance(r, dict)}
        for x in lote:
            r = por.get(x["id"])
            if r is None: continue
            cache[x["id"]] = {**r, "_t": x["titulo"], "_l": x["link"], "_v": x["veiculo"], "_d": x["data"]}
            if x.get("cidade"): cache[x["id"]].update(_cid=x["cidade"], _uf=x.get("uf"))
        print(f"  IA lote {i // 20 + 1}: {len(por)} respostas")
    # monta obras a partir do cache (apenas relevantes e no período)
    obras = {}
    for k, r in cache.items():
        if not r.get("relevante") or r.get("_d", "") < lim: continue
        dia = k.startswith("D")
        if dia and not r.get("cidade"): r["cidade"] = r.get("_cid")
        uf = (r.get("uf") or (r.get("_uf") if dia else "") or "").upper()
        if uf and uf not in UFS: continue
        if SEMEMP.search(norm(r.get("empresa") or "")): r["empresa"] = None
        emp = norm(r.get("empresa") or "")
        if dia: chave = "D" + hid(emp or k, uf, norm(r.get("cidade"))[:20], round((r.get("valor") or 0) / 1e7))
        elif emp: chave = hid(emp, uf, round((r.get("valor") or 0) / 1e7))
        elif r.get("valor"): chave = hid("", uf, r.get("segmento"), round(r["valor"] / 1e8))
        else: chave = hid(k)
        fonte = {"t": r.get("_t"), "url": r.get("_l"), "veiculo": r.get("_v"), "data": r.get("_d")}
        o = obras.get(chave)
        if not o:
            o = obras[chave] = {"id": ("" if dia else "N") + chave, "origem": "diario" if dia else "noticia", "obra": re.sub(r"^((EMPRESA )?N[AÃ]O (INFORMAD[AO]|IDENTIFICAD[AO]|DIVULGAD[AO])|EMPRESA( PRIVADA)?|MULTINACIONAL( \w+)?|PROPRIET[AÁ]RI[OA]( DA OBRA)?|REQUERENTE)\s*/\s*", "", (r.get("obra") or r.get("_t") or "").upper())[:160], "empresa": r.get("empresa"),
                                "cidade": r.get("cidade"), "uf": uf or None, "segmento": r.get("segmento") or "OUTROS", "subtipo": r.get("subtipo"), "tipo": r.get("tipo"),
                                "estagio": r.get("estagio") or "ANÚNCIO", "valor": r.get("valor"), "area_m2": r.get("area_m2"), "unidades": r.get("unidades"),
                                "empregos": r.get("empregos"), "inicio": r.get("inicio"), "termino": r.get("termino"), "detalhes": r.get("detalhes"),
                                "construtora": r.get("construtora"), "projetista": r.get("projetista"), "area_terreno_m2": r.get("area_terreno_m2"),
                                "pessoas": [p for p in (r.get("pessoas") or []) if isinstance(p, dict) and p.get("nome")][:6],
                                "atualizado": r.get("_d"), "criado": r.get("_d"), "fontes": []}
        else:
            for c in ("cidade", "uf", "valor", "area_m2", "unidades", "empregos", "inicio", "termino", "subtipo", "tipo", "construtora", "projetista", "area_terreno_m2"):
                if not o.get(c) and r.get(c): o[c] = r.get(c)
            if r.get("_d", "") > (o["atualizado"] or ""):
                o["atualizado"] = r["_d"]; o["estagio"] = r.get("estagio") or o["estagio"]; o["detalhes"] = r.get("detalhes") or o["detalhes"]
            o["criado"] = min(o["criado"] or r["_d"], r["_d"])
            for p in (r.get("pessoas") or []):
                if isinstance(p, dict) and p.get("nome") and len(o["pessoas"]) < 6 and all(norm(q["nome"]) != norm(p["nome"]) for q in o["pessoas"]): o["pessoas"].append(p)
        if fonte["url"] and all(f["url"] != fonte["url"] for f in o["fontes"]): o["fontes"].append(fonte)
    for o in obras.values(): o["fontes"] = sorted(o["fontes"], key=lambda f: f["data"] or "", reverse=True)[:8]
    return list(obras.values())

SEMEMP = re.compile(r"^(EMPRESA )?(NAO (INFORMAD|IDENTIFICAD|DIVULGAD|CITAD)|DESCONHECID|SIGILOS)|^(MULTINACIONAL|GRUPO|EMPRESA|INVESTIDOR|FUNDO)( [A-Z]+)?$|^(PROPRIETARI[OA]|REQUERENTE|INTERESSAD[OA]|INCORPORADORA|CONSTRUTORA)( DA OBRA| DO IMOVEL)?$")

# ------------------------------------------------------------------ 2. BNDES
BNDES_RES = "6f56b78c-510f-44b6-8274-78a5b7e931f4"
OBRA_RE = re.compile(r"IMPLANT|CONSTRU|AMPLIA|EXPANS|MODERNIZ|NOVA UNIDADE|NOVA PLANTA|NOVA FABRICA|FABRICA|PLANTA|USINA|PARQUE|CENTRO DE DISTRIB|HOSPITAL|SHOPPING|HOTEL|EMPREENDIMENTO|TERMINAL|ARMAZE|GALPA|EDIFIC|COMPLEXO|LINHA DE TRANSMISS|SUBESTA")
def seg_bndes(r):
    s = norm(f"{r.get('subsetor_cnae_agrupado')} {r.get('setor_bndes')} {r.get('subsetor_bndes')} {r.get('subsetor_cnae_nome')} {r.get('descricao_do_projeto')}")
    if re.search(r"RESIDENC|HABITAC|LOTEAMENTO|INCORPORACAO IMOBILI", s): return "RESIDENCIAL"
    for k, v in [("ENERGIA|ELETRIC|GERACAO|EOLIC|SOLAR|FOTOVOLT|TRANSMISS", "ENERGIA"), ("SANEAMENTO|AGUA E ESGOTO|RESIDUO", "SANEAMENTO E INFRAESTRUTURA"),
                 ("LOGIST|ARMAZEN|TRANSPORTE|PORTU|TERMINAL|FERROV|RODOV", "LOGÍSTICA"), ("SAUDE|HOSPITAL", "SAÚDE"), ("EDUCA|ENSINO", "EDUCAÇÃO"),
                 ("HOTEL|TURIS|ALOJAMENTO", "HOTELARIA E TURISMO"), ("AGROPEC|AGRICULT|PECUAR|AGRO", "AGRONEGÓCIO"), ("EXTRATIVA|MINERA", "MINERAÇÃO"),
                 ("COMERCIO|SHOPPING|VAREJ", "COMERCIAL"), ("TELECOM|DATA CENTER|INFORMAC", "DATA CENTER"),
                 ("INDUSTRIA|TRANSFORMACAO|FABRIC|QUIMIC|ALIMENT|METAL|PAPEL|CELULOSE|AUTOMOT|TEXTIL", "INDUSTRIAL")]:
        if re.search(k, s): return v
    return "OUTROS"

def bndes():
    lim = (HOJE - timedelta(days=730)).isoformat(); out = []; off = 0; vistos = {}
    base = "https://dadosabertos.bndes.gov.br/api/3/action/datastore_search?"
    while True:
        q = urllib.parse.urlencode({"resource_id": BNDES_RES, "limit": 1000, "offset": off, "sort": "data_da_contratacao desc"})
        b, _ = get(base + q); rs = json.loads(b)["result"]["records"]
        if not rs: break
        for r in rs:
            d = (r.get("data_da_contratacao") or "")[:10]
            if d < lim: continue
            v = num(r.get("valor_contratado_reais")) or 0
            nat = norm(r.get("natureza_do_cliente"))
            desc = re.sub(r"\s+", " ", r.get("descricao_do_projeto") or "").strip()
            if v < 10e6 or "ADMINISTRACAO PUBLICA" in nat or "GOVERNO" in nat or not OBRA_RE.search(norm(desc)): continue
            cid = (r.get("municipio") or "").title() or None; uf = (r.get("uf") or "").strip().upper() or None
            if cid and "SEM MUNIC" in norm(cid): cid = None
            if uf not in UFS: uf = None
            tipo = "AMPLIAÇÃO" if re.search(r"AMPLIA|EXPANS", norm(desc)) else "MODERNIZAÇÃO" if "MODERNIZ" in norm(desc) else "IMPLANTAÇÃO"
            cli = re.sub(r"\s+", " ", r.get("cliente") or "").strip()
            mo = re.search(r"(?:IMPLANTACAO|CONSTRUCAO|AMPLIACAO|EXPANSAO|MODERNIZACAO)\s+(?:E \w+ )?(?:D[AOE]S?\s+)?(.{8,70}?)(?:,| NO | NA | EM | LOCALIZAD| COM | PARA |$)", norm(desc))
            objeto = (mo.group(1).strip() if mo else "").upper()
            chave = norm(cli) + "|" + norm(desc)[:70]
            if chave in vistos:
                o = vistos[chave]; o["valor"] += v; o["contratos"] += 1
                o["fontes"].append({"t": f"BNDES · contrato {r.get('numero_do_contrato')} · {r.get('produto')}", "url": "https://dadosabertos.bndes.gov.br/dataset/operacoes-financiamento", "veiculo": "BNDES (dados abertos)", "data": d})
                o["criado"] = min(o["criado"], d); continue
            out.append({"id": "B" + str(r.get("numero_do_contrato")), "origem": "bndes", "obra": " / ".join(x for x in [cli, tipo, objeto, (cid or uf or "BRASIL").upper()] if x)[:160], "contratos": 1,
                        "empresa": cli, "cnpj": re.sub(r"\D", "", r.get("cnpj") or "") or None, "cidade": cid, "uf": uf, "segmento": seg_bndes(r),
                        "subtipo": (r.get("subsetor_cnae_nome") or "").strip().upper() or None, "tipo": tipo, "estagio": "FINANCIAMENTO", "valor": v,
                        "detalhes": desc.capitalize(), "atualizado": d, "criado": d, "produto": r.get("produto"), "situacao": r.get("situacao_do_contrato"),
                        "fontes": [{"t": f"BNDES · contrato {r.get('numero_do_contrato')} · {r.get('produto')}", "url": "https://dadosabertos.bndes.gov.br/dataset/operacoes-financiamento", "veiculo": "BNDES (dados abertos)", "data": d}]})
            vistos[chave] = out[-1]
        if (rs[-1].get("data_da_contratacao") or "")[:10] < lim: break
        off += 1000
    print("BNDES:", len(out)); return out

# ------------------------------------------------------------------ 3. ANEEL
ANEEL_RES = "11ec447d-698d-4ab8-977f-b424d5deee6a"
TIPOGER = {"UFV": "USINA FOTOVOLTAICA", "EOL": "USINA EÓLICA", "UTE": "USINA TERMELÉTRICA", "PCH": "PEQUENA CENTRAL HIDRELÉTRICA", "CGH": "CENTRAL GERADORA HIDRELÉTRICA", "UHE": "USINA HIDRELÉTRICA", "UTN": "USINA TERMONUCLEAR"}
def aneel():
    out = []
    for fase, est in (("Construção", "EM OBRAS"), ("Construção não iniciada", "PROJETO")):
        off = 0
        while True:
            q = urllib.parse.urlencode({"resource_id": ANEEL_RES, "limit": 1000, "offset": off, "filters": json.dumps({"DscFaseUsina": fase})})
            b, _ = get("https://dadosabertos.aneel.gov.br/api/3/action/datastore_search?" + q); rs = json.loads(b)["result"]["records"]
            if not rs: break
            for r in rs:
                kw = num(r.get("MdaPotenciaOutorgadaKw")) or 0
                if kw < 5000 or (est == "PROJETO" and kw < 50000): continue
                prop = r.get("DscPropriRegimePariticipacao") or ""
                m = re.search(r"para (.+?) - (\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2})", prop)
                emp = m.group(1).strip() if m else (prop[:80] or None); cnpj = re.sub(r"\D", "", m.group(2)) if m else None
                mun = (r.get("DscMuninicpios") or "").split(",")[0].strip()
                cid = mun.rsplit(" - ", 1)[0] if " - " in mun else (mun or None)
                tg = TIPOGER.get(r.get("SigTipoGeracao"), r.get("SigTipoGeracao"))
                lat, lon = num(r.get("NumCoordNEmpreendimento")), num(r.get("NumCoordEEmpreendimento"))
                out.append({"id": "A" + str(r.get("CodCEG")), "origem": "aneel", "obra": f"{(emp or '').upper()} / IMPLANTAÇÃO / {tg} {(r.get('NomEmpreendimento') or '').upper()} / {(cid or '').upper()}"[:160],
                            "empresa": emp, "cnpj": cnpj, "cidade": cid, "uf": r.get("SigUFPrincipal"), "segmento": "ENERGIA", "subtipo": f"{tg} · {r.get('DscFonteCombustivel') or ''}".strip(" ·"),
                            "tipo": "IMPLANTAÇÃO", "estagio": est, "valor": None, "potencia_mw": round(kw / 1000, 2),
                            "detalhes": f"{tg} {r.get('NomEmpreendimento')} com potência outorgada de {f'{kw / 1000:,.1f}'.replace(',', 'X').replace('.', ',').replace('X', '.')} MW ({r.get('DscOrigemCombustivel') or ''}). Fase na ANEEL: {fase}. Outorga: {r.get('DscTipoOutorga') or '—'}.",
                            "inicio": None, "termino": r.get("DatEntradaOperacao") or None, "lat": lat, "lon": lon,
                            "atualizado": r.get("DatInicioVigencia") or r.get("DatGeracaoConjuntoDados") or HOJE.isoformat(), "criado": r.get("DatInicioVigencia"),
                            "fontes": [{"t": f"ANEEL/SIGA · CEG {r.get('CodCEG')}", "url": "https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel", "veiculo": "ANEEL (dados abertos)", "data": r.get("DatGeracaoConjuntoDados")}]})
            off += 1000
    print("ANEEL:", len(out)); return out

# ------------------------------------------------------------------ principal
def main():
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    lim_cache = (HOJE - timedelta(days=DIAS_NOTICIA + 30)).isoformat()
    cache = {k: v for k, v in cache.items() if v.get("_d", "9") >= lim_cache}
    anterior = {}
    if os.path.exists(OUT):
        try:
            for o in json.load(open(OUT)).get("obras", []): anterior[o["id"]] = o
        except Exception: pass
    obras, fontes_ok = [], {}
    try: dia = X.diarios()
    except Exception as e: print("diários", e); dia = []
    for nome, fn in (("noticias", lambda: noticias(cache, dia)), ("bndes", bndes), ("aneel", aneel)):
        try:
            lst = fn(); obras += lst; fontes_ok[nome] = len(lst)
        except Exception as e:
            print("FALHA", nome, e)
            antes = [o for o in anterior.values() if o.get("origem") in ((nome[:-1], "diario") if nome == "noticias" else (nome,))]
            obras += antes; fontes_ok[nome] = f"mantido ({len(antes)})"
    json.dump(cache, open(CACHE, "w"), ensure_ascii=False, separators=(",", ":"))
    fontes_ok["diarios"] = sum(1 for o in obras if o.get("origem") == "diario")
    for etapa, f in (("cruzamento", lambda: X.cruzar(obras)), ("confiabilidade", lambda: X.confianca(obras)),
                     ("canais de compra", lambda: X.fornecedores(obras, f"{DIR}/empresas.json", int(os.environ.get("MAX_EMPRESAS", "120"))))):
        try: f()
        except Exception as e: print("FALHA", etapa, e)
    for o in obras:
        o["codigo"] = "OL" + hashlib.sha1(o["id"].encode()).hexdigest()[:6].upper()
        o["novo"] = o["id"] not in anterior
        pv = anterior.get(o["id"], {}).get("primeira_vez")
        if not pv or pv == CARGA_INICIAL:
            pv = min((o.get("criado") or o.get("atualizado") or HOJE.isoformat())[:10], HOJE.isoformat()) if (not anterior or pv == CARGA_INICIAL) else HOJE.isoformat()
        o["primeira_vez"] = pv
        for k in [k for k, v in o.items() if v in (None, "", [])]: del o[k]
    obras.sort(key=lambda o: (o.get("atualizado") or ""), reverse=True)
    json.dump({"gerado": datetime.now(timezone.utc).isoformat(timespec="minutes"), "fontes": fontes_ok, "total": len(obras), "obras": obras},
              open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("total:", len(obras), fontes_ok)

if __name__ == "__main__":
    main()
