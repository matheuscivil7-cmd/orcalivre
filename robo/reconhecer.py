"""Robô de reconhecimento do OrçaLivre.

Visita a página oficial de cada base pública, acha os arquivos mais recentes, baixa uma
amostra e imprime no log a estrutura (arquivos do pacote, abas, primeiras linhas).
Não grava nada no site: serve só para escrever os leitores de cada base.
Uso: python robo/reconhecer.py [nome_da_base ...]
"""
import io, os, re, sys, tempfile, zipfile, html, urllib.request, urllib.parse, http.cookiejar

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
op.addheaders = [("User-Agent", UA), ("Accept-Language", "pt-BR,pt;q=0.9")]
LIM = 60 * 1024 * 1024


def log(*a):
    print(*a, flush=True)


def get(url, binario=False):
    with op.open(url, timeout=120) as r:
        dados = r.read(LIM)
        if binario:
            return dados, r.geturl()
        cs = r.headers.get_content_charset() or "utf-8"
        return dados.decode(cs, "replace"), r.geturl()


def links(url, padrao):
    pag, final = get(url)
    hrefs = re.findall(r"""href\s*=\s*["']([^"']+)["']""", pag, re.I)
    out = []
    for h in hrefs:
        h = html.unescape(h.strip())
        a = urllib.parse.urljoin(final, h)
        if re.search(padrao, urllib.parse.unquote(a), re.I) and a not in out:
            out.append(a)
    return out, pag


def mostrar_planilha(nome, dados):
    low = nome.lower()
    try:
        if low.endswith(".xlsx") or low.endswith(".xlsm"):
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(dados), read_only=True, data_only=True)
            for ws in wb.worksheets[:6]:
                ws.reset_dimensions()
                log(f"      aba '{ws.title}'")
                for i, row in enumerate(ws.iter_rows(values_only=True)):
                    if i >= 14:
                        break
                    log("        ", [str(c)[:28] for c in row[:10] if c is not None])
        elif low.endswith(".xls"):
            import xlrd
            wb = xlrd.open_workbook(file_contents=dados)
            for sh in wb.sheets()[:6]:
                log(f"      aba '{sh.name}' ({sh.nrows} linhas x {sh.ncols} colunas)")
                for i in range(min(14, sh.nrows)):
                    log("        ", [str(c)[:28] for c in sh.row_values(i)[:10] if str(c).strip()])
        elif low.endswith(".pdf"):
            from pypdf import PdfReader
            pdf = PdfReader(io.BytesIO(dados))
            txt = (pdf.pages[0].extract_text() or "")[:600].replace("\n", " | ")
            log(f"      PDF {len(pdf.pages)} páginas; início: {txt}")
        elif low.endswith(".csv") or low.endswith(".txt"):
            log("      ", dados[:600].decode("latin-1", "replace").replace("\n", " | "))
    except Exception as e:
        log(f"      (não consegui abrir {nome}: {e})")


def mostrar_pacote(nome, dados, nivel=0):
    low = nome.lower()
    pre = "  " * nivel
    if low.endswith(".zip"):
        z = zipfile.ZipFile(io.BytesIO(dados))
        nomes = z.namelist()
        log(f"{pre}    ZIP com {len(nomes)} arquivos: {nomes[:40]}")
        vistos = 0
        for n in nomes:
            if vistos >= 6:
                break
            if re.search(r"\.(xlsx?|xlsm|pdf|zip|7z|csv)$", n, re.I):
                log(f"{pre}    -> {n}")
                mostrar_pacote(n, z.read(n), nivel + 1)
                vistos += 1
    elif low.endswith(".7z"):
        import py7zr
        with tempfile.TemporaryDirectory() as d:
            with py7zr.SevenZipFile(io.BytesIO(dados)) as z:
                nomes = z.getnames()
                log(f"{pre}    7Z com {len(nomes)} arquivos: {nomes[:40]}")
                z.extractall(d)
            vistos = 0
            for raiz, _, fs in os.walk(d):
                for f in sorted(fs):
                    if vistos >= 8:
                        break
                    if re.search(r"\.(xlsx?|xlsm|pdf|csv)$", f, re.I):
                        log(f"{pre}    -> {os.path.relpath(os.path.join(raiz, f), d)}")
                        mostrar_planilha(f, open(os.path.join(raiz, f), "rb").read())
                        vistos += 1
    else:
        mostrar_planilha(nome, dados)


def baixar_e_mostrar(url):
    try:
        dados, final = get(url, binario=True)
    except Exception as e:
        log(f"    ERRO ao baixar {url}: {e}")
        return
    nome = urllib.parse.unquote(final.split("?")[0].rsplit("/", 1)[-1])
    if not re.search(r"\.(xlsx?|xlsm|pdf|zip|7z|csv)$", nome, re.I):
        cab = dados[:4]
        nome += ".zip" if cab[:2] == b"PK" else ".pdf" if cab == b"%PDF" else ".xls" if cab == b"\xd0\xcf\x11\xe0" else ""
    log(f"    baixado: {nome} ({len(dados)/1024:.0f} KB)")
    mostrar_pacote(nome, dados)


def pagina(nome, url, padrao, escolher=3):
    log(f"\n===== {nome} =====\n  página: {url}")
    try:
        ls, pag = links(url, padrao)
    except Exception as e:
        log(f"  ERRO ao abrir a página: {e}")
        return
    log(f"  {len(ls)} links encontrados (primeiros 25):")
    for l in ls[:25]:
        log("   ", urllib.parse.unquote(l))
    if not ls:
        txt = re.sub(r"<[^>]+>", " ", pag)
        log("  trecho da página:", re.sub(r"\s+", " ", txt)[:700])
    for l in ls[:escolher]:
        baixar_e_mostrar(l)


SICRO = "https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-referenciais/sistemas-de-custos/sicro/relatorios/relatorios-sicro"


def sicro():
    log(f"\n===== SICRO (DNIT) =====")
    try:
        reg, _ = links(f"{SICRO}/sudeste/sudeste", r"/relatorios-sicro/sudeste/sao-paulo")
        log("  links de SP:", [urllib.parse.unquote(x) for x in reg[:15]])
        anos = sorted({x for x in reg if re.search(r"/sao-paulo/20\d\d", x)}, reverse=True)
        alvo = None
        for a in anos[:4] or [f"{SICRO}/sudeste/sao-paulo"]:
            sub, _ = links(a, r"/sao-paulo/20\d\d/")
            log("  ", urllib.parse.unquote(a), "->", [urllib.parse.unquote(x) for x in sub[:12]])
            for s in sub:
                arq, _ = links(s, r"\.(7z|zip|rar|xlsx?)($|\?)")
                if arq:
                    log("   arquivos em", urllib.parse.unquote(s), ":", [urllib.parse.unquote(x) for x in arq[:8]])
                    alvo = arq[0]
                    break
            if alvo:
                break
        if alvo:
            baixar_e_mostrar(alvo)
        else:
            log("  nenhum arquivo do SICRO encontrado")
    except Exception as e:
        log("  ERRO:", e)


BASES = {
    "sicro": sicro,
    "derpr": lambda: pagina("DER-PR", "https://www.der.pr.gov.br/Pagina/Normas-e-Custos-Rodoviarios", r"Referencial.*Sem_Desonera.*\.zip$", 1),
    "goinfra": lambda: pagina("GOINFRA (composições rodoviárias)", "https://goias.gov.br/goinfra/?p=235994", r"\.xlsx?$", 2),
    "goinfra_civil": lambda: pagina("GOINFRA (obras civis)", "https://goias.gov.br/goinfra/tabela-de-composicao114/", r"\.xlsx?$", 2),
    "dersp": lambda: pagina("DER-SP", "https://www.der.sp.gov.br/der/biblioteca/manuais_e_normas/tabelas", r"\.(xlsx?|zip|pdf)($|\?)", 1),
    "sudecap": lambda: pagina("SUDECAP-BH", "https://prefeitura.pbh.gov.br/sudecap/tabela-de-precos", r"\.xlsx?$", 2),
    "deres": lambda: pagina("DER-ES (edificações)", "https://der.es.gov.br/referencial-de-precos-edificacoes", r"\.zip$", 1),
    "seinfrace": lambda: pagina("SEINFRA-CE (desonerada)", "https://sin.seinfra.ce.gov.br/site-seinfra/siproce/desonerada/tabela-custo-download.html", r"\.xlsx?($|\?)", 2),
    "siurb": lambda: pagina("SIURB (Prefeitura de SP)", "https://prefeitura.sp.gov.br/web/obras/w/tabelas_de_custos/355179", r"/documents/d/obras/.*(xls|xlsx)", 3),
    "scorio": lambda: pagina("SCO-Rio", "https://controladoria.prefeitura.rio/tabelas-do-sistema-de-custos-para-obras-e-servicos-de-engenharia-sco-rio/", r"EXCEL.*\.zip$", 1),
    "secidpr": lambda: pagina("SECID-PR (edificações)", "https://www.secid.pr.gov.br/Pagina/Custos-de-Edificacoes", r"\.(xlsx?|zip)$", 1),
    "compesa": lambda: pagina("COMPESA", "https://servicos.compesa.com.br/engenharia/", r"\.xlsx?$", 1),
    "sanepar": lambda: pagina("SANEPAR", "https://www.sanepar.com.br/tabelas-de-precos", r"\.zip$", 1),
    "cdhu": lambda: pagina("CDHU (composições públicas)", "https://www.cdhu.sp.gov.br/cdhu/Transpar%C3%AAncia/Licitacoes%20e%20Contratos/Tabela%20de%20Composicao%20de%20Servicos", r"\.(xlsx?|pdf)$", 1),
    "cptm": lambda: pagina("CPTM / SIEC", "https://www.cptm.sp.gov.br/cptm/transparencia/sistema-de-engenharia-de-custos-siec/custos-referenciais", r"\.(zip|xlsx?)$", 1),
    "orse": lambda: pagina("ORSE (CEHOP-SE)", "https://orse.cehop.se.gov.br/downloads.asp", r"(contardownloads|\.zip|\.xlsx?|\.mdb|\.exe)", 0),
    "fde": lambda: pagina("FDE (SP)", "https://www.fde.sp.gov.br/fde/fornecedores/pesquisa_de_precos", r"\.(xlsx?|zip|pdf)$", 0),
}

if __name__ == "__main__":
    alvo = sys.argv[1:] or list(BASES)
    for nome in alvo:
        try:
            BASES[nome]()
        except Exception as e:
            log(f"\n===== {nome}: ERRO GERAL {e}")
