"""Responsáveis técnicos dos alvarás de São Paulo (programa "De Olho na Obra", Decreto 49.737/2008).
A Prefeitura publica o PDF de parte dos alvarás do Aprova Digital. O documento traz, para cada responsável técnico,
o vínculo (projeto ou execução), o nome, o número de conselho (CAU/CREA) e o CCM.
Só esses dados profissionais são lidos. Os dados do proprietário são ignorados."""
import io, re, time, urllib.request

BASE = "https://prefeitura.sp.gov.br/documents/d/licenciamento/"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"}

def urls(processo):
    p = processo.strip().lower()
    return [BASE + "alvara_" + p + "-pdf", BASE + "alvara-" + p + "-pdf", BASE + "alvara_" + p + "-1-pdf"]

def baixa(processo):
    """Devolve (url, bytes) do PDF publicado ou (None, None)."""
    for u in urls(processo):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r:
                if "pdf" not in (r.headers.get("Content-Type") or "").lower(): continue
                b = r.read(8_000_000)
                if b[:4] == b"%PDF": return u, b
        except urllib.error.HTTPError as e:
            if e.code in (403, 429): raise
        except Exception:
            pass
        time.sleep(0.3)
    return None, None

def segmentos(pdf):
    """Trechos de texto com posição, na ordem de leitura: (página, topo, x, texto)."""
    out = []
    for pg, page in enumerate(pdf.pages):
        linhas = {}
        for c in page.chars:
            linhas.setdefault(round(c["top"]), []).append(c)
        for top in sorted(linhas):
            cs = sorted(linhas[top], key=lambda c: c["x0"])
            seg, x0, fim = "", None, None
            for c in cs:
                if fim is not None and c["x0"] - fim > 15:
                    if seg.strip(): out.append((pg, top, x0, seg.strip()))
                    seg, x0 = "", None
                if x0 is None: x0 = c["x0"]
                if fim is not None and c["x0"] - fim > 1.2 and not seg.endswith(" ") and c["text"] != " ": seg += " "
                seg += c["text"]; fim = c["x1"]
            if seg.strip(): out.append((pg, top, x0, seg.strip()))
    return out

ROTULOS = re.compile(r"^(NOME|N[ÚU]MERO DE CONSELHO|CCM|V[ÍI]NCULO|CPF|CNPJ)", re.I)
VERSAO = 2

def _abaixo(pdf, S, i):
    """Valor logo abaixo do rótulo S[i], recortado até a coluna do próximo rótulo da mesma linha (até 2 linhas)."""
    pg, top, x, _ = S[i]
    page = pdf.pages[pg]
    prox = [s[2] for s in S if s[0] == pg and abs(s[1] - top) < 2 and s[2] > x + 5 and ROTULOS.match(s[3])]
    x1 = min(prox) - 2 if prox else page.width
    cs = [c for c in page.chars if c["top"] > top + 2 and x - 1 <= c["x0"] < x1]
    if not cs: return None
    linhas = {}
    for c in cs: linhas.setdefault(round(c["top"]), []).append(c)
    tops = sorted(linhas)
    h = max(c["bottom"] - c["top"] for c in linhas[tops[0]])
    if tops[0] - top > 3 * h: return None
    partes, ant = [], None
    for tp in tops[:2]:
        if ant is not None and tp - ant > 1.6 * h: break
        lc = sorted(linhas[tp], key=lambda c: c["x0"])
        s, fim = "", None
        for c in lc:
            if fim is not None and c["x0"] - fim > 1.2 and not s.endswith(" ") and c["text"] != " ": s += " "
            s += c["text"]; fim = c["x1"]
        s = s.strip()
        if ROTULOS.match(s.upper()) or (ant is not None and abs(lc[0]["x0"] - x) > 8): break
        partes.append(s); ant = tp
    return " ".join(" ".join(partes).split()) or None

def tipo_vinculo(v):
    v = v.lower()
    if "propriet" in v or not re.search(r"respons|autor|dirigente", v): return None
    pj = bool(re.search(r"projeto|autor", v)); ex = bool(re.search(r"execu|obra|dirigente", v))
    return "ambos" if pj and ex else "projeto" if pj else "execucao" if ex else None

def le_rts(pdf_bytes):
    import pdfplumber
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        S = segmentos(pdf)
        rts = []
        for i, (_, _, _, txt) in enumerate(S):
            if txt.upper().replace("Í", "I") != "VINCULO": continue
            tipo = tipo_vinculo(_abaixo(pdf, S, i) or "")
            if not tipo: continue
            rt = {"vinculo": tipo}
            for j in range(i + 2, min(i + 40, len(S))):
                t = S[j][3].upper().replace("Í", "I").replace("Ú", "U").replace("Ã", "A")
                if t == "VINCULO": break
                if t in ("NOME", "NOME/RAZAO SOCIAL") and "nome" not in rt: rt["nome"] = _abaixo(pdf, S, j)
                elif t.startswith("NUMERO DE CONSELHO DA EMPRESA"): rt["registro"] = _abaixo(pdf, S, j); rt["empresa"] = True
                elif t.startswith("NOME DO REPRESENTANTE"): rt["representante"] = _abaixo(pdf, S, j)
                elif t.startswith("NUMERO DE CONSELHO DO REPRESENTANTE"):
                    v = _abaixo(pdf, S, j)
                    if rt.get("empresa"): rt["registro_rep"] = v
                    elif "registro" not in rt: rt["registro"] = v
            if rt.get("nome"):
                reg = re.sub(r"\s+", "", rt.get("registro") or "")
                if reg: rt["registro"] = reg
                rt["conselho"] = "CAU" if re.match(r"^[A-Z]{1,3}\d{2,}", reg) else ("CREA" if reg else None)
                if not rt.get("empresa"):
                    rt["empresa"] = bool(re.search(r"\b(LTDA|S\.?A\.?|EIRELI|ENGENHARIA|CONSTRU\w*|INCORPORA\w*|EMPREENDIMENTOS|ARQUITETURA|ARQUITETOS|ME|EPP)\b", rt["nome"].upper()))
                rts.append({k: v for k, v in rt.items() if v not in (None, "")})
    vistos, out = set(), []
    for r in rts:
        k = (r["vinculo"], r["nome"].upper())
        if k not in vistos: vistos.add(k); out.append(r)
    return out
