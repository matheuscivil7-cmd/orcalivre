/* OrçaLivre · Obras privadas: radar de obras privadas de grande porte (notícias de investimento estruturadas por IA,
   financiamentos do BNDES e usinas em construção da ANEEL), ficha da obra no formato de relatório, empresa pelo CNPJ,
   funil de oportunidades com contatos e follow-ups, e buscas salvas com aviso de novidades. Carregado por último. */
(function(){
"use strict";
if(!window.OF) return;
const {ic,LIVRES}=OF;
const SV=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IO={
  pred:'<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6M9 10h.01M15 10h.01"/>', star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  ext:'<path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>', bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  pdf:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h3"/>', spark:'<path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8z"/>',
  map:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', csv:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', plus:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M18 6L6 18M6 6l12 12"/>', cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  chk:'<path d="M20 6L9 17l-5-5"/>', cart:'<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6"/>', team:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3"/>', mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'};
const io=(k,s=15)=>SV(IO[k]).replace('<svg',`<svg style="width:${s}px;height:${s}px;vertical-align:-3px;flex:0 0 ${s}px"`);
const N=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
const UFS='AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ');
const SEGS=['INDUSTRIAL','LOGÍSTICA','COMERCIAL','CORPORATIVO','RESIDENCIAL','HOTELARIA E TURISMO','SAÚDE','EDUCAÇÃO','ENERGIA','SANEAMENTO E INFRAESTRUTURA','AGRONEGÓCIO','DATA CENTER','MINERAÇÃO','OUTROS'];
const ESTS=['ANÚNCIO','PROJETO','LICENCIAMENTO','FINANCIAMENTO','EM OBRAS','INAUGURADA'];
const ORIG={noticia:['Notícia','#7c5cf6'],bndes:['BNDES','#0f9d74'],aneel:['ANEEL','#4f7cff'],diario:['Diário Oficial','#c27a06']};
const confNv=c=>c>=65?['alta','#0f9d74']:c>=35?['média','#c27a06']:['baixa','#b42318'];
const ESTC={'ANÚNCIO':'#8b5cf6','PROJETO':'#4f7cff','LICENCIAMENTO':'#c27a06','FINANCIAMENTO':'#0f9d74','EM OBRAS':'#e0464e','INAUGURADA':'#6b7385'};
const mi=v=>{ v=+v||0; return v>=1e9?nf2.format(v/1e9).replace(/,00$/,'')+' bi':v>=1e6?nf0.format(v/1e6)+' mi':R(v); };
const brl=v=>v==null||!isFinite(v)||!v?'—':'R$ '+R(v);
const brlc=v=>!v?'—':'R$ '+mi(v);
const fd=s=>{ if(!s) return '—'; const d=new Date(String(s).slice(0,10)+'T12:00'); return isNaN(d)?String(s):d.toLocaleDateString('pt-BR'); };
const dias=s=>{ const d=new Date(String(s||'').slice(0,10)+'T12:00'); return isNaN(d)?1e9:(Date.now()-d)/864e5; };
const cnpjF=c=>{ c=String(c||'').replace(/\D/g,''); return c.length===14?c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):c; };
const lg=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } };
const ls=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

/* ================================================================ estilos */
const css=`
.opkp{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:2px 0 14px}
.opkp>div{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 16px;box-shadow:var(--nx-sh)}
.opkp>div:first-child{background:var(--nx-side);border-color:var(--nx-side);color:#fff}
.opkp .l{font:700 10px var(--f-body);letter-spacing:.09em;text-transform:uppercase;color:#8a91a6}
.opkp .v{font:800 22px var(--f-body);letter-spacing:-.02em;margin-top:3px}
.opkp>div:first-child .v{background:linear-gradient(90deg,#c4b5fd,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent}
.opkp .s{font-size:11.5px;color:var(--muted);margin-top:1px}
.oppan{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;margin:12px 0}
.oppan>div{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px 16px;box-shadow:var(--nx-sh)}
.oppan h3{margin:0 0 8px;font:800 12px var(--f-body);letter-spacing:.07em;text-transform:uppercase;color:#4a5268}
.ophb{display:grid;grid-template-columns:150px minmax(0,1fr) 64px;gap:6px 10px;align-items:center;font-size:12px}
.ophb button{all:unset;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#2b3245;font-weight:600}
.ophb button:hover{color:var(--accent)}
.ophb .tr{height:8px;border-radius:6px;background:#eef0f6;overflow:hidden}.ophb .tr i{display:block;height:100%;border-radius:6px;background:var(--nx-grad)}
.ophb .n{text-align:right;font:600 11.5px var(--f-mono);color:#4a5268}
.opc{position:relative;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px 16px 14px 20px;box-shadow:var(--nx-sh);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 18px;transition:border-color .15s,transform .15s;overflow:hidden}
.opc::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:var(--ec,#8b5cf6)}
.opc:hover{border-color:#cfc9ff;transform:translateY(-1px)}
.opc .t1{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11.5px;color:var(--muted)}
.opc .est{font:800 10.5px var(--f-body);letter-spacing:.04em;padding:3px 9px;border-radius:999px;color:#fff;background:var(--ec,#8b5cf6)}
.opc .org{font:700 10.5px var(--f-body);padding:2px 8px;border-radius:6px;border:1px solid currentColor}
.opc .nv{font:800 10px var(--f-body);padding:2px 7px;border-radius:6px;background:#14c8b0;color:#fff;letter-spacing:.05em}
.opc h4{margin:4px 0 2px;font:800 15px/1.35 var(--f-body);color:var(--ink);cursor:pointer}
.opc h4:hover{color:var(--accent)}
.opc .dt{font-size:13px;line-height:1.5;color:#3a4257;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.opc .mt{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:4px}
.opc .mt b{color:var(--ink)}
.opc .val{font:800 18px var(--f-body);color:var(--ink);text-align:right;white-space:nowrap}
.opc .acts{display:flex;flex-direction:column;gap:6px;align-items:flex-end;justify-content:center}
.opc .acts .btn{white-space:nowrap;display:inline-flex;gap:6px;align-items:center}
.opc .acts .btn.on{background:#fff6e5;border-color:#f6e2b5;color:#9a6100}
.opsv{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 0}
.opsv span{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#fff;border-radius:999px;padding:4px 6px 4px 12px;font:600 12px var(--f-body);color:#3a4257}
.opsv span button{all:unset;cursor:pointer}
.opsv span .go{font-weight:700;color:var(--accent)}
.opsv span .q{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:9px;background:#14c8b0;color:#fff;font:800 10.5px var(--f-body);padding:0 5px}
.opsv span .x{width:18px;height:18px;border-radius:50%;display:grid;place-items:center;color:#8a91a6}.opsv span .x:hover{background:#f1f2f7;color:#e0464e}
.opnote{font-size:11.5px;color:#8a91a6;margin:12px 2px 0;line-height:1.5}
/* ficha */
.opf .hdr{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--muted);padding-bottom:8px;border-bottom:2px solid #efedff}
.opf .hdr b{color:var(--ink)}
.opf h5{margin:14px 0 8px;font:800 12px var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:#4b3fd6;display:flex;align-items:center;gap:8px}
.opf h5::after{content:"";flex:1;height:1px;background:#e4e0ff}
.opf .kv{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.opf .kv div{background:#f6f7fb;border-radius:12px;padding:9px 12px;font-size:11px;color:var(--muted)}
.opf .kv b{display:block;color:var(--ink);font-size:13.5px;margin-top:2px;word-break:break-word}
.opf .kv .w2{grid-column:span 2}.opf .kv .w3{grid-column:1/-1}
.opf p.det{font-size:13.5px;line-height:1.6;color:#2b3245;margin:0}
.opf .src a{display:flex;gap:10px;align-items:flex-start;padding:9px 12px;border:1px solid var(--line);border-radius:12px;text-decoration:none;color:var(--ink);font-size:13px;margin-bottom:6px;line-height:1.4}
.opf .src a:hover{border-color:#bdb5ff;background:#faf9ff}
.opf .src small{display:block;color:var(--muted);font-size:11.5px}
.opf .emp{border:1px solid var(--line);border-radius:14px;padding:12px 14px;font-size:13px;line-height:1.6}
.opf .emp b{color:var(--ink)}
.opf .qsa{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.opf .qsa span{background:#f3f1ff;border-radius:8px;padding:3px 9px;font-size:12px;color:#3a2fb0}
.opf .cnpjin{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.opf .cnpjin input{width:220px}
/* oportunidades */
.opk{display:grid;grid-template-columns:repeat(7,minmax(210px,1fr));gap:12px;overflow-x:auto;padding-bottom:8px}
.opk .kcol{min-height:220px}
.opk .kcard .v{font:800 13px var(--f-body);color:var(--ink);margin-top:4px}
.opk .fu{display:inline-flex;align-items:center;gap:5px;font:700 11px var(--f-body);padding:2px 8px;border-radius:999px;background:#eef0f6;color:#4a5268;margin-top:6px}
.opk .fu.late{background:#fdecec;color:#b42318}.opk .fu.hoje{background:#fff6e5;color:#9a6100}
.opct{display:flex;flex-direction:column;gap:8px}
.opct .c{display:grid;grid-template-columns:1.2fr 1fr 1fr 1.3fr auto;gap:6px;align-items:center}
.opct .c input{width:100%}
@media (max-width:1100px){.opkp{grid-template-columns:repeat(2,minmax(0,1fr))}.oppan{grid-template-columns:1fr}}
@media (max-width:860px){.opc{grid-template-columns:1fr}.opc .acts{flex-direction:row;flex-wrap:wrap;justify-content:flex-start}.opc .val{text-align:left}.opf .kv{grid-template-columns:1fr 1fr}.opct .c{grid-template-columns:1fr 1fr}.ophb{grid-template-columns:110px minmax(0,1fr) 54px}}
.opc .cf{display:inline-flex;align-items:center;gap:3px;font:800 10.5px var(--f-body);padding:2px 7px;border-radius:6px;color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,transparent)}
.opconf{display:flex;gap:14px;align-items:center;border:1px solid var(--line,#e3e5ee);border-radius:12px;padding:10px 14px}
.opconf .n{font:800 26px var(--f-body);color:var(--cc)}.opconf .n small{font-size:12px;color:var(--muted);font-weight:600}
.opconf .bar{height:8px;border-radius:9px;background:color-mix(in srgb,var(--cc) 14%,transparent);overflow:hidden}.opconf .bar i{display:block;height:100%;background:var(--cc);border-radius:9px}
.opconf .mot{font-size:12.5px;color:#3a4257;margin-top:6px}.opconf .mot b{color:var(--cc)}
.oppp{display:grid;gap:6px}.oppp>div{display:flex;gap:10px;align-items:center;flex-wrap:wrap;border:1px solid var(--line,#e3e5ee);border-radius:10px;padding:7px 10px}
.oppp span{font:700 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);min-width:110px}.oppp b{flex:1;min-width:140px;font-size:13px}.oppp b small{font-weight:500;color:var(--muted)}
.opdec{display:grid;gap:10px;border:1px solid var(--line,#e3e5ee);border-radius:12px;padding:12px 14px;background:color-mix(in srgb,var(--accent,#5b5bd6) 3%,transparent)}
.opdec .row{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}.opdec .lb{font:700 11px var(--f-body);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);width:170px;padding-top:6px}
.opdec .bt{display:flex;gap:6px;flex-wrap:wrap;flex:1;min-width:0}.opdec .bt .btn{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qsa .lkin{display:inline-grid;place-items:center;width:17px;height:17px;border-radius:4px;background:#0a66c2;color:#fff!important;font:800 10px Arial;text-decoration:none;margin-left:4px;vertical-align:1px}
.eqct{display:grid;gap:6px}.eqct>div{position:relative;border:1px solid var(--line,#e3e5ee);border-radius:10px;padding:7px 34px 7px 10px;font-size:13px}.eqct small{display:block;color:var(--muted);font-size:11.5px}.eqct .btn{position:absolute;right:4px;top:4px}
.eqform{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:8px}.eqform .w2{grid-column:1/-1}.eqform input{min-width:0;padding:7px 9px;border:1px solid var(--line,#d9dce6);border-radius:8px;font:inherit;font-size:13px}
.eqp{display:flex;gap:12px;align-items:center;flex-wrap:wrap;border:1px solid var(--line,#e3e5ee);border-radius:14px;padding:12px 16px;margin-bottom:14px;background:var(--card,#fff)}
.eqp .ic{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--accent,#5b5bd6) 12%,transparent);color:var(--accent,#5b5bd6)}
.eqp code{font:800 13px ui-monospace,monospace;background:#f1f2f7;padding:2px 7px;border-radius:6px;letter-spacing:.08em}.eqp select{font:inherit;padding:3px 6px;border-radius:7px;border:1px solid var(--line,#d9dce6)}
.eqa{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.eqa input{padding:6px 9px;border:1px solid var(--line,#d9dce6);border-radius:8px;font:inherit;font-size:13px;width:170px}
@media(max-width:700px){.eqform{grid-template-columns:1fr 1fr}.opdec .lb{width:100%;padding:0}}

.sparq{display:grid;gap:6px}.sparq button{display:flex;justify-content:space-between;gap:10px;align-items:center;text-align:left;border:1px solid var(--line,#e3e5ee);background:var(--card,#fff);border-radius:10px;padding:7px 10px;cursor:pointer;font:inherit;font-size:13px}
.sparq button:hover{border-color:var(--accent,#5b5bd6)}.sparq span{color:var(--muted);font-size:11.5px;white-space:nowrap}
.sparq .tg{font-size:10.5px;font-weight:700;color:#0f9d74;background:#e7f7f1;border-radius:6px;padding:1px 6px}
.spbox .todos{margin-top:8px;width:100%;justify-content:center}
.aqtop{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.aqtop input{flex:1 1 220px}
.aqlist{display:grid;gap:6px;max-height:58vh;overflow:auto;padding-right:4px}
.aqr{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line,#e3e5ee);border-radius:10px;padding:8px 10px}
.aqr b{display:block;font-size:13.5px}.aqr small{color:var(--muted);font-size:11.5px}.aqr .n{font-size:12px;color:var(--muted)}.aqr .n b{display:inline;font-size:13px;color:var(--ink)}.aqr .n .f{color:#0f9d74}
.aqr .bt{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}
@media(max-width:720px){.aqr{grid-template-columns:1fr}.aqr .bt{justify-content:flex-start}}

.sptabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:4px 0 12px}
.sptabs button{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:11px 14px;border-radius:12px;border:1px solid var(--line,#e3e5ee);background:var(--card,#fff);cursor:pointer;font:inherit;text-align:left;color:var(--ink)}
.sptabs button b{font-size:13.5px}.sptabs button span{font:800 13px var(--f-body);color:var(--muted);background:#f1f2f7;border-radius:999px;padding:2px 9px}
.sptabs button.on{border-color:transparent;background:linear-gradient(135deg,#6d5df6,#14b8a6);color:#fff;box-shadow:0 6px 18px -8px rgba(80,70,220,.6)}.sptabs button.on span{background:rgba(255,255,255,.22);color:#fff}
.spbar{display:flex;gap:8px;flex-wrap:wrap;align-items:stretch;background:var(--card,#fff);border:1px solid var(--line,#e3e5ee);border-radius:14px;padding:8px}
.sps{flex:1 1 280px;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:10px;background:#f6f7fb;color:var(--muted)}.sps input{flex:1;border:0;background:transparent;font:inherit;font-size:14px;padding:10px 0;outline:none;color:var(--ink)}
.sps .x{border:0;background:none;cursor:pointer;color:var(--muted);display:grid;place-items:center}
.spf{display:flex;flex-direction:column;justify-content:center;gap:1px;padding:4px 10px;border-radius:10px;background:#f6f7fb;border:1px solid transparent;min-width:120px}
.spf span{font:700 10px var(--f-body);text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}.spf select{border:0;background:transparent;font:inherit;font-size:13px;font-weight:600;color:var(--ink);padding:0;outline:none;cursor:pointer;max-width:200px}
.spf.on{background:color-mix(in srgb,var(--accent,#5b5bd6) 10%,#fff);border-color:color-mix(in srgb,var(--accent,#5b5bd6) 35%,transparent)}
.spfont{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:10px 2px 0}.spfont .lb{font:700 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-right:4px}
.spfont button,.spchips button{border:1px solid var(--line,#e3e5ee);background:var(--card,#fff);border-radius:999px;padding:5px 11px;font:inherit;font-size:12.5px;cursor:pointer;color:var(--ink)}
.spfont button span,.spchips button span{color:var(--muted);font-size:11.5px;margin-left:2px}.spfont button.on,.spchips button.on{background:var(--ink,#1d2433);border-color:var(--ink,#1d2433);color:#fff}.spfont button.on span,.spchips button.on span{color:#cfd3e0}
.sp-res{margin-left:auto;font-size:13px;color:var(--muted)}.sp-res b{color:var(--ink);font-size:15px}
.spat{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 2px 0}.spat button{display:inline-flex;align-items:center;gap:5px;border:0;border-radius:999px;padding:5px 10px;font:inherit;font-size:12.5px;cursor:pointer;background:color-mix(in srgb,var(--accent,#5b5bd6) 12%,#fff);color:var(--accent,#4b3fd6)}
.spat .lim{background:none;color:var(--muted);text-decoration:underline}
.spgrid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;margin-top:12px;align-items:start}
.splist{display:grid;gap:8px}
.spc{display:grid;grid-template-columns:118px minmax(0,1fr) auto;gap:14px;align-items:start;background:var(--card,#fff);border:1px solid var(--line,#e3e5ee);border-left:4px solid var(--ec);border-radius:12px;padding:12px 14px;cursor:pointer;transition:box-shadow .15s,transform .15s}
.spc:hover{box-shadow:0 8px 24px -14px rgba(20,30,60,.35);border-color:color-mix(in srgb,var(--ec) 40%,#e3e5ee)}
.spc .c1{display:flex;flex-direction:column;gap:6px}.spc .est{font:800 10px var(--f-body);letter-spacing:.04em;padding:4px 8px;border-radius:7px;color:#fff;background:var(--ec);text-align:center;line-height:1.25}.spc .dt2{font-size:11.5px;color:var(--muted);text-align:center}
.spc .tg{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:11px}.spc .org{font:700 10.5px var(--f-body);padding:1px 7px;border-radius:6px;border:1px solid currentColor}
.spc .nv{font:800 10px var(--f-body);padding:2px 7px;border-radius:6px;background:#14c8b0;color:#fff}.spc .cf{display:inline-flex;align-items:center;font:800 10.5px var(--f-body);padding:2px 7px;border-radius:6px;color:var(--cc);background:color-mix(in srgb,var(--cc) 12%,transparent)}.spc .u{color:var(--muted);text-transform:capitalize}
.spc h4{margin:5px 0 2px;font:800 14.5px/1.35 var(--f-body);color:var(--ink)}.spc .dt{font-size:12.8px;line-height:1.45;color:#3a4257;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.spc .mt{display:flex;gap:6px 14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:6px}.spc .mt span{display:inline-flex;align-items:center;gap:4px}
.spc .c3{display:flex;flex-direction:column;gap:6px;align-items:flex-end}.spc .val{font:800 15px var(--f-body);color:var(--ink);white-space:nowrap}
.spside{display:grid;gap:12px;position:sticky;top:70px}.spbox{background:var(--card,#fff);border:1px solid var(--line,#e3e5ee);border-radius:14px;padding:12px 14px}
.spbox h3{margin:0 0 8px;font:800 11px var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.spchips{display:flex;flex-wrap:wrap;gap:6px}.spchips button{text-transform:capitalize}
.spinfo summary{cursor:pointer;font-weight:700;font-size:13px}.spinfo p{font-size:12.5px;color:#3a4257;line-height:1.5;margin:8px 0 0}
@media(max-width:1100px){.spgrid{grid-template-columns:1fr}.spside{position:static;grid-template-columns:1fr 1fr}.spinfo{grid-column:1/-1}}
@media(max-width:720px){.sptabs{grid-template-columns:1fr 1fr}.spc{grid-template-columns:1fr}.spc .c1{flex-direction:row;align-items:center}.spc .c3{flex-direction:row;align-items:center;justify-content:flex-start}.spside{grid-template-columns:1fr}}

.sppanel{background:var(--card,#fff);border:1px solid var(--line,#e3e5ee);border-radius:14px;padding:12px;margin-top:4px}
.sptop{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.sptop .sps{flex:1 1 320px}.spres{font-size:13px;color:var(--muted);white-space:nowrap}.spres b{font-size:18px;color:var(--ink)}
.sptop .btn[disabled]{opacity:.45;cursor:default}
.spgrid2{display:grid;grid-template-columns:repeat(auto-fill,minmax(178px,1fr));gap:10px;margin-top:12px}
.spgrid2 .spf{display:flex;flex-direction:column;gap:4px;padding:0;background:none;border:0;min-width:0}
.spgrid2 .spf .h{display:flex;justify-content:space-between;align-items:center;min-height:18px}
.spgrid2 .spf label{font:700 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.spgrid2 .spf .h button{border:0;background:none;color:var(--accent,#4b3fd6);font:600 11.5px var(--f-body);cursor:pointer;display:inline-flex;align-items:center;gap:3px;padding:0}
.spgrid2 .spf .h span{width:15px;height:15px;border-radius:50%;background:#eef0f6;color:var(--muted);font:700 10px var(--f-body);display:grid;place-items:center;cursor:help}
.spgrid2 .spf select{width:100%;max-width:none;appearance:none;-webkit-appearance:none;border:1px solid var(--line,#d9dce6);border-radius:10px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7385' stroke-width='2.4'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;padding:9px 30px 9px 11px;font:inherit;font-size:13.5px;font-weight:600;color:var(--ink);cursor:pointer;text-overflow:ellipsis}
.spgrid2 .spf select:hover{border-color:#b9bfd3}.spgrid2 .spf select:focus{outline:none;border-color:var(--accent,#5b5bd6);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent,#5b5bd6) 18%,transparent)}
.spgrid2 .spf.on select{border-color:var(--accent,#5b5bd6);background-color:color-mix(in srgb,var(--accent,#5b5bd6) 7%,#fff);color:var(--accent,#3f34c9)}
`;
const st=document.createElement('style'); st.id='opcss'; st.textContent=css; document.head.appendChild(st);

/* ================================================================ menu */
(function menu(){ const i=NAV.findIndex(x=>x[0]==='g'&&x[1]==='Orçamento aberto');
  const add=[['g','Obras privadas'],['opRadar','Radar de obras privadas','search'],['opSP','Alto padrão SP','star'],['opMinhas','Minhas oportunidades','list']];
  NAV.splice(i<0?NAV.length:i,0,...add); for(const a of add) if(a[0]!=='g') LIVRES.push(a[0]); })();
const TT={opRadar:'Radar de obras privadas',opSP:'Alto padrão SP',opMinhas:'Minhas oportunidades'};
const head=(t,s,a='')=>`<div class="head"><div class="ofh"><span class="ic">${SV(IO.pred)}</span><div><h1>${t}</h1>${s?`<div class="sub">${s}</div>`:''}</div></div>${a?`<div class="actions">${a}</div>`:''}</div>`;

/* ================================================================ dados */
const DB={st:'', obras:[], meta:null, err:''};
async function carregar(force){ if(DB.st==='ok'&&!force) return; if(DB.st==='load') return; DB.st='load';
  try{ const j=await fetch('dados/obras/obras.json?v='+Math.floor(Date.now()/36e5),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
    DB.obras=(j.obras||[]).map(o=>({...o,_t:N([o.obra,o.empresa,o.cidade,o.uf,o.segmento,o.subtipo,o.detalhes,o.tipo].join(' '))})); DB.meta={gerado:j.gerado,fontes:j.fontes,total:j.total}; DB.st='ok'; DB.err=''; }
  catch(e){ DB.st='err'; DB.err='O radar ainda está sendo preparado. A primeira coleta roda uma vez por dia; tente novamente em alguns minutos.'; }
  if(['opRadar','opMinhas'].includes(S.view)) render(); }
const achar=id=>DB.obras.find(o=>o.id===id)||(typeof SPD!=='undefined'?SPD.itens.find(o=>o.id===id):null)||minhas().find(m=>m.oid===id);

/* ================================================================ radar */
S.op=S.op||{q:'',uf:'',seg:'',est:'',org:'',vmin:'',conf:'',per:'180',ord:'rec',n:30};
function filtra(F){ const terms=N(F.q).split(/\s+/).filter(w=>w.length>1); const vmin=+F.vmin||0; const per=+F.per||0;
  let L=DB.obras.filter(o=>(!F.uf||o.uf===F.uf)&&(!F.seg||o.segmento===F.seg)&&(!F.est||o.estagio===F.est)&&(!F.org||o.origem===F.org)&&(!vmin||(o.valor||0)>=vmin)&&(!+F.conf||(o.conf||0)>=+F.conf)&&(!per||dias(o.atualizado)<=per)&&terms.every(w=>o._t.includes(w)));
  const ord={rec:(a,b)=>String(b.atualizado||'').localeCompare(String(a.atualizado||'')),val:(a,b)=>(b.valor||0)-(a.valor||0),porte:(a,b)=>((b.area_m2||0)+(b.potencia_mw||0)*1e3)-((a.area_m2||0)+(a.potencia_mw||0)*1e3),novo:(a,b)=>String(b.primeira_vez||'').localeCompare(String(a.primeira_vez||'')),conf:(a,b)=>(b.conf||0)-(a.conf||0)||(b.valor||0)-(a.valor||0)}[F.ord]||(()=>0);
  return L.sort(ord); }
const minhas=()=>S.docs.filter(d=>d.kind==='opv');
const seguida=id=>minhas().find(d=>d.oid===id);
const sel=(k,lab,opts,val,cls='')=>`<label class="field ${cls}"><span>${lab}</span><select data-opf="${k}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(val)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
function cardOp(o){ const ec=ESTC[o.estagio]||'#8b5cf6', og=ORIG[o.origem]||['Fonte','#6b7385'], seg=seguida(o.id); const nv=dias(o.primeira_vez)<=7;
  const porte=o.area_m2?Q(o.area_m2)+' m²':o.potencia_mw?nf2.format(o.potencia_mw)+' MW':o.unidades?nf0.format(o.unidades)+' unidades':'—';
  const f0=(o.fontes||[])[0];
  return `<article class="opc" style="--ec:${ec}"><div style="min-width:0"><div class="t1"><span class="est">${esc(o.estagio||'')}</span><span class="tag2">${esc(o.segmento||'')}</span><span class="org" style="color:${og[1]}">${og[0]}</span>${nv?'<span class="nv">NOVA</span>':''}${o.conf?`<span class="cf" style="--cc:${confNv(o.conf)[1]}" title="Confiabilidade ${confNv(o.conf)[0]}: ${esc((o.conf_motivos||[]).join('; '))}">${io('chk',11)}${o.conf}</span>`:''}${o.canais?`<span class="cf" style="--cc:#4f7cff" title="Canal de compras da empresa identificado">${io('cart',11)}canal de compras</span>`:''}<span>${esc([o.cidade,o.uf].filter(Boolean).join(' / ')||'Local a definir')}</span><span>· atualizada em ${fd(o.atualizado)}</span></div>
    <h4 data-act="opFicha" data-id="${esc(o.id)}">${esc(o.obra||'')}</h4><div class="dt">${esc(o.detalhes||'')}</div>
    <div class="mt"><span>Empresa: <b>${esc(o.empresa||'—')}</b></span><span>Porte: <b>${porte}</b></span>${o.empregos?`<span>Empregos: <b>${nf0.format(o.empregos)}</b></span>`:''}${o.inicio?`<span>Início: <b>${esc(o.inicio)}</b></span>`:''}${o.subtipo?`<span>${esc(o.subtipo)}</span>`:''}</div></div>
   <div class="acts"><div class="val">${o.valor?brlc(o.valor):'<span style="font-size:12px;color:#8a91a6;font-weight:600">valor não divulgado</span>'}</div>
    <button class="btn sm primary" data-act="opFicha" data-id="${esc(o.id)}">Ver ficha</button><button class="btn sm ${seg?'on':''}" data-act="opSeguir" data-id="${esc(o.id)}">${io('star',13)}${seg?'Acompanhando':'Acompanhar'}</button>${f0&&f0.url?`<a class="btn sm" href="${esc(f0.url)}" target="_blank" rel="noopener">${io('ext',13)}Fonte</a>`:''}</div></article>`; }
function barras(cont,key,max=8){ const L=Object.entries(cont).sort((a,b)=>b[1]-a[1]).slice(0,max); const m=L[0]?L[0][1]:1;
  return `<div class="ophb">${L.map(([k,n])=>`<button data-act="opQuick" data-k="${key}" data-v="${esc(k)}" title="Filtrar por ${esc(k)}">${esc(k||'—')}</button><div class="tr"><i style="width:${(n/m*100).toFixed(1)}%"></i></div><div class="n">${n}</div>`).join('')||'<span class="note">Sem dados.</span>'}</div>`; }
VIEWS.opRadar=()=>{ if(DB.st!=='ok'&&DB.st!=='load'&&DB.st!=='err') carregar();
  const F=S.op; const L=DB.st==='ok'?filtra(F):[]; const vis=L.slice(0,F.n);
  const soma=L.reduce((s,o)=>s+(o.valor||0),0), novas=L.filter(o=>dias(o.primeira_vez)<=7).length, obr=L.filter(o=>o.estagio==='EM OBRAS').length;
  const cS={}, cU={}; for(const o of L){ cS[o.segmento||'OUTROS']=(cS[o.segmento||'OUTROS']||0)+1; if(o.uf) cU[o.uf]=(cU[o.uf]||0)+1; }
  const salvas=lg('orcalivre.op.buscas',[]);
  const ger=DB.meta?.gerado?new Date(DB.meta.gerado).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';
  return head('Radar de obras privadas',`Obras privadas de grande porte no Brasil, reunidas todo dia de notícias de investimento, Diários Oficiais municipais, financiamentos do BNDES e usinas em implantação na ANEEL${ger?' · atualizado em '+ger:''}`,
    `<button class="btn" data-act="opSalvar">${io('bell')} Salvar esta busca</button><button class="btn" data-act="opCsv">${io('csv')} Exportar planilha</button>`)+
   `<div class="lcbar"><label class="field grow"><span>Buscar</span><input id="opQ" value="${esc(F.q)}" placeholder="Empresa, cidade, tipo de obra… (ex.: centro de distribuição, hospital, Toyota)" autocomplete="off"></label>
     ${sel('uf','Estado',[['','Todos'],...UFS.map(u=>[u,u])],F.uf)}${sel('seg','Segmento',[['','Todos'],...SEGS.map(s=>[s,s])],F.seg)}${sel('est','Estágio',[['','Todos'],...ESTS.map(s=>[s,s])],F.est)}
     ${sel('vmin','Investimento mínimo',[['','Qualquer'],['10000000','R$ 10 mi'],['50000000','R$ 50 mi'],['100000000','R$ 100 mi'],['500000000','R$ 500 mi'],['1000000000','R$ 1 bi']],F.vmin)}
     ${sel('org','Fonte',[['','Todas'],['noticia','Notícias (IA)'],['bndes','BNDES'],['aneel','ANEEL'],['diario','Diários Oficiais']],F.org)}${sel('conf','Confiabilidade',[['','Qualquer'],['35','Média ou alta'],['65','Somente alta']],F.conf)}${sel('per','Atualizadas há',[['30','30 dias'],['90','90 dias'],['180','6 meses'],['730','2 anos'],['0','Qualquer data']],F.per)}
     ${sel('ord','Ordenar por',[['rec','Mais recentes'],['val','Maior investimento'],['porte','Maior porte'],['novo','Entrada no radar'],['conf','Maior confiabilidade']],F.ord)}</div>
   ${salvas.length?`<div class="opsv">${salvas.map((b,i)=>{ const n=DB.st==='ok'?filtra({...b.f,per:'0',ord:'rec'}).filter(o=>(o.primeira_vez||'')>(b.visto||'')).length:0; return `<span><button class="go" data-act="opUsar" data-i="${i}">${esc(b.nome)}</button>${n?`<span class="q" title="Novas desde a última visita">${n}</span>`:''}<button class="x" data-act="opApagar" data-i="${i}" aria-label="Remover busca">${io('x',12)}</button></span>`; }).join('')}</div>`:''}
   ${DB.st==='load'?'<div class="empty"><b>Carregando o radar…</b>Reunindo as obras privadas mapeadas.</div>':DB.st==='err'?`<div class="empty"><b>Radar indisponível no momento</b>${esc(DB.err)}<div style="margin-top:12px"><button class="btn" data-act="opRecarregar">Tentar de novo</button></div></div>`:
   `<div class="opkp" style="margin-top:14px"><div><div class="l">Investimento mapeado</div><div class="v">${brlc(soma)}</div><div class="s">soma dos valores divulgados</div></div>
     <div><div class="l">Obras no filtro</div><div class="v">${nf0.format(L.length)}</div><div class="s">de ${nf0.format(DB.obras.length)} no radar</div></div>
     <div><div class="l">Novas nesta semana</div><div class="v">${nf0.format(novas)}</div><div class="s">entraram no radar nos últimos 7 dias</div></div>
     <div><div class="l">Em obras</div><div class="v">${nf0.format(obr)}</div><div class="s">já em execução</div></div></div>
    <div class="oppan"><div><h3>Por segmento</h3>${barras(cS,'seg')}</div><div><h3>Por estado</h3>${barras(cU,'uf')}</div></div>
    <div class="lclist">${vis.map(cardOp).join('')||'<div class="empty"><b>Nenhuma obra encontrada</b>Afrouxe os filtros ou busque por outro termo.</div>'}</div>
    ${L.length>vis.length?`<div style="text-align:center;margin-top:14px"><button class="btn" data-act="opMais">Mostrar mais (${nf0.format(L.length-vis.length)} restantes)</button></div>`:''}
    <p class="opnote">Notícias: manchetes de veículos de imprensa lidas por inteligência artificial, que identifica empresa, local, segmento, estágio e valor; confira sempre a matéria original. BNDES: financiamentos contratados por empresas privadas a partir de R$ 10 milhões para implantação, ampliação ou modernização. ANEEL: usinas de 5 MW ou mais com construção iniciada ou prevista. Diários Oficiais: alvarás de construção, licenças de instalação e aprovações de projeto de grande porte publicados pelos municípios (Querido Diário). A confiabilidade (0 a 100) soma as evidências: tipo de fonte, número de veículos, confirmação em outra fonte, CNPJ, cidade e valor. Dados da empresa vêm do cadastro público de CNPJ da Receita Federal.</p>`}`; };

let qT=0;
document.addEventListener('input',e=>{ if(e.target.id==='opQ'){ S.op.q=e.target.value; S.op.n=30; clearTimeout(qT); qT=setTimeout(()=>{ const p=e.target.selectionStart; render(); const i=$('#opQ'); if(i){ i.focus(); try{ i.setSelectionRange(p,p); }catch(_){} } },260); } });
document.addEventListener('change',e=>{ const k=e.target.dataset.opf; if(k){ S.op[k]=e.target.value; S.op.n=30; render(); } });

/* ================================================================ empresa (CNPJ público) */
const EMP={};
async function empresa(cnpj){ cnpj=String(cnpj||'').replace(/\D/g,''); if(cnpj.length!==14) return null; if(EMP[cnpj]) return EMP[cnpj];
  EMP[cnpj]={st:'load'};
  for(const u of [`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,`https://minhareceita.org/${cnpj}`]){
    try{ const r=await fetch(u); if(r.ok){ EMP[cnpj]={st:'ok',d:await r.json()}; break; } }catch(e){} }
  if(EMP[cnpj].st!=='ok') EMP[cnpj]={st:'err'};
  if(!$('#modal').hidden&&S.opf) remodal(); return EMP[cnpj]; }
function empHTML(o){ const cn=String(o.cnpj||o.cnpjUser||'').replace(/\D/g,'');
  if(cn.length!==14) return `<div class="emp"><b>${esc(o.empresa||'Empresa não identificada')}</b><div class="note" style="margin:4px 0 8px">A fonte não traz o CNPJ. Informe o CNPJ para ver razão social, endereço, atividade, telefone e quadro societário do cadastro público da Receita Federal.</div>
    <div class="cnpjin"><input id="opCnpj" placeholder="00.000.000/0000-00" inputmode="numeric" aria-label="CNPJ da empresa"><button class="btn sm" data-act="opCnpj">Consultar CNPJ</button>${o.empresa?`<a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent((o.empresa||'')+' CNPJ')}">${io('ext',13)}Procurar CNPJ</a>`:''}</div></div>`;
  const E=EMP[cn]; if(!E){ empresa(cn); return '<div class="emp nxshim" style="height:110px"></div>'; } if(E.st==='load') return '<div class="emp nxshim" style="height:110px"></div>';
  if(E.st==='err') return `<div class="emp"><b>${esc(o.empresa||'')}</b> · CNPJ ${cnpjF(cn)}<div class="note">Não foi possível consultar o cadastro agora.</div></div>`;
  const d=E.d; const tel=[d.ddd_telefone_1,d.ddd_telefone_2].filter(Boolean).map(t=>String(t).replace(/^(\d{2})(\d{4,5})(\d{4})$/,'($1) $2-$3'));
  const end=[d.descricao_tipo_de_logradouro,d.logradouro,d.numero].filter(Boolean).join(' ')+(d.complemento?' - '+d.complemento:'')+(d.bairro?' - '+d.bairro:'');
  const socios=(d.qsa||[]).slice(0,8);
  return `<div class="emp"><div><b>Razão social:</b> ${esc(d.razao_social||'')} · <b>CNPJ:</b> ${cnpjF(cn)}</div>${d.nome_fantasia?`<div><b>Nome fantasia:</b> ${esc(d.nome_fantasia)}</div>`:''}
    <div><b>Endereço:</b> ${esc(end)} · ${esc(d.municipio||'')} - ${esc(d.uf||'')} · CEP ${esc(String(d.cep||'').replace(/^(\d{5})(\d{3})$/,'$1-$2'))}</div>
    <div><b>Atividade principal:</b> ${esc(d.cnae_fiscal_descricao||'')} · <b>Porte:</b> ${esc(d.porte||d.descricao_porte||'')} · <b>Situação:</b> ${esc(d.descricao_situacao_cadastral||'')}</div>
    ${tel.length||d.email?`<div><b>Contato cadastrado na Receita:</b> ${esc(tel.join(' · '))}${d.email?' · '+esc(String(d.email).toLowerCase()):''}</div>`:''}
    ${d.capital_social?`<div><b>Capital social:</b> ${brl(+d.capital_social)}</div>`:''}
    ${socios.length?`<div style="margin-top:6px"><b>Quadro de sócios e administradores:</b><div class="qsa">${socios.map(s=>{ const nm=s.nome_socio||s.nome||''; const pj=/\d{8}/.test(String(s.cnpj_cpf_do_socio||''))&&String(s.cnpj_cpf_do_socio||'').replace(/\D/g,'').length===14; return `<span>${esc(nm)}${s.qualificacao_socio?' · '+esc(s.qualificacao_socio):''}${pj?'':` <a href="${lkP(nm+' '+curta(d.nome_fantasia||d.razao_social))}" target="_blank" rel="noopener" title="Procurar ${esc(nm)} no LinkedIn" class="lkin">in</a>`}</span>`; }).join('')}</div><div class="note" style="margin-top:4px">O botão <b>in</b> abre a busca de pessoas do LinkedIn com o nome e a empresa; confira se o perfil é da pessoa certa.</div></div>`:''}
    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent((d.nome_fantasia||d.razao_social||'')+' site oficial')}">${io('ext',13)}Site da empresa</a><a class="btn sm" target="_blank" rel="noopener" href="https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(d.nome_fantasia||d.razao_social||'')}">${io('user',13)}Empresa no LinkedIn</a></div></div>`; }

/* ================================================================ ficha (relatório) */
function fichaCorpo(o){ const og=ORIG[o.origem]||['Fonte'];
  const kv=(l,v,c='')=>`<div class="${c}">${l}<b>${v==null||v===''?'—':v}</b></div>`;
  const mapa=o.lat&&o.lon?`https://www.google.com/maps?q=${o.lat},${o.lon}`:`https://www.google.com/maps/search/${encodeURIComponent([o.cidade,o.uf,'Brasil'].filter(Boolean).join(', '))}`;
  return `<div class="opf"><div class="hdr"><span><b>Código:</b> ${esc(o.codigo||'')} · <b>Última atualização:</b> ${fd(o.atualizado)} · <b>No radar desde:</b> ${fd(o.primeira_vez)}</span><span><b>Fonte:</b> ${og[0]}</span></div>
   <h5>Dados da obra</h5><div class="kv">${kv('Nome da obra',esc(o.obra),'w3')}${kv('Cidade',esc(o.cidade||'A definir'))}${kv('Estado',esc(o.uf||'—'))}${kv('Localização',`<a href="${mapa}" target="_blank" rel="noopener">${io('map',13)} Ver no mapa</a>`)}
    ${kv('Segmento',esc(o.segmento))}${kv('Subtipo',esc(o.subtipo||'—'))}${kv('Tipo',esc(o.tipo||'—'))}${kv('Estágio',esc(o.estagio))}${kv('Início',esc(o.inicio||'A definir'))}${kv('Término',esc(o.termino?(/^\d{4}-\d\d-\d\d$/.test(o.termino)?fd(o.termino):o.termino):'A definir'))}
    ${kv('Valor do investimento',o.valor?brl(o.valor):'Não divulgado')}${kv('Área construída',o.area_m2?Q(o.area_m2)+' m²':'—')}${kv(o.potencia_mw?'Potência':'Unidades',o.potencia_mw?nf2.format(o.potencia_mw)+' MW':o.unidades?nf0.format(o.unidades):'—')}
    ${o.empregos?kv('Empregos previstos',nf0.format(o.empregos)):''}${o.produto?kv('Linha BNDES',esc(o.produto)):''}${o.situacao?kv('Situação do contrato',esc(o.situacao)):''}</div>
   <h5>Detalhes</h5><p class="det">${esc(o.detalhes||'—')}</p>
   ${o.conf?`<h5>Confiabilidade da informação</h5><div class="opconf" style="--cc:${confNv(o.conf)[1]}"><div class="n">${o.conf}<small>/100</small></div><div style="flex:1;min-width:0"><div class="bar"><i style="width:${o.conf}%"></i></div><div class="mot"><b>${confNv(o.conf)[0].toUpperCase()}</b> · ${esc((o.conf_motivos||[]).join(' · '))}</div></div></div>`:''}
   ${o.construtora||o.projetista||(o.pessoas||[]).length?`<h5>Envolvidos citados nas fontes</h5><div class="oppp">${o.construtora?`<div><span>Construtora</span><b>${esc(o.construtora)}</b><a class="btn sm" target="_blank" rel="noopener" href="${lkC(o.construtora)}">${io('user',13)}LinkedIn</a></div>`:''}${o.projetista?`<div><span>Projeto</span><b>${esc(o.projetista)}</b><a class="btn sm" target="_blank" rel="noopener" href="${lkC(o.projetista)}">${io('user',13)}LinkedIn</a></div>`:''}${(o.pessoas||[]).map(p=>`<div><span>${esc(p.cargo||'Citado')}</span><b>${esc(p.nome)}${p.empresa?` <small>· ${esc(p.empresa)}</small>`:''}</b><a class="btn sm" target="_blank" rel="noopener" href="${lkP(p.nome+' '+curta(p.empresa||o.empresa))}">${io('user',13)}Procurar no LinkedIn</a></div>`).join('')}</div><p class="note" style="margin:4px 0 0">Pessoas citadas publicamente na matéria como porta-vozes da obra. O radar não guarda telefones nem e-mails pessoais.</p>`:''}
   <h5>Empresa participante</h5>${empHTML(o)}
   ${decisor(o)}
   <h5>Fontes</h5><div class="src">${(o.fontes||[]).map(f=>`<a href="${esc(f.url||'#')}" target="_blank" rel="noopener">${io('ext',15)}<span>${esc(f.t||'')}<small>${esc(f.veiculo||'')} · ${fd(f.data)}</small></span></a>`).join('')||'<span class="note">Sem link de origem.</span>'}</div></div>`; }
ACT.opFicha=d=>{ const o=achar(d.id); if(!o) return; S.opf=d.id; const cn=String(o.cnpj||o.cnpjUser||'').replace(/\D/g,''); if(cn.length===14) empresa(cn);
  modal(()=>{ const x=achar(S.opf)||o; const sg=seguida(x.oid||x.id);
    return dlg(`<div class="eyebrow">${esc(x.segmento||'')} · ${esc(x.estagio||'')}</div><h2 style="margin:4px 0 0;font-size:17px;line-height:1.35">${esc(x.obra||'')}</h2>`, fichaCorpo(x),
     `<button class="btn" data-act="opRelatorio">${io('pdf')} Relatório em PDF</button><button class="btn" data-act="opIA">${io('spark')} Analisar com a IA</button><button class="btn" data-act="opOrc">Criar orçamento</button><button class="btn ${sg?'':'primary'}" data-act="opSeguir" data-id="${esc(x.oid||x.id)}">${io('star')} ${sg?'Acompanhando':'Acompanhar'}</button>`); }); };
ACT.opCnpj=()=>{ const v=($('#opCnpj')?.value||'').replace(/\D/g,''); if(v.length!==14){ toast('Informe um CNPJ com 14 dígitos.'); return; } const o=achar(S.opf); if(!o) return; o.cnpjUser=v; const m=seguida(o.oid||o.id); if(m){ m.cnpjUser=v; Store.save(m); } empresa(v); remodal(); };

/* relatório imprimível (padrão de relatório de obras) */
ACT.opRelatorio=()=>{ const o=achar(S.opf); if(!o) return; const cn=String(o.cnpj||o.cnpjUser||'').replace(/\D/g,''); const E=EMP[cn]?.d;
  const w=window.open('','_blank'); if(!w){ toast('Permita janelas pop-up para gerar o relatório.'); return; }
  const linha=(l,v)=>`<div><b>${l}:</b> ${v||'—'}</div>`;
  const emp=E?`${linha('Razão social',esc(E.razao_social)+' - <b>CNPJ:</b> '+cnpjF(cn))}${E.nome_fantasia?linha('Nome fantasia',esc(E.nome_fantasia)):''}${linha('Endereço',esc([E.descricao_tipo_de_logradouro,E.logradouro,E.numero].filter(Boolean).join(' ')+(E.bairro?' - '+E.bairro:'')))}${linha('Cidade',esc(E.municipio)+' - '+esc(E.uf)+' - <b>CEP:</b> '+esc(E.cep))}${linha('Atividade principal',esc(E.cnae_fiscal_descricao))}${linha('Telefone',esc([E.ddd_telefone_1,E.ddd_telefone_2].filter(Boolean).join(' / ')))}${E.email?linha('E-mail',esc(String(E.email).toLowerCase())):''}${(E.qsa||[]).length?linha('Sócios e administradores',(E.qsa||[]).slice(0,10).map(s=>esc(s.nome_socio||'')+' ('+esc(s.qualificacao_socio||'')+')').join('; ')):''}`
    :`${linha('Empresa',esc(o.empresa||'Não identificada'))}${cn?linha('CNPJ',cnpjF(cn)):''}`;
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de obra ${esc(o.codigo||'')}</title><style>
   @page{size:A4;margin:14mm}body{font:12.5px/1.55 'Segoe UI',Arial,sans-serif;color:#1d2433;margin:0}
   .top{display:flex;justify-content:space-between;align-items:center;background:#0b1020;color:#fff;padding:16px 22px;border-radius:6px}
   .top .b{font:800 22px Arial;letter-spacing:-.02em}.top .b span{color:#5eead4}.top .r{font:700 15px Arial;letter-spacing:.04em}.top .r span{color:#a78bfa}
   .cod{margin:10px 0 4px;font-size:12px}h3{color:#4b3fd6;font-size:13px;margin:16px 0 6px;padding-bottom:4px;border-bottom:2px solid #e4e0ff;text-transform:uppercase;letter-spacing:.05em}
   .g{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px}.box{border:1px solid #d9dce6;border-radius:8px;padding:10px 14px}
   a{color:#3730a3;word-break:break-all}.f{font-size:11px;color:#6b7385;margin-top:18px;border-top:1px solid #e3e5ee;padding-top:8px}
   *{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>
   <div class="top"><div class="b">Orça<span>Livre</span></div><div class="r">RELATÓRIO DE <span>OBRAS</span></div></div>
   <div class="cod"><b>Código:</b> ${esc(o.codigo||'')} - <b>Última atualização:</b> ${fd(o.atualizado)} - <b>Emitido em:</b> ${new Date().toLocaleDateString('pt-BR')}</div>
   <h3>Dados da obra</h3>${linha('Nome da obra',esc(o.obra))}${linha('Cidade',esc(o.cidade||'A definir')+' <b>Estado:</b> '+esc(o.uf||'—'))}${linha('Segmento',esc(o.segmento)+(o.subtipo?' - <b>Subtipo:</b> '+esc(o.subtipo):''))}
   ${linha('Tipo',esc(o.tipo||'—'))}${linha('Início / Término',esc(o.inicio||'A definir')+' / '+esc(o.termino||'A definir'))}${linha('Estágio',esc(o.estagio))}${linha('Área total construída (m²)',o.area_m2?Q(o.area_m2):'')}
   ${o.potencia_mw?linha('Potência',nf2.format(o.potencia_mw)+' MW'):''}${o.unidades?linha('Total de unidades',nf0.format(o.unidades)):''}${o.empregos?linha('Empregos previstos',nf0.format(o.empregos)):''}${linha('Valor do investimento',o.valor?brl(o.valor):'Não divulgado')}
   <h3>Detalhes</h3><div>${esc(o.detalhes||'—')}</div>
   ${o.conf?`<h3>Confiabilidade</h3><div><b>${o.conf}/100</b> (${confNv(o.conf)[0]}) — ${esc((o.conf_motivos||[]).join('; '))}</div>`:''}
   ${o.construtora||o.projetista||(o.pessoas||[]).length?`<h3>Envolvidos citados</h3>${o.construtora?linha('Construtora',esc(o.construtora)):''}${o.projetista?linha('Projeto',esc(o.projetista)):''}${(o.pessoas||[]).map(p=>linha(esc(p.cargo||'Citado'),esc(p.nome)+(p.empresa?' ('+esc(p.empresa)+')':''))).join('')}`:''}
   ${o.canais?`<h3>Canais de compra da empresa</h3>${o.canais.fornecedores?linha('Portal de fornecedores',`<a href="${esc(o.canais.fornecedores)}">${esc(o.canais.fornecedores)}</a>`):''}${o.canais.site?linha('Site',esc(o.canais.site)):''}${(o.canais.emails||[]).length?linha('E-mails corporativos',esc(o.canais.emails.join(' · '))):''}`:''}
   <h3>Empresa participante</h3><div class="box">${emp}</div>
   <h3>Fontes</h3>${(o.fontes||[]).map(f=>`<div>• ${esc(f.t||'')} (${esc(f.veiculo||'')}, ${fd(f.data)})<br><a href="${esc(f.url||'')}">${esc(f.url||'')}</a></div>`).join('')}
   <div class="f">Relatório gerado pelo OrçaLivre a partir de fontes públicas (imprensa, BNDES, ANEEL e cadastro de CNPJ da Receita Federal). Confirme as informações com a empresa antes de qualquer proposta.</div>
   <script>setTimeout(()=>print(),400)<\/script></body></html>`); w.document.close(); };

ACT.opIA=()=>{ const o=achar(S.opf); if(!o) return; closeModal();
  ACT.nxChip&&ACT.nxChip({q:`Sou de uma construtora e quero prospectar esta obra privada: "${o.obra}" (${o.segmento}${o.subtipo?', '+o.subtipo:''}; ${[o.cidade,o.uf].filter(Boolean).join('/')}; estágio ${o.estagio}${o.valor?'; investimento de '+brl(o.valor):''}${o.area_m2?'; '+Q(o.area_m2)+' m²':''}). Detalhes: ${o.detalhes||''}. Quais etapas e serviços principais essa obra deve ter, que composições das bases eu uso para estimar o custo, quais riscos observar e como abordar a empresa nesse estágio?`}); };
ACT.opOrc=async()=>{ const o=achar(S.opf); if(!o) return;
  const b=newBudget({nome:('Obra privada · '+(o.obra||'')).slice(0,90),cliente:o.empresa||'',local:[o.cidade,o.uf].filter(Boolean).join('/'),dataBase:new Date().toISOString().slice(0,7)});
  if(o.area_m2) b.area=o.area_m2; await Store.save(b); const m=seguida(o.oid||o.id); if(m){ m.orc=b.id; await Store.save(m); }
  closeModal(); S.cur=b; S.sel=null; lsSet('orcalivre.last',b.id); go('plan'); toast('Orçamento criado para a obra. Monte as etapas e use o assistente para escolher as composições.'); };


/* ================================================================ como chegar ao decisor (somente canais públicos e buscas manuais) */
const STOPW=new Set('S A SA LTDA EIRELI ME EPP HOLDING PARTICIPACOES PARTICIPACAO DO DA DE DOS DAS E BRASIL BRAZIL INDUSTRIA INDUSTRIAL COMERCIO COMERCIAL GRUPO CIA COMPANHIA EMPREENDIMENTOS EMPREENDIMENTO SPE'.split(' '));
const chaveEmp=n=>N(n).replace(/[^A-Z0-9 ]+/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOPW.has(w)).slice(0,2).join(' ');
const curta=n=>{ const t=String(n||'').replace(/\b(S\.?\/?A\.?|LTDA\.?|EIRELI|ME|EPP)\b/gi,'').replace(/\s+/g,' ').trim(); return t.split(' ').slice(0,3).join(' '); };
const lkP=q=>'https://www.linkedin.com/search/results/people/?keywords='+encodeURIComponent(q.trim());
const lkC=q=>'https://www.linkedin.com/search/results/companies/?keywords='+encodeURIComponent(curta(q));
const gS=q=>'https://www.google.com/search?q='+encodeURIComponent(q);
function decisor(o){ const emp=curta(o.empresa||''); const c=o.canais||{};
  const ch=[c.fornecedores?`<a class="btn sm primary" href="${esc(c.fornecedores)}" target="_blank" rel="noopener">${io('cart',13)}Portal de fornecedores</a>`:'',
    c.site?`<a class="btn sm" href="${esc(c.site)}" target="_blank" rel="noopener">${io('ext',13)}${esc(c.site.replace(/^https?:\/\//,''))}</a>`:'',
    ...(c.emails||[]).map(e=>`<a class="btn sm" href="mailto:${esc(e)}">${io('mail',13)}${esc(e)}</a>`)].filter(Boolean).join('');
  const cargos=[['Suprimentos','suprimentos'],['Compras','compras'],['Engenharia','engenharia'],['Diretor de obras','diretor de obras'],['Expansão / novos projetos','expansão'],['Facilities','facilities']];
  return `<h5>Como chegar ao decisor</h5><div class="opdec">
   <div class="row"><span class="lb">Canais de compra da empresa</span><div class="bt">${ch||`<span class="note">Nenhum canal público encontrado automaticamente.</span>`}${emp?`<a class="btn sm" target="_blank" rel="noopener" href="${gS('"'+emp+'" portal de fornecedores OR "seja um fornecedor" OR "cadastro de fornecedores"')}">${io('ext',13)}Procurar portal de fornecedores</a>`:''}</div></div>
   ${emp?`<div class="row"><span class="lb">Pessoas por área no LinkedIn</span><div class="bt">${cargos.map(([l,q])=>`<a class="btn sm" target="_blank" rel="noopener" href="${lkP(q+' '+emp)}">${io('user',13)}${l}</a>`).join('')}<a class="btn sm" target="_blank" rel="noopener" href="${lkC(o.empresa)}">${io('pred',13)}Página da empresa</a></div></div>`:''}
   ${o.construtora?`<div class="row"><span class="lb">Construtora contratada</span><div class="bt"><a class="btn sm" target="_blank" rel="noopener" href="${lkP('suprimentos '+curta(o.construtora))}">${io('user',13)}Suprimentos da ${esc(curta(o.construtora))}</a><a class="btn sm" target="_blank" rel="noopener" href="${lkP('engenheiro '+curta(o.construtora)+' '+(o.cidade||''))}">${io('user',13)}Engenharia da obra</a></div></div>`:''}
   ${eqBloco(o)}
   <p class="note" style="margin:6px 0 0">Os botões abrem buscas no LinkedIn e no Google para você conferir manualmente; o radar não copia perfis nem guarda dados pessoais (LGPD e termos de uso do LinkedIn). E-mails exibidos são canais corporativos publicados no site da própria empresa.</p></div>`; }

/* ================================================================ equipe: contatos compartilhados */
const EQ={st:'',lista:[],sel:lg('orcalivre.eq.sel',''),ct:{},membros:{},abrir:false};
const eqLogado=()=>!!(Store.sb&&Store.user);
async function eqCarregar(force){ if(!eqLogado()){ EQ.st='off'; return; } if(EQ.st==='ok'&&!force||EQ.st==='load') return; EQ.st='load';
  try{ const {data,error}=await Store.sb.from('equipes').select('id,nome,codigo,criado_por').order('criado'); if(error) throw error; EQ.lista=data||[];
    if(!EQ.lista.find(e=>e.id===EQ.sel)){ EQ.sel=EQ.lista[0]?.id||''; ls('orcalivre.eq.sel',EQ.sel); } EQ.st='ok'; EQ.ct={};
    if(EQ.sel){ const r=await Store.sb.from('equipe_membros').select('email,entrou').eq('equipe',EQ.sel); EQ.membros[EQ.sel]=r.data||[]; }
  }catch(e){ EQ.st='err'; EQ.err=e.message||String(e); }
  rr(); }
const rr=()=>{ if(!$('#modal').hidden) remodal(); else render(); };
const eqChave=o=>chaveEmp(o.empresa)||String(o.cnpj||o.cnpjUser||'').replace(/\D/g,'').slice(0,8);
async function eqContatos(k){ if(!EQ.sel||!k) return; EQ.ct[k]={st:'load',L:[]};
  const {data,error}=await Store.sb.from('contatos_equipe').select('*').eq('equipe',EQ.sel).eq('empresa_chave',k).order('atualizado',{ascending:false});
  EQ.ct[k]=error?{st:'err',L:[]}:{st:'ok',L:data||[]}; rr(); }
function eqBloco(o){ const k=eqChave(o);
  if(!eqLogado()) return `<div class="row"><span class="lb">Contatos da equipe</span><div class="note">Entre na sua conta para ver e registrar contatos compartilhados com a sua equipe.</div></div>`;
  if(EQ.st===''||EQ.st==='off'){ eqCarregar(); } if(EQ.st!=='ok') return `<div class="row"><span class="lb">Contatos da equipe</span><div class="note">${EQ.st==='err'?'Não foi possível carregar as equipes.':'Carregando…'}</div></div>`;
  if(!EQ.sel) return `<div class="row"><span class="lb">Contatos da equipe</span><div class="note">Crie uma equipe ou entre com o código de um colega em <a href="#" data-act="go" data-v="opMinhas">Minhas oportunidades</a> para compartilhar contatos.</div></div>`;
  if(!k) return '';
  const C=EQ.ct[k]; if(!C){ eqContatos(k); } const L=C?.L||[]; const eq=EQ.lista.find(e=>e.id===EQ.sel);
  const meu=Store.user?.id;
  return `<div class="row"><span class="lb">Contatos da equipe ${esc(eq?.nome||'')}</span><div style="flex:1;min-width:0">
    ${C?.st==='load'?'<div class="note">Carregando…</div>':L.length?`<div class="eqct">${L.map(c=>`<div><b>${esc(c.nome)}</b>${c.cargo?` · ${esc(c.cargo)}`:''}${c.tel?` · <a href="tel:${esc(c.tel)}">${esc(c.tel)}</a>`:''}${c.email?` · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:''}${c.obs?`<small>${esc(c.obs)}</small>`:''}<small>por ${esc(c.criado_email||'colega')} em ${fd(c.atualizado)}</small>${c.criado_por===meu?`<button class="btn sm ghost" data-act="eqDel" data-id="${c.id}" data-k="${esc(k)}" aria-label="Excluir contato">${io('x',12)}</button>`:''}</div>`).join('')}</div>`:'<div class="note">Ninguém da equipe registrou contato nesta empresa ainda.</div>'}
    ${EQ.abrir===k?`<div class="eqform"><input id="eqN" placeholder="Nome"><input id="eqC" placeholder="Cargo / área"><input id="eqT" placeholder="Telefone"><input id="eqE" placeholder="E-mail"><input id="eqO" placeholder="Observação (como conseguiu, melhor horário…)" class="w2"><div class="w2" style="display:flex;gap:8px"><button class="btn sm primary" data-act="eqAdd" data-k="${esc(k)}" data-emp="${esc(o.empresa||'')}">Salvar para a equipe</button><button class="btn sm" data-act="eqForm" data-k="">Cancelar</button></div><p class="note w2" style="margin:0">Registre apenas contatos obtidos de forma legítima (cartão, conversa, canal da empresa). Ficam visíveis só para os membros da equipe.</p></div>`
      :`<button class="btn sm" data-act="eqForm" data-k="${esc(k)}" style="margin-top:6px">${io('plus',13)} Registrar contato para a equipe</button>`}</div></div>`; }
ACT.eqForm=d=>{ EQ.abrir=d.k||false; rr(); };
ACT.eqAdd=async d=>{ const v=id=>($('#'+id)?.value||'').trim(); const nome=v('eqN'); if(!nome){ toast('Informe o nome do contato.'); return; }
  const row={equipe:EQ.sel,empresa_chave:d.k,empresa:d.emp||null,nome,cargo:v('eqC')||null,tel:v('eqT')||null,email:v('eqE')||null,obs:v('eqO')||null,criado_por:Store.user.id,criado_email:Store.user.email||null};
  const {error}=await Store.sb.from('contatos_equipe').insert(row); if(error){ toast('Não foi possível salvar: '+error.message); return; }
  EQ.abrir=false; toast('Contato compartilhado com a equipe.'); eqContatos(d.k); };
ACT.eqDel=async d=>{ const {error}=await Store.sb.from('contatos_equipe').delete().eq('id',d.id); if(error){ toast(error.message); return; } eqContatos(d.k); };
ACT.eqCriar=async()=>{ const n=($('#eqNome')?.value||'').trim(); if(n.length<2){ toast('Dê um nome para a equipe.'); return; }
  const {data,error}=await Store.sb.rpc('criar_equipe',{p_nome:n}); if(error){ toast(error.message); return; } EQ.sel=data.id; ls('orcalivre.eq.sel',EQ.sel); toast('Equipe criada. Envie o código '+data.codigo+' para os colegas.'); eqCarregar(true); };
ACT.eqEntrar=async()=>{ const c=($('#eqCod')?.value||'').trim(); if(c.length<6){ toast('Informe o código da equipe.'); return; }
  const {data,error}=await Store.sb.rpc('entrar_equipe',{p_codigo:c}); if(error){ toast(error.message.includes('não encontrado')?'Código não encontrado.':error.message); return; } EQ.sel=data.id; ls('orcalivre.eq.sel',EQ.sel); toast('Você entrou na equipe '+data.nome+'.'); eqCarregar(true); };
ACT.eqSair=async()=>{ if(!EQ.sel||!confirmar('Sair desta equipe? Você deixa de ver os contatos compartilhados.')) return; await Store.sb.from('equipe_membros').delete().eq('equipe',EQ.sel).eq('user_id',Store.user.id); EQ.sel=''; ls('orcalivre.eq.sel',''); eqCarregar(true); };
const confirmar=t=>window.confirm(t);
ACT.eqCopiar=d=>{ try{ navigator.clipboard.writeText(d.c); toast('Código copiado.'); }catch(e){ toast('Código: '+d.c); } };
document.addEventListener('change',e=>{ if(e.target.id==='eqSel'){ EQ.sel=e.target.value; ls('orcalivre.eq.sel',EQ.sel); eqCarregar(true); } });
function eqPainel(){ if(!eqLogado()) return `<div class="eqp"><span class="ic">${io('team',18)}</span><div><b>Contatos compartilhados com a equipe</b><div class="note">Entre na sua conta para criar uma equipe e compartilhar contatos de obras com os colegas.</div></div></div>`;
  if(EQ.st===''||EQ.st==='off') eqCarregar(); if(EQ.st!=='ok') return `<div class="eqp"><span class="ic">${io('team',18)}</span><div class="note">${EQ.st==='err'?'Equipes indisponíveis: '+esc(EQ.err||''):'Carregando equipes…'}</div></div>`;
  const e=EQ.lista.find(x=>x.id===EQ.sel); const M=EQ.membros[EQ.sel]||[];
  return `<div class="eqp"><span class="ic">${io('team',18)}</span><div style="flex:1;min-width:0">${e?`<b>Equipe</b> ${EQ.lista.length>1?`<select id="eqSel" aria-label="Equipe">${EQ.lista.map(x=>`<option value="${x.id}" ${x.id===EQ.sel?'selected':''}>${esc(x.nome)}</option>`).join('')}</select>`:`<b>${esc(e.nome)}</b>`} · código <code>${esc(e.codigo)}</code> <button class="btn sm ghost" data-act="eqCopiar" data-c="${esc(e.codigo)}" aria-label="Copiar código">${io('copy',13)}</button>
     <div class="note">${M.length} membro${M.length===1?'':'s'}${M.length?': '+M.map(m=>esc(m.email||'')).join(', '):''}. Os contatos registrados nas fichas das obras ficam visíveis para todos da equipe.</div>`:`<b>Contatos compartilhados com a equipe</b><div class="note">Crie uma equipe e envie o código aos colegas, ou entre com o código que recebeu.</div>`}</div>
    <div class="eqa"><input id="eqNome" placeholder="Nome da nova equipe"><button class="btn sm" data-act="eqCriar">Criar equipe</button><input id="eqCod" placeholder="Código" style="width:110px;text-transform:uppercase"><button class="btn sm" data-act="eqEntrar">Entrar</button>${e?`<button class="btn sm ghost" data-act="eqSair">Sair</button>`:''}</div></div>`; }

/* ================================================================ acompanhar / minhas oportunidades */
const ETAPAS=[['prospeccao','Prospecção'],['contato','Contato feito'],['reuniao','Visita / reunião'],['proposta','Proposta enviada'],['negociacao','Negociação'],['ganha','Ganha'],['perdida','Perdida']];
ACT.opSeguir=async d=>{ const ja=seguida(d.id);
  if(ja){ await Store.del(ja.id); toast('Removida das suas oportunidades.'); }
  else { const o=DB.obras.find(x=>x.id===d.id)||SPD.itens.find(x=>x.id===d.id); if(!o) return; const {_t,...snap}=o;
    await Store.save({...snap,id:uid(),oid:o.id,kind:'opv',etapa:'prospeccao',notas:'',contatos:[],follow:'',orc:null,proposta:null,criado:Date.now()}); toast('Adicionada em Minhas oportunidades.'); }
  if(!$('#modal').hidden&&S.opf) remodal(); render(); };
const hoje=()=>new Date().toISOString().slice(0,10);
const fuTag=f=>{ if(!f) return ''; const c=f<hoje()?'late':f===hoje()?'hoje':''; return `<span class="fu ${c}">${io('cal',12)}${c==='late'?'Atrasado · ':c==='hoje'?'Hoje · ':''}${fd(f)}</span>`; };
VIEWS.opMinhas=()=>{ if(DB.st===''){ carregar(); }
  const L=minhas(); const by={}; for(const e of ETAPAS) by[e[0]]=[]; for(const d of L) (by[d.etapa]||by.prospeccao).push(d);
  for(const k in by) by[k].sort((a,b)=>String(a.follow||'9').localeCompare(String(b.follow||'9')));
  const at=L.filter(d=>!['ganha','perdida'].includes(d.etapa)); const pipe=at.reduce((s,d)=>s+(+d.proposta||+d.valor||0),0);
  const late=at.filter(d=>d.follow&&d.follow<=hoje()).length; const dec2=L.filter(d=>['ganha','perdida'].includes(d.etapa)); const taxa=dec2.length?L.filter(d=>d.etapa==='ganha').length/dec2.length*100:null;
  return head('Minhas oportunidades','Acompanhe cada obra privada da prospecção ao contrato, com contatos, follow-ups e orçamento vinculado',`<button class="btn" data-act="go" data-v="opRadar">Abrir o radar</button>`)+eqPainel()+
   `<div class="opkp"><div><div class="l">Pipeline em aberto</div><div class="v">${brlc(pipe)}</div><div class="s">propostas ou investimento das obras ativas</div></div><div><div class="l">Oportunidades ativas</div><div class="v">${at.length}</div></div><div><div class="l">Follow-ups para hoje ou atrasados</div><div class="v" style="${late?'color:#b42318':''}">${late}</div></div><div><div class="l">Taxa de conversão</div><div class="v">${taxa==null?'—':nf2.format(taxa)+'%'}</div><div class="s">ganhas ÷ decididas</div></div></div>
   ${L.length?`<div class="opk">${ETAPAS.map(([k,l])=>`<div class="kcol"><h3>${l}<span>${by[k].length}</span></h3>${by[k].map(d=>`<div class="kcard" data-act="opCard" data-id="${d.id}"><span class="tag2">${esc(d.segmento||'')}</span><div class="o">${esc(d.obra||'')}</div><div class="m">${esc(d.empresa||'')}${d.cidade||d.uf?'<br>'+esc([d.cidade,d.uf].filter(Boolean).join(' / ')):''}</div>${d.proposta||d.valor?`<div class="v">${brlc(d.proposta||d.valor)}${d.proposta?' <small style="color:#8a91a6;font-weight:600">proposta</small>':''}</div>`:''}${fuTag(d.follow)}</div>`).join('')}</div>`).join('')}</div>`
   :`<div class="empty"><b>Nenhuma oportunidade ainda</b>No Radar de obras privadas, clique em "Acompanhar" nas obras que interessam à sua empresa.<div style="margin-top:12px"><button class="btn primary" data-act="go" data-v="opRadar">Abrir o radar</button></div></div>`}`; };
ACT.opCard=d=>{ S.opc=d.id; modal(cardHTML); };
function cardHTML(){ const m=minhas().find(x=>x.id===S.opc); if(!m) return dlg('<h2 style="margin:0">Oportunidade</h2>','<p>Não encontrada.</p>','<button class="btn" data-act="close">Fechar</button>');
  const orcs=S.docs.filter(d=>d.kind==='orc'); const C=m.contatos||[];
  return dlg(`<div class="eyebrow">${esc(m.segmento||'')} · ${esc([m.cidade,m.uf].filter(Boolean).join('/'))}</div><h2 style="margin:4px 0 0;font-size:17px;line-height:1.35">${esc(m.obra||'')}</h2>`,
   `<div class="stack" style="gap:12px"><div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
     <label class="field"><span>Etapa</span><select data-opm="etapa">${ETAPAS.map(([k,l])=>`<option value="${k}" ${m.etapa===k?'selected':''}>${l}</option>`).join('')}</select></label>
     <label class="field"><span>Próximo follow-up</span><input type="date" data-opm="follow" value="${esc(m.follow||'')}"></label>
     <label class="field"><span>Responsável</span><input data-opm="resp" value="${esc(m.resp||'')}" placeholder="Quem cuida"></label>
     <label class="field"><span>Valor da nossa proposta (R$)</span><input data-opm="proposta" value="${m.proposta?R(m.proposta):''}" inputmode="decimal"></label>
     <label class="field" style="grid-column:span 2"><span>Orçamento vinculado</span><select data-opm="orc"><option value="">Nenhum</option>${orcs.map(o=>`<option value="${o.id}" ${m.orc===o.id?'selected':''}>${esc(o.nome)}</option>`).join('')}</select></label></div>
    <div><div class="eyebrow" style="margin-bottom:6px">Contatos da obra</div><div class="opct">${C.map((c,i)=>`<div class="c"><input data-opc="${i}" data-k="nome" value="${esc(c.nome||'')}" placeholder="Nome"><input data-opc="${i}" data-k="cargo" value="${esc(c.cargo||'')}" placeholder="Cargo"><input data-opc="${i}" data-k="tel" value="${esc(c.tel||'')}" placeholder="Telefone"><input data-opc="${i}" data-k="email" value="${esc(c.email||'')}" placeholder="E-mail"><button class="btn sm ghost" data-act="opCtDel" data-i="${i}" aria-label="Remover contato">${io('x',13)}</button></div>`).join('')}
     <div><button class="btn sm" data-act="opCtAdd">${io('plus',13)} Adicionar contato</button></div></div><p class="note" style="margin:6px 0 0">Contatos particulares desta oportunidade (só você vê). Para compartilhar com a equipe, use o bloco abaixo.</p></div>
    <div class="opf" style="padding:0">${decisor(m)}</div>
    <label class="field"><span>Histórico e anotações</span><textarea data-opm="notas" rows="4" style="width:100%" placeholder="Ex.: 26/10 liguei para suprimentos, pediram apresentação da empresa…">${esc(m.notas||'')}</textarea></label></div>`,
   `<button class="btn danger" data-act="opSeguir" data-id="${esc(m.oid)}">Parar de acompanhar</button>${m.orc?`<button class="btn" data-act="opAbrirOrc" data-id="${m.orc}">Abrir orçamento</button>`:''}<button class="btn" data-act="opFicha" data-id="${esc(m.oid)}">Ver ficha</button><button class="btn primary" data-act="close">Concluir</button>`); }
ACT.opAbrirOrc=d=>{ closeModal(); ACT.open({id:d.id}); };
ACT.opCtAdd=async()=>{ const m=minhas().find(x=>x.id===S.opc); if(!m) return; m.contatos=[...(m.contatos||[]),{nome:'',cargo:'',tel:'',email:''}]; await Store.save(m); remodal(); };
ACT.opCtDel=async d=>{ const m=minhas().find(x=>x.id===S.opc); if(!m) return; m.contatos=(m.contatos||[]).filter((_,i)=>i!==+d.i); await Store.save(m); remodal(); };
document.addEventListener('change',async e=>{ const t=e.target; const m=minhas().find(x=>x.id===S.opc); if(!m||$('#modal').hidden) return;
  const f=t.dataset.opm; if(f){ m[f]=f==='proposta'?(num(t.value)||null):t.value; await Store.save(m); if(f==='etapa'||f==='follow'||f==='proposta') render(); return; }
  if(t.dataset.opc!=null){ const c=(m.contatos||[])[+t.dataset.opc]; if(c){ c[t.dataset.k]=t.value; await Store.save(m); } } });

/* ================================================================ buscas salvas, filtros rápidos e exportação */
ACT.opQuick=d=>{ S.op[d.k]=S.op[d.k]===d.v?'':d.v; S.op.n=30; render(); };
ACT.opMais=()=>{ S.op.n+=30; render(); };
ACT.opRecarregar=()=>{ DB.st=''; carregar(true); render(); };
ACT.opSalvar=()=>{ const F=S.op; const nome=[F.q,F.seg,F.uf,F.est,F.vmin?'≥ '+mi(+F.vmin):''].filter(Boolean).join(' · ')||'Todas as obras';
  const L=lg('orcalivre.op.buscas',[]); if(L.some(b=>b.nome===nome)){ toast('Essa busca já está salva.'); return; }
  L.push({nome,f:{q:F.q,uf:F.uf,seg:F.seg,est:F.est,org:F.org,vmin:F.vmin},visto:new Date().toISOString().slice(0,10)}); ls('orcalivre.op.buscas',L); toast('Busca salva. O número ao lado mostra as obras novas desde a sua última visita.'); render(); };
ACT.opUsar=d=>{ const L=lg('orcalivre.op.buscas',[]); const b=L[+d.i]; if(!b) return; Object.assign(S.op,{q:'',uf:'',seg:'',est:'',org:'',vmin:'',...b.f,per:'0',ord:'novo',n:30}); b.visto=new Date().toISOString().slice(0,10); ls('orcalivre.op.buscas',L); render(); };
ACT.opApagar=d=>{ const L=lg('orcalivre.op.buscas',[]); L.splice(+d.i,1); ls('orcalivre.op.buscas',L); render(); };
ACT.opCsv=()=>{ if(DB.st!=='ok') return; const L=filtra(S.op); const cols=[['codigo','Código'],['obra','Obra'],['empresa','Empresa'],['cnpj','CNPJ'],['cidade','Cidade'],['uf','UF'],['segmento','Segmento'],['subtipo','Subtipo'],['tipo','Tipo'],['estagio','Estágio'],['valor','Investimento (R$)'],['area_m2','Área (m²)'],['potencia_mw','Potência (MW)'],['empregos','Empregos'],['inicio','Início'],['termino','Término'],['atualizado','Atualizado'],['origem','Fonte'],['conf','Confiabilidade'],['construtora','Construtora'],['canal','Canal de compras'],['detalhes','Detalhes'],['link','Link da fonte']];
  const cel=v=>{ v=v==null?'':String(v); return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
  const linhas=[cols.map(c=>c[1]).join(';'),...L.map(o=>cols.map(([k])=>k==='link'?cel((o.fontes||[])[0]?.url):k==='canal'?cel(o.canais?.fornecedores||(o.canais?.emails||[])[0]||o.canais?.site):k==='valor'||k==='area_m2'||k==='potencia_mw'?cel(o[k]!=null?String(o[k]).replace('.',','):''):k==='cnpj'?cel(cnpjF(o.cnpj)):cel(o[k])).join(';'))];
  const blob=new Blob(['﻿'+linhas.join('\r\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`obras-privadas-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); toast(`${L.length} obras exportadas para planilha.`); };


/* ================================================================ alto padrão SP */
const SPD={st:'',itens:[],meta:null};
async function carregarSP(){ if(SPD.st==='ok'||SPD.st==='load') return; SPD.st='load';
  try{ const j=await fetch('dados/obras/sp_alto.json?v='+Math.floor(Date.now()/36e5),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); });
    SPD.itens=(j.itens||[]).map(o=>({...o,_t:N([o.obra,o.arquitetura,o.construtora,o.incorporadora,o.bairro,o.endereco,o.uso,o.detalhes,o.tipo,o.processo,...(o.rts||[]).map(r=>r.nome+' '+(r.registro||''))].join(' '))})); SPD.meta=j; SPD.st='ok'; }
  catch(e){ SPD.st='err'; }
  if(S.view==='opSP'||S.view==='opMinhas') render(); }
const SPEST={'PROJETO APROVADO':'#0f9d74','EXECUÇÃO LIBERADA':'#e0464e','LICENCIAMENTO':'#c27a06','ANÚNCIO':'#8b5cf6','PROJETO':'#4f7cff','APROVAÇÃO':'#0f9d74','LANÇAMENTO':'#c27a06','EM OBRAS':'#e0464e','INAUGURADA':'#6b7385'};
const SPORIG={alvara:['Alvará','#0f9d74'],licenca:['Licença ambiental','#c27a06'],noticia:['Notícia','#7c5cf6']};
const spProprias=()=>lg('orcalivre.sp.proprias',null)||(SPD.meta?.proprias)||[];
const spPropria=o=>{ const t=N([o.incorporadora,o.construtora].join(' ')); return !!t.trim()&&spProprias().some(p=>p&&new RegExp('\\b'+N(p).replace(/[^A-Z0-9 ]/g,'')+'\\b').test(t)); };
const spRtP=o=>(o.rts||[]).find(r=>r.vinculo==='projeto');
const SPRTV={projeto:'Responsável técnico pelo projeto',execucao:'Responsável técnico pela execução'};
const SPFASE=new Set(['PROJETO','APROVAÇÃO','PROJETO APROVADO','LICENCIAMENTO','ANÚNCIO','LANÇAMENTO']);
const SP0={q:'',aba:'fase',arq:'',orig:'',est:'',uso:'',bairro:'',per:'365',ord:'rec',n:30};
S.sp=Object.assign({},SP0,lg('orcalivre.sp.f',{}),{n:30});
const SPABAS=[['fase','Fase ideal p/ contato','Alto padrão, sem construtora e ainda em projeto, aprovação ou lançamento — momento de procurar o arquiteto'],['opor','Oportunidades','Alto padrão sem construtora definida'],['aprov','Projeto aprovado','Alvará de aprovação ainda sem execução — melhor momento'],['arq','Com arquiteto','Escritório de arquitetura identificado nas notícias'],['todas','Toda a cidade','Sem filtro de padrão nem de construtora']];
const spBase=(o,aba)=>aba==='todas'?true:!!o.alto&&(aba==='fase'?(!o.construtora&&!spPropria(o)&&!o.execucao_outro&&SPFASE.has(o.estagio)):aba==='opor'?(!o.construtora&&!spPropria(o)):aba==='aprov'?o.estagio==='PROJETO APROVADO':aba==='arq'?!!(o.arquitetura||spRtP(o)):true);
function spFiltra(F,ignora){ const terms=N(F.q).split(/\s+/).filter(w=>w.length>1); const per=+F.per||0; const ig=k=>ignora===k;
  const L=SPD.itens.filter(o=>(ig('aba')||spBase(o,F.aba))&&(ig('orig')||!F.orig||o.origem===F.orig)&&(ig('est')||!F.est||o.estagio===F.est)&&(ig('uso')||!F.uso||(o.uso||'')===F.uso)
    &&(ig('bairro')||!F.bairro||(o.bairro||'')===F.bairro)&&(ig('arq')||!F.arq||N(o.arquitetura||'')===N(F.arq))&&(ig('per')||!per||dias(o.atualizado)<=per)&&terms.every(w=>o._t.includes(w)));
  const ord={rec:(a,b)=>String(b.atualizado||'').localeCompare(String(a.atualizado||'')),terreno:(a,b)=>(b.area_terreno||b.area_m2||0)-(a.area_terreno||a.area_m2||0),
    novo:(a,b)=>String(b.primeira_vez||'').localeCompare(String(a.primeira_vez||''))||String(b.atualizado||'').localeCompare(String(a.atualizado||'')),
    etapa:(a,b)=>(SPRANK[a.estagio]??9)-(SPRANK[b.estagio]??9)||String(b.atualizado||'').localeCompare(String(a.atualizado||''))}[F.ord]||(()=>0);
  return L.sort(ord); }
const SPRANK={'PROJETO APROVADO':0,'APROVAÇÃO':1,'PROJETO':2,'LICENCIAMENTO':3,'ANÚNCIO':4,'LANÇAMENTO':5,'EXECUÇÃO LIBERADA':6,'EM OBRAS':7};
const spCap=s=>{ s=String(s||'').toLowerCase(); return s.charAt(0).toUpperCase()+s.slice(1); };
const spSel=(k,lab,opts,val,dica='')=>{ const mud=String(val)!==String(SP0[k]);
  return `<div class="spf ${mud?'on':''}"><div class="h"><label for="spf_${k}">${lab}</label>${mud?`<button data-act="spTira" data-k="${k}" title="Voltar ao padrão">${io('x',11)} limpar</button>`:dica?`<span title="${esc(dica)}">?</span>`:''}</div>
    <select id="spf_${k}" data-spf="${k}">${opts.map(([v,l,n])=>`<option value="${esc(v)}" ${String(val)===String(v)?'selected':''}${n===0&&String(val)!==String(v)?' disabled':''}>${esc(l)}${n!=null?` (${nf0.format(n)})`:''}</option>`).join('')}</select></div>`; };
const spConta=(F,k,fn)=>{ const c={}; for(const o of spFiltra(F,k)){ const v=fn(o); if(v) c[v]=(c[v]||0)+1; } return c; };
const spSalva=()=>ls('orcalivre.sp.f',{...S.sp,n:30});
function spCard(o){ const ec=SPEST[o.estagio]||'#8b5cf6', og=SPORIG[o.origem]||['Fonte','#6b7385'], seg=seguida(o.id), nv=dias(o.primeira_vez)<=7, pr=spPropria(o);
  const f0=(o.fontes||[])[0]; const porte=o.area_terreno?`Terreno ${Q(o.area_terreno)} m²`:o.area_m2?`${Q(o.area_m2)} m²`:o.unidades?`${nf0.format(o.unidades)} unid.`:'';
  const rp=spRtP(o);
  const quem=[o.arquitetura?`<span title="Escritório de arquitetura">${io('pred',12)} ${esc(o.arquitetura)}</span>`:rp?`<span title="Responsável técnico pelo projeto (alvará oficial)">${io('pred',12)} Projeto: ${esc(rp.nome)}</span>`:'',o.incorporadora?`<span title="Incorporadora">${io('user',12)} ${esc(o.incorporadora)}</span>`:'',o.construtora?`<span title="Construtora">${io('list',12)} ${esc(o.construtora)}</span>`:''].filter(Boolean).join('');
  return `<article class="spc" style="--ec:${ec}" data-act="spFicha" data-id="${esc(o.id)}">
    <div class="c1"><span class="est">${esc(o.estagio||'')}</span><span class="dt2">${fd(o.atualizado)}</span></div>
    <div class="c2"><div class="tg"><span class="org" style="color:${og[1]}">${og[0]}</span>${nv?'<span class="nv">NOVA</span>':''}${String(o.zona||'').startsWith('ZER')?'<span class="cf" style="--cc:#0f9d74" title="Zona Exclusivamente Residencial">ZER</span>':''}${pr?'<span class="cf" style="--cc:#6b7385">construção própria</span>':o.execucao_outro&&!o.construtora?'<span class="cf" style="--cc:#c27a06" title="O alvará tem um responsável pela execução diferente do autor do projeto">execução com outro RT</span>':!o.construtora?'<span class="cf" style="--cc:#0f9d74">sem construtora</span>':''}${o.uso?`<span class="u">${esc(o.uso.toLowerCase())}</span>`:''}</div>
      <h4>${esc(o.obra||'')}</h4>${o.detalhes?`<div class="dt">${esc(o.detalhes)}</div>`:''}
      <div class="mt"><span>${io('map',12)} ${esc(o.bairro||'São Paulo')}</span>${porte?`<span>${porte}</span>`:''}${quem}</div></div>
    <div class="c3">${o.valor?`<div class="val">${brlc(o.valor)}</div>`:''}<button class="btn sm ${seg?'on':''}" data-act="opSeguir" data-id="${esc(o.id)}" title="Acompanhar em Minhas oportunidades">${io('star',13)}${seg?'Acompanhando':'Acompanhar'}</button>${f0&&f0.url?`<a class="btn sm ghost" data-act="spLink" href="${esc(f0.url)}" target="_blank" rel="noopener" title="Abrir a fonte">${io('ext',13)}</a>`:''}</div></article>`; }
VIEWS.opSP=()=>{ if(SPD.st==='') carregarSP(); const F=S.sp;
  if(SPD.st!=='ok') return head('Alto padrão SP','Obras residenciais e comerciais de alto padrão na cidade de São Paulo')+(SPD.st==='err'?'<div class="empty"><b>Radar de SP ainda em preparação</b>A primeira coleta roda uma vez por dia. Tente novamente em alguns minutos.</div>':'<div class="empty"><b>Carregando…</b></div>');
  const L=spFiltra(F), vis=L.slice(0,F.n);
  const nAba=Object.fromEntries(SPABAS.map(([k])=>[k,spFiltra({...F,aba:k},'_').length]));
  const cO=spConta(F,'orig',o=>o.origem), cE=spConta(F,'est',o=>o.estagio), cB=spConta(F,'bairro',o=>o.bairro), cU=spConta(F,'uso',o=>o.uso), cA=spConta(F,'arq',o=>o.arquitetura);
  const tot=k=>spFiltra(F,k).length;
  const nP=Object.fromEntries(['90','180','365','0'].map(p=>[p,spFiltra({...F,per:p}).length]));
  const etapas=Object.keys(SPEST).filter(e=>SPD.itens.some(o=>o.estagio===e)).sort((a,b)=>(SPRANK[a]??9)-(SPRANK[b]??9));
  const arq=spArqs(), rank=arq.filter(a=>a.n).sort((a,b)=>b.fase-a.fase||b.livre-a.livre||b.n-a.n).slice(0,10);
  const mud=Object.keys(SP0).filter(k=>k!=='n'&&String(F[k])!==String(SP0[k])).length, ger=SPD.meta?.gerado?new Date(SPD.meta.gerado).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';
  return head('Alto padrão SP',`Obras residenciais e comerciais de alto padrão na capital${ger?' · atualizado em '+ger:''}`,`<button class="btn" data-act="spProprias" title="Empresas que constroem as próprias obras">${io('pred')} Construção própria (${spProprias().length})</button>`)+
   `<section class="sppanel"><div class="sptop"><div class="sps">${io('search',16)}<input id="spQ" value="${esc(F.q)}" placeholder="Buscar por escritório, bairro, rua ou incorporadora" autocomplete="off">${F.q?`<button class="x" data-act="spTira" data-k="q" aria-label="Limpar busca">${io('x',14)}</button>`:''}</div>
     <div class="spres"><b>${nf0.format(L.length)}</b> obra${L.length===1?'':'s'}</div>
     <button class="btn ${mud?'primary':''}" data-act="spLimpar" ${mud?'':'disabled'} title="Voltar todos os filtros ao padrão">${io('x',13)} Limpar filtros${mud?` (${mud})`:''}</button></div>
    <div class="spgrid2">
     ${spSel('aba','Mostrar',SPABAS.map(([k,l])=>[k,l,nAba[k]]),F.aba,'Fase ideal = alto padrão sem construtora, ainda em projeto, aprovação ou lançamento')}
     ${spSel('orig','Fonte',[['','Todas as fontes',tot('orig')],['alvara','Alvarás da Prefeitura',cO.alvara||0],['noticia','Notícias',cO.noticia||0],['licenca','Licenças ambientais',cO.licenca||0]],F.orig)}
     ${spSel('est','Etapa',[['','Todas as etapas',tot('est')],...etapas.map(e=>[e,spCap(e),cE[e]||0])],F.est,'Projeto aprovado = alvará sem execução ainda')}
     ${spSel('bairro','Bairro / distrito',[['','Todos os bairros',tot('bairro')],...Object.entries(cB).sort((a,b)=>b[1]-a[1]).map(([b,n])=>[b,spCap(b),n])],F.bairro)}
     ${spSel('arq','Escritório',[['','Todos os escritórios',tot('arq')],...Object.entries(cA).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([a,n])=>[a,a,n]),...(F.arq&&!cA[F.arq]?[[F.arq,F.arq,0]]:[])],F.arq,'Só aparecem escritórios citados nas obras do filtro atual')}
     ${spSel('uso','Uso',[['','Todos os usos',tot('uso')],...Object.entries(cU).sort((a,b)=>b[1]-a[1]).map(([u,n])=>[u,spCap(u),n])],F.uso)}
     ${spSel('per','Atualizadas em',[['90','Últimos 90 dias',nP['90']],['180','Últimos 6 meses',nP['180']],['365','Último ano',nP['365']],['0','Qualquer data',nP['0']]],F.per)}
     ${spSel('ord','Ordenar por',[['rec','Mais recentes'],['etapa','Etapa (aprovado primeiro)'],['terreno','Maior terreno / área'],['novo','Entrada no radar']],F.ord)}
    </div></section>
   <div class="spgrid"><div class="splist">${vis.map(spCard).join('')||`<div class="empty"><b>Nenhuma obra com esses filtros</b><button class="btn" data-act="spLimpar" style="margin-top:10px">Limpar filtros</button></div>`}
     ${L.length>vis.length?`<div style="text-align:center;margin-top:6px"><button class="btn" data-act="spMais">Mostrar mais (${nf0.format(L.length-vis.length)})</button></div>`:''}</div>
    <aside class="spside"><div class="spbox"><h3>Escritórios de arquitetura</h3>${rank.length?`<div class="sparq">${rank.map(a=>`<button data-act="spArq" data-v="${esc(a.nome)}" title="Ver as obras deste escritório"><b>${esc(a.nome)}</b>${a.fase?`<span class="tg">${a.fase} na fase</span>`:`<span>${a.n} obra${a.n>1?'s':''}</span>`}</button>`).join('')}</div>`:'<span class="note">Aparecem conforme as notícias citam os projetos.</span>'}<button class="btn sm todos" data-act="spArqs">${io('pred',13)} Todos os escritórios (${nf0.format(arq.length)})</button></div>
     <details class="spbox spinfo"><summary>Como ler este radar</summary><p><b>Projeto aprovado</b>: alvará de aprovação ainda sem execução — melhor momento para abordar. <b>Execução liberada</b>: obra autorizada a começar.</p><p>Alvarás vêm do relatório mensal da Prefeitura (exceto HIS/HMP) com endereço, distrito, zoneamento e terreno do GeoSampa. Não informam arquiteto nem dono; em residências só a rua é exibida. Arquiteto, construtora e incorporadora vêm das notícias lidas por IA.</p></details></aside></div>`; };
let spT=0;
document.addEventListener('input',e=>{ if(e.target.id==='spQ'){ S.sp.q=e.target.value; S.sp.n=30; clearTimeout(spT); spT=setTimeout(()=>{ const p=e.target.selectionStart; spSalva(); render(); const i=$('#spQ'); if(i){ i.focus(); try{ i.setSelectionRange(p,p); }catch(_){} } },300); } });
document.addEventListener('change',e=>{ const k=e.target.dataset.spf; if(k){ S.sp[k]=e.target.value; S.sp.n=30; spSalva(); render(); const s=$('#spf_'+k); if(s) s.focus(); } });
ACT.spAba=d=>{ S.sp.aba=d.v; S.sp.n=30; spSalva(); render(); };
ACT.spSet=d=>{ S.sp[d.k]=d.v; S.sp.n=30; spSalva(); render(); };
ACT.spTira=d=>{ S.sp[d.k]=SP0[d.k]; S.sp.n=30; spSalva(); render(); };
ACT.spLimpar=()=>{ Object.assign(S.sp,SP0); spSalva(); render(); toast('Filtros zerados.'); };
ACT.spLink=(d,a)=>{ window.open(a.href,'_blank','noopener'); };
ACT.spQuick=d=>{ S.sp.bairro=S.sp.bairro===d.v?'':d.v; S.sp.n=30; render(); };
ACT.spArq=d=>{ Object.assign(S.sp,SP0,{aba:'todas',arq:d.v}); spSalva(); render(); window.scrollTo({top:0,behavior:'smooth'}); };
ACT.spMais=()=>{ S.sp.n+=30; render(); };
const spArqs=()=>{ const m=new Map(); const add=(nome,x={})=>{ const k=N(nome); if(!k) return null; if(!m.has(k)) m.set(k,{nome,seg:null,origem:'radar',midia:0,ultima:null,n:0,fase:0,livre:0}); const a=m.get(k); if(x.seg) a.seg=x.seg; if(x.origem) a.origem=x.origem; if(x.n!=null) a.midia=x.n; if(x.ultima) a.ultima=x.ultima; return a; };
  for(const x of (SPD.meta?.arquitetos||[])) add(x.nome,x);
  for(const o of SPD.itens) if(o.arquitetura){ const a=add(o.arquitetura.trim()); a.n++; const livre=!o.construtora&&!spPropria(o); if(livre) a.livre++; if(livre&&o.alto&&SPFASE.has(o.estagio)) a.fase++; }
  return [...m.values()]; };
const AQSEG={residencial:'Residencial',edifícios:'Edifícios',corporativo:'Corporativo',interiores:'Interiores','varejo/hotelaria':'Varejo / hotelaria'};
ACT.spArqs=()=>{ const L=spArqs().sort((a,b)=>b.fase-a.fase||b.n-a.n||b.midia-a.midia||a.nome.localeCompare(b.nome)); const segs=[...new Set(L.map(a=>a.seg).filter(Boolean))];
  const row=a=>`<div class="aqr" data-n="${esc(N(a.nome))}" data-s="${esc(a.seg||(a.origem==='descoberto'?'_novo':''))}"><div><b>${esc(a.nome)}</b><small>${a.seg?AQSEG[a.seg]||a.seg:a.origem==='descoberto'?'Encontrado nas notícias':'Citado no radar'}</small></div>
    <div class="n">${a.n?`<b>${a.n}</b> obra${a.n>1?'s':''} no radar${a.fase?` · <b class="f">${a.fase}</b> na fase de contato`:''}`:'Sem obra no radar agora'}<br>${a.midia?`${a.midia} notícia${a.midia>1?'s':''} em 12 meses${a.ultima?` · última ${fd(a.ultima)}`:''}`:'Ainda não consultado ou sem notícias'}</div>
    <div class="bt">${a.n?`<button class="btn sm primary" data-act="spArqVer" data-v="${esc(a.nome)}">Ver obras</button>`:''}<a class="btn sm" target="_blank" rel="noopener" href="${gS(a.nome+' arquitetura site')}">${io('ext',12)}Site</a><a class="btn sm" target="_blank" rel="noopener" href="${lkC(a.nome)}">${io('pred',12)}LinkedIn</a><a class="btn sm" target="_blank" rel="noopener" href="https://news.google.com/search?q=${encodeURIComponent('"'+a.nome+'"')}&hl=pt-BR&gl=BR&ceid=BR:pt-419">${io('ext',12)}Notícias</a></div></div>`;
  modal(()=>dlg(`<h2 style="margin:0;font-size:17px">Escritórios de arquitetura de alto padrão</h2>`,
   `<p class="note" style="margin-top:0">${nf0.format(L.length)} escritórios acompanhados. O robô procura notícias de cada um em rodízio diário e acrescenta sozinho os que aparecem em obras de alto padrão na capital. "Na fase de contato" = obra sem construtora, ainda em projeto, aprovação ou lançamento.</p>
   <div class="aqtop"><input id="aqQ" placeholder="Filtrar por nome" autocomplete="off" autofocus><select id="aqS"><option value="">Todos os segmentos</option>${segs.map(s=>`<option value="${esc(s)}">${esc(AQSEG[s]||s)}</option>`).join('')}<option value="_novo">Encontrados nas notícias</option></select></div>
   <div class="aqlist">${L.map(row).join('')}</div>`,'',true)); };
ACT.spArqVer=d=>{ closeModal(); ACT.spArq(d); };
const aqFiltra=()=>{ const q=N($('#aqQ')?.value||''), s=$('#aqS')?.value||''; document.querySelectorAll('.aqr').forEach(r=>{ r.hidden=!((!q||r.dataset.n.includes(q))&&(!s||r.dataset.s===s)); }); };
document.addEventListener('input',e=>{ if(e.target.id==='aqQ') aqFiltra(); });
document.addEventListener('change',e=>{ if(e.target.id==='aqS') aqFiltra(); });
ACT.spProprias=()=>{ modal(()=>dlg('<h2 style="margin:0;font-size:17px">Incorporadoras com construção própria</h2>',
  `<p class="note" style="margin-top:0">Obras dessas empresas recebem a etiqueta "construção própria" e saem do filtro "Sem construtora definida". Uma empresa por linha.</p><textarea id="spPr" rows="12" style="width:100%">${esc(spProprias().join('\n'))}</textarea>`,
  `<button class="btn" data-act="spPrReset">Restaurar padrão</button><button class="btn primary" data-act="spPrSalvar">Salvar</button>`)); };
ACT.spPrSalvar=()=>{ const v=($('#spPr')?.value||'').split('\n').map(x=>x.trim()).filter(Boolean); ls('orcalivre.sp.proprias',v); closeModal(); render(); toast('Lista atualizada.'); };
ACT.spPrReset=()=>{ try{ localStorage.removeItem('orcalivre.sp.proprias'); }catch(e){} closeModal(); render(); };
const spAchar=id=>SPD.itens.find(o=>o.id===id)||minhas().find(m=>m.oid===id);
ACT.spFicha=d=>{ const o=spAchar(d.id); if(!o) return; S.opf=d.id;
  modal(()=>{ const x=spAchar(S.opf)||o; const sg=seguida(x.oid||x.id); const kv=(l,v,c='')=>`<div class="${c}">${l}<b>${v==null||v===''?'—':v}</b></div>`;
    const loc=[x.endereco,x.bairro,'São Paulo, SP'].filter(Boolean).join(', ');
    const arq=x.arquitetura?`<div class="row"><span class="lb">Escritório de arquitetura</span><div class="bt"><a class="btn sm primary" target="_blank" rel="noopener" href="${lkC(x.arquitetura)}">${io('pred',13)}${esc(x.arquitetura)} no LinkedIn</a><a class="btn sm" target="_blank" rel="noopener" href="${lkP('sócio '+curta(x.arquitetura))}">${io('user',13)}Sócios / arquitetos</a><a class="btn sm" target="_blank" rel="noopener" href="${gS(x.arquitetura+' arquitetura site')}">${io('ext',13)}Site</a><a class="btn sm" target="_blank" rel="noopener" href="${gS(x.arquitetura+' instagram')}">${io('ext',13)}Instagram</a></div></div>`:'';
    const rtsH=(x.rts||[]).length?`<h5>Responsáveis técnicos (alvará oficial)</h5><div class="oppp">${x.rts.map(r=>`<div><span>${esc(SPRTV[r.vinculo]||r.vinculo)}</span><b>${esc(r.nome)}${r.registro?` <small>· ${esc(r.conselho||'Registro')} ${esc(r.registro)}</small>`:''}</b><a class="btn sm" target="_blank" rel="noopener" href="${gS('"'+r.nome+'" arquitetura')}">${io('ext',13)}Escritório / site</a><a class="btn sm" target="_blank" rel="noopener" href="${lkP(r.nome)}">${io('user',13)}LinkedIn</a></div>`).join('')}</div>
      <p class="note" style="margin:6px 0 0">${x.execucao_outro?'O responsável pela execução é diferente do autor do projeto: provavelmente a obra já tem construtora ou engenheiro contratado. Vale confirmar com o arquiteto.':(x.rts.some(r=>r.vinculo==='execucao')?'O mesmo profissional responde pelo projeto e pela execução: é comum quando a construtora ainda não foi contratada.':'Ainda sem responsável pela execução no alvará: a obra provavelmente não tem construtora.')} Dados profissionais publicados pela Prefeitura (De Olho na Obra).</p>`:'';
    const dicaAlv=x.origem==='alvara'&&!(x.rts||[]).length?`<div class="row"><span class="lb">Quem é o responsável</span><div style="flex:1" class="note">O relatório de alvarás não informa o arquiteto. Caminhos: a placa de obra (obrigatória) traz os responsáveis técnicos pelo projeto e pela execução; o processo ${esc(x.processo||'')}${x.sei?` (SEI ${esc(x.sei)})`:''} pode ser consultado na Prefeitura; e a busca abaixo procura o endereço em notícias e portfólios de arquitetura.<div class="bt" style="margin-top:6px"><a class="btn sm" target="_blank" rel="noopener" href="${gS('"'+(x.endereco||'')+'" '+(x.bairro||'')+' arquitetura projeto')}">${io('ext',13)}Procurar projeto deste endereço</a><a class="btn sm" target="_blank" rel="noopener" href="${gS('"'+(x.processo||'')+'"')}">${io('ext',13)}Procurar o processo</a></div></div></div>`:'';
    const corpo=`<div class="opf"><div class="hdr"><span><b>Código:</b> ${esc(x.codigo||'')} · <b>Atualizado:</b> ${fd(x.atualizado)} · <b>No radar desde:</b> ${fd(x.primeira_vez)}</span><span><b>Fonte:</b> ${(SPORIG[x.origem]||['—'])[0]}</span></div>
      <h5>Dados da obra</h5><div class="kv">${kv('Obra',esc(x.obra),'w3')}${kv('Bairro / distrito',esc(x.bairro||'—'))}${kv('Endereço',esc(x.endereco||(x.residencia_pf?'Residência: só a rua é exibida':'—')))}${kv('Localização',`<a href="https://www.google.com/maps/search/${encodeURIComponent(loc)}" target="_blank" rel="noopener">${io('map',13)} Ver no mapa</a>`)}
       ${kv('Etapa',esc(x.estagio||''))}${kv('Tipo',esc(x.tipo||x.uso||'—'))}${kv('Zoneamento',esc(x.zona||'—'))}${x.area_terreno?kv('Área do terreno',Q(x.area_terreno)+' m²'):''}${x.area_construida_atual?kv('Área construída atual (IPTU)',Q(x.area_construida_atual)+' m²'):''}${x.area_m2?kv('Área do projeto',Q(x.area_m2)+' m²'):''}${x.unidades?kv('Unidades',nf0.format(x.unidades)):''}${x.valor?kv('Valor / VGV',brl(x.valor)):''}
       ${kv('Arquitetura',esc(x.arquitetura||(spRtP(x)?spRtP(x).nome+' (RT do projeto)':'Não informado')))}${kv('Construtora',x.construtora?esc(x.construtora):(spPropria(x)?'Construção própria (incorporadora)':'<span style="color:#0f9d74">Nenhuma identificada</span>'))}${kv('Incorporadora / empresa',esc(x.incorporadora||'—'))}${x.processo?kv('Processo',esc(x.processo)+(x.sei?' · SEI '+esc(x.sei):'')):''}</div>
      ${x.detalhes?`<h5>Detalhes</h5><p class="det">${esc(x.detalhes)}</p>`:''}
      ${(x.eventos||[]).length?`<h5>Histórico do licenciamento</h5><div class="det">${x.eventos.map(e=>`<div>• ${esc(e)}</div>`).join('')}</div>`:''}
      ${rtsH}
      ${(x.pessoas||[]).length?`<h5>Citados nas fontes</h5><div class="oppp">${x.pessoas.map(p=>`<div><span>${esc(p.cargo||'Citado')}</span><b>${esc(p.nome)}${p.empresa?` <small>· ${esc(p.empresa)}</small>`:''}</b><a class="btn sm" target="_blank" rel="noopener" href="${lkP(p.nome+' '+curta(p.empresa||x.arquitetura||''))}">${io('user',13)}LinkedIn</a></div>`).join('')}</div>`:''}
      <h5>Como chegar ao decisor</h5><div class="opdec">${arq}${dicaAlv}${x.incorporadora?decisor({...x,empresa:x.incorporadora}).replace(/^<h5>[^<]*<\/h5><div class="opdec">/,'').replace(/<\/div>\s*$/,''):eqBloco({...x,empresa:x.arquitetura||x.endereco||x.obra})}</div>
      <h5>Fontes</h5><div class="src">${(x.fontes||[]).map(f=>`<a href="${esc(f.url||'#')}" target="_blank" rel="noopener">${io('ext',15)}<span>${esc(f.t||'')}<small>${esc(f.veiculo||'')} · ${fd(f.data)}</small></span></a>`).join('')}</div></div>`;
    return dlg(`<div class="eyebrow">${esc(x.uso||'')} · ${esc(x.estagio||'')}</div><h2 style="margin:4px 0 0;font-size:17px;line-height:1.35">${esc(x.obra||'')}</h2>`, corpo,
      `<button class="btn" data-act="opOrc">Criar orçamento</button><button class="btn ${sg?'':'primary'}" data-act="opSeguir" data-id="${esc(x.oid||x.id)}">${io('star')} ${sg?'Acompanhando':'Acompanhar'}</button>`); }); };

const _opF=ACT.opFicha; ACT.opFicha=d=>String(d.id||'').startsWith('SP')?ACT.spFicha(d):_opF(d);
if(S.view==='opMinhas') carregarSP();

/* ================================================================ moldura */
const _r=render;
render=function(){ _r(); if(TT[S.view]){ const t=$('#uxtt'); if(t) t.innerHTML=`<span class="nm">${TT[S.view]}</span>`; } };
try{ render(); }catch(err){ console.error(err); }
})();
