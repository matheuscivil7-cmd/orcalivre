/* OrçaLivre · camada UX v3: novo layout (menu flutuante recolhível, barra superior limpa,
   cabeçalho do orçamento com abas), nova montagem da planilha (barra de inserção, "+" entre linhas,
   atalhos de teclado, filtro) e o Resumo do orçamento em formato de apresentação. Carregado por último. */
(function(){
"use strict";
if(!window.OF) return;
const {ic,LIVRES}=OF;
const BV=['plan','ins','abc','ind','crono','bdi','rel'];
const TABS=[['plan','Planilha','sheet'],['ins','Insumos','ins'],['abc','Curva ABC','abc'],['ind','Indicadores','ind'],['crono','Cronograma','cron'],['bdi','BDI','bdi'],['rel','Relatórios','rel']];
const TT={orcs:'Orçamentos',pesqC:'Composições',pesqI:'Insumos',own:'Composições próprias',bases:'Bases disponíveis',licRadar:'Radar de licitações',licMinhas:'Minhas licitações',licJuris:'Jurisprudência do TCU',licFerr:'Ferramentas da Lei 14.133',plan:'Planilha',ins:'Insumos do orçamento',abc:'Curva ABC',ind:'Indicadores',crono:'Cronograma',bdi:'BDI',rel:'Relatórios'};
const NN=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
const SV=(p,w=1.9)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I={plus:'<path d="M12 5v14M5 12h14"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',side:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
  play:'<path d="M7 4.5v15l12-7.5z"/>',down:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',x:'<path d="M18 6L6 18M6 6l12 12"/>',
  l:'<path d="M15 6l-6 6 6 6"/>',r:'<path d="M9 6l6 6-6 6"/>',col:'<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>',exp:'<path d="M7 4l5 5 5-5M7 20l5-5 5 5"/>',
  filt:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  deck:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="M7 12l3-3 2 2 4-4"/>',out:'<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4"/>'};
const ix=(k,w)=>SV(I[k],w);
const ini=s=>String(s||'?').replace(/\(.*?\)/g,'').trim().split(/\s+/).filter(w=>w.length>2||/^\d/.test(w)).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'O';
const mi=v=>{ v=+v||0; return v>=1e6?nf2.format(v/1e6)+' mi':v>=1e4?nf0.format(v/1e3)+' mil':R(v); };
const ago=t=>{ if(!t) return ''; const d=(Date.now()-t)/864e5; if(d<1/24) return 'agora há pouco'; if(d<1) return 'hoje'; if(d<2) return 'ontem'; if(d<30) return `há ${Math.floor(d)} dias`; return new Date(t).toLocaleDateString('pt-BR'); };
const lsg=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:v; }catch(e){ return d; } };
const lss=(k,v)=>{ try{ localStorage.setItem(k,v); }catch(e){} };

/* ================================================================ estilos */
const css=`
.shell{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;min-height:100vh}
.uxcol{min-width:0}
.uxside{position:sticky;top:12px;margin:12px 0 12px 12px;height:calc(100vh - 24px);width:248px;display:flex;flex-direction:column;background:var(--nx-side);border-radius:22px;box-shadow:0 24px 50px -28px rgba(11,16,32,.75);overflow:hidden;transition:width .22s ease;z-index:30}
.uxside::before{content:"";position:absolute;inset:auto -40% -30% -40%;height:60%;background:radial-gradient(closest-side,rgba(139,92,246,.22),transparent 70%);pointer-events:none}
.uxbrand{display:flex;align-items:center;gap:10px;padding:18px 18px 10px;color:#fff;font:800 18px var(--f-body);letter-spacing:-.02em;white-space:nowrap;position:relative}
.uxbrand .nxtag{font:600 9.5px var(--f-mono);color:#8a93ad;border:1px solid #2a3150;border-radius:999px;padding:2px 6px}
.uxbrand .nxw b{background:var(--nx-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.uxside .side{align-self:stretch!important;width:auto!important;min-width:0;max-width:100%;position:relative!important;top:auto!important;min-height:0!important;height:auto;flex:1 1 auto;overflow-y:auto!important;overflow-x:hidden!important;background:transparent!important;padding:4px 10px 12px!important;display:block!important;scrollbar-width:thin;scrollbar-color:#2a3150 transparent}
.uxside .side .grp{padding:16px 12px 6px;white-space:nowrap;display:block!important}
.uxside .side .nav{display:flex!important;width:100%;white-space:nowrap;border-bottom:0!important}
.uxside .side .nav span{overflow:hidden;text-overflow:ellipsis}
.uxside .side .cur{display:none}
.uxcur{display:flex;align-items:center;gap:10px;width:100%;margin:2px 0 4px;padding:9px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,rgba(139,92,246,.20),rgba(20,200,176,.10));color:#fff;cursor:pointer;text-align:left;transition:border-color .15s,transform .15s}
.uxcur:hover{border-color:rgba(255,255,255,.22)} .uxcur.on{border-color:#8b7cf8;box-shadow:0 0 0 3px rgba(139,92,246,.18)}
.uxcur .av,.uxcard .av{flex:0 0 34px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font:800 12px var(--f-body);color:#fff;background:var(--nx-grad)}
.uxcur .tx{min-width:0;display:flex;flex-direction:column;line-height:1.25}
.uxcur b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uxcur small{font:600 11px var(--f-mono);color:#8fe3d6}
.uxsfoot{padding:8px 10px 12px;border-top:1px solid rgba(255,255,255,.06);position:relative}
.uxmini-t{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:#8a93ad;font:600 12.5px var(--f-body);padding:9px 12px;border-radius:10px;cursor:pointer;white-space:nowrap}
.uxmini-t:hover{background:var(--nx-side2);color:#fff} .uxmini-t svg{width:18px;height:18px;flex:0 0 18px}
body.uxmini .uxside{width:76px}
body.uxmini .uxbrand{padding:18px 0 10px;justify-content:center} body.uxmini .uxbrand .nxw,body.uxmini .uxbrand .nxtag{display:none}
body.uxmini .uxside .side .grp{font-size:0;padding:10px 0 4px} body.uxmini .uxside .side .grp::after{content:"";display:block;height:1px;margin:0 14px;background:rgba(255,255,255,.08)}
body.uxmini .uxside .side .nav{justify-content:center;padding:10px 0} body.uxmini .uxside .side .nav span{display:none} body.uxmini .uxside .side .nav.on::before{display:none}
body.uxmini .uxcur{justify-content:center;padding:8px 0} body.uxmini .uxcur .tx{display:none}
body.uxmini .nxside-ai{display:none} body.uxmini .uxmini-t{justify-content:center;padding:9px 0} body.uxmini .uxmini-t span{display:none}
body.uxmini .uxmini-t svg{transform:scaleX(-1)}
/* barra superior */
.uxcol .top{position:sticky;top:0;z-index:25;height:64px;padding:0 22px 0 26px;gap:10px;background:rgba(243,244,249,.80);-webkit-backdrop-filter:saturate(1.5) blur(14px);backdrop-filter:saturate(1.5) blur(14px);border-bottom:0;box-shadow:none;flex-wrap:nowrap!important}
.uxcol .top .brand,.uxcol .top #oftb{display:none!important}
#uxmb{display:none;order:0;width:40px;height:40px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);place-items:center;cursor:pointer;flex:0 0 40px}
#uxmb svg{width:19px;height:19px}
.uxtt{order:1;flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:8px;font:800 17px var(--f-body);letter-spacing:-.02em;color:var(--ink);white-space:nowrap;overflow:hidden}
.uxtt a{color:#7a8196;font-weight:600;font-size:14px;cursor:pointer;text-decoration:none} .uxtt a:hover{color:var(--accent)}
.uxtt .sep{color:#c2c6d3;font-weight:500}
.uxtt .nm{overflow:hidden;text-overflow:ellipsis}
.uxcol .top .nxtopx{order:2;padding:0}
.uxcol .top .ctx{order:3;flex:0 0 auto!important;display:flex;align-items:center;gap:8px;padding:0!important;border:0!important;background:none!important}
.uxst{display:flex;align-items:center;gap:7px;font:600 12px var(--f-body);color:#5d6580;white-space:nowrap;padding:0 4px}
.uxst i{width:8px;height:8px;border-radius:50%;background:#14c8b0;box-shadow:0 0 0 4px rgba(20,200,176,.15)}
.uxst.w i{background:#e8a317;box-shadow:0 0 0 4px rgba(232,163,23,.16)} .uxst.p i{background:#4f7cff;animation:uxpulse 1s ease infinite}
@keyframes uxpulse{50%{opacity:.35}}
.uxav{width:38px;height:38px;border-radius:50%;border:0;cursor:pointer;font:800 13px var(--f-body);color:#fff;background:var(--nx-side);box-shadow:inset 0 0 0 2px rgba(255,255,255,.12),0 0 0 2px #fff,0 0 0 4px #c9c4ff}
.uxpop{position:fixed;z-index:70;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 22px 50px -18px rgba(11,16,32,.35);padding:6px;min-width:220px;animation:nxpop .16s ease}
.uxpop .h{padding:8px 10px 6px;font-size:11px;color:var(--muted)} .uxpop .h b{display:block;color:var(--ink);font-size:13px;word-break:break-all}
.uxpop button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;border-radius:9px;padding:8px 10px;font:600 13px var(--f-body);color:#2b3245;cursor:pointer;text-align:left}
.uxpop button:hover{background:var(--accent-soft);color:var(--accent)} .uxpop button svg{width:17px;height:17px;flex:0 0 17px}
.uxpop button kbd{margin-left:auto;font:600 10.5px var(--f-mono);background:var(--sunk);border:1px solid var(--line);border-radius:6px;padding:1px 6px;color:#596079}
.uxpop .ico{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:0 0 30px;color:#fff;background:var(--nx-grad)} .uxpop .ico svg{width:16px;height:16px}
.uxpop .ico.e{background:#0b1020} .uxpop .ico.s{background:#4f7cff} .uxpop .ico.i{background:#14c8b0}
.uxcol main{padding:4px 26px 90px}
.ofbc{display:none!important}
/* cabeçalho do orçamento */
.uxhero{position:relative;background:#fff;border:1px solid var(--line);border-radius:22px;padding:18px 20px 0;margin:6px 0 16px;box-shadow:var(--nx-sh);overflow:hidden}
.uxhero::after{content:"";position:absolute;right:-120px;top:-140px;width:380px;height:300px;background:radial-gradient(closest-side,rgba(139,92,246,.14),transparent 70%),radial-gradient(closest-side,rgba(20,200,176,.10),transparent 70%) 120px 80px/300px 240px no-repeat;pointer-events:none}
.uxh1{display:flex;align-items:flex-start;gap:14px;position:relative;z-index:1}
.uxh1 .av{flex:0 0 48px;width:48px;height:48px;border-radius:15px;display:grid;place-items:center;font:800 16px var(--f-body);color:#fff;background:var(--nx-grad);box-shadow:0 10px 22px -10px rgba(91,79,240,.7)}
.uxh1 .tl{min-width:0;flex:1}
.uxh1 h1{margin:0;font:800 23px/1.15 var(--f-body);letter-spacing:-.025em;color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.uxmeta{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-top:6px;font-size:12.5px;color:var(--muted)}
.uxchip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:3px 10px;font:600 11.5px var(--f-body);background:var(--sunk);border:1px solid var(--line);color:#4a5268}
.uxchip.v{background:var(--accent-soft);border-color:#dcd7ff;color:#4b3fd6}
.uxha{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.uxha .btn{display:inline-flex;align-items:center;gap:7px} .uxha .btn svg{width:15px;height:15px}
.uxkp{display:grid;grid-template-columns:1.35fr repeat(4,minmax(0,1fr));gap:10px;margin:16px 0 14px;position:relative;z-index:1}
.uxkp>div{border:1px solid var(--line);border-radius:15px;padding:10px 14px;background:linear-gradient(180deg,#fff,#fafbff);min-width:0}
.uxkp .l{font:700 10px var(--f-body);letter-spacing:.09em;text-transform:uppercase;color:#8a91a6}
.uxkp .v{font:800 18px var(--f-body);letter-spacing:-.02em;color:var(--ink);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uxkp .s{font-size:11px;color:var(--muted);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uxkp .main{background:var(--nx-side);border-color:var(--nx-side);position:relative;overflow:hidden}
.uxkp .main::after{content:"";position:absolute;inset:auto -20px -40px auto;width:140px;height:110px;background:radial-gradient(closest-side,rgba(20,200,176,.45),transparent 70%)}
.uxkp .main .l{color:#8a93ad} .uxkp .main .v{font-size:22px;background:linear-gradient(90deg,#c4b5fd,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent} .uxkp .main .s{color:#8a93ad}
.uxtabs{display:flex;gap:4px;overflow-x:auto;margin:0 -20px;padding:0 16px;border-top:1px solid var(--line);position:relative;z-index:1;scrollbar-width:none}
.uxtabs::-webkit-scrollbar{display:none}
.uxtabs button{position:relative;display:flex;align-items:center;gap:7px;border:0;background:none;padding:13px 12px 14px;font:700 13px var(--f-body);color:#6b7385;cursor:pointer;white-space:nowrap;transition:color .15s}
.uxtabs button svg{width:16px;height:16px;opacity:.8}
.uxtabs button:hover{color:var(--ink)}
.uxtabs button.on{color:var(--ink)} .uxtabs button.on svg{color:var(--accent);opacity:1}
.uxtabs button.on::after{content:"";position:absolute;left:10px;right:10px;bottom:-1px;height:3px;border-radius:3px 3px 0 0;background:var(--nx-grad)}
.uxtabs .sp{flex:1}
.uxtabs .deck{color:#4b3fd6} .uxtabs .deck svg{color:#7c5cf6}
.uxbody>.head{margin-top:2px} .uxbody>.head h1{font-size:19px}
.uxbody>.head .ofh .ic{display:none}
/* barra de montagem da planilha */
.uxbar{position:sticky;top:64px;z-index:12;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px;margin:0 0 10px;border-radius:16px;background:rgba(255,255,255,.88);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid var(--line);box-shadow:var(--nx-sh)}
.uxadd{display:flex;align-items:center;gap:4px;padding:3px;border-radius:12px;background:var(--sunk);border:1px solid var(--line)}
.uxadd .lb{font:700 10px var(--f-body);letter-spacing:.1em;text-transform:uppercase;color:#8a91a6;padding:0 8px 0 6px}
.uxab{display:flex;align-items:center;gap:7px;height:34px;padding:0 12px 0 6px;border:0;border-radius:9px;background:none;font:700 12.5px var(--f-body);color:#2b3245;cursor:pointer;transition:background .15s,box-shadow .15s}
.uxab .d{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:#fff;background:var(--nx-grad)} .uxab .d svg{width:14px;height:14px}
.uxab.E .d{background:#0b1020} .uxab.S .d{background:#4f7cff} .uxab.I .d{background:#14c8b0}
.uxab kbd{font:600 10px var(--f-mono);color:#8a91a6;border:1px solid var(--line);background:#fff;border-radius:5px;padding:0 5px;line-height:16px}
.uxab:hover{background:#fff;box-shadow:0 2px 8px -3px rgba(18,24,38,.18)}
.uxab.on{background:#fff;box-shadow:0 0 0 2px #8b7cf8}
.uxbar .grow{flex:1}
.uxfind{display:flex;align-items:center;gap:8px;height:38px;padding:0 10px;border-radius:11px;border:1px solid var(--line);background:#fff;min-width:240px;color:#8a91a6}
.uxfind svg{width:16px;height:16px;flex:0 0 16px} .uxfind input{border:0;outline:0;background:none;font:500 13px var(--f-body);color:var(--ink);flex:1;min-width:0;padding:0}
.uxfind kbd{font:600 10px var(--f-mono);border:1px solid var(--line);border-radius:5px;padding:0 5px;background:var(--sunk)}
.uxfind .n{font:600 11px var(--f-mono);color:var(--accent);white-space:nowrap}
.uxfind:focus-within{border-color:#8b7cf8;box-shadow:0 0 0 4px rgba(91,79,240,.10)}
.uxib{width:38px;height:38px;border-radius:11px;border:1px solid var(--line);background:#fff;display:grid;place-items:center;color:#4a5268;cursor:pointer} .uxib:hover{color:var(--accent);border-color:#c9c4ff} .uxib svg{width:17px;height:17px}
.uxtip{font-size:11.5px;color:#8a91a6;margin:10px 2px 0;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.uxtip kbd{font:600 10px var(--f-mono);border:1px solid var(--line);border-radius:5px;padding:0 5px;background:#fff;color:#596079}
.uxtip .pl{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--nx-grad);color:#fff;font-weight:800;font-size:12px;line-height:1}
.ofsheet{border-radius:18px!important}
.uxbody .ofsheet .scroll{max-height:calc(100vh - 150px)}
.ofp tr.e td{background:#f3f1ff;color:#231d73;border-bottom-color:#e4e0ff}
.ofp tr.e td:first-child{box-shadow:inset 4px 0 0 #7c5cf6;font-weight:800}
.ofp tr.s td{background:#f7f8ff} .ofp tr.s td:first-child{box-shadow:inset 4px 0 0 #4f7cff}
.ofp tr.e td:nth-child(4){position:relative}
.ofp tr.e td:nth-child(4) .hin{width:calc(100% - 130px);font-weight:800;letter-spacing:.01em}
.uxpct{position:absolute;right:8px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:7px;font:700 11px var(--f-mono);color:#4b3fd6}
.uxpct i{display:block;width:64px;height:6px;border-radius:6px;background:#e2defd;overflow:hidden} .uxpct i b{display:block;height:100%;border-radius:6px;background:var(--nx-grad)}
#uxins{position:fixed;z-index:24;height:0;pointer-events:none;display:none}
#uxins .bt{pointer-events:auto;position:absolute;left:-13px;top:-12px;width:24px;height:24px;border-radius:50%;border:0;display:grid;place-items:center;color:#fff;background:var(--nx-grad);box-shadow:0 4px 12px -3px rgba(91,79,240,.7);cursor:pointer;transition:transform .15s}
#uxins .bt svg{width:14px;height:14px} #uxins .bt:hover{transform:scale(1.15)}
#uxins .ln{position:absolute;left:12px;right:0;top:-1px;height:2px;border-radius:2px;background:var(--nx-grad);opacity:0;transition:opacity .15s}
#uxins .bt:hover+.ln{opacity:1}
.uxempty{padding:34px 20px!important;text-align:center;background:#fff!important}
.uxempty h3{margin:0 0 4px;font:800 18px var(--f-body);color:var(--ink)} .uxempty p{margin:0 0 18px;color:var(--muted);font-size:13px}
.uxempty .g{display:grid;grid-template-columns:repeat(4,minmax(0,170px));gap:12px;justify-content:center}
.uxempty .g button{display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;padding:14px;border-radius:16px;border:1px solid var(--line);background:#fafbff;cursor:pointer;font:700 13px var(--f-body);color:var(--ink);transition:transform .15s,box-shadow .15s,border-color .15s}
.uxempty .g button:hover{transform:translateY(-2px);border-color:#c9c4ff;box-shadow:0 14px 28px -18px rgba(91,79,240,.6)}
.uxempty .g small{font-weight:500;color:var(--muted);font-size:11.5px;line-height:1.35}
.uxempty .g .d{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:#fff;background:var(--nx-grad)} .uxempty .g .d svg{width:17px;height:17px}
.uxempty .g .E .d{background:#0b1020} .uxempty .g .S .d{background:#4f7cff} .uxempty .g .I .d{background:#14c8b0}
/* lista de orçamentos */
.uxwel{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:8px 0 16px}
.uxwel h1{margin:0;font:800 28px/1.1 var(--f-body);letter-spacing:-.03em} .uxwel p{margin:6px 0 0;color:var(--muted);font-size:13.5px}
.uxwel .acts{display:flex;gap:8px;flex-wrap:wrap}
.uxstats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
.uxstats>div{border-radius:18px;padding:14px 16px;background:#fff;border:1px solid var(--line);box-shadow:var(--nx-sh)}
.uxstats>div:first-child{background:var(--nx-side);border-color:var(--nx-side);color:#fff}
.uxstats .l{font:700 10px var(--f-body);letter-spacing:.09em;text-transform:uppercase;color:#8a91a6}
.uxstats .v{font:800 22px var(--f-body);letter-spacing:-.02em;margin-top:4px}
.uxstats>div:first-child .v{background:linear-gradient(90deg,#c4b5fd,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent}
.uxgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
.uxcard{position:relative;display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:20px;background:#fff;border:1px solid var(--line);box-shadow:var(--nx-sh);transition:transform .18s,box-shadow .18s,border-color .18s;cursor:pointer}
.uxcard:hover{transform:translateY(-3px);border-color:#d6d1ff;box-shadow:0 22px 40px -24px rgba(91,79,240,.55)}
.uxcard.on{border-color:#8b7cf8;box-shadow:0 0 0 3px rgba(139,92,246,.14)}
.uxcard .tp{display:flex;gap:12px;align-items:flex-start}
.uxcard .tp .tx{min-width:0;flex:1} .uxcard h3{margin:0;font:800 15px/1.25 var(--f-body);color:var(--ink);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.uxcard .mt{font-size:12px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uxcard .tot{font:800 22px var(--f-body);letter-spacing:-.02em;color:var(--ink)} .uxcard .tot small{font:600 11px var(--f-body);color:var(--muted);letter-spacing:0;margin-left:6px}
.uxcard .ft{display:flex;align-items:center;gap:6px;border-top:1px dashed var(--line);padding-top:10px}
.uxcard .ft .when{font-size:11.5px;color:#8a91a6;margin-right:auto}
.uxcard .bar{height:5px;border-radius:5px;background:#eef0f6;overflow:hidden;display:flex} .uxcard .bar i{display:block;height:100%}
.uxnew{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:190px;border-radius:20px;border:2px dashed #d6d1ff;background:linear-gradient(135deg,rgba(139,92,246,.06),rgba(20,200,176,.05));cursor:pointer;font:800 15px var(--f-body);color:#4b3fd6;transition:border-color .15s,transform .15s}
.uxnew:hover{border-color:#8b7cf8;transform:translateY(-2px)} .uxnew .d{width:46px;height:46px;border-radius:15px;display:grid;place-items:center;color:#fff;background:var(--nx-grad);box-shadow:0 12px 24px -12px rgba(91,79,240,.8)} .uxnew .d svg{width:22px;height:22px}
.uxnew small{font:500 12px var(--f-body);color:var(--muted)}
/* relatórios: destaque da apresentação */
.uxfeat{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:20px;align-items:center;padding:22px 24px;margin-bottom:16px;border-radius:22px;background:var(--nx-side);color:#fff;position:relative;overflow:hidden}
.uxfeat::before{content:"";position:absolute;inset:-40% -10% auto auto;width:520px;height:420px;background:radial-gradient(closest-side,rgba(139,92,246,.45),transparent 70%),radial-gradient(closest-side,rgba(20,200,176,.35),transparent 70%) 200px 160px/320px 260px no-repeat;pointer-events:none}
.uxfeat>*{position:relative} .uxfeat .ey{font:700 10.5px var(--f-body);letter-spacing:.12em;text-transform:uppercase;color:#8fe3d6}
.uxfeat h2{margin:6px 0 6px;font:800 22px var(--f-body);letter-spacing:-.02em;color:#fff} .uxfeat p{margin:0 0 14px;color:#a4adc4;font-size:13px;line-height:1.5;max-width:560px}
.uxfeat .row{display:flex;gap:8px;flex-wrap:wrap} .uxfeat .btn{display:inline-flex;gap:7px;align-items:center} .uxfeat .btn svg{width:15px;height:15px}
.uxfeat .btn.gh{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.16)}
.uxmock{aspect-ratio:16/9;border-radius:12px;background:#fff;box-shadow:0 20px 40px -18px rgba(0,0,0,.6);padding:12px;display:grid;grid-template-rows:auto 1fr;gap:8px;transform:rotate(-2deg)}
.uxmock .t{height:8px;width:55%;border-radius:4px;background:#0b1020} .uxmock .c{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.uxmock .c i{border-radius:8px;background:#f1f0ff} .uxmock .c i:first-child{background:conic-gradient(#8b5cf6 0 40%,#4f7cff 0 70%,#14c8b0 0 100%);border-radius:50%;width:70%;aspect-ratio:1;margin:auto}
/* apresentação */
#uxdeck{position:fixed;inset:0;z-index:95;background:#070a15;display:flex;flex-direction:column;color:#fff;animation:nxup .25s ease}
#uxdeck .dt{display:flex;align-items:center;gap:10px;padding:10px 16px;font:600 13px var(--f-body);color:#a4adc4}
#uxdeck .dt b{color:#fff;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#uxdeck .dt .sp{flex:1} #uxdeck .dt .pg{font:600 12px var(--f-mono);color:#8a93ad}
#uxdeck .db{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font:700 12.5px var(--f-body);cursor:pointer}
#uxdeck .db:hover{background:rgba(255,255,255,.12)} #uxdeck .db svg{width:16px;height:16px} #uxdeck .db.pr{background:var(--nx-grad);border:0}
#uxdeck .stg{flex:1;position:relative;overflow:hidden}
#uxdeck .scl{position:absolute;left:50%;top:50%;width:1280px;height:720px;transform-origin:center center}
#uxdeck .nav{display:flex;align-items:center;justify-content:center;gap:12px;padding:10px 16px 14px}
#uxdeck .nb{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#fff;display:grid;place-items:center;cursor:pointer} #uxdeck .nb svg{width:18px;height:18px} #uxdeck .nb:disabled{opacity:.3;cursor:default}
#uxdeck .dots{display:flex;gap:6px} #uxdeck .dots button{width:8px;height:8px;border-radius:8px;border:0;background:rgba(255,255,255,.22);cursor:pointer;padding:0;transition:width .2s,background .2s} #uxdeck .dots button.on{width:26px;background:linear-gradient(90deg,#8b5cf6,#14c8b0)}
.sl{position:absolute;inset:0;width:1280px;height:720px;background:#f6f7fb;color:#121826;font-family:var(--f-body);overflow:hidden;display:none;border-radius:6px;box-shadow:0 40px 90px -30px rgba(0,0,0,.8)}
.sl.on{display:block;animation:slin .35s ease}
@keyframes slin{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
.sl .in{position:absolute;inset:0;padding:56px 72px 64px;display:flex;flex-direction:column}
.sl .ey{font:700 13px var(--f-body);letter-spacing:.16em;text-transform:uppercase;color:#5b4ff0}
.sl h2{margin:8px 0 26px;font:800 40px/1.1 var(--f-body);letter-spacing:-.03em;color:#0b1020}
.sl .ft{position:absolute;left:72px;right:72px;bottom:24px;display:flex;align-items:center;gap:10px;font:600 12px var(--f-body);color:#8a91a6}
.sl .ft .lg{display:flex;align-items:center;gap:8px;color:#0b1020;font-weight:800} .sl .ft .sp{flex:1}
.sl .ft::before{content:"";position:absolute;left:0;right:0;top:-12px;height:1px;background:#e5e7f0}
.sl .acc{position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,#8b5cf6,#4f7cff,#14c8b0)}
.sl.dk{background:#0b1020;color:#fff}
.sl.dk::before{content:"";position:absolute;inset:-20%;background:radial-gradient(closest-side,rgba(139,92,246,.55),transparent 70%) 8% 12%/55% 60% no-repeat,radial-gradient(closest-side,rgba(20,200,176,.38),transparent 70%) 95% 90%/55% 60% no-repeat,radial-gradient(closest-side,rgba(79,124,255,.40),transparent 70%) 75% 5%/40% 45% no-repeat}
.sl.dk .in{z-index:1}
.sl .cv-b{display:flex;align-items:center;gap:12px;font:800 24px var(--f-body);letter-spacing:-.02em}
.sl .cv-b .nxw b{background:var(--nx-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.sl .cv-k{margin-top:auto;font:700 14px var(--f-body);letter-spacing:.18em;text-transform:uppercase;color:#8fe3d6}
.sl .cv-t{font:800 62px/1.04 var(--f-body);letter-spacing:-.035em;margin:12px 0 16px;max-width:1000px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.sl .cv-m{display:flex;gap:10px;flex-wrap:wrap}
.sl .cv-m span{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);border-radius:999px;padding:7px 14px;font:600 15px var(--f-body);color:#d5daea}
.sl .cv-tot{margin-top:38px;display:flex;align-items:flex-end;gap:40px}
.sl .cv-tot .l{font:700 12px var(--f-body);letter-spacing:.14em;text-transform:uppercase;color:#8a93ad}
.sl .cv-tot .v{font:800 54px var(--f-body);letter-spacing:-.03em;background:linear-gradient(90deg,#c4b5fd,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent}
.sl .cv-tot .v2{font:800 30px var(--f-body);color:#fff}
.sl .kg{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.sl .k{background:#fff;border:1px solid #e5e7f0;border-radius:20px;padding:20px 22px;box-shadow:0 14px 30px -22px rgba(31,27,99,.35)}
.sl .k .l{font:700 12px var(--f-body);letter-spacing:.1em;text-transform:uppercase;color:#8a91a6}
.sl .k .v{font:800 32px var(--f-body);letter-spacing:-.03em;margin-top:6px;color:#0b1020;white-space:nowrap}
.sl .k .s{font-size:14px;color:#6b7385;margin-top:4px}
.sl .k.hl{background:#0b1020;border-color:#0b1020} .sl .k.hl .v{background:linear-gradient(90deg,#c4b5fd,#7dd3fc,#5eead4);-webkit-background-clip:text;background-clip:text;color:transparent} .sl .k.hl .s{color:#8a93ad}
.sl .ins{margin-top:22px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.sl .ins div{display:flex;gap:12px;align-items:flex-start;font-size:16px;line-height:1.4;color:#2b3245;background:#fff;border:1px solid #e5e7f0;border-radius:16px;padding:14px 16px}
.sl .ins i{flex:0 0 28px;height:28px;border-radius:9px;background:var(--nx-grad);display:grid;place-items:center;color:#fff;font:800 13px var(--f-body);font-style:normal}
.sl .two{display:grid;grid-template-columns:1.25fr 1fr;gap:28px;flex:1;min-height:0}
.sl .pn{background:#fff;border:1px solid #e5e7f0;border-radius:22px;padding:22px 24px;min-height:0;overflow:hidden}
.sl .pn h3{margin:0 0 14px;font:800 16px var(--f-body);color:#0b1020}
.sl .hb{display:grid;grid-template-columns:250px minmax(0,1fr) 110px;gap:15px 16px;align-items:center;font-size:15px}
.sl .hb .lb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#2b3245;font-weight:600}
.sl .hb .tr{height:14px;border-radius:8px;background:#eef0f6;overflow:hidden} .sl .hb .tr i{display:block;height:100%;border-radius:8px}
.sl .hb .vv{text-align:right;font:700 14px var(--f-mono);color:#0b1020} .sl .hb .vv small{display:block;font:600 11px var(--f-body);color:#8a91a6}
.sl .lg2{display:flex;flex-direction:column;gap:12px;font-size:15px}
.sl .lg2 div{display:flex;align-items:center;gap:10px} .sl .lg2 i{width:14px;height:14px;border-radius:4px;flex:0 0 14px} .sl .lg2 b{margin-left:auto;font-family:var(--f-mono)} .sl .lg2 span{color:#6b7385}
.sl table{width:100%;border-collapse:collapse;font-size:14px}
.sl th{text-align:left;font:700 11px var(--f-body);letter-spacing:.08em;text-transform:uppercase;color:#8a91a6;padding:0 10px 10px;border-bottom:1px solid #e5e7f0}
.sl td{padding:8px 10px;border-bottom:1px solid #f0f1f6;color:#2b3245;vertical-align:middle}
.sl td.d{max-width:560px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl td.r,.sl th.r{text-align:right} .sl td.m{font-family:var(--f-mono);font-size:13px}
.sl .cl{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;color:#fff;font:800 12px var(--f-body)}
.sl .abcg{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
.sl .abcg div{border-radius:16px;padding:12px 16px;border:1px solid #e5e7f0;background:#fff;font-size:13px;color:#6b7385}
.sl .abcg b{display:block;font:800 24px var(--f-body);color:#0b1020}
.sl .note{font-size:13px;color:#8a91a6;margin-top:10px;line-height:1.45}
.sl .pr{display:grid;grid-template-columns:240px 1fr;gap:12px 20px;font-size:16px}
.sl .pr dt{font-weight:700;color:#6b7385} .sl .pr dd{margin:0;color:#121826;font-weight:600}
body.uxprint>*:not(#uxdeck){display:none!important}
@media print{
  body.uxprint{background:#fff!important}
  body.uxprint #uxdeck{position:static;display:block;background:#fff;animation:none}
  body.uxprint #uxdeck .dt,body.uxprint #uxdeck .nav{display:none!important}
  body.uxprint #uxdeck .stg{overflow:visible} body.uxprint #uxdeck .scl{position:static;transform:none!important;width:auto;height:auto}
  body.uxprint .sl{display:block!important;position:relative;inset:auto;border-radius:0;box-shadow:none;page-break-after:always;break-after:page;animation:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body.uxprint .sl *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
#uxbd{display:none}
@media (max-width:1180px){ .uxkp{grid-template-columns:repeat(3,minmax(0,1fr))} .uxkp>div:nth-child(n+4){display:none} }
@media (max-width:860px){
  .shell{display:block!important}
  .uxside{position:fixed!important;left:0;top:0;bottom:0;margin:0;height:100%;width:270px!important;border-radius:0 22px 22px 0;transform:translateX(-105%);transition:transform .25s ease;z-index:80}
  body.uxdrawer .uxside{transform:none}
  body.uxdrawer #uxbd{display:block;position:fixed;inset:0;z-index:79;background:rgba(11,16,32,.45);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
  body.uxmini .uxside .side .nav span,body.uxmini .uxbrand .nxw,body.uxmini .uxcur .tx{display:initial}
  .uxmini-t{display:none!important}
  #uxmb{display:grid}
  .uxcol .top{padding:0 12px;height:60px}
  .uxtt{font-size:15px} .uxtt a,.uxtt .sep{display:none}
  .uxst span{display:none}
  .uxcol main{padding:4px 12px 90px}
  .uxh1{flex-wrap:wrap} .uxh1 .av{display:none} .uxha{width:100%;justify-content:flex-start}
  .uxkp{grid-template-columns:repeat(2,minmax(0,1fr))} .uxkp>div:nth-child(n+4){display:none} .uxkp .main{grid-column:1/-1}
  .uxbar{top:60px} .uxadd{width:100%;overflow-x:auto;scrollbar-width:none} .uxadd::-webkit-scrollbar{display:none} .uxadd .lb{display:none} .uxab kbd{display:none} .uxfind{min-width:0;flex:1}
  .uxempty .g{grid-template-columns:repeat(2,minmax(0,1fr))}
  .uxstats{grid-template-columns:1fr} .uxfeat{grid-template-columns:1fr} .uxmock{display:none}
  #uxins{display:none!important}
  #uxdeck .dt .lbl{display:none}
}`;
const st=document.createElement('style'); st.id='uxcss'; st.textContent=css; document.head.appendChild(st);
if(lsg('orcalivre.ux.mini','0')==='1') document.body.classList.add('uxmini');

/* ================================================================ moldura */
function shell(){ const sh=$('.shell'), side=$('#side'), top=$('.top'), main=$('#main'); if(!sh||!side||!top||!main||$('#uxside')) return;
  const as=document.createElement('aside'); as.id='uxside'; as.className='uxside'; sh.insertBefore(as,side);
  const br=$('.top .brand'); as.innerHTML=`<div class="uxbrand">${br?br.innerHTML.replace(/nxg(\d+)/g,'uxg$1'):'OrçaLivre'}</div>`;
  as.appendChild(side);
  as.insertAdjacentHTML('beforeend',`<div class="uxsfoot"><button class="uxmini-t" data-act="uxMini" title="Recolher ou expandir o menu">${ix('side')}<span>Recolher menu</span></button></div>`);
  const col=document.createElement('div'); col.className='uxcol'; sh.insertBefore(col,main); col.appendChild(top); col.appendChild(main);
  top.insertAdjacentHTML('afterbegin',`<button id="uxmb" data-act="uxDrawer" aria-label="Abrir menu">${ix('menu')}</button><div class="uxtt" id="uxtt"></div>`);
  document.body.insertAdjacentHTML('beforeend','<div id="uxbd" data-act="uxDrawer"></div>'); }
function paintTitle(){ const t=$('#uxtt'); if(!t) return; const o=S.cur, v=S.view;
  t.innerHTML=BV.includes(v)&&o?`<a data-act="go" data-v="orcs">Orçamentos</a><span class="sep">/</span><span class="nm">${esc(o.nome)}</span>`:`<span class="nm">${esc(TT[v]||'OrçaLivre')}</span>`; }

renderSide=function(){ const o=S.cur; let h='', pend=null;
  for(const [k,l,icn] of NAV){ if(k==='g'){ pend=l==='Orçamento aberto'?null:l; continue; } if(BV.includes(k)) continue; if(!LIVRES.includes(k)&&!o) continue;
    if(pend){ h+=`<div class="grp">${esc(pend)}</div>`; pend=null; }
    h+=`<button class="nav ${S.view===k?'on':''}" data-act="go" data-v="${k}" title="${esc(l)}">${ic(icn)}<span>${esc(l)}</span></button>`; }
  if(o){ const {tot}=calc(o); h+=`<div class="grp">Orçamento aberto</div><button class="uxcur ${BV.includes(S.view)?'on':''}" data-act="go" data-v="plan" title="${esc(o.nome)}"><span class="av">${esc(ini(o.nome))}</span><span class="tx"><b>${esc(o.nome)}</b><small>R$ ${R(tot.pv)}</small></span></button>`; }
  $('#side').innerHTML=h; };
renderCtx=function(){ const el=$('#ctx'); if(!el) return; let s;
  if(Store.mode==='db') s=S.saving==='pend'?'<span class="uxst p"><i></i><span>Salvando…</span></span>':'<span class="uxst" title="Seus dados estão salvos na sua conta"><i></i><span>Salvo na nuvem</span></span>';
  else s='<span class="uxst w" title="Os dados ficam só neste navegador. Entre na sua conta para salvá-los na nuvem."><i></i><span>Só neste navegador</span></span>';
  const u=Store.user; const em=u?.email||'';
  const acc=u?`<button class="uxav" data-act="uxUser" title="${esc(em)}">${esc((em[0]||'U').toUpperCase())}</button>`:(Store.sb?'<button class="btn sm primary" data-act="entrar">Entrar</button>':'');
  el.innerHTML=s+acc; };

/* ================================================================ cabeçalho do orçamento */
function hero(v){ const o=S.cur; if(!o) return ''; const {tot,bdi,rows}=calc(o); const nS=rows.filter(r=>r.it.k==='V').length, nE=o.items.filter(i=>i.k==='E').length, a=num(o.area)||0;
  const meta=[o.cliente&&esc(o.cliente),o.local&&esc(o.local)].filter(Boolean).join(' · ');
  return `<section class="uxhero"><div class="uxh1"><span class="av">${esc(ini(o.nome))}</span><div class="tl"><h1 title="${esc(o.nome)}">${esc(o.nome)}</h1>
    <div class="uxmeta">${meta?`<span>${meta}</span>`:''}<span class="uxchip v">${esc(labelOf(o.base))}</span>${o.dataBase?`<span class="uxchip">Data-base ${esc(fmtMes(o.dataBase))}</span>`:''}${o.ex?'<span class="uxchip" style="background:#fff6e5;border-color:#f6e2b5;color:#9a6100">Exemplo</span>':''}${S.loadingB?'<span class="uxchip">carregando bancos…</span>':''}</div></div>
    <div class="uxha"><button class="btn" data-act="ofEdit">${ix('edit')}Dados da obra</button><button class="btn" data-act="ofRef">${ix('cal')}Banco e data-base</button><button class="btn primary" data-act="uxShow">${ix('play')}Apresentação</button></div></div>
   <div class="uxkp"><div class="main"><div class="l">Preço total com BDI</div><div class="v">R$ ${R(tot.pv)}</div><div class="s">${nS} serviços em ${nE} etapas</div></div>
    <div><div class="l">Custo direto</div><div class="v">R$ ${R(tot.cd)}</div><div class="s">sem BDI</div></div>
    <div><div class="l">BDI</div><div class="v">${P(bdi*100)}</div><div class="s">R$ ${R(tot.bdiV)}</div></div>
    <div><div class="l">Preço por m²</div><div class="v">${a?'R$ '+R(tot.pv/a):'—'}</div><div class="s">${a?Q(a)+' m²':'informe a área em Dados da obra'}</div></div>
    <div><div class="l">Prazo</div><div class="v">${o.prazo?esc(o.prazo)+' meses':'—'}</div><div class="s">${o.prazo&&tot.pv?'R$ '+mi(tot.pv/(num(o.prazo)||1))+' por mês':'cronograma'}</div></div></div>
   <nav class="uxtabs" aria-label="Seções do orçamento">${TABS.map(([k,l,icn])=>`<button class="${v===k?'on':''}" data-act="go" data-v="${k}">${ic(icn)}${l}</button>`).join('')}<span class="sp"></span><button class="deck" data-act="uxShow">${ix('deck')}Resumo em apresentação</button></nav></section>`; }

/* ================================================================ planilha: montagem */
function planBar(){ const A=S.add; const b=(k,l,icn,key)=>`<button class="uxab ${k} ${A&&A.k===k?'on':''}" data-act="ofNew" data-k="${k}" title="Adicionar ${l.toLowerCase()} (tecla ${key})"><span class="d">${icn}</span>${l}<kbd>${key}</kbd></button>`;
  return `<div class="uxbar"><div class="uxadd" role="toolbar" aria-label="Inserir na planilha"><span class="lb">Inserir</span>
    ${b('E','Etapa',ic('etapa',2),'E')}${b('S','Subetapa',ic('list',2),'S')}${b('C','Composição',ic('brick',1.8),'C')}${b('I','Insumo',ic('cube',1.8),'I')}</div>
    <span class="grow"></span>
    <label class="uxfind">${ix('filt')}<input id="uxFind" placeholder="Filtrar serviços na planilha" value="${esc(S.uxf||'')}" autocomplete="off" aria-label="Filtrar na planilha"><span class="n" id="uxFindN"></span><kbd>/</kbd></label>
    <button class="uxib" data-act="uxColap" title="Recolher todas as etapas">${ix('col')}</button><button class="uxib" data-act="uxExp" title="Expandir todas as etapas">${ix('exp')}</button></div>`; }
const EMPTY=`<tr class="hint"><td colspan="11" class="uxempty"><h3>Comece a montar o orçamento</h3><p>Crie a primeira etapa e depois insira composições ou insumos de qualquer banco.</p><div class="g">
  <button class="E" data-act="ofNew" data-k="E"><span class="d">${'§E'}</span>Etapa<small>Agrupa os serviços (ex.: Serviços preliminares)</small></button>
  <button class="S" data-act="ofNew" data-k="S"><span class="d">${'§S'}</span>Subetapa<small>Divide uma etapa em partes</small></button>
  <button class="C" data-act="ofNew" data-k="C"><span class="d">${'§C'}</span>Composição<small>Serviço com custo unitário do banco</small></button>
  <button class="I" data-act="ofNew" data-k="I"><span class="d">${'§I'}</span>Insumo<small>Material, mão de obra ou equipamento</small></button></div></td></tr>`;
const _plan=VIEWS.plan;
VIEWS.plan=()=>{ let h=_plan();
  const a=h.indexOf('<div class="oftiles">'), b=h.indexOf('<div class="ofsheet">'); if(a>=0&&b>a) h=h.slice(0,a)+h.slice(b);
  if(h.indexOf('<div class="head">')===0){ const nb=h.search(/<div class="banner">|<div class="ofsheet">/); if(nb>0) h=h.slice(nb); }
  h=h.replace(/<tr class="hint"><td colspan="11">Planilha vazia\.[\s\S]*?<\/td><\/tr>/,EMPTY.replace('§E',ic('etapa',2)).replace('§S',ic('list',2)).replace('§C',ic('brick',1.8)).replace('§I',ic('cube',1.8)));
  const si=h.indexOf('<div class="ofsheet">'); if(si>=0) h=h.slice(0,si)+planBar()+h.slice(si);
  return h+`<div class="uxtip">Passe o mouse na borda entre duas linhas e clique em <span class="pl">+</span> para inserir ali · atalhos <kbd>E</kbd> etapa <kbd>S</kbd> subetapa <kbd>C</kbd> composição <kbd>I</kbd> insumo <kbd>/</kbd> filtrar</div>`; };
function decoPlan(){ const o=S.cur; if(!o) return; const {grp,tot}=calc(o);
  document.querySelectorAll('#ofScroll tr.e[data-row]').forEach(tr=>{ const g=grp[tr.dataset.row]; const td=tr.children[3]; if(!g||!td||td.querySelector('.uxpct')) return; const p=tot.pv?g.pv/tot.pv*100:0;
    td.insertAdjacentHTML('beforeend',`<span class="uxpct" title="Participação da etapa no preço total"><i><b style="width:${Math.min(100,p).toFixed(1)}%"></b></i>${P(p)}</span>`); });
  applyFind(); }
function applyFind(){ const q=NN(S.uxf||'').trim(); const rows=[...document.querySelectorAll('#ofScroll tbody tr[data-row]')]; const n=$('#uxFindN');
  if(!q){ rows.forEach(r=>r.style.display=''); if(n) n.textContent=''; return; }
  const terms=q.split(/\s+/); let shown=0; const vis=new Map();
  for(const r of rows){ if(!r.classList.contains('v')) continue; const t=NN(r.textContent); const ok=terms.every(w=>t.includes(w)); r.style.display=ok?'':'none'; if(ok) shown++; vis.set(r,ok); }
  let grpRows=[], anyE=false, anyS=false, curE=null, curS=null;
  const flushS=()=>{ if(curS) curS.style.display=anyS?'':'none'; curS=null; anyS=false; };
  const flushE=()=>{ flushS(); if(curE) curE.style.display=anyE?'':'none'; curE=null; anyE=false; };
  for(const r of rows){ if(r.classList.contains('e')){ flushE(); curE=r; } else if(r.classList.contains('s')){ flushS(); curS=r; } else if(vis.get(r)){ anyE=true; anyS=true; } }
  flushE(); if(n) n.textContent=shown+' de '+rows.filter(r=>r.classList.contains('v')).length; }

/* "+" entre as linhas */
const insEl=document.createElement('div'); insEl.id='uxins'; insEl.innerHTML=`<button class="bt" data-act="uxInsMenu" aria-label="Inserir abaixo desta linha" title="Inserir abaixo desta linha">${ix('plus',2.6)}</button><div class="ln"></div>`; document.body.appendChild(insEl);
let insRow=null, insT=0;
function hideIns(){ insEl.style.display='none'; insRow=null; }
document.addEventListener('mouseover',e=>{ if(S.view!=='plan'||S.add||!S.cur){ if(insRow) hideIns(); return; }
  if(e.target.closest&&e.target.closest('#uxins')){ clearTimeout(insT); return; }
  const tr=e.target.closest&&e.target.closest('#ofScroll tbody tr[data-row]');
  if(!tr){ clearTimeout(insT); insT=setTimeout(hideIns,500); return; }
  clearTimeout(insT); if(tr===insRow) return; insRow=tr; const r=tr.getBoundingClientRect(), sc=$('#ofScroll')?.getBoundingClientRect();
  if(sc&&(r.bottom<sc.top+30||r.bottom>sc.bottom)){ hideIns(); return; }
  insEl.style.display='block'; insEl.style.left=r.left+'px'; insEl.style.width=r.width+'px'; insEl.style.top=r.bottom+'px'; insEl.querySelector('.bt').dataset.id=tr.dataset.row; });
window.addEventListener('scroll',()=>{ hideIns(); closePop(); },true);

/* menus flutuantes */
function closePop(){ const p=$('#uxpopm'); if(p) p.remove(); }
function pop(html,anchor,alignRight){ closePop(); const m=document.createElement('div'); m.className='uxpop'; m.id='uxpopm'; m.innerHTML=html; document.body.appendChild(m);
  const r=anchor.getBoundingClientRect(), w=m.offsetWidth, h=m.offsetHeight; let x=alignRight?r.right-w:r.left; x=Math.max(8,Math.min(x,innerWidth-w-8)); let y=r.bottom+6; if(y+h>innerHeight-8) y=Math.max(8,r.top-h-6);
  m.style.left=x+'px'; m.style.top=y+'px'; }
document.addEventListener('click',e=>{ if(!e.target.closest('#uxpopm')&&!e.target.closest('[data-act="uxInsMenu"],[data-act="uxUser"]')) closePop(); else if(e.target.closest('#uxpopm [data-act]')) setTimeout(closePop,0); },true);

Object.assign(ACT,{
  uxMini:()=>{ const on=document.body.classList.toggle('uxmini'); lss('orcalivre.ux.mini',on?'1':'0'); },
  uxDrawer:()=>document.body.classList.toggle('uxdrawer'),
  uxUser:(d,a)=>{ if($('#uxpopm')){ closePop(); return; } const em=Store.user?.email||''; pop(`<div class="h">Conectado como<b>${esc(em)}</b></div><button data-act="go" data-v="orcs">${ic('list')}Meus orçamentos</button><button data-act="sair">${ix('out')}Sair da conta</button>`,a,true); },
  uxInsMenu:(d,a)=>{ const id=d.id; const o=S.cur; const it=o&&o.items.find(x=>x.id===id); if(!it) return; const grpN=it.k==='E'?'nesta etapa':it.k==='S'?'nesta subetapa':'abaixo';
    const b=(k,cl,l,icn)=>`<button data-act="uxInsAt" data-k="${k}" data-id="${id}"><span class="ico ${cl}">${icn}</span>${l}<kbd>${k}</kbd></button>`;
    pop(`<div class="h">Inserir ${grpN}</div>${b('C','','Composição',ic('brick',1.8))}${b('I','i','Insumo',ic('cube',1.8))}${b('S','s','Subetapa',ic('list',2))}${b('E','e','Nova etapa',ic('etapa',2))}`,a,false); },
  uxInsAt:d=>{ closePop(); hideIns(); ACT.ofNewAfter({k:d.k,id:d.id}); },
  uxColap:()=>{ for(const e of S.cur.items) if(e.k==='E') S.colap.add(e.id); render(); },
  uxExp:()=>{ S.colap.clear(); render(); },
  uxShow:()=>deckOpen(false),
  uxPdf:()=>deckOpen(true)
});
document.addEventListener('input',e=>{ if(e.target.id==='uxFind'){ S.uxf=e.target.value; applyFind(); } });
document.addEventListener('keydown',e=>{ const t=e.target;
  if($('#uxdeck')){ deckKey(e); return; }
  if(t.id==='uxFind'&&e.key==='Escape'){ t.value=''; S.uxf=''; applyFind(); t.blur(); return; }
  if(S.view!=='plan'||!S.cur||e.ctrlKey||e.metaKey||e.altKey) return;
  if(t.closest&&t.closest('input,textarea,select,[contenteditable="true"]')) return; if(!$('#modal').hidden||S.add||$('#lgw:not([hidden])')) return;
  const k=e.key.toUpperCase(); if(['E','S','C','I'].includes(k)){ e.preventDefault(); ACT.ofNew({k}); }
  else if(e.key==='/'){ e.preventDefault(); $('#uxFind')?.focus(); } });

/* ================================================================ lista de orçamentos em cartões */
VIEWS.orcs=()=>{ const list=S.docs.filter(d=>d.kind==='orc').sort((a,b)=>(b.upd||0)-(a.upd||0));
  const ex=S.example=S.example||exampleBudget(); if(!ex) ensureBase(pkId(defPk())).then(b=>{ if(b&&S.view==='orcs') render(); });
  const all=[...list.map(o=>[o,false]),...(ex?[[ex,true]]:[])]; let soma=0; const lics=S.docs.filter(d=>d.kind==='lic').length;
  const cards=all.map(([o,isEx])=>{ const {tot,rows,grp}=calc(o); if(!isEx) soma+=tot.pv; const n=rows.filter(r=>r.it.k==='V').length; const es=o.items.filter(i=>i.k==='E');
    const cols=['#8b5cf6','#4f7cff','#14c8b0','#0b1020','#a78bfa','#38bdf8']; const bar=tot.pv?es.map((e,i)=>`<i style="width:${((grp[e.id]?.pv||0)/tot.pv*100).toFixed(2)}%;background:${cols[i%cols.length]}" title="${esc(e.d)}"></i>`).join(''):'';
    return `<div class="uxcard ${S.cur&&S.cur.id===o.id?'on':''}" data-act="open" data-id="${o.id}"><div class="tp"><span class="av">${esc(ini(o.nome))}</span><div class="tx"><h3>${esc(o.nome)}</h3><div class="mt">${esc([o.cliente,o.local].filter(Boolean).join(' · ')||'Sem cliente informado')}</div></div>${isEx?'<span class="uxchip" style="background:#fff6e5;border-color:#f6e2b5;color:#9a6100">Exemplo</span>':''}</div>
      <div><div class="tot">R$ ${R(tot.pv)}<small>${n} serviços</small></div><div class="mt">${esc(labelOf(o.base))}</div></div>
      <div class="bar" title="Distribuição por etapa">${bar}</div>
      <div class="ft"><span class="when">${isEx?'Orçamento de demonstração':'Atualizado '+ago(o.upd)}</span><button class="btn sm" data-act="dupOrc" data-id="${o.id}">Duplicar</button>${isEx?'':`<button class="btn sm danger" data-act="delOrc" data-id="${o.id}">Excluir</button>`}</div></div>`; }).join('');
  return `<div class="uxwel"><div><h1>Seus orçamentos</h1><p>Abra um orçamento para montar a planilha, ver indicadores e gerar a apresentação.</p></div>
    <div class="acts"><label class="btn">Importar backup<input type="file" id="impJson" accept=".json,application/json" hidden></label><button class="btn primary" data-act="newOrc">+ Novo orçamento</button></div></div>
   ${Store.mode==='local'?`<div class="banner"><b>Você não entrou na sua conta.</b> Os orçamentos ficam só neste navegador.${Store.sb?' <button class="btn sm" data-act="entrar">Entrar ou criar conta grátis</button>':''}</div>`:''}
   <div class="uxstats"><div><div class="l">Valor em orçamentos</div><div class="v">R$ ${R(soma)}</div></div><div><div class="l">Orçamentos</div><div class="v">${list.length}</div></div><div><div class="l">Licitações acompanhadas</div><div class="v">${lics}</div></div></div>
   <div class="uxgrid"><div class="uxnew" data-act="newOrc" role="button"><span class="d">${ix('plus',2.4)}</span>Novo orçamento<small>Escolha o banco, o estado e a data-base</small></div>${cards||'<div class="uxcard">Carregando…</div>'}</div>`; };

/* ================================================================ relatórios: destaque */
const _rel=VIEWS.rel;
VIEWS.rel=()=>{ const h=_rel(); const i=h.indexOf('<div class="cards">');
  const f=`<div class="uxfeat"><div><div class="ey">Novo · resumo executivo</div><h2>Resumo do orçamento em apresentação</h2><p>Capa, números principais, distribuição por etapa, composição do custo, curva ABC de serviços e insumos, cronograma, BDI e premissas, em slides prontos para apresentar ao cliente ou à diretoria.</p>
    <div class="row"><button class="btn primary" data-act="uxShow">${ix('play')}Abrir apresentação</button><button class="btn gh" data-act="uxPdf">${ix('down')}Salvar em PDF</button></div></div><div class="uxmock"><div class="t"></div><div class="c"><i></i><i></i></div></div></div>`;
  return i>=0?h.slice(0,i)+f+h.slice(i):h+f; };

/* ================================================================ apresentação */
const CC={A:'#7c5cf6',B:'#4f7cff',C:'#14c8b0'}, CT={MAT:'#7c5cf6',MO:'#14c8b0',EQ:'#4f7cff',OUT:'#f0a43a',SV:'#a78bfa'};
const PAL=['#7c5cf6','#4f7cff','#14c8b0','#0b1020','#a78bfa','#38bdf8','#5eead4','#94a3b8'];
function donut(segs,size,label,sub){ const tot=segs.reduce((s,x)=>s+x.v,0)||1, r=size/2-18, c=2*Math.PI*r; let off=0;
  const arcs=segs.map(x=>{ const l=x.v/tot*c; const s=`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${x.c}" stroke-width="30" stroke-dasharray="${Math.max(0,l-2).toFixed(2)} ${c.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/>`; off+=l; return s; }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#eef0f6" stroke-width="30"/>${arcs}<text x="50%" y="47%" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="26" fill="#0b1020">${esc(label)}</text><text x="50%" y="58%" text-anchor="middle" font-family="Manrope" font-weight="600" font-size="13" fill="#8a91a6">${esc(sub||'')}</text></svg>`; }
function paretoS(list){ const N=Math.min(list.length,40), it=list.slice(0,N), W=700,H=430,ml=40,mr=46,mt=14,mb=30,iw=W-ml-mr,ih=H-mt-mb; const max=Math.max(...it.map(x=>x.pct),.01), bw=iw/Math.max(N,1); let g='',b='',pts=[];
  for(let k=0;k<=4;k++){ const y=mt+ih-ih*k/4; g+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" stroke="#eef0f6"/><text x="${W-mr+8}" y="${y+4}" font-size="12" fill="#8a91a6">${k*25}%</text>`; }
  it.forEach((x,i)=>{ const h=x.pct/max*ih, X=ml+i*bw; b+=`<rect x="${(X+bw*.14).toFixed(1)}" y="${(mt+ih-h).toFixed(1)}" width="${Math.max(1,bw*.72).toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${CC[x.cl]}"/>`; pts.push(`${(X+bw/2).toFixed(1)},${(mt+ih-x.cum/100*ih).toFixed(1)}`); });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${g}${b}<polyline points="${pts.join(' ')}" fill="none" stroke="#0b1020" stroke-width="2.5"/><text x="${ml}" y="${H-6}" font-size="12" fill="#8a91a6">${N<list.length?`Primeiros ${N} de ${list.length} serviços`:`${N} serviços`} em ordem decrescente · linha: % acumulado</text></svg>`; }
function curveSS(mon,cum,total){ const N=mon.length, W=1130,H=380,ml=74,mr=50,mt=14,mb=34,iw=W-ml-mr,ih=H-mt-mb, mx=Math.max(...mon,1), bw=iw/N; let g='',b='',pts=[];
  for(let k=0;k<=4;k++){ const y=mt+ih-ih*k/4; g+=`<line x1="${ml}" x2="${W-mr}" y1="${y}" y2="${y}" stroke="#eef0f6"/><text x="${W-mr+8}" y="${y+4}" font-size="12" fill="#8a91a6">${k*25}%</text><text x="${ml-8}" y="${y+4}" font-size="12" fill="#8a91a6" text-anchor="end">${esc(mi(mx*k/4))}</text>`; }
  mon.forEach((v,i)=>{ const h=v/mx*ih, X=ml+i*bw; b+=`<rect x="${(X+bw*.2).toFixed(1)}" y="${(mt+ih-h).toFixed(1)}" width="${(bw*.6).toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="#c9c2ff"/><text x="${(X+bw/2).toFixed(1)}" y="${H-12}" font-size="12" fill="#8a91a6" text-anchor="middle">${i+1}</text>`; pts.push(`${(X+bw/2).toFixed(1)},${(mt+ih-(total?cum[i]/total:0)*ih).toFixed(1)}`); });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%">${g}${b}<polyline points="${pts.join(' ')}" fill="none" stroke="#14c8b0" stroke-width="3.5"/>${pts.map(p=>{ const [x,y]=p.split(','); return `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" stroke="#14c8b0" stroke-width="2.5"/>`; }).join('')}</svg>`; }
function hbars(items,max){ return `<div class="hb">${items.map((x,i)=>`<div class="lb" title="${esc(x.l)}">${esc(cap(x.l))}</div><div class="tr"><i style="width:${(max?x.v/max*100:0).toFixed(1)}%;background:${x.c||PAL[i%PAL.length]}"></i></div><div class="vv">${esc(mi(x.v))}<small>${P(x.p)}</small></div>`).join('')}</div>`; }

function slides(o){ const {tot,grp,bdi,rows}=calc(o); const a=num(o.area)||0, cub=num(o.cub)||0, hoje=new Date().toLocaleDateString('pt-BR');
  const es=o.items.filter(i=>i.k==='E'); const nS=rows.filter(r=>r.it.k==='V').length;
  const ex=explodeBudget(o).list.slice().sort((x,y)=>y.v-x.v); const cd=ex.reduce((s,x)=>s+x.v,0)||0; const byT={}; let hMO=0;
  for(const x of ex){ byT[x.t]=(byT[x.t]||0)+x.v; if(x.t==='MO'&&NN(x.u).trim()==='H') hMO+=x.q; }
  const abcS=abcServ(o), A=num(o.abcA)||80, B=num(o.abcB)||95, abcI=abcClass(ex,A,B);
  const cnt=L=>{ const s={A:{n:0,v:0},B:{n:0,v:0},C:{n:0,v:0}}; for(const x of L){ s[x.cl].n++; s[x.cl].v+=x.v; } return s; }; const sS=cnt(abcS), tS=abcS.reduce((s,x)=>s+x.v,0)||1;
  const etp=es.map(e=>({l:e.d,v:grp[e.id]?.pv||0})).sort((x,y)=>y.v-x.v).map(x=>({...x,p:tot.pv?x.v/tot.pv*100:0}));
  const sub=`${esc(o.nome)}`; const foot=n=>`<div class="ft"><span class="lg">${brandMini()}</span><span>${sub}</span><span class="sp"></span><span>${hoje}</span><span>·</span><span>${n}</span></div>`;
  const S2=[]; const add=(cls,inner)=>S2.push({cls,inner});
  /* 1 capa */
  add('dk',`<div class="in"><div class="cv-b">${brandMini(true)}</div><div class="cv-k">Resumo do orçamento</div><div class="cv-t">${esc(o.nome)}</div>
    <div class="cv-m">${o.cliente?`<span>${esc(o.cliente)}</span>`:''}${o.local?`<span>${esc(o.local)}</span>`:''}<span>${esc(labelOf(o.base))}</span>${o.dataBase?`<span>Data-base ${esc(fmtMes(o.dataBase))}</span>`:''}</div>
    <div class="cv-tot"><div><div class="l">Preço total com BDI</div><div class="v">R$ ${R(tot.pv)}</div></div>${a?`<div><div class="l">Preço por m²</div><div class="v2">R$ ${R(tot.pv/a)}</div></div>`:''}<div><div class="l">Emitido em</div><div class="v2">${hoje}</div></div></div></div>`);
  /* 2 visão geral */
  const ins=[]; if(etp[0]&&tot.pv) ins.push(`<b>${esc(cap(etp[0].l))}</b> é a etapa de maior peso: ${P(etp[0].p)} do preço total.`);
  if(abcS.length) ins.push(`<b>${sS.A.n} serviço(s)</b> (${P(sS.A.n/abcS.length*100)} dos itens) concentram ${P(sS.A.v/tS*100)} do valor, a classe A da curva ABC.`);
  if(cd) ins.push(`Mão de obra representa <b>${P((byT.MO||0)/cd*100)}</b> e materiais <b>${P((byT.MAT||0)/cd*100)}</b> do custo direto decomposto.`);
  const bp=bdi*100; ins.push(bp>=20.34&&bp<=25?`BDI de <b>${P(bp)}</b>, entre o 1º e o 3º quartil de referência do TCU para edificações (20,34% a 25,00%).`:`BDI de <b>${P(bp)}</b>; a faixa de referência do TCU para edificações vai de 20,34% a 25,00% (Acórdão 2.622/2013).`);
  if(cub&&a) ins.push(`O preço por m² equivale a <b>${P(tot.pv/a/cub*100)}</b> do CUB informado (R$ ${R(cub)}/m²).`);
  else if(o.prazo) ins.push(`Prazo de <b>${esc(o.prazo)} meses</b>, com desembolso médio de R$ ${esc(mi(tot.pv/(num(o.prazo)||1)))} por mês.`);
  add('',`<div class="acc"></div><div class="in"><div class="ey">Visão geral</div><h2>Os números do orçamento</h2><div class="kg">
    <div class="k hl"><div class="l">Preço total</div><div class="v">R$ ${R(tot.pv)}</div><div class="s">com BDI</div></div>
    <div class="k"><div class="l">Custo direto</div><div class="v">R$ ${R(tot.cd)}</div><div class="s">${P(tot.pv?tot.cd/tot.pv*100:0)} do preço</div></div>
    <div class="k"><div class="l">BDI</div><div class="v">${P(bp)}</div><div class="s">R$ ${R(tot.bdiV)}</div></div>
    <div class="k"><div class="l">Preço por m²</div><div class="v">${a?'R$ '+R(tot.pv/a):'—'}</div><div class="s">${a?Q(a)+' m² de área':'área não informada'}</div></div>
    <div class="k"><div class="l">Escopo</div><div class="v">${nS} serviços</div><div class="s">em ${es.length} etapas</div></div>
    <div class="k"><div class="l">Mão de obra</div><div class="v">${nf0.format(hMO)} h</div><div class="s">${a?nf2.format(hMO/a)+' h/m²':'horas das composições'}</div></div></div>
    <div class="ins">${ins.slice(0,4).map((t,i)=>`<div><i>${i+1}</i><span>${t}</span></div>`).join('')}</div></div>${foot(2)}`);
  /* 3 etapas */
  if(etp.length){ const top=etp.slice(0,9); const rest=etp.slice(9); if(rest.length){ const v=rest.reduce((s,x)=>s+x.v,0); top.push({l:`Demais ${rest.length} etapas`,v,p:tot.pv?v/tot.pv*100:0,c:'#94a3b8'}); }
    const d5=etp.slice(0,5).map((x,i)=>({v:x.v,c:PAL[i]})); const r5=etp.slice(5).reduce((s,x)=>s+x.v,0); if(r5>0) d5.push({v:r5,c:'#cbd5e1'});
    add('',`<div class="acc"></div><div class="in"><div class="ey">Distribuição</div><h2>Onde está o dinheiro: preço por etapa</h2><div class="two"><div class="pn"><h3>Preço com BDI por etapa</h3>${hbars(top,top[0]?.v||0)}</div>
      <div class="pn" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px"><h3 style="align-self:flex-start">As 5 maiores etapas</h3>${donut(d5,280,P(etp.slice(0,5).reduce((s,x)=>s+x.p,0)),'do preço total')}
      <div class="lg2" style="align-self:stretch">${etp.slice(0,5).map((x,i)=>`<div><i style="background:${PAL[i]}"></i><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px">${esc(cap(x.l))}</span><b>${P(x.p)}</b></div>`).join('')}</div></div></div></div>${foot(S2.length+1)}`); }
  /* 4 composição do custo */
  if(cd){ const ts=['MAT','MO','EQ','OUT','SV'].filter(t=>byT[t]>0);
    add('',`<div class="acc"></div><div class="in"><div class="ey">Composição do custo</div><h2>Materiais, mão de obra e equipamentos</h2><div class="two" style="grid-template-columns:1fr 1fr">
      <div class="pn" style="display:grid;place-items:center">${donut(ts.map(t=>({v:byT[t],c:CT[t]})),360,'R$ '+mi(cd),'custo direto decomposto')}</div>
      <div class="pn" style="display:flex;flex-direction:column;justify-content:center"><div class="lg2" style="font-size:18px;gap:18px">${ts.map(t=>`<div><i style="background:${CT[t]};width:18px;height:18px"></i><span style="color:#2b3245;font-weight:700">${TL[t]}</span><b>${P(byT[t]/cd*100)}</b></div><div style="margin:-12px 0 0 28px;font-size:14px;color:#8a91a6">R$ ${R(byT[t])}</div>`).join('')}</div>
      <p class="note" style="margin-top:22px">${nf0.format(hMO)} horas de mão de obra nas composições${a?` (${nf2.format(hMO/a)} h/m²)`:''}. Serviços sem composição analítica entram em Outros.</p></div></div></div>${foot(S2.length+1)}`); }
  /* 5 curva ABC serviços */
  if(abcS.length){ add('',`<div class="acc"></div><div class="in"><div class="ey">Curva ABC · serviços</div><h2>Poucos serviços, a maior parte do valor</h2><div class="two">
      <div class="pn">${paretoS(abcS)}</div><div class="pn" style="display:flex;flex-direction:column;justify-content:center">${['A','B','C'].map(c=>`<div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #f0f1f6"><span class="cl" style="background:${CC[c]};width:40px;height:40px;font-size:16px">${c}</span><div style="flex:1"><div style="font:800 26px var(--f-body)">${P(sS[c].v/tS*100)}</div><div style="font-size:13.5px;color:#6b7385">${sS[c].n} serviços · ${P(sS[c].n/abcS.length*100)} dos itens</div></div><div style="font:700 14px var(--f-mono)">R$ ${esc(mi(sS[c].v))}</div></div>`).join('')}
      <p class="note">Classes: A até ${A}% do valor acumulado, B até ${B}%, C o restante.</p></div></div></div>${foot(S2.length+1)}`);
    add('',`<div class="acc"></div><div class="in"><div class="ey">Curva ABC · serviços</div><h2>Os 10 serviços de maior valor</h2><div class="pn" style="padding:18px 20px"><table><thead><tr><th>Cl.</th><th>Item</th><th>Descrição</th><th class="r">Quant.</th><th class="r">Total</th><th class="r">%</th><th class="r">Acum.</th></tr></thead><tbody>
      ${abcS.slice(0,10).map(x=>`<tr><td><span class="cl" style="background:${CC[x.cl]}">${x.cl}</span></td><td class="m">${esc(x.n)}</td><td class="d" title="${esc(x.d)}">${esc(cap(x.d))}</td><td class="r m">${nf2.format(x.q)} ${esc(x.u)}</td><td class="r m"><b>${R(x.v)}</b></td><td class="r m">${P(x.pct)}</td><td class="r m" style="color:#8a91a6">${P(x.cum)}</td></tr>`).join('')}</tbody></table></div></div>${foot(S2.length+1)}`); }
  /* 6 insumos */
  if(abcI.length){ const top=abcI.slice(0,10), mx=top[0]?.v||1;
    add('',`<div class="acc"></div><div class="in"><div class="ey">Curva ABC · insumos</div><h2>Os insumos que mais pesam no custo</h2><div class="pn" style="padding:18px 20px"><table><thead><tr><th>Cl.</th><th>Código</th><th>Descrição</th><th>Tipo</th><th class="r">Quant.</th><th style="width:170px"></th><th class="r">Custo</th><th class="r">%</th></tr></thead><tbody>
      ${top.map(x=>`<tr><td><span class="cl" style="background:${CC[x.cl]}">${x.cl}</span></td><td class="m">${esc(x.c)}</td><td class="d" style="max-width:440px" title="${esc(x.d)}">${esc(cap(x.d))}</td><td><span style="font:700 11px var(--f-body);color:${CT[x.t]||'#6b7385'}">${esc(TS[x.t]||x.t)}</span></td><td class="r m">${nf2.format(x.q)} ${esc(x.u)}</td><td><div style="height:10px;border-radius:6px;background:#eef0f6;overflow:hidden"><i style="display:block;height:100%;width:${(x.v/mx*100).toFixed(1)}%;background:${CT[x.t]||'#7c5cf6'};border-radius:6px"></i></div></td><td class="r m"><b>${R(x.v)}</b></td><td class="r m">${P(x.pct)}</td></tr>`).join('')}</tbody></table>
      <p class="note">Custo direto decomposto pelas composições do banco (sem BDI). ${abcI.length} insumos no total.</p></div></div>${foot(S2.length+1)}`); }
  /* 7 cronograma */
  const N=Math.max(1,Math.min(60,Math.round(num(o.prazo)||0))); const cr=o.crono||{}; const mon=Array(N).fill(0); let temC=false;
  for(const e of es){ const arr=cr[e.id]||[]; const v=grp[e.id]?.pv||0; for(let m=0;m<N;m++){ const p=num(arr[m])||0; if(p) temC=true; mon[m]+=v*p/100; } }
  if(temC&&o.prazo){ let acc=0; const cum=mon.map(v=>acc+=v); const pico=mon.indexOf(Math.max(...mon));
    add('',`<div class="acc"></div><div class="in"><div class="ey">Cronograma físico-financeiro</div><h2>Desembolso ao longo de ${N} meses</h2><div class="pn" style="flex:1">${curveSS(mon,cum,tot.pv)}
      <div style="display:flex;gap:28px;margin-top:6px;font-size:14px;color:#6b7385"><span>Pico no <b style="color:#0b1020">mês ${pico+1}</b>: R$ ${R(mon[pico])}</span><span>Média mensal: <b style="color:#0b1020">R$ ${R(tot.pv/N)}</b></span><span>Barras: desembolso do mês · linha: % acumulado</span></div></div></div>${foot(S2.length+1)}`); }
  /* 8 BDI */
  const bd=o.bdi||{}; const parc=bd.manual?[]:[['Administração central','ac'],['Seguro','s'],['Garantia','g'],['Risco','r'],['Despesas financeiras','df'],['Lucro','l'],['PIS','pis'],['COFINS','cofins'],['ISS','iss'],['CPRB','cprb']].map(([l,k])=>({l,v:num(bd[k])||0})).filter(x=>x.v>0);
  const mp=Math.max(...parc.map(x=>x.v),1);
  add('',`<div class="acc"></div><div class="in"><div class="ey">Benefícios e despesas indiretas</div><h2>BDI de ${P(bp)}</h2><div class="two" style="grid-template-columns:1.2fr 1fr">
    <div class="pn">${parc.length?`<h3>Parcelas (%)</h3><div class="hb" style="grid-template-columns:200px minmax(0,1fr) 80px">${parc.map((x,i)=>`<div class="lb">${x.l}</div><div class="tr"><i style="width:${(x.v/mp*100).toFixed(1)}%;background:${i<6?'#7c5cf6':'#14c8b0'}"></i></div><div class="vv">${P(x.v)}</div>`).join('')}</div>`:'<h3>BDI informado manualmente</h3><p class="note">O orçamento usa um percentual único de BDI, sem detalhamento das parcelas.</p>'}</div>
    <div class="pn" style="display:flex;flex-direction:column;justify-content:center;gap:14px"><div class="k hl" style="box-shadow:none"><div class="l">Valor do BDI</div><div class="v">R$ ${R(tot.bdiV)}</div><div class="s">sobre o custo direto de R$ ${R(tot.cd)}</div></div>
      <p class="note" style="font-size:14px">Fórmula do Acórdão TCU 2.622/2013: BDI = [(1 + AC + S + R + G) × (1 + DF) × (1 + L)] ÷ (1 − I) − 1. Faixa de referência para edificações: 20,34% (1º quartil), 22,12% (médio) e 25,00% (3º quartil).</p>${num(o.bdi2)?`<p class="note" style="font-size:14px">BDI diferenciado de ${P(num(o.bdi2))} nos itens marcados com BDI 2.</p>`:''}</div></div></div>${foot(S2.length+1)}`);
  /* 9 premissas */
  const bancos=[...new Set([o.base,...o.items.filter(i=>i.k==='V'&&i.b).map(i=>i.b)])].map(id=>labelOf(id)); const man=o.items.filter(i=>i.k==='V'&&i.t==='M').length;
  add('',`<div class="acc"></div><div class="in"><div class="ey">Premissas</div><h2>Referências e observações</h2><div class="pn" style="padding:28px 30px"><dl class="pr">
    <dt>Orçamento</dt><dd>${esc(o.nome)}</dd>${o.cliente?`<dt>Cliente</dt><dd>${esc(o.cliente)}</dd>`:''}${o.local?`<dt>Local</dt><dd>${esc(o.local)}</dd>`:''}
    <dt>Bancos de preços</dt><dd>${bancos.map(esc).join('<br>')}</dd>${o.dataBase?`<dt>Data-base</dt><dd>${esc(fmtMes(o.dataBase))}</dd>`:''}
    <dt>Itens de cotação</dt><dd>${man?man+' serviço(s) com preço informado manualmente (cotação ou composição própria)':'Nenhum'}</dd>
    <dt>Emissão</dt><dd>${hoje}, gerado no OrçaLivre</dd></dl>
    <p class="note" style="font-size:14px;margin-top:22px">Preços unitários de referência dos bancos públicos na data-base indicada. Quantidades e cotações devem ser conferidas com os projetos e fornecedores antes de emitir uma proposta.</p></div></div>${foot(S2.length+1)}`);
  return S2; }
function cap(s){ s=String(s||''); if(s!==s.toUpperCase()) return s; return s.toLowerCase().replace(/(^|[\s(/-])([a-zà-ú])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E|Em|Com|Para|Por|A|O|As|Os|No|Na)\b/g,w=>w.toLowerCase()).replace(/^./,c=>c.toUpperCase()).replace(/\b(Af_\d+\/\d+)\b/gi,w=>w.toUpperCase()).replace(/\b(Ca|Fck|Mpa|Pvc|Pead|Cpvc|Ppr)\b/g,w=>w.toUpperCase()); }
let BMn=0; function brandMini(big){ const s=big?34:20, gid='uxdg'+(++BMn); return `<svg width="${s}" height="${s}" viewBox="0 0 32 32"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#4f7cff"/><stop offset="1" stop-color="#14c8b0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#${gid})"/><path d="M7.5 22.5h4.6v-4.4H7.5zM13.7 22.5h4.6v-8.2h-4.6zM19.9 22.5h4.6V9.5h-4.6z" fill="#fff"/></svg>${big?'<span class="nxw">Orça<b>Livre</b></span>':'OrçaLivre'}`; }

let DK={i:0,n:0};
function deckOpen(print){ const o=S.cur; if(!o){ toast('Abra um orçamento primeiro.'); return; }
  if(!o.items.some(i=>i.k==='V')){ toast('A planilha ainda não tem serviços para resumir.'); return; }
  closeDeck(); const L=slides(o); DK={i:0,n:L.length};
  const d=document.createElement('div'); d.id='uxdeck'; d.setAttribute('role','dialog'); d.setAttribute('aria-label','Resumo do orçamento');
  d.innerHTML=`<div class="dt"><b>${esc(o.nome)}</b><span class="pg" id="dkpg"></span><span class="sp"></span><button class="db" data-act="dkFull" title="Tela cheia (F)">${ix('full')}<span class="lbl">Tela cheia</span></button><button class="db pr" data-act="dkPdf" title="Salvar em PDF">${ix('down')}<span class="lbl">Salvar PDF</span></button><button class="db" data-act="dkClose" title="Fechar (Esc)">${ix('x')}</button></div>
   <div class="stg" id="dkstg"><div class="scl" id="dkscl">${L.map((s,i)=>`<section class="sl ${s.cls} ${i===0?'on':''}">${s.inner}</section>`).join('')}</div></div>
   <div class="nav"><button class="nb" data-act="dkGo" data-d="-1" aria-label="Anterior">${ix('l')}</button><div class="dots">${L.map((_,i)=>`<button data-act="dkTo" data-i="${i}" class="${i===0?'on':''}" aria-label="Slide ${i+1}"></button>`).join('')}</div><button class="nb" data-act="dkGo" data-d="1" aria-label="Próximo">${ix('r')}</button></div>`;
  document.body.appendChild(d); fit(); dkPaint(); if(print) setTimeout(dkPrint,350); }
function fit(){ const stg=$('#dkstg'), s=$('#dkscl'); if(!stg||!s) return; const k=Math.min((stg.clientWidth-24)/1280,(stg.clientHeight-12)/720); s.style.transform=`translate(-50%,-50%) scale(${Math.max(.1,k)})`; }
window.addEventListener('resize',fit);
function dkPaint(){ const d=$('#uxdeck'); if(!d) return; d.querySelectorAll('.sl').forEach((s,i)=>s.classList.toggle('on',i===DK.i)); d.querySelectorAll('.dots button').forEach((b,i)=>b.classList.toggle('on',i===DK.i));
  const pg=$('#dkpg'); if(pg) pg.textContent=`${DK.i+1} / ${DK.n}`; const nb=d.querySelectorAll('.nb'); nb[0].disabled=DK.i===0; nb[1].disabled=DK.i===DK.n-1; }
function closeDeck(){ const d=$('#uxdeck'); if(d) d.remove(); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }
function dkPrint(){ const ps=document.createElement('style'); ps.id='uxpage'; ps.textContent='@page{size:1280px 720px;margin:0}'; document.head.appendChild(ps); document.body.classList.add('uxprint');
  const done=()=>{ document.body.classList.remove('uxprint'); ps.remove(); fit(); window.removeEventListener('afterprint',done); }; window.addEventListener('afterprint',done); setTimeout(()=>window.print(),60); }
function deckKey(e){ if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){ e.preventDefault(); ACT.dkGo({d:1}); } else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); ACT.dkGo({d:-1}); }
  else if(e.key==='Escape'){ if(!document.fullscreenElement) closeDeck(); } else if(e.key==='Home'){ DK.i=0; dkPaint(); } else if(e.key==='End'){ DK.i=DK.n-1; dkPaint(); } else if(e.key.toLowerCase()==='f'){ ACT.dkFull(); } }
Object.assign(ACT,{ dkGo:d=>{ DK.i=Math.max(0,Math.min(DK.n-1,DK.i+(+d.d))); dkPaint(); }, dkTo:d=>{ DK.i=+d.i; dkPaint(); }, dkClose:()=>closeDeck(), dkPdf:()=>dkPrint(),
  dkFull:()=>{ const d=$('#uxdeck'); if(!d) return; if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); else if(d.requestFullscreen) d.requestFullscreen().then(()=>setTimeout(fit,120)).catch(()=>{}); } });
document.addEventListener('fullscreenchange',()=>setTimeout(fit,80));
let tx0=null; document.addEventListener('touchstart',e=>{ if(e.target.closest&&e.target.closest('#dkstg')) tx0=e.touches[0].clientX; },{passive:true});
document.addEventListener('touchend',e=>{ if(tx0==null) return; const dx=e.changedTouches[0].clientX-tx0; tx0=null; if(Math.abs(dx)>50) ACT.dkGo({d:dx<0?1:-1}); },{passive:true});

/* ================================================================ envolve as telas do orçamento e a renderização */
for(const k of BV){ if(k==='plan') continue; const f=VIEWS[k]; if(!f) continue; VIEWS[k]=()=>hero(k)+`<div class="uxbody">${f()}</div>`; }
{ const f=VIEWS.plan; VIEWS.plan=()=>hero('plan')+`<div class="uxbody">${f()}</div>`; }
const _r=render;
render=function(){ shell(); _r(); paintTitle(); document.body.classList.remove('uxdrawer'); hideIns(); closePop(); if(S.view==='plan') decoPlan(); };
try{ render(); }catch(err){ console.error(err); }
})();
