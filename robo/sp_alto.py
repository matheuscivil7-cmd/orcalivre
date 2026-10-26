"""Radar "Alto padrão SP" do OrçaLivre — obras residenciais e comerciais de alto padrão na cidade de São Paulo.
Fontes públicas e gratuitas:
  1. Alvarás emitidos pela Prefeitura (planilhas mensais do Portal de Licenciamento / Aprova Digital):
     edificação nova e reforma, exceto HIS/HMP. Etapa: projeto aprovado (sem execução) ou execução liberada.
  2. GeoSampa (WFS): endereço, uso atual, área do terreno, distrito e zoneamento de cada lote (pelo SQL).
  3. Licenças ambientais de empreendimentos publicadas no GeoSampa.
  4. Notícias de alto padrão em SP lidas pela IA (função obras-ia, modo "sp"): escritório de arquitetura,
     construtora, incorporadora, bairro e estágio.
Não guarda nomes de proprietários pessoas físicas. Saída: dados/obras/sp_alto.json."""
import json, os, re, io, sys, time, html, hashlib, unicodedata, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

DIR = "dados/obras"; os.makedirs(DIR, exist_ok=True)
OUT, LOTES, CACHE, ALV = f"{DIR}/sp_alto.json", f"{DIR}/sp_lotes.json", f"{DIR}/sp_cache_noticias.json", f"{DIR}/sp_alvaras.json"
IA = "https://caexsyimhdwshrwcetok.supabase.co/functions/v1/obras-ia"
W = "http://wfs.geosampa.prefeitura.sp.gov.br/geoserver/geoportal/wfs"
PAG = "https://prefeitura.sp.gov.br/web/licenciamento/w/servicos/331597"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", "Accept-Language": "pt-BR,pt;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8"}
HOJE = datetime.now(timezone.utc).date()
MESES_ALVARA = int(os.environ.get("SP_MESES", "8"))

NOBRES = {"JARDIM PAULISTA", "ITAIM BIBI", "PINHEIROS", "ALTO DE PINHEIROS", "MOEMA", "MORUMBI", "PERDIZES", "CONSOLACAO",
          "VILA MARIANA", "CAMPO BELO", "SANTO AMARO", "BUTANTA", "VILA ANDRADE", "LAPA", "JARDIM EUROPA", "JARDIM AMERICA", "VILA NOVA CONCEICAO", "CIDADE JARDIM"}
PROPRIAS = ["TECNISA", "JHSF", "CYRELA", "EVEN", "EZTEC", "GAFISA", "TRISUL", "MITRE", "VITACON", "LAVVI", "HELBOR", "YOU INC",
            "TEGRA", "PLANO PLANO", "CURY", "MRV", "SETIN", "KALLAS", "MOURA DUBEUX", "ONE INNOVATION", "GAMARO", "IDEA ZARVOS", "BENX"]

def get(url, n=40_000_000, timeout=60, tent=2):
    for t in range(tent):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read(n)
        except Exception:
            if t == tent - 1: raise
            time.sleep(3)

def norm(s): return re.sub(r"[^A-Z0-9 ]+", " ", unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().upper()).strip()
def hid(*p): return hashlib.sha1("|".join(map(str, p)).encode()).hexdigest()[:12]
def propria(nome): n = norm(nome); return bool(n) and any(re.search(r"\b" + p + r"\b", n) for p in PROPRIAS)

# ------------------------------------------------------------------ 1. alvarás (planilhas mensais)
MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
def planilhas():
    h = get(PAG).decode("utf8", "replace")
    links = []
    for u in re.findall(r'href="([^"]+?(?:xlsx|-xlsx))"', h):
        m = re.search(r"(" + "|".join(MESES) + r")[_-]?(20\d\d)", unicodedata.normalize("NFD", u.lower()).encode("ascii", "ignore").decode())
        if not m: continue
        links.append(((int(m.group(2)), MESES.index(m.group(1)) + 1), urllib.parse.urljoin(PAG, html.unescape(u))))
    links = sorted(set(links), reverse=True)[:MESES_ALVARA]
    print("planilhas de alvarás:", [f"{a}-{m:02d}" for (a, m), _ in links])
    return links

def alvaras():
    import openpyxl
    proc = {}
    for (ano, mes), u in planilhas():
        try:
            wb = openpyxl.load_workbook(io.BytesIO(get(u)), read_only=True)
        except Exception as e:
            print("planilha", u, e); continue
        for ws in wb.worksheets:
            for r in ws.iter_rows(values_only=True):
                if not r or len(r) < 5 or not r[1] or not r[3]: continue
                desc = str(r[3]).strip()
                if not re.search(r"Alvar|Modificativo|Conclus", desc): continue
                if "HIS" in desc and "Exceto" not in desc: continue
                pa = str(r[1]).strip()
                d = proc.setdefault(pa, {"processo": pa, "sei": str(r[2] or "").strip(), "eventos": [], "sqls": set()})
                dt = r[0]
                try: dt = (dt if isinstance(dt, datetime) else datetime.strptime(str(dt)[:10], "%d/%m/%Y")).date().isoformat()
                except Exception: dt = f"{ano}-{mes:02d}-01"
                d["eventos"].append((dt, desc))
                for s in re.findall(r"\d{11}|\d{3}\.\d{3}\.\d{4}-\d", str(r[4] or "")):
                    d["sqls"].add(re.sub(r"\D", "", s))
    out = []
    for pa, d in proc.items():
        ev = sorted(set(d["eventos"]))
        txt = " | ".join(e for _, e in ev)
        if "Conclus" in txt: continue
        if not re.search(r"Edifica|Reforma", txt): continue
        tipo = "EDIFICAÇÃO NOVA" if "Edificação Nova" in txt or "Edificacao Nova" in txt else "REFORMA"
        etapa = "EXECUÇÃO LIBERADA" if "Execução" in txt or "Execucao" in txt else "PROJETO APROVADO"
        out.append({"processo": pa, "sei": d["sei"], "tipo": tipo, "etapa": etapa, "eventos": ev, "sqls": sorted(d["sqls"])[:6],
                    "data": ev[-1][0], "primeira": ev[0][0]})
    print("alvarás (processos, sem HIS/HMP e sem conclusão):", len(out))
    return out

# ------------------------------------------------------------------ 2. GeoSampa: lote, distrito e zoneamento
def wfs(layer, extra, count=5):
    u = W + "?service=WFS&version=2.0.0&request=GetFeature&outputFormat=application/json&count=%d&typeNames=%s%s" % (count, layer, extra)
    return json.loads(get(u, timeout=60))

def centro(geom):
    pts = []
    def walk(c):
        if c and isinstance(c[0], (int, float)): pts.append(c)
        else:
            for x in c: walk(x)
    walk(geom.get("coordinates") or [])
    if not pts: return None
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)

def em_ponto(layer, xy, crs, campo):
    x, y = xy
    j = wfs(layer, "&bbox=%f,%f,%f,%f,%s" % (x - 1, y - 1, x + 1, y + 1, crs), count=10)
    for f in j.get("features", []):
        v = f["properties"].get(campo)
        if v and not RUIDO.search(str(v)): return v
    return None
RUIDO = re.compile(r"pra[cç]a|canteiro|vi[aá]rio|logradouro", re.I)

def lote(sql, cache):
    if sql in cache: return cache[sql]
    st, qd, lt = sql[:3], sql[3:6], sql[6:10]
    info = {}
    try:
        j = wfs("geoportal:lote_cidadao", "&CQL_FILTER=" + urllib.parse.quote(f"cd_setor_fiscal='{st}' AND cd_quadra_fiscal='{qd}' AND cd_lote='{lt}'"), count=2)
        fs = j.get("features", [])
        if fs:
            p = fs[0]["properties"]
            info = {"logradouro": (p.get("nm_logradouro_completo") or "").strip(), "numero": (p.get("cd_numero_porta") or "").strip(),
                    "compl": (p.get("tx_complemento_endereco") or "").strip(), "uso": p.get("dc_tipo_uso_imovel"),
                    "terreno": p.get("qt_area_terreno"), "construida": p.get("qt_area_construida")}
            crs = ((j.get("crs") or {}).get("properties") or {}).get("name") or "EPSG:31983"
            xy = centro(fs[0].get("geometry") or {})
            if xy:
                info["distrito"] = em_ponto("geoportal:distrito_municipal", xy, crs, "nm_distrito_municipal")
                info["zona"] = em_ponto("geoportal:perimetro_zona_lei_18177_24", xy, crs, "cd_zoneamento_perimetro")
    except Exception as e:
        print("lote", sql, str(e)[:120]); return None
    cache[sql] = info
    return info

# ------------------------------------------------------------------ 3. licenças ambientais de empreendimentos (GeoSampa)
def licencas():
    out = []
    lim = (HOJE - timedelta(days=730)).isoformat()
    try:
        j = wfs("geoportal:GEOSAMPA_licenca_obra", "", count=2000)
        crs = ((j.get("crs") or {}).get("properties") or {}).get("name") or "EPSG:31983"
        for f in j.get("features", []):
            p = f["properties"]; d = str(p.get("dt_publicacao_doc") or "")[:10]
            if d < lim or (p.get("st_licenca_empreendimento") or "").upper() not in ("DEFERIDO", ""): continue
            xy = centro(f.get("geometry") or {})
            dist = None
            try: dist = em_ponto("geoportal:distrito_municipal", xy, crs, "nm_distrito_municipal") if xy else None
            except Exception: pass
            out.append({"id": "SPL" + str(p.get("cd_identificador_licenca_obra")), "nome": (p.get("nm_empreendimento") or "").strip(),
                        "endereco": (p.get("tx_endereco_empreendimento") or "").strip(), "data": d, "categoria": p.get("tx_categoria_ocupacao"),
                        "processo": p.get("cd_processo_administrativo"), "link": p.get("tx_link_doc"), "distrito": dist})
    except Exception as e:
        print("licenças", str(e)[:150])
    print("licenças ambientais de obras:", len(out))
    return out

# ------------------------------------------------------------------ 4. notícias de alto padrão em SP (IA)
CONSULTAS = [
    "residência alto padrão São Paulo projeto arquitetura", "casa Jardim Europa projeto arquiteto", "casa Jardim América reforma arquitetura",
    "edifício alto padrão Itaim Bibi lançamento", "prédio de luxo Vila Nova Conceição", "empreendimento alto padrão Jardins lançamento",
    "prédio boutique Pinheiros arquitetura", "edifício corporativo São Paulo projeto arquitetura obras", "retrofit prédio São Paulo arquitetura",
    "loja conceito São Paulo projeto arquitetura", "flagship store São Paulo obra", "restaurante São Paulo projeto arquitetura inauguração obra",
    "hotel boutique São Paulo construção", "clínica alto padrão São Paulo projeto arquitetura", "escritório de arquitetura assina projeto São Paulo residencial",
    "Cidade Jardim residência projeto", "Alto de Pinheiros casa projeto arquitetura", "Higienópolis edifício lançamento arquitetura",
]
def rss(q):
    u = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:120d", "hl": "pt-BR", "gl": "BR", "ceid": "BR:pt-419"})
    out = []
    for it in ET.fromstring(get(u)).iter("item"):
        t = html.unescape(it.findtext("title") or ""); src = it.findtext("source") or ""
        if src and t.endswith(" - " + src): t = t[: -len(src) - 3]
        try: d = datetime.strptime(it.findtext("pubDate") or "", "%a, %d %b %Y %H:%M:%S %Z").date().isoformat()
        except Exception: d = HOJE.isoformat()
        out.append({"titulo": t.strip(), "link": it.findtext("link"), "veiculo": src, "data": d, "resumo": ""})
    return out

def chama_ia(lote_):
    body = json.dumps({"modo": "sp", "itens": lote_}).encode()
    for t in range(3):
        try:
            req = urllib.request.Request(IA, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=150) as r: return json.loads(r.read()).get("itens", [])
        except urllib.error.HTTPError as e:
            print("IA HTTP", e.code, e.read()[:200])
            if e.code == 429: return None
        except Exception as e: print("IA erro", e)
        time.sleep(5 + 10 * t)
    return []

def noticias(cache):
    vistos = {}
    for q in CONSULTAS:
        try:
            for it in rss(q):
                k = hid(norm(it["titulo"])[:90])
                if k not in vistos: it["id"] = k; vistos[k] = it
        except Exception as e: print("rss", q, e)
        time.sleep(0.7)
    novos = [x for x in vistos.values() if x["id"] not in cache][:160]
    print(f"notícias SP: {len(vistos)} encontradas, {len(novos)} novas para a IA")
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import obras_extra as X
        X.enriquecer(novos)
    except Exception as e: print("enriquecer", e)
    for i in range(0, len(novos), 15):
        lt = novos[i:i + 15]
        res = chama_ia([{"id": x["id"], "titulo": x["titulo"], "resumo": (x.get("resumo") or "")[:2800], "data": x["data"]} for x in lt])
        if res is None: print("limite diário da IA"); break
        por = {str(r.get("id")): r for r in res if isinstance(r, dict)}
        for x in lt:
            if x["id"] in por: cache[x["id"]] = {**por[x["id"]], "_t": x["titulo"], "_l": x["link"], "_v": x["veiculo"], "_d": x["data"]}
    lim = (HOJE - timedelta(days=240)).isoformat()
    obras = {}
    for k, r in cache.items():
        if not r.get("relevante") or r.get("_d", "") < lim or r.get("estagio") == "INAUGURADA": continue
        nome = (r.get("obra") or r.get("_t") or "").upper()[:160]
        bairro = (r.get("bairro") or "").strip().upper() or None; r["bairro"] = bairro
        dono = norm(r.get("incorporadora") or "").split()[:1]
        chave = hid(dono[0], norm(bairro)) if dono else hid(norm(r.get("arquitetura") or ""), norm(bairro), norm(nome)[:40])
        f = {"t": r.get("_t"), "url": r.get("_l"), "veiculo": r.get("_v"), "data": r.get("_d")}
        o = obras.get(chave)
        if o:
            if f["url"] and all(x["url"] != f["url"] for x in o["fontes"]): o["fontes"].append(f)
            for c in ("arquitetura", "construtora", "incorporadora", "area_m2", "valor", "unidades", "detalhes"):
                if not o.get(c) and r.get(c): o[c] = r.get(c)
            continue
        obras[chave] = {"id": "SPN" + chave, "origem": "noticia", "obra": nome, "uso": r.get("uso") or "OUTROS", "bairro": bairro,
                        "estagio": r.get("estagio") or "ANÚNCIO", "arquitetura": r.get("arquitetura"), "construtora": r.get("construtora"),
                        "incorporadora": r.get("incorporadora"), "area_m2": r.get("area_m2"), "unidades": r.get("unidades"), "valor": r.get("valor"),
                        "detalhes": r.get("detalhes"), "pessoas": [p for p in (r.get("pessoas") or []) if isinstance(p, dict) and p.get("nome")][:5],
                        "atualizado": r.get("_d"), "fontes": [f], "alto": bool(r.get("alto_padrao", True))}
    return list(obras.values())

# ------------------------------------------------------------------ principal
def main():
    lotes = json.load(open(LOTES)) if os.path.exists(LOTES) else {}
    lotes = {k: v for k, v in lotes.items() if not (v and RUIDO.search(str(v.get("zona") or "")))}
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    anterior = {}
    if os.path.exists(OUT):
        try: anterior = {o["id"]: o for o in json.load(open(OUT)).get("itens", [])}
        except Exception: pass
    itens, fontes = [], {}
    # alvarás + lotes
    try:
        try:
            alv = alvaras(); json.dump(alv, open(ALV, "w"), ensure_ascii=False, separators=(",", ":"))
        except Exception as e:
            if not os.path.exists(ALV): raise
            print("planilhas indisponíveis agora (", str(e)[:80], ") — usando a última leitura"); alv = json.load(open(ALV))
        fim = time.time() + 30 * 60; n_novos = 0
        for a in sorted(alv, key=lambda a: a["data"], reverse=True):
            info = None
            for s in a["sqls"][:2]:
                if s not in lotes:
                    if time.time() > fim: break
                    n_novos += 1
                info = lote(s, lotes) or info
                if info: break
            info = info or {}
            res = (info.get("uso") or "").lower().startswith("residencial")
            dist = info.get("distrito"); zona = info.get("zona") or ""
            nobre = norm(dist) in NOBRES or zona.startswith("ZER")
            end = info.get("logradouro") or ""
            if end and not res and info.get("numero"): end += ", " + info["numero"]
            terreno = info.get("terreno")
            itens.append({"id": "SPA" + re.sub(r"\W", "", a["processo"]), "origem": "alvara", "obra": f"{a['tipo']} · {(dist or 'SÃO PAULO').upper()}" + (f" · {end}" if end else ""),
                          "tipo": a["tipo"], "estagio": a["etapa"], "uso": "RESIDENCIAL" if res else ("NÃO RESIDENCIAL" if info.get("uso") else None),
                          "bairro": dist, "zona": zona or None, "endereco": end or None, "area_terreno": terreno, "area_construida_atual": info.get("construida"),
                          "processo": a["processo"], "sei": a["sei"] or None, "eventos": [f"{fd} · {e}" for fd, e in a["eventos"]][-4:],
                          "atualizado": a["data"], "criado": a["primeira"], "alto": bool(nobre and (not res or (terreno or 0) >= 450)), "nobre": nobre,
                          "residencia_pf": res, "fontes": [{"t": "Relatório de alvarás emitidos — Prefeitura de São Paulo", "url": PAG, "veiculo": "Prefeitura de SP (SEL)", "data": a["data"]}]})
        fontes["alvaras"] = len(alv); print("lotes novos consultados no GeoSampa:", n_novos)
    except Exception as e:
        print("FALHA alvarás", e)
        antes = [o for o in anterior.values() if o.get("origem") == "alvara"]; itens += antes; fontes["alvaras"] = f"mantido ({len(antes)})"
    json.dump(lotes, open(LOTES, "w"), ensure_ascii=False, separators=(",", ":"))
    # licenças ambientais
    for l in licencas():
        itens.append({"id": l["id"], "origem": "licenca", "obra": (l["nome"] or "EMPREENDIMENTO").upper(), "estagio": "LICENCIAMENTO", "uso": (l.get("categoria") or "").upper() or None,
                      "bairro": l.get("distrito"), "endereco": l.get("endereco"), "processo": l.get("processo"), "atualizado": l["data"], "criado": l["data"],
                      "nobre": norm(l.get("distrito")) in NOBRES, "alto": norm(l.get("distrito")) in NOBRES,
                      "fontes": [{"t": "Licença ambiental publicada no Diário Oficial", "url": l.get("link"), "veiculo": "Prefeitura de SP (SVMA)", "data": l["data"]}]})
    fontes["licencas"] = sum(1 for o in itens if o["origem"] == "licenca")
    # notícias
    try:
        nts = noticias(cache); itens += nts; fontes["noticias"] = len(nts)
    except Exception as e:
        print("FALHA notícias", e); antes = [o for o in anterior.values() if o.get("origem") == "noticia"]; itens += antes
    json.dump(cache, open(CACHE, "w"), ensure_ascii=False, separators=(",", ":"))
    for o in itens:
        o["cidade"], o["uf"] = "São Paulo", "SP"
        o["empresa"] = o.get("incorporadora") or o.get("arquitetura")
        o["segmento"] = o.get("uso") or "OUTROS"
        o["construcao_propria"] = propria(o.get("incorporadora")) or propria(o.get("construtora"))
        o["sem_construtora"] = not o.get("construtora") and not o["construcao_propria"]
        o["codigo"] = "SP" + hashlib.sha1(o["id"].encode()).hexdigest()[:6].upper()
        pv = anterior.get(o["id"], {}).get("primeira_vez")
        o["primeira_vez"] = pv or (min(str(o.get("criado") or o.get("atualizado") or HOJE)[:10], HOJE.isoformat()) if not anterior else HOJE.isoformat())
        for k in [k for k, v in o.items() if v in (None, "", [])]: del o[k]
    itens.sort(key=lambda o: o.get("atualizado") or "", reverse=True)
    json.dump({"gerado": datetime.now(timezone.utc).isoformat(timespec="minutes"), "fontes": fontes, "total": len(itens),
               "nobres": sorted(NOBRES), "proprias": PROPRIAS, "itens": itens}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print("total:", len(itens), fontes, "alto padrão:", sum(1 for o in itens if o.get("alto")))

if __name__ == "__main__":
    main()
