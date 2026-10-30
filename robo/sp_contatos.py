"""Canais comerciais públicos dos escritórios de arquitetura (site, telefone, WhatsApp e e-mail divulgados pelo próprio escritório).
Só lê o site oficial do escritório. Não coleta celular pessoal nem dados de redes sociais de pessoas."""
import json, os, re, time
from datetime import timedelta
import obras_extra as X

VERSAO = 2
SITES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sp_sites.json"))) if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sp_sites.json")) else {}
FALSO = re.compile(r"mysite|example|exemplo|seudominio|seuemail|dominio\.com|email\.com|domain\.com|sentry|wixpress|godaddy", re.I)
TEL = re.compile(r"(?:\+?55[\s.\-]?)?\(?\b([1-9]\d)\)?[\s.\-]?(9?\d{4})[\s.\-]?(\d{4})\b")
WA = re.compile(r"(?:wa\.me/|api\.whatsapp\.com/send\?phone=|whatsapp\.com/send/?\?phone=)\+?(\d{10,13})", re.I)
MAIL = re.compile(r"[\w.\-+]+@[\w\-]+(?:\.[\w\-]+)+")
MAIL_OK = re.compile(r"^(contato|contact|comercial|atendimento|info|ola|oi|hello|hi|studio|estudio|escritorio|office|arquitetura|arq|projetos?|orcamentos?|novosprojetos|faleconosco|sac|secretaria|recepcao|administrativo|adm)[\w.\-]*@", re.I)
SOCIAL = re.compile(r"https?://(?:www\.)?instagram\.com/([A-Za-z0-9_.]{2,30})/?", re.I)

def _fmt(ddd, a, b):
    n = ddd + a + b
    if len(n) not in (10, 11) or n[2:].startswith("0") or len(set(n[2:])) < 3: return None
    return f"({ddd}) {a}-{b}"

def _pagina(url):
    try: h, final = X.get(url, 1_500_000, timeout=20)
    except Exception: return "", url
    return h, final

def _dados(h, dom):
    tels, was, mails, insta = [], [], [], None
    for m in re.finditer(r'href="tel:([^"]+)"', h, re.I):
        d = re.sub(r"\D", "", m.group(1))
        if d.startswith("55") and len(d) > 11: d = d[2:]
        if len(d) in (10, 11): t = _fmt(d[:2], d[2:-4], d[-4:]); t and t not in tels and tels.append(t)
    for m in WA.finditer(h):
        d = m.group(1)
        if d.startswith("55"): d = d[2:]
        if len(d) in (10, 11): t = _fmt(d[:2], d[2:-4], d[-4:]); t and t not in was and was.append(t)
    texto = re.sub(r"<script.*?</script>|<style.*?</style>", " ", h, flags=re.S | re.I)
    texto = re.sub(r"<[^>]+>", " ", texto)
    for m in TEL.finditer(texto):
        # só números com DDD entre parênteses, prefixo +55 ou separadores típicos de telefone
        s = m.group(0)
        if not re.search(r"\(|\+55|\d{4,5}[\-.\s]\d{4}", s): continue
        t = _fmt(m.group(1), m.group(2), m.group(3))
        if t and t not in tels and t not in was: tels.append(t)
    base = (dom or "").split(".")[0]
    for e in set(x.lower() for x in MAIL.findall(h)):
        if e.endswith((".png", ".jpg", ".svg", ".webp", ".gif")) or FALSO.search(e): continue
        dm = e.split("@")[1]
        if base and base not in dm and not dm.startswith(("gmail.", "hotmail.", "outlook.", "uol.", "terra.")): continue
        if MAIL_OK.match(e) or (base and base in dm and len(e.split("@")[0]) <= 12 and not re.search(r"[a-z]+\.[a-z]+@", e)):
            if e not in mails: mails.append(e)
    m = SOCIAL.search(h)
    if m and m.group(1).lower() not in ("p", "explore", "accounts", "reel", "stories"): insta = "https://www.instagram.com/" + m.group(1) + "/"
    return tels, was, mails, insta

def contato(nome, buscar=True):
    if nome in SITES:
        return _le_site(nome, SITES[nome])
    if not buscar: return None
    tok = [w.lower() for w in X.chave_empresa(nome).split() if len(w) > 3] or [w.lower() for w in X.chave_empresa(nome).split() if len(w) > 1]
    site = ""
    for u, t in X.busca_web(f'"{nome}" arquitetura São Paulo'):
        d = X.dominio(u)
        if not d or X.RUIM.search(d) or "archdaily" in d or "casavogue" in d or "gshow" in d: continue
        if any(x in d.replace("-", "") for x in tok): site = "https://" + d; break
    time.sleep(15)
    return _le_site(nome, site)

def _le_site(nome, site):
    out = {"verificado": X.HOJE.isoformat(), "v": VERSAO}
    if not site: return out
    out["site"] = site
    tels, was, mails, insta = [], [], [], None
    for p in ("", "/contato", "/contact", "/fale-conosco"):
        h, final = _pagina(site + p)
        if not h: continue
        a, b, c, i = _dados(h, X.dominio(final))
        tels += [x for x in a if x not in tels]; was += [x for x in b if x not in was]; mails += [x for x in c if x not in mails]; insta = insta or i
        if (tels or was) and mails: break
    if tels: out["telefones"] = tels[:3]
    if was: out["whatsapp"] = was[:2]
    if mails: out["emails"] = mails[:3]
    if insta: out["instagram"] = insta
    return out

def escritorios(nomes, arq, minutos=12):
    """nomes: lista em ordem de prioridade. Cache por nome; achados revistos a cada 60 dias, vazios a cada 15."""
    cache = json.load(open(arq)) if os.path.exists(arq) else {}
    achou = lambda c: c.get("telefones") or c.get("whatsapp") or c.get("emails")
    lim_ok, lim_vazio = (X.HOJE - timedelta(days=60)).isoformat(), (X.HOJE - timedelta(days=15)).isoformat()
    vencido = lambda c: not c or c.get("v") != VERSAO or c.get("verificado", "") < (lim_ok if achou(c) else lim_vazio)
    fila = [n for n in dict.fromkeys(nomes) if n and vencido(cache.get(n))]
    print(f"contatos de escritórios: {len(fila)} para pesquisar ({len(cache)} no cache)")
    fim, ok, pausas, buscas = time.time() + minutos * 60, 0, 0, 0
    # primeiro os escritórios com site conhecido (sem buscador), depois até 15 buscas por dia
    fila.sort(key=lambda n: n not in SITES)
    for n in fila:
        if time.time() > fim: print("  contatos: tempo esgotado, continua amanhã"); break
        if n not in SITES and (pausas or buscas >= 15): continue
        try:
            if n not in SITES: buscas += 1
            c = contato(n)
            if c is not None: cache[n] = c; ok += bool(achou(c))
        except X.Bloqueado:
            pausas += 1; print("  busca bloqueada; as buscas continuam amanhã")
        except Exception as e: print("contato", n, str(e)[:100])
    print(f"contatos de escritórios: {ok} com telefone ou e-mail nesta rodada")
    json.dump(cache, open(arq, "w"), ensure_ascii=False, separators=(",", ":"))
    NAO = re.compile(r"^(rh|cv|curriculos?|academicos?|job|jobs|press|imprensa|selecao|vagas|trabalheconosco|estagio)@", re.I)
    def limpa(c):
        c = {k: v for k, v in c.items() if k not in ("verificado", "v") and v}
        if c.get("emails"): c["emails"] = [e for e in c["emails"] if not NAO.match(e)] or None
        for k in ("telefones", "whatsapp"):
            if c.get(k): c[k] = [x for x in c[k] if not x.startswith("(55)")] or None
        return {k: v for k, v in c.items() if v}
    return {n: limpa(c) for n, c in cache.items() if c.get("site")}
