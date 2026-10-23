"""Robô das bases públicas do OrçaLivre (todas exceto SINAPI, que tem robô próprio).

Para cada base: acha a edição mais recente no site oficial, baixa, lê, confere e grava
dados/pub/<BASE>/<versão>/<UF>.json, atualizando dados/bases.json (chave "pub").
Guarda as 2 edições mais recentes de cada base. Uma base com problema não impede as outras.

Uso: python robo/bases_publicas.py [--forcar] [--local PASTA] [base ...]
  --local PASTA  lê arquivos já baixados (nomes do robo/amostras.py) em vez de baixar (testes)
"""
import io, os, re, sys, json, glob, shutil, zipfile, tempfile, unicodedata, html
import urllib.request, urllib.parse, http.cookiejar

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DADOS = os.path.join(RAIZ, "dados")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
_op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
_op.addheaders = [("User-Agent", UA), ("Accept-Language", "pt-BR,pt;q=0.9")]
LOCAL = None
GUARDAR = 2
MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
ABREV = [m[:3] for m in MESES]


def log(*a):
    print(*a, flush=True)


def norm(s):
    t = unicodedata.normalize("NFD", str(s if s is not None else "")).encode("ascii", "ignore").decode().upper()
    return re.sub(r"\s+", " ", t).strip()


# ---------------------------------------------------------------- rede
def url_ok(url):
    p = urllib.parse.urlsplit(url)
    caminho = urllib.parse.quote(urllib.parse.unquote(p.path), safe="/")
    return urllib.parse.urlunsplit((p.scheme, p.netloc, caminho, p.query, ""))


def baixar(url, local=None):
    if LOCAL and local:
        return open(os.path.join(LOCAL, local), "rb").read()
    for tentativa in range(4):
        try:
            with _op.open(url_ok(url), timeout=300) as r:
                return r.read()
        except Exception as e:
            if tentativa == 3:
                raise
            log(f"    nova tentativa de download ({type(e).__name__})")
            import time
            time.sleep(10 * (tentativa + 1))


def pagina(url):
    with _op.open(url_ok(url), timeout=120) as r:
        dados = r.read()
        final = r.geturl()
    txt = dados.decode("utf-8", "replace")
    hrefs = []
    for h in re.findall(r"""href\s*=\s*["']([^"']+)["']""", txt, re.I):
        a = urllib.parse.urljoin(final, html.unescape(h.strip()))
        if a not in hrefs:
            hrefs.append(a)
    return hrefs


def nome_url(u):
    return urllib.parse.unquote(urllib.parse.urlsplit(u).path)


# ---------------------------------------------------------------- planilhas
def linhas_planilha(dados, nome=""):
    """Lista de abas: (titulo, [linhas]) com valores crus (str/float/None)."""
    if dados[:4] == b"\xd0\xcf\x11\xe0":
        import xlrd
        wb = xlrd.open_workbook(file_contents=dados)
        out = []
        for sh in wb.sheets():
            out.append((sh.name, [[(c if c != "" else None) for c in sh.row_values(i)] for i in range(sh.nrows)]))
        return out
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(dados), read_only=True, data_only=True)
    out = []
    for ws in wb.worksheets:
        ws.reset_dimensions()
        out.append((ws.title, [list(r) for r in ws.iter_rows(values_only=True)]))
    return out


def num(v):
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("R$", "").replace(" ", "")
    if not s or not re.fullmatch(r"-?[\d.,]+", s):
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def txt(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).replace("\xa0", " ").strip()


def codigo(v):
    s = txt(v).lstrip("'").strip()
    return s


def tipo_insumo(u, d, dica=""):
    x = norm(dica)
    if "MAO" in x and "OBRA" in x:
        return "MO"
    if "EQUIP" in x:
        return "EQ"
    if "MATERIA" in x:
        return "MAT"
    U, D = norm(u), norm(d)
    if re.fullmatch(r"CH[PI]", U):
        return "EQ"
    if U in ("H", "MES", "HORA"):
        if re.search(r"CAMINHAO|BETONEIRA|ESCAVADEIRA|TRATOR|ROLO |GUINDA|COMPRESSOR|VIBRADOR|BOMBA|RETRO|MOTONIVEL|CARREGADEIRA|GERADOR|PERFURATRIZ|MARTELETE|SERRA |EQUIPAMENTO|MAQUINA|GRUA|ELEVADOR|ANDAIME|LOCACAO|USINA|VEICULO|CAMIONETE|CAMINHONETE|ROLO|VASSOURA|DISTRIBUIDOR|FRESADORA|MOTOSERRA", D):
            return "EQ"
        return "MO"
    return "MAT"


# ---------------------------------------------------------------- montagem de uma base
class Base:
    def __init__(self):
        self.ins = {}    # c -> [d,u,t]
        self.comp = {}   # c -> [d,u,g,itens]
        self.pi = {}     # reg -> {c: preço}
        self.pc = {}     # reg -> {c: preço}
        self.grupos = []

    def add_ins(self, reg, c, d, u, t, p):
        if not c:
            return
        if c not in self.ins:
            self.ins[c] = [d, u, t]
        if p is not None:
            self.pi.setdefault(reg, {})[c] = round(p, 4)

    def add_comp(self, reg, c, d, u, g, p, itens=None):
        if not c:
            return
        e = self.comp.get(c)
        if e is None:
            self.comp[c] = e = [d, u, g or "", []]
        if itens and not e[3]:
            e[3] = itens
        if g and not e[2]:
            e[2] = g
        if p is not None:
            self.pc.setdefault(reg, {})[c] = round(p, 4)

    def json(self, fonte, nome, uf, m, v):
        regs = sorted(set(self.pi) | set(self.pc), key=lambda r: ["SD", "CD", "SE"].index(r) if r in ("SD", "CD", "SE") else 9)
        gl = sorted({e[2] for e in self.comp.values() if e[2]})
        gi = {g: i for i, g in enumerate(gl)}
        ic = sorted(self.ins)
        cc = sorted(self.comp)
        out = {"f": fonte, "n": nome, "uf": uf, "m": m, "v": v, "regs": regs, "g": gl,
               "ins": [[c] + self.ins[c] for c in ic],
               "comp": [[c, self.comp[c][0], self.comp[c][1], gi.get(self.comp[c][2], -1), self.comp[c][3]] for c in cc],
               "px": {}}
        for r in regs:
            out["px"][r] = {"i": [self.pi.get(r, {}).get(c) for c in ic], "c": [self.pc.get(r, {}).get(c) for c in cc]}
        return out


# ---------------------------------------------------------------- leitor de tabela de preços (sintética)
def achar_colunas(rows):
    for i, r in enumerate(rows[:200]):
        ns = [norm(c) for c in r]
        ehcod = lambda x: (re.search(r"\bCOD", x) and "AUX" not in x and "ALPHA" not in x) or x in ("SERVICO", "ITEM")
        if not any(ehcod(x) for x in ns) or not any(re.search(r"DESCRI|ESPECIFICA|NOME", x) for x in ns):
            continue
        col = {}
        for j, x in enumerate(ns):
            if "cod" not in col and ehcod(x):
                col["cod"] = j
            elif "desc" not in col and re.search(r"DESCRI|ESPECIFICA|NOME", x):
                col["desc"] = j
            elif "un" not in col and re.fullmatch(r"(UN|UND|UNID|UNIDADE)\.?|UN\. ?MED\.?|UNID\.? MEDIDA", x):
                col["un"] = j
        sub = [norm(c) for c in rows[i + 1]] if i + 1 < len(rows) else []
        prec = [(j, x) for j, x in enumerate(ns) if re.search(r"VALOR|PRECO|CUSTO|R\$|TOTAL", x) and j not in col.values()]
        prec += [(j, x) for j, x in enumerate(sub) if re.search(r"TOTAL|VALOR|PRECO", x)]
        if not prec:
            continue
        pick = [j for j, x in prec if "UNIT" in x and "C$" not in x] or [j for j, x in prec if "TOTAL" in x and "PRECO TOTAL" not in x and "SUBTOTAL" not in x] or [prec[0][0]]
        col["preco"] = pick[0]
        if "cod" in col and "desc" in col:
            return i, col
    return None, None


def tabela_precos(base, reg, rows, prefixo_grupo="", como="comp", dica_tipo="", cols=None, ns=""):
    h, col = achar_colunas(rows)
    if cols and col is not None:
        col.update(cols)
    if col is None:
        amostra = [[txt(c)[:25] for c in r if c is not None and txt(c)] for r in rows[:40]]
        raise ValueError("cabeçalho não encontrado; início da planilha: " + json.dumps([a for a in amostra if a][:15], ensure_ascii=False))
    grupo, n = "", 0
    for r in rows[h + 1:]:
        def cel(k):
            j = col.get(k)
            return r[j] if j is not None and j < len(r) else None
        c, d = codigo(cel("cod")), txt(cel("desc"))
        if not c or not d or norm(c) in ("CODIGO",):
            continue
        p = num(cel("preco"))
        u = txt(cel("un"))
        if p is None or not u or u in (".",):
            grupo = (prefixo_grupo + " · " if prefixo_grupo else "") + d[:90]
            continue
        if como == "comp":
            if ns and c in base.comp and base.comp[c][0] != d:
                c = f"{ns}-{c}"
            base.add_comp(reg, c, d, u, grupo, p)
        else:
            base.add_ins(reg, c, d, u, tipo_insumo(u, d, dica_tipo), p)
        n += 1
    return n


# ---------------------------------------------------------------- leitor de relatório analítico (GOINFRA, DER-ES)
SEC = [("EQUIPAMENTO", "EQ"), ("MAO-DE-OBRA", "MO"), ("MAOS-DE-OBRA", "MO"), ("MAO DE OBRA", "MO"), ("INCIDENCIA", "X"),
       ("MATERIA", "MAT"), ("SERVICOS", "SV"), ("TRANSPORTE", "TR"), ("ATIVIDADES AUX", "SV"), ("TEMPO FIXO", "TR")]


def _par(vals, total, preco_conhecido=None, col_consumo=None):
    """Acha (coeficiente, preço) entre os números da linha cujo produto dá o total."""
    best = None
    for a in range(len(vals)):
        for b in range(len(vals)):
            if a == b:
                continue
            (ja, va), (jb, vb) = vals[a], vals[b]
            if va is None or vb is None:
                continue
            err = abs(va * vb - total)
            if err <= max(0.011, total * 0.015):
                if best is None or err < best[0] - 1e-9:
                    best = (err, a, b)
    if best is None:
        return None
    _, a, b = best
    (ja, va), (jb, vb) = vals[a], vals[b]
    if preco_conhecido:
        if abs(va - preco_conhecido) <= preco_conhecido * 0.011:
            return vb, va
        if abs(vb - preco_conhecido) <= preco_conhecido * 0.011:
            return va, vb
    if col_consumo is not None:
        if ja == col_consumo:
            return va, vb
        if jb == col_consumo:
            return vb, va
    return (va, vb) if va <= vb else (vb, va)


def relatorio_analitico(base, reg, rows, precos_comp=None, precos_ins=None):
    """Lê blocos 'Serviço: código - descrição'. Devolve nº de composições e nº conferidas."""
    precos_comp = precos_comp or {}
    precos_ins = precos_ins or {}
    blocos, cur = [], None
    for r in rows:
        cells = [(j, c) for j, c in enumerate(r) if c is not None and txt(c) != ""]
        if not cells:
            continue
        t0 = norm(cells[0][1])
        if t0.startswith("SERVICO:"):
            s = txt(cells[0][1]).split(":", 1)[1].strip()
            if not s and len(cells) > 1:
                s = txt(cells[1][1])
            m = re.match(r"'?([\w.\-/]+)\s*(?:-\s*)?(.*)$", s)
            und = ""
            for j, (cj, cv) in enumerate(cells):
                if norm(cv).startswith("UNIDADE:"):
                    und = txt(cv).split(":", 1)[1].strip() or (txt(cells[j + 1][1]) if j + 1 < len(cells) else "")
            cur = {"c": m.group(1).strip(), "d": m.group(2).strip(), "u": und, "sec": None, "hdr": {}, "it": [], "prod": 1.0, "cd": None}
            blocos.append(cur)
            continue
        if cur is None:
            continue
        linha = " ".join(norm(c) for _, c in cells)
        if re.match(r"^\(?[A-H]\)?\s*TOTAL", t0):
            cur["sec"] = None
            continue
        if "PRODUCAO DA EQUIPE" in linha:
            v = [num(c) for _, c in cells if num(c) is not None]
            if v and v[-1]:
                cur["prod"] = v[-1]
            continue
        if "CUSTO DIRETO TOTAL" in linha:
            v = [num(c) for _, c in cells if num(c) is not None]
            if v:
                cur["cd"] = v[-1]
            continue
        sec = None
        if any("COD" in norm(c) for _, c in cells) and not any(num(c) is not None for _, c in cells):
            for k, s in SEC:
                if k in linha:
                    sec = s
                    break
        if sec:
            cur["sec"] = sec
            cur["hdr"] = {norm(c): j for j, c in cells}
            continue
        if not cur["sec"] or cur["sec"] == "X":
            continue
        cod, nome, und, vals = None, "", "", []
        for j, c in cells:
            n = num(c) if not isinstance(c, str) or not re.fullmatch(r"'?\s*\d{3,}\s*", c) else None
            s = txt(c)
            if cod is None and isinstance(c, str) and re.fullmatch(r"'?\s*[A-Z]{0,2}\d[\dA-Z.\-]*\s*", c) and not re.fullmatch(r"\s*[A-Z]{1,2}\d\s*", c):
                cod = s.lstrip("'").strip()
            elif n is not None:
                vals.append((j, n))
            elif len(s) > len(nome) and len(s) > 6:
                nome = s
            elif not und and len(s) <= 7:
                und = s
        if not cod or len(vals) < 2:
            continue
        total = vals[-1][1]
        resto = vals[:-1]
        hdr = cur["hdr"]
        ccons = next((j for k, j in hdr.items() if "CONSUMO" in k or "QUANT" in k or "COEF" in k), None)
        sec = cur["sec"]
        if sec == "EQ":
            cprod = next((j for k, j in hdr.items() if "PROD" in k and "HR" in k), None)
            vp = next((v for j, v in resto if j == cprod), None) or max(v for _, v in resto)
            if not vp:
                continue
            q = total / vp
            cur["it"].append((sec, cod, nome, und or "H", q, vp, True))
            continue
        conhecido = precos_comp.get(cod) if sec in ("SV", "TR") else precos_ins.get(cod)
        par = _par(resto, total, conhecido, ccons)
        if par is None:
            continue
        q, p = par
        cur["it"].append((sec, cod, nome, und, q, p, sec == "MO"))
    nconf = 0
    for b in blocos:
        itens, soma = [], 0.0
        for sec, cod, nome, und, q, p, horario in b["it"]:
            qq = q / b["prod"] if horario else q
            soma += qq * p
            if sec in ("SV", "TR"):
                itens += ["C", cod, round(qq, 7)]
                if cod not in base.comp and cod not in precos_comp:
                    base.add_ins(reg, "S" + cod, nome, und, "OUT", p)
                    itens[-2] = "S" + cod
                    itens[-3] = "I"
            else:
                itens += ["I", cod, round(qq, 7)]
                base.add_ins(reg, cod, nome, und, sec if sec in ("EQ", "MO", "MAT") else "MAT", p)
        preco = precos_comp.get(b["c"], b["cd"])
        if b["cd"] is not None and abs(soma - b["cd"]) <= max(0.05, 0.02 * b["cd"]):
            nconf += 1
        base.add_comp(reg, b["c"], b["d"], b["u"], "", preco, itens)
    # itens de serviço que apontam para composição sem preço próprio
    return len(blocos), nconf


# ---------------------------------------------------------------- utilidades de versão
def ultima_versao(fonte):
    d = os.path.join(DADOS, "pub", fonte)
    return sorted(os.listdir(d)) if os.path.isdir(d) else []


def ja_tem(fonte, ver, ufs=None):
    d = os.path.join(DADOS, "pub", fonte, ver)
    if not os.path.isdir(d):
        return False
    if ufs:
        return all(os.path.exists(os.path.join(d, uf + ".json")) for uf in ufs)
    return bool(glob.glob(os.path.join(d, "*.json")))


def gravar(fonte, ver, uf, obj):
    d = os.path.join(DADOS, "pub", fonte, ver)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, uf + ".json"), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    log(f"  gravado {fonte}/{ver}/{uf}.json: {len(obj['ins'])} insumos, {len(obj['comp'])} composições, regimes {obj['regs']}")


def mes_de(texto):
    """Extrai AAAA-MM de textos como '01/06/2026', 'julho-2026', 'jul26', 'JUN/26', 'dez25', '2026.07', '07/26'."""
    t = norm(texto).lower()
    m = re.search(r"(?<!\d)\d{1,2}/(\d{1,2})/(20\d\d)", t)
    if m and 1 <= int(m.group(1)) <= 12:
        return f"{m.group(2)}-{int(m.group(1)):02d}"
    for i, nm in enumerate(MESES):
        m = re.search(nm + r"[\s\-_/]*(?:de[\s\-_]*)?(20\d\d|\d\d)(?!\d)", t) or re.search(r"(?<![a-z])" + ABREV[i] + r"[a-z]*[\s\-_/]*(20\d\d|\d\d)(?!\d)", t)
        if m:
            a = m.group(1)
            return f"{a if len(a) == 4 else '20' + a}-{i + 1:02d}"
    m = re.search(r"(20\d\d)[.\-_/ ](\d{1,2})(?!\d)", t)
    if m and 1 <= int(m.group(2)) <= 12:
        return f"{m.group(1)}-{int(m.group(2)):02d}"
    m = re.search(r"(?<!\d)(\d{1,2})[/\-.](20\d\d|\d\d)(?!\d)", t)
    if m and 1 <= int(m.group(1)) <= 12:
        a = m.group(2)
        return f"{a if len(a) == 4 else '20' + a}-{int(m.group(1)):02d}"
    return None


# ================================================================ BASES
# ---------------- SICRO (DNIT) — trimestral, 27 UFs
SICRO = "https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-referenciais/sistemas-de-custos/sicro/relatorios/relatorios-sicro"
SICRO_UF = {"AC": ("norte", "acre"), "AM": ("norte", "amazonas"), "AP": ("norte", "amapa"), "PA": ("norte", "para"), "RO": ("norte", "rondonia"),
            "RR": ("norte", "roraima"), "TO": ("norte", "tocantins"), "AL": ("nordeste", "alagoas"), "BA": ("nordeste", "bahia"), "CE": ("nordeste", "ceara"),
            "MA": ("nordeste", "maranhao"), "PB": ("nordeste", "paraiba"), "PE": ("nordeste", "pernambuco"), "PI": ("nordeste", "piaui"),
            "RN": ("nordeste", "rio-grande-do-norte"), "SE": ("nordeste", "sergipe"), "DF": ("centro-oeste", "distrito-federal"), "GO": ("centro-oeste", "goias"),
            "MS": ("centro-oeste", "mato-grosso-do-sul"), "MT": ("centro-oeste", "mato-grosso"), "ES": ("sudeste", "espirito-santo"), "MG": ("sudeste", "minas-gerais"),
            "RJ": ("sudeste", "rio-de-janeiro"), "SP": ("sudeste", "sao-paulo"), "PR": ("sul", "parana"), "RS": ("sul", "rio-grande-do-sul"), "SC": ("sul", "santa-catarina")}


def sicro_ler_pacote(dados, uf):
    import py7zr
    base = Base()
    with tempfile.TemporaryDirectory() as d:
        if dados[:2] == b"PK":
            zipfile.ZipFile(io.BytesIO(dados)).extractall(d)
        else:
            with py7zr.SevenZipFile(io.BytesIO(dados)) as z:
                z.extractall(d)
        arqs = {norm(os.path.basename(p)): p for p in glob.glob(os.path.join(d, "**", "*.xls*"), recursive=True)}

        def acha(*chaves, sem=()):
            for k, p in arqs.items():
                if all(c in k for c in chaves) and not any(s in k for s in sem):
                    return open(p, "rb").read()
            raise FileNotFoundError(" ".join(chaves))
        m = None
        for k in arqs:
            mm = re.search(r"(\d\d)-(20\d\d)", k)
            if mm:
                m = f"{mm.group(2)}-{mm.group(1)}"
                break
        for reg, sem in (("SD", ("COM DESONERA",)),):  # o DNIT só publica composições sem desoneração
            for chave, t in (("SINTETICO DE MATERIAIS", "MAT"), ("SINTETICO DE EQUIPAMENTOS", "EQ"), ("SINTETICO DE MAO DE OBRA", "MO")):
                try:
                    dd = acha(chave, "COM DESONERA") if reg == "CD" and t != "MAT" else acha(chave, sem=("COM DESONERA",))
                except FileNotFoundError:
                    continue
                rows = linhas_planilha(dd)[0][1]
                for r in rows[1:]:
                    c, desc = codigo(r[0] if r else None), txt(r[1] if len(r) > 1 else None)
                    if not c or not desc:
                        continue
                    if t == "EQ":
                        p = num(r[9]) if len(r) > 9 else None
                        u = "h"
                    else:
                        p, u = num(r[3]) if len(r) > 3 else None, txt(r[2])
                    base.add_ins(reg, c, desc, u, t, p)
        # composições: preço oficial (sem desoneração) + analítico
        rows = linhas_planilha(acha("SINTETICO DE COMPOSICOES"))[0][1]
        oficial = {}
        for r in rows[1:]:
            c, desc = codigo(r[0] if r else None), txt(r[1] if len(r) > 1 else None)
            p = num(r[3]) if len(r) > 3 else None
            if c and desc and p is not None:
                oficial[c] = (desc, txt(r[2]), p)
        rows = linhas_planilha(acha("ANALITICO DE COMPOSICOES"))[0][1]
    blocos, cur, sec = [], None, None
    for r in rows:
        cells = [c for c in r if c is not None and txt(c) != ""]
        if not cells:
            continue
        a = norm(cells[0])
        if a.startswith("SISTEMA DE CUSTOS"):
            cur = {"prod": 1.0, "it": [], "mat": None, "matsoma": 0.0}
            blocos.append(cur)
            sec = None
            continue
        if cur is None:
            continue
        if a.startswith("CUSTO UNITARIO DE REFERENCIA"):
            v = [num(x) for x in cells if num(x) is not None]
            cur["prod"] = v[-1] if v and v[-1] else 1.0
            continue
        if "c" not in cur:
            cur["c"] = codigo(cells[0])
            continue
        if re.match(r"^[A-F] - ", a):
            sec = a[0]
            continue
        if a.startswith("CUSTO UNITARIO TOTAL DE MATERIAL"):
            v = [num(x) for x in cells if num(x) is not None]
            cur["mat"] = v[-1] if v else 0.0
            continue
        if a.startswith("CUSTO") or a.startswith("SUBTOTAL") or a in ("OPERATIVA", "LN", "OBS."):
            continue
        c = codigo(cells[0])
        if not re.fullmatch(r"[A-Z]?\d+", c):
            continue
        if sec == "A":       # qtd, ut. op, ut. imp, custo prod, custo improd, custo total
            v = [num(x) for x in cells[2:]]
            if len(v) >= 6 and v[3]:
                cur["it"] += ["I", c, round(v[5] / v[3] / cur["prod"], 7)]
        elif sec == "B":     # qtd, unidade, custo horário, total
            v = num(cells[2])
            if v:
                cur["it"] += ["I", c, round(v / cur["prod"], 7)]
        elif sec == "C":
            q, p = num(cells[2]), num(cells[4]) if len(cells) > 4 else None
            if q is not None:
                cur["it"] += ["I", c, q]
                cur["matsoma"] += q * (p or 0)
        elif sec == "D":
            q = num(cells[2])
            if q is not None:
                cur["it"] += ["C", c, q]
        elif sec == "E":     # insumo, descrição, composição de transporte, qtd
            ct, q = codigo(cells[2]) if len(cells) > 3 else "", num(cells[3]) if len(cells) > 3 else None
            if ct and q is not None:
                cur["it"] += ["C", ct, q]
    conf = 0
    for b in blocos:
        c = b.get("c")
        if not c:
            continue
        d, u, p = oficial.get(c, ("", "", None))
        if b["mat"] is not None and abs(b["matsoma"] - b["mat"]) <= max(0.02, 0.005 * b["mat"]):
            conf += 1
        base.add_comp("SD", c, d, u, "", p, b["it"])
    for c, (d, u, p) in oficial.items():
        base.add_comp("SD", c, d, u, "", p)
    # grupos pelo prefixo do código (2 primeiros dígitos)
    log(f"  SICRO {uf}: {len(blocos)} composições no analítico, {conf} com materiais conferidos; {len(oficial)} preços oficiais")
    if len(oficial) < 1000 or conf < 0.9 * len(blocos):
        raise ValueError("conferência do SICRO reprovada")
    return base, m


def sicro(forcar):
    achados, regiao = {}, {}
    for uf, (reg, slug) in sorted(SICRO_UF.items()):
        try:
            if LOCAL:
                if uf != "SP":
                    continue
                url, ver = None, "2026-07"
            else:
                eds, vistos = [], set()

                def colher(links):
                    for l in links:
                        m = re.search(rf"/{slug}/(20\d\d)/([a-z0-9\-]+)/([a-z]+)-(20\d\d)(-revisado)?/?$", l)
                        if m and m.group(3) in MESES and l not in vistos:
                            vistos.add(l)
                            eds.append(((m.group(1), MESES.index(m.group(3)), bool(m.group(5))), l))
                    return links
                ls = colher(regiao.get(reg) or regiao.setdefault(reg, pagina(f"{SICRO}/{reg}/{reg}")))
                if not eds:
                    try:
                        ls = colher(pagina(f"{SICRO}/{reg}/{slug}"))
                    except Exception:
                        ls = []
                    anos = sorted({l for l in ls if re.search(rf"/{slug}/20\d\d/?$", l)}, reverse=True)[:2]
                    for a in anos:
                        colher(pagina(a))
                if not eds:
                    log(f"  SICRO {uf}: nenhuma edição encontrada")
                    continue
                (ano, mi, _), pag = max(eds)
                ver = f"{ano}-{mi + 1:02d}"
                if not forcar and ja_tem("SICRO", ver, [uf]):
                    achados[uf] = ver
                    continue
                arq = [l for l in pagina(pag) if re.search(r"\.(7z|zip)$", l, re.I)]
                if not arq:
                    log(f"  SICRO {uf}: página {pag} sem arquivo")
                    continue
                url = arq[0]
            dados = baixar(url, "sicro_sp.7z")
            base, m = sicro_ler_pacote(dados, uf)
            gravar("SICRO", ver, uf, base.json("SICRO", "SICRO · DNIT", uf, m or ver, ver))
            achados[uf] = ver
        except Exception as e:
            log(f"  SICRO {uf}: ERRO {e}")
    return achados


# ---------------- SUDECAP (Belo Horizonte)
SUDECAP = "https://prefeitura.pbh.gov.br/sudecap/tabela-de-precos"


def sudecap(forcar):
    if LOCAL:
        arqs = {("ins", "CD"): "sudecap_ins_des.xls", ("cons", "CD"): "sudecap_cons_des.xls"}
        ver, urls = "2026-07", {k: None for k in arqs}
    else:
        links = [l for l in pagina(SUDECAP) if re.search(r"\.xlsx?$", l, re.I)]
        por = {}
        for l in links:
            n = nome_url(l).lower().rsplit("/", 1)[-1]
            m = re.match(r"(20\d\d)\.(\d\d)", n)
            if not m or "consultoria" in n:
                continue
            k = ("ins" if "insumo" in n else "cons" if "constru" in n else None, "CD" if "desonerad" in n else "SD")
            if k[0]:
                por.setdefault(f"{m.group(1)}-{m.group(2)}", {})[k] = l
        ver = max([v for v, d in por.items() if len(d) >= 4] or [v for v, d in por.items() if len(d) >= 2])
        urls, arqs = por[ver], {k: None for k in por[ver]}
    if not forcar and ja_tem("SUDECAP", ver):
        return {"MG": ver}
    base = Base()
    for (tipo, reg), u in (urls if not LOCAL else {k: None for k in arqs}).items():
        rows = linhas_planilha(baixar(u, arqs.get((tipo, reg))))[0][1]
        n = tabela_precos(base, reg, rows, como="ins" if tipo == "ins" else "comp")
        log(f"  SUDECAP {tipo} {reg}: {n} linhas")
    if len(base.comp) < 1000:
        raise ValueError("SUDECAP com poucas composições")
    gravar("SUDECAP", ver, "MG", base.json("SUDECAP", "SUDECAP · Belo Horizonte", "MG", ver, ver))
    return {"MG": ver}


# ---------------- SIURB (Prefeitura de São Paulo)
SIURB = "https://prefeitura.sp.gov.br/web/obras/w/tabelas_de_custos/355179"


def siurb_composicoes(base, reg, rows, grupo, itens=True):
    cur, n = None, 0
    for r in rows[4:]:
        r = list(r) + [None] * 10
        c0 = num(r[0])
        if c0 is not None and txt(r[1]):
            cur = codigo(r[0])
            base.add_comp(reg, cur, txt(r[1]), txt(r[7]), grupo, num(r[9]), [])
            n += 1
            continue
        ci = codigo(r[2])
        if itens and cur and ci and num(r[6]) is not None:
            base.comp[cur][3] += [ci, num(r[6]), txt(r[3]), txt(r[4]), num(r[5])]
    return n


def siurb(forcar):
    if LOCAL:
        ver = "2026-07"
        pares = {("SD", "insumos"): ("x", "siurb_ins_one.xlsx"), ("SD", "custos-edif"): ("x", "siurb_edif_one.xls"),
                 ("SD", "comp-edif"): ("x", "siurb_compedif_one.xls")}
    else:
        links = [l for l in pagina(SIURB) if "/documents/d/obras/" in l]
        por = {}
        for l in links:
            n = nome_url(l).rsplit("/", 1)[-1].lower()
            reg = "CD" if n.startswith("desonerada") else "SD" if n.startswith("onerada") else None
            mes = mes_de(n.replace("-xlsx", "").replace("-xls", ""))
            if not reg or not mes:
                continue
            for k, pad in (("insumos", r"-insumos-"), ("comp-edif", r"comp-custos-uni[td]-edif"), ("custos-edif", r"(?<!comp-)custos-uni[td]-edif"),
                           ("comp-infra", r"comp-custos-uni[td]-infra"), ("custos-infra", r"(?<!comp-)custos-uni[td]-infra"), ("aux", r"composicoes-auxiliares")):
                if re.search(pad, n):
                    por.setdefault(mes, {}).setdefault((reg, k), (l, None))
        ver = max(v for v, d in por.items() if len(d) >= 6)
        pares = por[ver]
    if not forcar and ja_tem("SIURB", ver):
        return {"SP": ver}
    base = Base()
    comps = {}
    for (reg, k), (u, loc) in sorted(pares.items()):
        try:
            rows = linhas_planilha(baixar(u, loc))[0][1]
        except Exception as e:
            log(f"  SIURB {k} {reg}: ERRO {e}")
            continue
        if k == "insumos":
            log(f"  SIURB insumos {reg}: {tabela_precos(base, reg, rows, como='ins')}")
        elif k in ("custos-edif", "custos-infra"):
            log(f"  SIURB {k} {reg}: {tabela_precos(base, reg, rows, prefixo_grupo='Edificações' if 'edif' in k else 'Infraestrutura')}")
        else:
            comps[(reg, k)] = rows
    primeiro = min((reg for reg, _ in comps), default="SD")
    for (reg, k), rows in sorted(comps.items()):
        g = "Edificações" if "edif" in k else "Infraestrutura" if "infra" in k else "Auxiliares"
        try:
            log(f"  SIURB {k} {reg}: {siurb_composicoes(base, reg, rows, g, reg == primeiro)} composições analíticas")
        except Exception as e:
            log(f"  SIURB {k} {reg}: ERRO {e}")
    # converte os itens crus [código, coef, desc, und, preço] em [t, código, coef]
    conf = tot = 0
    for c, e in base.comp.items():
        crus, it, soma = e[3], [], 0.0
        if not crus or isinstance(crus[0], str) and crus[0] in ("I", "C") and len(crus) % 3 == 0 and not isinstance(crus[1], float):
            pass
        if crus and len(crus) % 5 == 0 and not (crus[0] in ("I", "C")):
            for j in range(0, len(crus), 5):
                ci, q, d, u, p = crus[j:j + 5]
                t = "C" if ci in base.comp else "I"
                if t == "I" and ci not in base.ins:
                    base.add_ins(primeiro, ci, d, u, tipo_insumo(u, d), p)
                it += [t, ci, q]
                soma += q * (p or 0)
            e[3] = it
            pr = base.pc.get(primeiro, {}).get(c)
            if pr:
                tot += 1
                conf += abs(soma - pr) <= max(0.05, 0.02 * pr)
    log(f"  SIURB: {conf}/{tot} composições conferidas (soma dos itens = custo unitário)")
    if tot and conf < 0.85 * tot:
        raise ValueError("conferência do SIURB reprovada")
    gravar("SIURB", ver, "SP", base.json("SIURB", "SIURB · Prefeitura de São Paulo", "SP", ver, ver))
    return {"SP": ver}


# ---------------- DER-ES (edificações) — mensal, não desonerada
DERES = "https://der.es.gov.br/referencial-de-precos-edificacoes"


def deres(forcar):
    if LOCAL:
        ver, url = "2026-05", None
    else:
        cand = []
        for l in pagina(DERES):
            m = re.search(r"DER-ES - (20\d\d)-(\d\d)[^/]*\.zip$", nome_url(l), re.I)
            if m:
                cand.append((f"{m.group(1)}-{m.group(2)}", l))
        ver, url = max(cand)
    if not forcar and ja_tem("DER-ES", ver):
        return {"ES": ver}
    z = zipfile.ZipFile(io.BytesIO(baixar(url, "deres_2026_05.zip")))
    pega = lambda k: next(z.read(n) for n in z.namelist() if n.lower().endswith(k) and "/xls/" in n.lower())
    base = Base()
    rows = linhas_planilha(pega("insumos.xlsx"))[0][1]
    dica = ""
    h, col = achar_colunas(rows)
    for r in rows[h + 1:]:
        c, d = codigo(r[0]), txt(r[1])
        if c and d and num(r[3]) is None and len(c) <= 4:
            dica = d
        elif c and d and num(r[3]) is not None:
            base.add_ins("SD", c, d, txt(r[2]), tipo_insumo(txt(r[2]), d, dica), num(r[3]))
    rows = linhas_planilha(pega("servicos.xlsx"))[0][1]
    n = tabela_precos(base, "SD", rows, cols={"cod": 0})
    precos = dict(base.pc.get("SD", {}))
    rows = linhas_planilha(pega("composicoes.xlsx"))[0][1]
    nb, nconf = relatorio_analitico(base, "SD", rows, precos, base.pi.get("SD", {}))
    log(f"  DER-ES: {n} serviços com preço, {nb} composições analíticas, {nconf} conferidas")
    if nb and nconf < 0.85 * nb:
        raise ValueError("conferência do DER-ES reprovada")
    gravar("DER-ES", ver, "ES", base.json("DER-ES", "DER-ES · Edificações", "ES", ver, ver))
    return {"ES": ver}


# ---------------- GOINFRA (Goiás) — rodoviária e obras civis, com e sem desoneração
GOINFRA = {"rod": "https://goias.gov.br/goinfra/?p=235994", "civ": "https://goias.gov.br/goinfra/tabela-de-composicao114/"}


def goinfra(forcar):
    tabelas = {}
    if LOCAL:
        tabelas = {("rod", "SD"): (341, None, "goinfra_rod_S.xls"), ("civ", "SD"): (343, None, "goinfra_civ_S.xls")}
    else:
        for k, pg in GOINFRA.items():
            for l in pagina(pg):
                m = re.search(r"/T(\d+)_([SC])/[^/]+\.xls$", nome_url(l), re.I)
                if m:
                    reg = "SD" if m.group(2).upper() == "S" else "CD"
                    t = int(m.group(1))
                    if (k, reg) not in tabelas or t > tabelas[(k, reg)][0]:
                        tabelas[(k, reg)] = (t, l, None)
    feitos = {}
    for k, nome in (("rod", "GOINFRA · Rodoviária"), ("civ", "GOINFRA · Obras civis")):
        fonte = "GOINFRA-ROD" if k == "rod" else "GOINFRA-CIV"
        regs = {reg: v for (kk, reg), v in tabelas.items() if kk == k}
        if not regs:
            continue
        ver = "T" + "-".join(str(regs[r][0]) for r in sorted(regs))
        if not forcar and ja_tem(fonte, ver):
            feitos[fonte] = ver
            continue
        try:
            base, m = Base(), None
            for reg, (t, u, loc) in sorted(regs.items()):
                rows = linhas_planilha(baixar(u, loc))[0][1]
                for r in rows[:12]:
                    for c in r:
                        if c and "DATA BASE" in norm(c):
                            m = m or mes_de(txt(c).split(":", 1)[-1])
                nb, nconf = relatorio_analitico(base, reg, rows)
                log(f"  {fonte} T{t} {reg}: {nb} composições, {nconf} conferidas")
                if nb < 100 or nconf < 0.85 * nb:
                    raise ValueError("conferência reprovada")
            gravar(fonte, ver, "GO", base.json(fonte, nome, "GO", m or "", ver))
            feitos[fonte] = ver
        except Exception as e:
            log(f"  {fonte}: ERRO {e}")
    return feitos


# ---------------- SECID-PR (edificações, derivada do SINAPI)
SECID = "https://www.secid.pr.gov.br/Pagina/Custos-de-Edificacoes"


def secid(forcar):
    if LOCAL:
        urls, ver = {"CD": (None, "secid_des.xlsx")}, "2026-07"
    else:
        urls = {}
        for l in pagina(SECID):
            n = nome_url(l).lower()
            if n.endswith(".xlsx") and "composicoes_de_custos" in n:
                urls["SD" if "nao_desonerado" in n else "CD"] = (l, None)
        ver = None
    base, m = Base(), None
    for reg, (u, loc) in urls.items():
        abas = dict(linhas_planilha(baixar(u, loc)))
        ins = next(v for k, v in abas.items() if "INSUMO" in norm(k))
        for r in ins[:6]:
            for c in r:
                if c and "VIGENCIA" in norm(c):
                    m = mes_de(txt(c))
        ver = ver or m
        if not forcar and ja_tem("SECID-PR", ver):
            return {"PR": ver}
        tabela_precos(base, reg, ins, como="ins")
        sv = next(v for k, v in abas.items() if "SERVI" in norm(k))
        h, col = achar_colunas(sv)
        for r in sv[h + 1:]:
            c, d, p = codigo(r[1]), txt(r[2]), num(r[6]) if len(r) > 6 else None
            if c and d and p is not None:
                base.add_comp(reg, c, d, txt(r[3]), txt(r[0]), p)
        an = next(v for k, v in abas.items() if "ANALIT" in norm(k))
        for r in an[6:]:
            r = list(r) + [None] * 10
            c, ti, ci, q = codigo(r[1]), norm(r[2]), codigo(r[3]), num(r[6])
            if c in base.comp and ci and q is not None and ti in ("INSUMO", "COMPOSICAO"):
                it = base.comp[c][3]
                if reg == list(urls)[0]:
                    it += ["C" if ti == "COMPOSICAO" else "I", ci, q]
                if ti == "COMPOSICAO" and ci not in base.comp:
                    base.add_comp(reg, ci, txt(r[4]), txt(r[5]), "Auxiliares", None)
        log(f"  SECID-PR {reg}: {len(base.pi.get(reg, {}))} insumos, {len(base.pc.get(reg, {}))} serviços")
    if len(base.comp) < 500:
        raise ValueError("SECID-PR com poucas composições")
    gravar("SECID-PR", ver, "PR", base.json("SECID-PR", "SECID-PR · Edificações", "PR", ver, ver))
    return {"PR": ver}


# ---------------- COMPESA (Pernambuco) — sintética com e sem desoneração
COMPESA = "https://servicos.compesa.com.br/engenharia/"


def compesa(forcar):
    if LOCAL:
        urls, ver = {"CD": (None, "compesa_com.xlsx")}, "2026-07"
    else:
        urls, ver = {}, None
        for l in pagina(COMPESA):
            n = nome_url(l).upper()
            if n.endswith(".XLSX") and "SINTETICA" in n:
                urls["CD" if "COM-DESONERA" in n else "SD"] = (l, None)
                m = re.search(r"DB-(\d\d)\.(20\d\d)", n)
                if m:
                    ver = f"{m.group(2)}-{m.group(1)}"
    if not forcar and ver and ja_tem("COMPESA", ver):
        return {"PE": ver}
    base = Base()
    for reg, (u, loc) in urls.items():
        n = tabela_precos(base, reg, linhas_planilha(baixar(u, loc))[0][1])
        log(f"  COMPESA {reg}: {n} serviços")
    if len(base.comp) < 300:
        raise ValueError("COMPESA com poucos serviços")
    gravar("COMPESA", ver, "PE", base.json("COMPESA", "COMPESA · Pernambuco", "PE", ver, ver))
    return {"PE": ver}


# ---------------- SANEPAR (Paraná) — tabelas de preços por especialidade
SANEPAR = "https://www.sanepar.com.br/tabelas-de-precos"


def sanepar(forcar):
    if LOCAL:
        zips = [(None, "sanepar_mos.zip", "MOS 5ed v02 - dez25")]
    else:
        zips = [(l, None, nome_url(l).rsplit("/", 1)[-1][:-4]) for l in pagina(SANEPAR)
                if nome_url(l).lower().endswith(".zip") and "anteriores" not in nome_url(l).lower()]
    meses = [mes_de(n) for _, _, n in zips if mes_de(n)]
    ver = max(meses) if meses else None
    if not forcar and ver and ja_tem("SANEPAR", ver):
        return {"PR": ver}
    base = Base()
    for u, loc, nome in zips:
        try:
            z = zipfile.ZipFile(io.BytesIO(baixar(u, loc)))
            for n in z.namelist():
                if n.lower().endswith((".xlsx", ".xls")):
                    rot = re.sub(r"\s*-?\s*\w{3}\d\d$", "", nome).strip()
                    k = tabela_precos(base, "SD", linhas_planilha(z.read(n))[0][1], prefixo_grupo=rot, ns=re.sub(r"[^A-Z]", "", norm(rot))[:4] or "T")
                    log(f"  SANEPAR {nome}: {k} serviços")
        except Exception as e:
            log(f"  SANEPAR {nome}: ERRO {e}")
    if len(base.comp) < 300:
        raise ValueError("SANEPAR com poucos serviços")
    gravar("SANEPAR", ver, "PR", base.json("SANEPAR", "SANEPAR · Paraná", "PR", ver, ver))
    return {"PR": ver}


# ---------------- CDHU — composição sintética de serviços (pública)
CDHU = "https://www.cdhu.sp.gov.br/cdhu/Transpar%C3%AAncia/Licitacoes%20e%20Contratos/Tabela%20de%20Composicao%20de%20Servicos"


def cdhu_publica(forcar):
    if LOCAL:
        return {}
    cand = []
    for l in pagina(CDHU):
        n = nome_url(l)
        if re.search(r"sintetica-de-servicos-padrao/.*\.xls$", n, re.I) and "especiais" not in n.lower():
            m = re.search(r"(\d\d)[-_](\d\d)(?=[-_ .]|$)", n.rsplit("/", 1)[-1])
            if m:
                cand.append((f"20{m.group(2)}-{m.group(1)}", l))
    ver, url = max(cand)
    if not forcar and ja_tem("CDHU", ver):
        return {"SP": ver}
    base = Base()
    n = tabela_precos(base, "SD", linhas_planilha(baixar(url))[0][1])
    log(f"  CDHU: {n} serviços")
    if n < 500:
        raise ValueError("CDHU com poucos serviços")
    gravar("CDHU", ver, "SP", base.json("CDHU", "CDHU · São Paulo", "SP", ver, ver))
    return {"SP": ver}


BASES = {
    "SICRO": ("SICRO · DNIT (rodoviária)", sicro),
    "SUDECAP": ("SUDECAP · Belo Horizonte", sudecap),
    "SIURB": ("SIURB · Prefeitura de São Paulo", siurb),
    "DER-ES": ("DER-ES · Edificações", deres),
    "GOINFRA": ("GOINFRA · Goiás", goinfra),
    "SECID-PR": ("SECID-PR · Edificações", secid),
    "COMPESA": ("COMPESA · Pernambuco", compesa),
    "SANEPAR": ("SANEPAR · Paraná", sanepar),
    "CDHU": ("CDHU · São Paulo (composições públicas)", cdhu_publica),
}
NOMES = {"SICRO": "SICRO · DNIT (rodoviária)", "SUDECAP": "SUDECAP · Belo Horizonte", "SIURB": "SIURB · Pref. São Paulo",
         "DER-ES": "DER-ES · Edificações", "GOINFRA-ROD": "GOINFRA · Rodoviária", "GOINFRA-CIV": "GOINFRA · Obras civis",
         "SECID-PR": "SECID-PR · Edificações", "COMPESA": "COMPESA · Pernambuco", "SANEPAR": "SANEPAR · Paraná", "CDHU": "CDHU · São Paulo"}


def atualizar_manifesto():
    mp = os.path.join(DADOS, "bases.json")
    man = json.load(open(mp, encoding="utf-8")) if os.path.exists(mp) else {}
    pub = {}
    raiz = os.path.join(DADOS, "pub")
    for fonte in sorted(os.listdir(raiz)) if os.path.isdir(raiz) else []:
        vers = sorted(os.listdir(os.path.join(raiz, fonte)), reverse=True)
        for velha in vers[GUARDAR:]:
            shutil.rmtree(os.path.join(raiz, fonte, velha))
        lst = []
        for v in vers[:GUARDAR]:
            ufs = sorted(f[:-5] for f in os.listdir(os.path.join(raiz, fonte, v)) if f.endswith(".json"))
            if not ufs:
                continue
            amostra = json.load(open(os.path.join(raiz, fonte, v, ufs[0] + ".json"), encoding="utf-8"))
            lst.append({"v": v, "m": amostra.get("m") or v, "ufs": ufs, "regs": amostra.get("regs", ["SD"])})
        if lst:
            pub[fonte] = {"n": NOMES.get(fonte, fonte), "vers": lst}
    man["pub"] = pub
    man.pop("cdhu", None)  # o boletim CDHU é pago; o site usa só as composições públicas da CDHU
    with open(mp, "w", encoding="utf-8") as f:
        json.dump(man, f, ensure_ascii=False, indent=1)
    log("manifesto: " + ", ".join(f"{k} {v['vers'][0]['v']}" for k, v in pub.items()))


def main():
    global LOCAL
    args = sys.argv[1:]
    forcar = "--forcar" in args
    if "--local" in args:
        LOCAL = args[args.index("--local") + 1]
    alvo = [a for a in args if not a.startswith("--") and a != LOCAL] or list(BASES)
    resumo = {}
    for nome in alvo:
        log(f"\n===== {nome} =====")
        try:
            resumo[nome] = BASES[nome][1](forcar)
        except Exception as e:
            log(f"  {nome}: ERRO {type(e).__name__}: {e}")
            resumo[nome] = "erro"
    atualizar_manifesto()
    log("\nRESUMO: " + json.dumps(resumo, ensure_ascii=False))
    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a") as f:
            f.write("pub=" + ",".join(k for k, v in resumo.items() if v and v != "erro") + "\n")


if __name__ == "__main__":
    main()
