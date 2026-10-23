"""Baixa amostras reais das bases públicas para a pasta indicada (diagnóstico)."""
import os, sys, re, urllib.request, urllib.parse

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
SICRO = "https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-referenciais/sistemas-de-custos/sicro/relatorios/relatorios-sicro"
URLS = {
    "sicro_sp.7z": SICRO + "/sudeste/sao-paulo/2026/julho/sp-07-2026.7z",
    "derpr_sem.zip": "https://www.der.pr.gov.br/sites/der/arquivos_restritos/files/documento/2026-10/Referencial_de_Custos_Agosto_2026_Sem_Desoneracao.zip",
    "goinfra_rod_S.xls": "http://cdn.goinfra.go.gov.br/site/arquivos/arquivos/Obras Rodoviarias/T341_S/COMPOSIÇÕES_T341.xls",
    "goinfra_civ_S.xls": "http://cdn.goinfra.go.gov.br/site/arquivos/arquivos/Obras Civis/T343_S/Relatório de Composição do Serviço.xls",
    "sudecap_ins_des.xls": "https://prefeitura.pbh.gov.br/sites/default/files/estrutura-de-governo/sudecap/2026/2026.07-tabela-de-insumos-desonerada.xls",
    "sudecap_cons_des.xls": "https://prefeitura.pbh.gov.br/sites/default/files/estrutura-de-governo/sudecap/2026/2026.07-tabela-de-construcao-desonerada.xls",
    "deres_2026_05.zip": "https://der.es.gov.br/media/Documentos/Tabela Referencial de Preço/Referencial de Edificações/OBRAS_2026/TABELA REFERENCIAL OBRAS - DER-ES - 2026-05 - MAI.zip",
    "siurb_ins_one.xlsx": "https://prefeitura.sp.gov.br/documents/d/obras/onerada-sem-des-insumos-julho-2026-1-xlsx",
    "siurb_edif_one.xls": "https://prefeitura.sp.gov.br/documents/d/obras/onerada-sem-des-custos-unit-edif-julho-2026-2-xls",
    "siurb_compedif_one.xls": "https://prefeitura.sp.gov.br/documents/d/obras/onerada-sem-des-comp-custos-unit-edif-julho-2026-2-xls",
    "secid_des.xlsx": "https://www.secid.pr.gov.br/sites/default/arquivos_restritos/files/documento/2026-08/composicoes_de_custos_insumos_e_servicos_de_edificacoes_desonerado.xlsx",
    "compesa_com.xlsx": "https://servicos.compesa.com.br/wp-content/uploads/2026/09/T.C.-2026_DB-07.2026_SINTETICA-COM-DESONERACAO_REV01.xlsx",
    "sanepar_mos.zip": "https://www.sanepar.com.br/sites/default/files/media/simple-files/MOS 5ed v02 - dez25.zip",
    "cdhu_sint.xls": "https://stor.cdhu.sp.gov.br/sites-portais/publico/DOCUMENTOS/transparencia/licitacoes/tabelas-composicao/tabela-de-composicao-sintetica-de-servicos-padrao/Composição sintética de serviços-Padrão-08-26-Bdi 20,81%.xls",
}


def baixar(url):
    p = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit((p.scheme, p.netloc, urllib.parse.quote(p.path, safe="/%"), p.query, ""))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


if __name__ == "__main__":
    pasta = sys.argv[1] if len(sys.argv) > 1 else "amostras"
    os.makedirs(pasta, exist_ok=True)
    for nome, url in URLS.items():
        try:
            d = baixar(url)
            open(os.path.join(pasta, nome), "wb").write(d)
            print(f"ok {nome} {len(d)/1024:.0f} KB", flush=True)
        except Exception as e:
            print(f"ERRO {nome}: {e}", flush=True)
