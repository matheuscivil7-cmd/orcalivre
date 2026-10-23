"""Gera a narração (vozes neurais pt-BR) e as capturas de tela do OrçaLivre para o vídeo institucional.
Roda no GitHub Actions (workflow "Vídeo institucional"); a saída vai para o ramo `video`."""
import asyncio, json, os, sys, traceback
import edge_tts
from playwright.async_api import async_playwright

OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "/tmp/video"
os.makedirs(OUT, exist_ok=True)
URL = "https://matheuscivil7-cmd.github.io/orcalivre/"

CENAS = [
    ["Orçar uma obra não precisa ser lento, manual, nem complicado."],
    ["Este é o OrçaLivre.", "A plataforma de orçamento de obras que reúne bancos de preços oficiais, inteligência artificial e licitações, em um só lugar."],
    ["O SINAPI dos vinte e sete estados e outras bases públicas chegam atualizados automaticamente, todo mês.", "Você só escolhe o banco, o estado e a data-base."],
    ["Montar a planilha é simples.", "Insira etapas, composições e insumos com um clique, ou pelo teclado.", "E acompanhe o preço total, o BDI e o custo por metro quadrado, em tempo real."],
    ["Encontre qualquer composição em segundos, com foto de referência e acesso ao caderno técnico de origem."],
    ["Ficou em dúvida?", "O assistente de inteligência artificial indica a composição certa e revisa o seu orçamento com você."],
    ["Curva ABC, indicadores, cronograma físico-financeiro e BDI pela fórmula do TCU.", "Tudo pronto, sem planilhas paralelas."],
    ["Com um clique, o orçamento vira uma apresentação executiva, pronta para o cliente ou para a diretoria."],
    ["Para quem disputa licitações, há um radar de editais do Portal Nacional de Contratações Públicas.", "Com farol de prazos, jurisprudência do TCU e as ferramentas da Lei catorze mil cento e trinta e três."],
    ["OrçaLivre.", "Orçamentos mais rápidos e mais precisos.", "Comece agora."],
]
VOZES = ["pt-BR-AntonioNeural", "pt-BR-FranciscaNeural", "pt-BR-ThalitaMultilingualNeural"]


async def narracao():
    try:
        lst = await edge_tts.list_voices()
        json.dump([v for v in lst if v["Locale"].startswith("pt")], open(f"{OUT}/vozes.json", "w"), ensure_ascii=False, indent=1)
    except Exception as e:
        print("lista de vozes:", e)
    for v in VOZES:
        for i, frases in enumerate(CENAS):
          for j, t in enumerate(frases):
            for tent in range(3):
                try:
                    com = edge_tts.Communicate(t, v, rate="-6%")
                    with open(f"{OUT}/{v}_{i:02d}_{j}.mp3", "wb") as f:
                        async for ch in com.stream():
                            if ch["type"] == "audio":
                                f.write(ch["data"])
                    break
                except Exception as e:
                    print("ERRO voz", v, i, e)
                    await asyncio.sleep(3)
    json.dump(CENAS, open(f"{OUT}/roteiro.json", "w"), ensure_ascii=False, indent=1)


async def telas():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # tela de login (sem sessão)
        try:
            c0 = await b.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=2, locale="pt-BR")
            p0 = await c0.new_page()
            await p0.goto(URL, wait_until="networkidle")
            await p0.wait_for_timeout(3500)
            await p0.screenshot(path=f"{OUT}/t_login.jpg", type="jpeg", quality=92)
            await c0.close()
        except Exception:
            traceback.print_exc()
        ctx = await b.new_context(viewport={"width": 1600, "height": 900}, device_scale_factor=2, locale="pt-BR")
        await ctx.add_init_script("try{sessionStorage.setItem('orcalivre.semconta','1')}catch(e){}")
        pg = await ctx.new_page()
        pg.on("pageerror", lambda e: print("pageerror:", e))
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_timeout(4000)

        async def js(code, espera=1500):
            try:
                await pg.evaluate(code)
            except Exception as e:
                print("js:", code[:60], e)
            await pg.wait_for_timeout(espera)

        async def foto(nome):
            try:
                await pg.screenshot(path=f"{OUT}/t_{nome}.jpg", type="jpeg", quality=92)
                print("ok", nome)
            except Exception as e:
                print("foto", nome, e)

        await js("go('orcs')", 3000); await foto("orcs")
        await js("openBudget('exemplo')", 6000); await js("go('plan')", 2500); await foto("plan")
        await js("document.querySelector('#ofScroll') && document.querySelector('#ofScroll').scrollTo(0,0); ACT.ofNew({k:'C'})", 800)
        try:
            await pg.fill("#ofAddQ", "alvenaria bloco ceramico 14")
            await pg.wait_for_timeout(2500)
            await foto("add")
        except Exception as e:
            print("add", e)
        await js("S.add=null; render()", 800)
        await js("go('pesqC')", 1500)
        try:
            await pg.fill("#ofPq", "alvenaria de vedação bloco cerâmico")
            await pg.wait_for_timeout(3500)
            await foto("pesq")
        except Exception as e:
            print("pesq", e)
        await js("go('plan')", 1500)
        await js("(()=>{ const it=S.cur.items.find(x=>x.k==='V'&&x.t==='C'&&/ALVENARIA/.test(x.d))||S.cur.items.find(x=>x.k==='V'&&x.t==='C'); ACT.comp({b:it.b,t:it.t,c:it.c}); })()", 9000)
        await foto("comp")
        await js("closeModal()", 800)
        await js("ACT.nxChip({q:'Qual composição usar para alvenaria de vedação com bloco cerâmico de 14 cm?'})", 12000)
        await foto("ia")
        await js("ACT.nxAI()", 800)
        for v in ["abc", "ind", "crono", "bdi", "rel"]:
            await js(f"go('{v}')", 2500); await foto(v)
        await js("ACT.uxShow()", 2000)
        for i in [0, 1, 2, 4, 7]:
            await js(f"ACT.dkTo({{i:{i}}})", 1200); await foto(f"deck{i}")
        await js("ACT.dkClose()", 800)
        await js("go('licRadar')", 12000); await foto("radar")
        await js("ACT.licDet({pid:S.lr.res[0].pid})", 8000); await foto("edital")
        await js("closeModal()", 800)
        await js("go('licJuris'); setTimeout(()=>ACT.ljTema({q:'BDI'}),600)", 10000); await foto("juris")
        await js("go('licFerr')", 2500); await foto("ferr")
        await b.close()


async def main():
    await narracao()
    if "--telas" in sys.argv:
        await telas()

asyncio.run(main())
