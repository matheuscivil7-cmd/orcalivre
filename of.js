/* OrçaLivre · interface de trabalho (menu lateral, barra superior, pesquisa inteligente e planilha com inclusão em linha).
   Carregado depois de pub.js. Reaproveita o estado (S), o cálculo (calc) e as bases do app. */
(function(){
"use strict";
const MAN=()=>PUB.man||{};
const PUBM=()=>MAN().pub||{};
const REGN={SD:'Não desonerado',CD:'Desonerado',SE:'Sem encargos'};
document.documentElement.dataset.theme='light';

/* ------------------------------------------------------------------ estilos */
const css=`
:root{--accent:#1565c0;--accent-soft:#e3eefb;--bg:#eef1f4;--panel:#ffffff;--sunk:#f1f3f6;--line:#dde2e8;--ink:#1f2933;--muted:#66727f;
  --of-top:#1565c0;--of-top2:#0f4f99;--of-side:#2b3036;--of-side2:#23272c;--of-sidetx:#c3cad2;--of-etapa:#cfe0f3;--of-sub:#e6eef8;--of-hover:#f5f9ff}
body{background:var(--bg);font-size:13px}
.top{background:var(--of-top);color:#fff;border:0;padding:0;gap:0;height:56px;flex-wrap:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.18)}
.top .brand{background:var(--of-side2);color:#fff;height:100%;width:220px;flex:0 0 220px;justify-content:center;align-items:center;font-size:19px;gap:8px}
.top .brand .mk{background:#fff;color:var(--of-top)}
.top .brand small{display:none}
.oftb{display:flex;height:100%;align-items:stretch}
.oftb button{background:none;border:0;border-right:1px solid rgba(255,255,255,.14);color:#fff;min-width:74px;padding:6px 10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:11px}
.oftb button:hover{background:var(--of-top2)}
.oftb button svg{width:22px;height:22px}
.oftb button.on{background:var(--of-top2)}
.top .ctx{padding:0 16px;justify-content:flex-end;flex-wrap:nowrap;overflow:hidden}
.top .ctx .linkish{color:#fff}
.top .ctx .pill{background:rgba(255,255,255,.16);color:#fff}
.top .ctx .pill.ok{background:rgba(120,220,160,.25);color:#fff}
.top .ctx .pill.warn{background:rgba(255,200,90,.28);color:#fff}
.top .ctx .btn{background:#fff;color:var(--of-top);border-color:#fff}
.top .ctx .btn.ghost{background:none;color:#fff;border-color:transparent}
.shell{grid-template-columns:220px minmax(0,1fr)}
.side{background:var(--of-side);min-height:calc(100vh - 56px);top:56px;padding:8px 0;gap:0}
.side .grp{color:#7f8a96;padding:14px 18px 6px;font-size:10px}
.side .nav{color:var(--of-sidetx);border-radius:0;padding:9px 18px;gap:12px;font-size:13px;border-left:3px solid transparent}
.side .nav svg{width:16px;height:16px;flex:0 0 16px;opacity:.85}
.side .nav:hover{background:var(--of-side2);color:#fff}
.side .nav.on{background:var(--of-side2);color:#fff;border-left-color:#4fa3ff;font-weight:600}
.side .nav .k{display:none}
.side .cur{margin:6px 12px 2px;padding:8px 10px;border-radius:6px;background:rgba(255,255,255,.06);color:#fff;font-size:12px;line-height:1.3}
.side .cur small{display:block;color:#8d98a4;font-size:10.5px;margin-top:2px}
main{padding:0 22px 60px}
.ofbc{font-size:12px;color:var(--muted);padding:12px 0 6px;display:flex;gap:6px;align-items:center}
.ofbc a{color:var(--accent);cursor:pointer}
.head{align-items:center;margin:4px 0 16px}
.ofh{display:flex;gap:12px;align-items:center}
.ofh .ic{width:40px;height:40px;border-radius:50%;border:2px solid var(--accent);display:grid;place-items:center;color:var(--accent);flex:0 0 40px}
.ofh .ic svg{width:20px;height:20px}
.ofh h1{font:500 24px/1.1 var(--f-body);color:var(--accent);letter-spacing:0}
.ofh .sub{margin-top:2px;font-size:12px}
h1{font-family:var(--f-body);font-weight:600}
.panel{border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.btn{border-radius:4px}
.btn.primary{background:var(--accent);border-color:var(--accent)}
.t th{background:#e9edf2;color:#4a5562;font-size:10.5px}
.t tr.r-e td{background:var(--of-etapa);color:#14324f}
.t tr.r-s td{background:var(--of-sub);color:#14324f}
/* blocos do topo da planilha */
.oftiles{display:grid;grid-template-columns:repeat(4,minmax(110px,150px)) minmax(260px,1fr);gap:10px;margin-bottom:14px;align-items:stretch}
.oftile{background:#fff;border:1px solid var(--line);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 8px;cursor:pointer;color:#45505c;font-size:12px;text-align:center;min-height:92px}
.oftile svg{width:34px;height:34px;color:#3d4650}
.oftile b{font-size:13px;color:#1f2933}
.oftile:hover,.oftile.on{background:#bcd6f2;border-color:#9cc1ea}
.ofinfo{background:#fff;border:1px solid var(--line);border-radius:4px;padding:8px 14px;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;align-content:center;font-size:12px}
.ofinfo .k{color:var(--accent);text-align:right}
.ofinfo .v{text-align:right}
.ofinfo .tot{font:600 22px var(--f-body);color:#1f2933}
/* planilha */
.ofsheet{background:#fff;border:1px solid var(--line);border-radius:4px;overflow:hidden}
.ofsheet .scroll{max-height:calc(100vh - 330px);overflow:auto}
table.ofp{border-collapse:collapse;width:100%;font-size:12.5px;font-variant-numeric:tabular-nums}
.ofp th{position:sticky;top:0;z-index:2;background:#e2e7ed;color:#3f4a56;font:600 10.5px var(--f-body);text-transform:uppercase;letter-spacing:.04em;padding:8px 8px;text-align:left;white-space:nowrap;border-bottom:1px solid #cfd6de}
.ofp td{padding:6px 8px;border-bottom:1px solid #e8ecf0;vertical-align:middle}
.ofp td.r,.ofp th.r{text-align:right}
.ofp tr.e td{background:var(--of-etapa);font-weight:600;color:#14324f}
.ofp tr.s td{background:var(--of-sub);font-weight:600;color:#14324f}
.ofp tr.v:hover td{background:var(--of-hover)}
.ofp tr.sel td{box-shadow:inset 0 0 0 9999px rgba(21,101,192,.08)}
.ofp tr.sel td:first-child{box-shadow:inset 3px 0 0 var(--accent),inset 0 0 0 9999px rgba(21,101,192,.08)}
.ofp .cod{font-family:var(--f-mono);font-size:11.5px;line-height:1.25;white-space:nowrap}
.ofp .cod small{display:block;color:#7b8794;font-size:10px}
.ofp .cod .linkish{font-family:var(--f-mono)}
.ofp .bs{font-size:11px;color:#4a5562;white-space:nowrap}
.ofp .ds{min-width:320px;line-height:1.3}
.ofp .qin{width:86px;text-align:right;border:1px solid transparent;background:transparent;padding:3px 5px;border-radius:3px}
.ofp .qin:hover{border-color:var(--line)} .ofp .qin:focus{border-color:var(--accent);background:#fff}
.ofp .hin{width:100%;border:1px solid transparent;background:transparent;font-weight:600;text-transform:uppercase;padding:3px 5px;color:inherit}
.ofp .hin:focus{border-color:var(--accent);background:#fff}
.ofp .tg{width:18px;height:18px;border:1px solid #9fb6cf;border-radius:50%;background:#fff;color:#3b5a7a;font:700 12px/14px var(--f-mono);cursor:pointer;padding:0;margin-right:6px}
.ofp .mn{border:0;background:none;cursor:pointer;color:#55606b;font-size:16px;padding:0 6px;line-height:1}
.ofp .bd2{font-size:10px;color:#a86c0a}
.ofp tr.add td{background:#f3f8fe}
.ofp tr.add input,.ofp tr.add select{border:1px solid #c5d3e2;border-radius:3px;padding:5px 7px;background:#fff;font-size:12.5px;width:100%}
.ofp tr.add .ok,.ofp tr.add .no{border:0;background:none;cursor:pointer;font-size:18px;line-height:1;padding:0 3px}
.ofp tr.add .ok{color:#2e7d32} .ofp tr.add .no{color:#c62828}
.ofp tr.sug td{background:#fbfcfe;font-size:12px;cursor:pointer;color:#33404c}
.ofp tr.sug:hover td,.ofp tr.sug.hl td{background:#e3eefb}
.ofp tr.sug .src{font-size:10.5px;color:#5b6773;white-space:nowrap}
.ofp tr.hint td{background:#fbfcfe;color:#7b8794;font-size:12px;text-align:center;padding:10px}
.ofmenu{position:fixed;z-index:50;background:#fff;border:1px solid var(--line);border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,.16);min-width:210px;padding:4px 0}
.ofmenu button{display:block;width:100%;text-align:left;border:0;background:none;padding:7px 14px;cursor:pointer;font-size:12.5px;color:#1f2933}
.ofmenu button:hover{background:var(--of-hover)}
.ofmenu button.dg{color:#c62828}
.ofsum{display:flex;justify-content:flex-end;gap:28px;padding:10px 16px;border-top:1px solid var(--line);background:#fafbfc;font-size:12px;color:var(--muted)}
.ofsum b{display:block;font:600 16px var(--f-body);color:#1f2933;text-align:right}
.ofsum .pv b{color:var(--accent);font-size:19px}
/* pesquisa */
.ofsearch{background:#fff;border:1px solid var(--line);border-radius:4px;padding:14px}
.offilters{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px}
.offilters .field{min-width:150px}
.offilters select{min-width:150px}
.ofq{position:relative}
.ofq input{width:100%;font-size:15px;padding:11px 14px 11px 40px;border:1px solid #c5d3e2;border-radius:4px;box-sizing:border-box}
.ofq input:focus{border-color:var(--accent);outline:0;box-shadow:0 0 0 3px rgba(21,101,192,.15)}
.ofq svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#7b8794}
.ofres{margin-top:12px}
.ofres .meta{font-size:12px;color:var(--muted);margin:2px 0 8px}
.ofres table tr{cursor:pointer}
.ofres mark{background:#fff3b0;color:inherit;padding:0}
.ofhint{padding:34px 10px;text-align:center;color:var(--muted)}
.ofhint b{display:block;color:#1f2933;font-size:15px;margin-bottom:4px}
.oflist td{cursor:default}
@media (max-width:860px){
  .shell{grid-template-columns:minmax(0,1fr)}
  .side{position:sticky;top:0;z-index:8;flex-direction:row;overflow-x:auto;min-height:0;align-self:auto}
  .side .grp{display:none}
  .side .nav{white-space:nowrap}
  .top .ctx{flex:0 1 auto;padding:6px 10px}
  .top .ctx .pill:not(.ok):not(.warn),.top .ctx>.linkish{display:none}
  .top{height:auto;flex-wrap:wrap}
  .top .brand{width:auto;flex:1 1 auto;justify-content:flex-start;padding:10px 14px}
  .oftb{order:3;width:100%;overflow-x:auto;background:var(--of-top2)}
  .oftb button{min-width:68px;padding:6px 8px}
  .side{background:var(--of-side);top:0;min-height:0;padding:4px 6px}
  .side .nav{padding:7px 10px;border-left:0;border-bottom:2px solid transparent}
  .side .nav.on{border-bottom-color:#4fa3ff}
  .side .cur{display:none}
  .oftiles{grid-template-columns:repeat(2,1fr)}
  .ofinfo{grid-column:1/-1}
  main{padding:0 12px 60px}
}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ------------------------------------------------------------------ ícones */
const I={
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  comp:'<path d="M3 7l9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4"/>',
  ins:'<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  own:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  sheet:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  abc:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  ind:'<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/>',
  cron:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  bdi:'<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  rel:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
  tool:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  eye:'<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  etapa:'<path d="M4 6h16M8 12h12M12 18h8"/>',
  brick:'<path d="M3 9l6-4 12 4-6 4z"/><path d="M3 9v6l12 4 6-4V9M15 13v6"/>',
  cube:'<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M3 7l9 5 9-5"/>',
  hand:'<path d="M12 5v14M5 12h14"/>',
  ref:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'};
const ic=(k,sw=1.8)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]||''}</svg>`;

/* ------------------------------------------------------------------ busca inteligente */
const SIN={ALV:'ALVENARIA',CONC:'CONCRETO',ARG:'ARGAMASSA',REV:'REVESTIMENTO',ESP:'ESPESSURA',TUB:'TUBO',ELETROD:'ELETRODUTO',PINT:'PINTURA',IMPERM:'IMPERMEABILIZACAO',ESCAV:'ESCAVACAO',
  TIJOLO:'BLOCO',TIJOLOS:'BLOCOS',CERAMICO:'CERAMICO',PISO:'PISO',REBOCO:'REBOCO',EMBOCO:'EMBOCO',CHAPISCO:'CHAPISCO',FORMA:'FORMA',FORMAS:'FORMA',ACO:'ACO',FERRO:'ACO',CIMENTADO:'CIMENTADO',
  DEMOLICAO:'DEMOLICAO',PORCELANATO:'PORCELANATO',CERAMICA:'CERAMICO',TELHA:'TELHA',LAJE:'LAJE',VIGA:'VIGA',PILAR:'PILAR',SAPATA:'SAPATA',ESTACA:'ESTACA',FORRO:'FORRO',GESSO:'GESSO',DRYWALL:'GESSO'};
const ALT={TIJOLO:['BLOCO'],TIJOLOS:['BLOCOS'],FERRO:['ACO'],DRYWALL:['GESSO','DRY'],CERAMICA:['CERAMICO','CERAMICA'],CERAMICO:['CERAMICA'],PORCELANATO:['PORCELANATO'],CANO:['TUBO'],CANOS:['TUBOS'],
  FIO:['CABO'],FIOS:['CABOS'],AREIA:['AREIA'],BRITA:['PEDRA','BRITADA'],REBOCO:['REBOCO','MASSA UNICA'],TINTA:['PINTURA','TINTA'],TOMADA:['TOMADA'],INTERRUPTOR:['INTERRUPTOR']};
function stem(w){ if(w.length<=3) return w; if(/OES$|AES$/.test(w)) return w.slice(0,-3)+'AO'; if(/AIS$/.test(w)) return w.slice(0,-3)+'AL'; if(/EIS$/.test(w)) return w.slice(0,-3)+'EL'; if(/IS$/.test(w)&&w.length>4) return w.slice(0,-2)+'IL'; if(/ES$/.test(w)&&/(R|Z|S)ES$/.test(w)) return w.slice(0,-2); if(/S$/.test(w)) return w.slice(0,-1); return w; }
function lev(a,b,max){ const la=a.length, lb=b.length; if(Math.abs(la-lb)>max) return max+1; let prev=new Array(lb+1); for(let j=0;j<=lb;j++) prev[j]=j;
  for(let i=1;i<=la;i++){ const cur=[i]; let mn=i; for(let j=1;j<=lb;j++){ const c=a.charCodeAt(i-1)===b.charCodeAt(j-1)?0:1; cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+c); if(cur[j]<mn) mn=cur[j]; } if(mn>max) return max+1; prev=cur; } return prev[lb]; }
const WRE=/[^A-Z0-9]+/;
function words(s){ return [...new Set(norm(s).split(WRE).filter(Boolean))]; }
function fxIdx(b,kind){ b._fx=b._fx||{}; if(!b._fx[kind]){ const src=kind==='C'?b.comps:b.ins; b._fx[kind]=Object.keys(src).map(c=>({c,w:words(src[c].d||''),cn:norm(c)})); } return b._fx[kind]; }
function wordScore(tok,w,memo){ let s=memo.get(w); if(s!==undefined) return s; s=0;
  if(w===tok) s=100; else if(w.startsWith(tok)&&tok.length>=2) s=tok.length>=3?82:60; else { const st=stem(tok), sw=stem(w);
    if(st===sw&&st.length>=3) s=88; else if(sw.startsWith(st)&&st.length>=4) s=70;
    else if(tok.length>=4&&!/\d/.test(tok)){ const d=lev(st,sw.slice(0,Math.max(st.length,Math.min(sw.length,st.length+1))),tok.length>=7?2:1); const d2=d>2?lev(st,sw,tok.length>=7?2:1):d; const dd=Math.min(d,d2); if(dd===1) s=58; else if(dd===2&&tok.length>=7) s=40; } }
  memo.set(w,s); return s; }
/* tokens com alternativas (sinônimos) */
const STOP=new Set(['DE','DA','DO','DAS','DOS','E','EM','COM','PARA','A','O','AS','OS','NA','NO','POR']);
function qtokens(q){ let raw=norm(q).split(WRE).filter(Boolean); const sem=raw.filter(t=>!STOP.has(t)); if(sem.length) raw=sem; return raw.map(t=>({t,alts:[t,...(ALT[t]||[]),...(SIN[t]&&SIN[t]!==t?[SIN[t]]:[])].map(x=>norm(x)).flatMap(x=>x.split(' ')).filter(Boolean)})); }
function fsearch(q,ids,tipo,limit=200){
  const toks=qtokens(q); if(!toks.length) return {res:[],aprox:false};
  const memos=toks.map(tk=>tk.alts.map(()=>new Map()));
  const run=(need)=>{ const out=[];
    for(const bid of ids){ const b=S.bases[bid]; if(!b) continue; const pri=(S.cur&&bid===S.cur.base?15:0)+(b.fonte==='SINAPI'?8:b.id==='PROPRIA'?10:0);
      for(const kind of (tipo==='*'?['C','I']:[tipo])){ const ix=fxIdx(b,kind);
        for(const e of ix){ let tot=0, hit=0;
          for(let k=0;k<toks.length;k++){ const tk=toks[k]; let best=0;
            if(e.cn===tk.t) best=220; else if(tk.t.length>=3&&e.cn.startsWith(tk.t)) best=150;
            if(best<100){ for(let a=0;a<tk.alts.length;a++){ const memo=memos[k][a], at=tk.alts[a]; for(const w of e.w){ const s=wordScore(at,w,memo)*(a?0.9:1); if(s>best){ best=s; if(best>=100) break; } } if(best>=100) break; } }
            if(best>0){ tot+=best; hit++; } }
          if(hit>=need){ out.push({b:bid,t:kind,c:e.c,s:tot+(hit===toks.length?50:0)-Math.min(10,e.w.length*0.4)+pri}); } } } }
    return out; };
  let res=run(toks.length), aprox=false;
  if(!res.length&&toks.length>=2){ res=run(toks.length-1); aprox=true; }
  res.sort((a,b)=>b.s-a.s); return {res:res.slice(0,limit),aprox,total:res.length};
}
function hl(d,q){ const ts=qtokens(q).flatMap(t=>t.alts).filter(t=>t.length>=2); if(!ts.length) return esc(d);
  const parts=String(d).split(/(\s+)/); return parts.map(p=>{ const n=norm(p).replace(WRE,''); return n&&ts.some(t=>n.startsWith(t)||stem(n)===stem(t))?`<mark>${esc(p)}</mark>`:esc(p); }).join(''); }

/* ------------------------------------------------------------------ escopos de base */
function fontes(){ const L=[['*','Todas as bases']]; if(MAN().sinapi) L.push(['SINAPI','SINAPI · Caixa']);
  for(const [k,v] of Object.entries(PUBM())) L.push(['P:'+k,v.n]);
  L.push(['PROPRIA','Composições e insumos próprios']);
  for(const b of Object.values(S.bases)) if(!b.pub&&b.id!=='PROPRIA') L.push([b.id,(b.nome||baseShort(b))+' (importada)']);
  return L; }
function ufsDe(src){ if(src==='SINAPI') return MAN().sinapi?.ufs||[]; if(String(src).startsWith('P:')){ const v=PUBM()[src.slice(2)]?.vers?.[0]; return v?v.ufs:[]; } return []; }
function datasDe(src){ if(src==='SINAPI') return (MAN().sinapi?.meses||[]).map(m=>[m,fmtMes(m)]); if(String(src).startsWith('P:')) return (PUBM()[src.slice(2)]?.vers||[]).map(v=>[v.v,/^\d{4}-\d\d$/.test(v.v)?fmtMes(v.v):v.v+(v.m?' · '+fmtMes(v.m):'')]); return []; }
function regsDe(src){ if(src==='SINAPI') return ['SD','CD','SE']; if(String(src).startsWith('P:')){ const v=PUBM()[src.slice(2)]?.vers?.[0]; return v?v.regs:['SD']; } return []; }
function idPara(src,f){ const uf=f.uf||'SP', reg=f.reg||'SD';
  if(src==='SINAPI') return `SINAPI:${f.data&&f.src==='SINAPI'?f.data:latestMes()}:${uf}:${['SD','CD','SE'].includes(reg)?reg:'SD'}`;
  if(String(src).startsWith('P:')){ const s=src.slice(2), I=PUBM()[s]; if(!I) return null; const V=(f.src===src&&I.vers.find(v=>v.v===f.data))||I.vers[0];
    const u=V.ufs.includes(uf)?uf:V.ufs[0], r=V.regs.includes(reg)?reg:V.regs[0]; return `P:${s}:${V.v}:${u}:${r}`; }
  return S.bases[src]?src:null; }
function escopo(f){ if(f.src==='ORC'&&S.cur) return [S.cur.base]; if(f.src!=='*') return [idPara(f.src,f)].filter(Boolean);
  const ids=[]; if(MAN().sinapi) ids.push(idPara('SINAPI',f)); for(const k of Object.keys(PUBM())) ids.push(idPara('P:'+k,f));
  ids.push('PROPRIA'); for(const b of Object.values(S.bases)) if(!b.pub&&b.id!=='PROPRIA') ids.push(b.id); return ids.filter(Boolean); }
async function carregar(ids){ await Promise.all(ids.map(id=>S.bases[id]?null:ensureBase(id))); return ids.filter(id=>S.bases[id]); }
function dataRef(bid){ const p=parseId(bid); if(!p) return ''; if(p.src==='SINAPI') return fmtMes(p.mes); if(p.src==='P'){ const v=PUBM()[p.s]?.vers?.find(x=>x.v===p.ver); return v&&/^\d{4}-\d\d$/.test(v.m||'')?fmtMes(v.m):p.ver; } return ''; }
function nomeFonte(bid){ const b=S.bases[bid]; if(!b) return bid; if(b.fonte==='SINAPI') return 'SINAPI'; if(b.fnome) return b.fonte; return b.id==='PROPRIA'?'PRÓPRIA':(b.fonte||'BASE'); }

/* ------------------------------------------------------------------ menu, barra e moldura */
const NAVOF=[['g','Geral'],['orcs','Orçamentos','list'],['g','Bancos de preços'],['pesqC','Composições','comp'],['pesqI','Insumos','ins'],['own','Composições próprias','own'],['bases','Bases disponíveis','db'],
  ['g','Orçamento aberto'],['plan','Planilha orçamentária','sheet'],['ins','Insumos do orçamento','ins'],['abc','Curva ABC','abc'],['ind','Indicadores','ind'],['crono','Cronograma','cron'],['bdi','BDI','bdi'],['rel','Relatórios','rel']];
NAV.length=0; NAVOF.forEach(x=>NAV.push(x));
const LIVRES=['orcs','bases','pesqC','pesqI','own'];
renderSide=function(){ const o=S.cur; let h='';
  for(const [k,l,icn] of NAV){ if(k==='g'){ if(l==='Orçamento aberto'&&!o) continue; h+=`<div class="grp">${l}</div>`; if(l==='Orçamento aberto') h+=`<div class="cur">${esc(o.nome)}<small>${esc(labelOf(o.base))}</small></div>`; continue; }
    if(!LIVRES.includes(k)&&!o) continue;
    h+=`<button class="nav ${S.view===k?'on':''}" data-act="go" data-v="${k}">${ic(icn)}<span>${l}</span></button>`; }
  $('#side').innerHTML=h; };
const TITLES={orcs:['Orçamentos','list'],pesqC:['Composições','comp'],pesqI:['Insumos','ins'],own:['Composições próprias','own'],bases:['Bases disponíveis','db'],plan:['Orçamento','sheet'],ins:['Insumos do orçamento','ins'],abc:['Curva ABC','abc'],ind:['Indicadores','ind'],crono:['Cronograma','cron'],bdi:['BDI','bdi'],rel:['Relatórios','rel']};
function crumbs(){ const t=TITLES[S.view]||['','']; const inB=!LIVRES.includes(S.view);
  return `<div class="ofbc">${ic('home',2).replace('<svg','<svg style="width:13px;height:13px"')} <a data-act="go" data-v="orcs">Home</a> / ${inB?`<a data-act="go" data-v="orcs">Orçamentos</a> / <a data-act="go" data-v="plan">${esc(S.cur?.nome||'')}</a> / `:''}<span>${t[0]}</span></div>`; }
function toolbar(){ const o=S.cur, v=S.view; const b=(act,k,l,extra='')=>`<button data-act="${act}" ${extra}>${ic(k)}<span>${l}</span></button>`;
  let h=b('go','list','Orçamentos','data-v="orcs"')+b('go','search','Pesquisar','data-v="pesqC"');
  if(o&&!LIVRES.includes(v)) h+=b('ofEdit','edit','Editar')+b('ofRef','ref','Data-base')+b('ofView','eye','Exibir')+b('go','bdi','BDI','data-v="bdi"')+b('go','rel','Relatórios','data-v="rel"');
  return h; }
(function shell(){ const top=$('.top'); if(!top||$('#oftb')) return; const ctx=$('#ctx');
  top.innerHTML=`<div class="brand"><span class="mk">R$</span>OrçaLivre</div><nav class="oftb" id="oftb" aria-label="Ferramentas"></nav>`; top.appendChild(ctx); })();
render=function(){ renderSide(); renderCtx(); const tb=$('#oftb'); if(tb) tb.innerHTML=toolbar();
  const V=VIEWS[S.view]||VIEWS.orcs; const needs=!LIVRES.includes(S.view);
  $('#main').innerHTML=crumbs()+((needs&&!S.cur)?`<div class="empty"><b>Nenhum orçamento aberto</b>Abra ou crie um orçamento para usar este módulo.<div style="margin-top:12px"><button class="btn primary" data-act="go" data-v="orcs">Ver orçamentos</button></div></div>`:V());
  if(S.view==='plan') afterPlan(); if(S.view==='pesqC'||S.view==='pesqI') afterPesq(); };
const _go=go; go=function(v){ closeMenu(); _go(v); };
const ofHead=(k,title,sub,actions='')=>`<div class="head"><div class="ofh"><span class="ic">${ic(k,2)}</span><div><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div></div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;

/* ------------------------------------------------------------------ lista de orçamentos */
VIEWS.orcs=()=>{ const list=S.docs.filter(d=>d.kind==='orc').sort((a,b)=>(b.upd||0)-(a.upd||0));
  const ex=S.example=S.example||exampleBudget(); if(!ex) ensureBase(pkId(defPk())).then(b=>{ if(b&&S.view==='orcs') render(); });
  const all=[...list.map(o=>[o,false]),...(ex?[[ex,true]]:[])];
  const row=([o,isEx])=>{ const {tot,rows}=calc(o); const n=rows.filter(r=>r.it.k==='V').length;
    return `<tr class="${S.cur&&S.cur.id===o.id?'sel':''}"><td><button class="linkish b" data-act="open" data-id="${o.id}">${esc(o.nome)}</button>${isEx?' <span class="pill warn">Exemplo</span>':''}</td><td>${esc(o.cliente||'—')}</td><td>${esc(o.local||'—')}</td><td>${esc(fmtMes(o.dataBase))}</td><td class="bs">${esc(labelOf(o.base))}</td><td class="r">${n}</td><td class="r b">R$ ${R(tot.pv)}</td>
      <td class="r" style="white-space:nowrap"><button class="btn sm primary" data-act="open" data-id="${o.id}">Abrir</button> <button class="btn sm" data-act="dupOrc" data-id="${o.id}">Duplicar</button>${isEx?'':` <button class="btn sm danger" data-act="delOrc" data-id="${o.id}">Excluir</button>`}</td></tr>`; };
  return ofHead('list','Orçamentos','Seus orçamentos de obra',`<label class="btn">Importar backup<input type="file" id="impJson" accept=".json,application/json" hidden></label><button class="btn primary" data-act="newOrc">+ Novo orçamento</button>`)+
   (Store.mode==='local'?`<div class="banner"><b>Você não entrou na sua conta.</b> Os orçamentos ficam só neste navegador.${Store.sb?' <button class="btn sm" data-act="entrar">Entrar ou criar conta grátis</button>':''}</div>`:'')+
   `<div class="ofsheet"><div class="scroll"><table class="ofp oflist"><thead><tr><th>Orçamento</th><th>Cliente</th><th>Local</th><th>Data-base</th><th>Banco de preços</th><th class="r">Serviços</th><th class="r">Total</th><th></th></tr></thead><tbody>${all.length?all.map(row).join(''):'<tr class="hint"><td colspan="8">Carregando…</td></tr>'}</tbody></table></div></div>`; };

/* ------------------------------------------------------------------ pesquisa de composições / insumos */
S.pq=S.pq||{q:'',src:'*',uf:'SP',reg:'SD',data:'',n:60};
function filtrosHTML(F,key){ const fs=fontes(); const ufs=F.src==='*'?(MAN().sinapi?.ufs||[]):ufsDe(F.src); const ds=F.src==='*'?[]:datasDe(F.src); const rg=F.src==='*'?['SD','CD']:regsDe(F.src);
  const sel=(k,lab,opts,val)=>`<label class="field"><span>${lab}</span><select data-off="${key}" data-k="${k}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(val)===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
  let h=sel('src','Banco de preços',fs,F.src);
  if(ds.length) h+=sel('data','Data de referência',ds,F.data||ds[0][0]);
  if(ufs.length>1) h+=sel('uf',F.src==='*'?'Estado (SINAPI/SICRO)':'Estado',ufs.map(u=>[u,u]),F.uf);
  if(rg.length) h+=sel('reg','Encargos',rg.map(r=>[r,REGN[r]||r]),F.reg);
  return h; }
function pesqView(t){ S.pq.t=t; const F=S.pq;
  return ofHead(t==='C'?'comp':'ins',t==='C'?'Composições':'Insumos','Consulte os bancos de preços antes ou durante o orçamento')+
  `<div class="ofsearch"><div class="offilters">${filtrosHTML(F,'pq')}</div>
   <div class="ofq">${ic('search',2)}<input id="ofPq" placeholder="Digite o código ou a descrição ${t==='C'?'da composição':'do insumo'} (ex.: alvenaria bloco ceramico 9 cm)" value="${esc(F.q)}" autocomplete="off" aria-label="Pesquisar"></div>
   <div class="ofres" id="ofPqRes"></div></div>`; }
VIEWS.pesqC=()=>pesqView('C'); VIEWS.pesqI=()=>pesqView('I');
let pqSeq=0;
async function rodaPesq(){ const box=$('#ofPqRes'); if(!box) return; const F=S.pq, q=F.q.trim(), my=++pqSeq;
  if(norm(q).replace(WRE,'').length<2){ box.innerHTML=`<div class="ofhint"><b>Comece a digitar</b>A lista aparece conforme você escreve. A busca aceita palavras parecidas, plurais, abreviações e pequenos erros de digitação.</div>`; return; }
  const ids=escopo(F); if(ids.some(id=>!S.bases[id])){ box.innerHTML='<div class="ofhint"><b>Carregando bancos de preços…</b>Na primeira busca em todas as bases isso pode levar alguns segundos.</div>'; await carregar(ids); if(my!==pqSeq) return; }
  const {res,aprox,total}=fsearch(q,ids.filter(id=>S.bases[id]),F.t,F.n);
  if(my!==pqSeq) return;
  if(!res.length){ box.innerHTML=`<div class="ofhint"><b>Nada encontrado</b>Tente outras palavras ou escolha “Todas as bases”.</div>`; return; }
  const canAdd=!!S.cur;
  box.innerHTML=`<div class="meta">${total>res.length?`${res.length} de ${total} resultados`:`${total} resultado${total>1?'s':''}`}${aprox?' · nenhum item tem todas as palavras; mostrando os mais parecidos':''}</div>
   <div class="ofsheet"><div class="scroll" style="max-height:62vh"><table class="ofp"><thead><tr><th>Banco</th><th>Código</th><th>Descrição</th><th>Und</th><th class="r">Valor unit.</th><th></th></tr></thead><tbody>${res.map(r=>{ const i=refInfo(r.b,r.t,r.c)||{}; const u=refUnit(r.b,r.t,r.c);
    return `<tr class="v" data-act="comp" data-b="${esc(r.b)}" data-t="${r.t}" data-c="${esc(r.c)}"><td class="bs">${esc(nomeFonte(r.b))}<br><small class="muted">${esc(dataRef(r.b))}${S.bases[r.b]?.uf?' · '+esc(S.bases[r.b].uf):''}</small></td><td class="cod">${esc(r.c)}</td><td class="ds">${hl(i.d||'',q)}${i.g&&r.t==='C'?`<br><small class="muted">${esc(i.g)}</small>`:''}</td><td>${esc(i.u||'')}</td><td class="r">${u==null?'<span class="muted">—</span>':R(u)}</td>
     <td class="r" style="white-space:nowrap">${canAdd?`<button class="btn sm" data-act="ofAddFrom" data-b="${esc(r.b)}" data-t="${r.t}" data-c="${esc(r.c)}">+ Orçamento</button>`:''}</td></tr>`; }).join('')}</tbody></table></div></div>
   ${total>res.length?`<div style="text-align:center;margin-top:10px"><button class="btn" data-act="ofMais">Mostrar mais resultados</button></div>`:''}`; }
function afterPesq(){ const i=$('#ofPq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } rodaPesq(); }

/* ------------------------------------------------------------------ composições próprias (lista) */
VIEWS.own=()=>{ const own=S.docs.filter(d=>d.kind==='cpu'||d.kind==='ins').sort((a,b)=>String(a.c).localeCompare(String(b.c)));
  return ofHead('own','Composições próprias','Composições (CPU) e insumos de cotação criados por você',`<button class="btn" data-act="newIns">+ Insumo / cotação</button><button class="btn primary" data-act="newCpu">+ Composição própria</button>`)+
  `<div class="ofsheet"><div class="scroll"><table class="ofp"><thead><tr><th>Código</th><th>Tipo</th><th>Descrição</th><th>Und</th><th class="r">Valor unit.</th><th></th></tr></thead><tbody>${own.length?own.map(d=>`<tr class="v"><td class="cod"><button class="linkish" data-act="comp" data-b="PROPRIA" data-t="${d.kind==='cpu'?'C':'I'}" data-c="${esc(d.c)}">${esc(d.c)}</button></td><td>${d.kind==='cpu'?'Composição':TL[d.t||'MAT']}</td><td class="ds">${esc(d.d)}</td><td>${esc(d.u)}</td><td class="r">${R(refUnit('PROPRIA',d.kind==='cpu'?'C':'I',d.c))}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="${d.kind==='cpu'?'editCpu':'editIns'}" data-id="${d.id}">Editar</button> <button class="btn sm danger" data-act="delOwn" data-id="${d.id}">Excluir</button></td></tr>`).join(''):'<tr class="hint"><td colspan="6">Nenhuma composição própria ainda. Crie uma a partir do zero ou abra uma composição de qualquer banco e use “Criar composição própria a partir desta”.</td></tr>'}</tbody></table></div></div>`; };

/* ------------------------------------------------------------------ planilha orçamentária */
S.colap=S.colap||new Set(); S.add=null;
function totalBancos(o){ const s=new Set(); for(const it of o.items) if(it.k==='V'&&it.b) s.add(it.b); s.add(o.base); return [...s]; }
VIEWS.plan=()=>{ const o=S.cur, {rows,grp,tot,bdi}=calc(o); const A=S.add;
  const bancos=totalBancos(o).map(id=>`${esc(nomeFonte(id))} - ${esc(dataRef(id))}${S.bases[id]?.uf?' - '+esc(S.bases[id].uf):''}`).join('<br>');
  const tiles=`<div class="oftiles">
    <div class="oftile ${A&&A.k==='E'?'on':''}" data-act="ofNew" data-k="E" role="button">${ic('etapa',2)}<span>Adicionar<br><b>Etapa</b></span></div>
    <div class="oftile ${A&&A.k==='C'?'on':''}" data-act="ofNew" data-k="C" role="button">${ic('brick',1.6)}<span>Adicionar<br><b>Composição</b></span></div>
    <div class="oftile ${A&&A.k==='I'?'on':''}" data-act="ofNew" data-k="I" role="button">${ic('cube',1.6)}<span>Adicionar<br><b>Insumo</b></span></div>
    <div class="oftile ${A&&A.k==='S'?'on':''}" data-act="ofNew" data-k="S" role="button">${ic('list',2)}<span>Adicionar<br><b>Subetapa</b></span></div>
    <div class="ofinfo"><span class="k">Bancos</span><span class="v">${bancos}</span><span class="k">BDI</span><span class="v">${P(bdi*100)}</span><span class="k">Total</span><span class="v tot">R$ ${R(tot.pv)}</span></div></div>`;
  let body='', hideE=null;
  for(const r of rows){ const it=r.it;
    if(it.k==='E'){ hideE=S.colap.has(it.id)?it.id:null; }
    if(hideE&&it.k!=='E') { if(A&&A.after===it.id) body+=addRow(o,rows); continue; }
    const sel=S.sel===it.id?'sel':'';
    if(it.k!=='V'){ const g=grp[it.id]||{pv:0,cd:0}; const isE=it.k==='E';
      body+=`<tr class="${isE?'e':'s'} ${sel}" data-row="${it.id}"><td>${isE?`<button class="tg" data-act="ofTog" data-id="${it.id}" aria-label="${S.colap.has(it.id)?'Expandir':'Recolher'} etapa">${S.colap.has(it.id)?'+':'−'}</button>`:''}${r.n}</td><td></td><td></td><td colspan="2"><input class="hin" data-ofd="${it.id}" value="${esc(it.d)}" aria-label="Nome"></td><td></td><td class="r">1,00</td><td class="r">${R(g.cd)}</td><td class="r">${R(g.pv)}</td><td class="r">${R(g.pv)}</td><td><button class="mn" data-act="ofMenu" data-id="${it.id}" aria-label="Opções">⋮</button></td></tr>`; }
    else{ const man=it.t==='M';
      body+=`<tr class="v ${sel}" data-row="${it.id}"><td>${r.n}</td><td class="cod">${man?esc(it.c||'—'):`<button class="linkish" data-act="comp" data-b="${esc(it.b)}" data-t="${it.t}" data-c="${esc(it.c)}">${esc(it.c)}</button>`}<small>${man?'':esc(dataRef(it.b))}</small></td><td class="bs">${esc(man?(it.bl||'PRÓPRIO'):nomeFonte(it.b))}</td>
       <td class="ds" colspan="2">${esc(it.d)}${it.bd2?' <span class="bd2">BDI 2</span>':''}</td><td>${esc(it.u)}</td>
       <td class="r"><input class="qin" data-ofq="${it.id}" value="${Q(r.q)}" inputmode="decimal" aria-label="Quantidade"></td>
       <td class="r">${man?`<input class="qin" data-ofcu="${it.id}" value="${R(r.cu)}" inputmode="decimal" aria-label="Valor unitário">`:R(r.cu)}</td><td class="r">${R(r.pu)}</td><td class="r b">${R(r.tp)}</td><td><button class="mn" data-act="ofMenu" data-id="${it.id}" aria-label="Opções">⋮</button></td></tr>`; }
    if(A&&A.after===it.id) body+=addRow(o,rows); }
  if(A&&!A.after) body+=addRow(o,rows);
  const head=`<thead><tr><th style="width:70px">Item</th><th>Código</th><th>Banco</th><th colspan="2">Descrição</th><th>Und</th><th class="r">Quant.</th><th class="r">Valor unit.</th><th class="r">Valor com BDI</th><th class="r">Total</th><th></th></tr></thead>`;
  return ofHead('sheet','Orçamento',`${esc(o.nome)}${o.cliente?' · '+esc(o.cliente):''}${S.loadingB?' · carregando bancos…':''}`)+
   (o.ex?'<div class="banner"><b>Exemplo.</b> Ao fazer qualquer alteração, uma cópia editável é criada nos seus orçamentos.</div>':'')+tiles+
   `<div class="ofsheet"><div class="scroll" id="ofScroll"><table class="ofp">${head}<tbody>${body||'<tr class="hint"><td colspan="11">Planilha vazia. Use <b>Adicionar Etapa</b> e depois <b>Adicionar Composição</b> ou <b>Insumo</b>.</td></tr>'}</tbody></table></div>
    <div class="ofsum"><div>Custo direto<b>R$ ${R(tot.cd)}</b></div><div>BDI (${P(bdi*100)})<b>R$ ${R(tot.bdiV)}</b></div>${o.area?`<div>Preço por m²<b>R$ ${R(tot.pv/o.area)}</b></div>`:''}<div class="pv">Preço total<b>R$ ${R(tot.pv)}</b></div></div></div>`; };

function proxNumero(o,rows){ const A=S.add; if(!A) return ''; if(A.k==='E') return String(rows.filter(r=>r.it.k==='E').length+1); const ref=rows.find(r=>r.it.id===A.after); if(!ref) return '';
  const base=ref.n.split('.'); if(A.k==='S') return base[0]+'.?'; if(ref.it.k==='E') return base[0]+'.?'; return base.slice(0,-1).join('.')+'.'+(+base[base.length-1]+1); }
function addRow(o,rows){ const A=S.add; const n=proxNumero(o,rows);
  if(A.k==='E'||A.k==='S') return `<tr class="add"><td><input value="${esc(n)}" disabled aria-label="Item"></td><td colspan="4"><input id="ofAddD" placeholder="Nome da ${A.k==='E'?'etapa (ex.: SERVIÇOS PRELIMINARES)':'subetapa'}" value="${esc(A.d||'')}" autocomplete="off"></td><td colspan="5"></td><td style="white-space:nowrap"><button class="ok" data-act="ofOk" title="Confirmar (Enter)" aria-label="Confirmar">✔</button><button class="no" data-act="ofNo" title="Cancelar (Esc)" aria-label="Cancelar">✖</button></td></tr>`;
  const opts=[...(S.cur?[['ORC','Banco do orçamento']]:[]),...fontes()];
  return `<tr class="add"><td><input value="${esc(n)}" disabled aria-label="Item" style="min-width:52px"></td><td><input id="ofAddC" placeholder="Código" value="${esc(A.code||'')}" style="width:96px" autocomplete="off"></td>
    <td><select id="ofAddB" aria-label="Banco">${opts.map(([v,l])=>`<option value="${esc(v)}" ${A.src===v?'selected':''}>${esc(l.replace(' · Caixa',''))}</option>`).join('')}</select></td>
    <td colspan="2"><input id="ofAddQ" placeholder="Digite a descrição ${A.k==='C'?'da composição':'do insumo'}…" value="${esc(A.q||'')}" autocomplete="off"></td><td>${esc(A.pick?A.pick.u:'')}</td>
    <td><input id="ofAddN" placeholder="Quant." value="${esc(A.qty||'')}" inputmode="decimal" style="text-align:right"></td><td class="r">${A.pick?R(A.pick.p):''}</td><td></td><td></td>
    <td style="white-space:nowrap"><button class="ok" data-act="ofOk" title="Confirmar (Enter)" aria-label="Confirmar">✔</button><button class="no" data-act="ofNo" title="Cancelar (Esc)" aria-label="Cancelar">✖</button></td></tr></tbody><tbody id="ofSug"></tbody><tbody>`; }
let sgSeq=0;
async function rodaSug(){ const A=S.add, box=$('#ofSug'); if(!A||!box||A.k==='E'||A.k==='S') return; const my=++sgSeq;
  const q=(A.q||'').trim(), code=(A.code||'').trim(); const qq=code||q;
  if(A.pick&&!A.typing){ box.innerHTML=''; return; }
  if(norm(qq).replace(WRE,'').length<2){ box.innerHTML=''; return; }
  const ids=escopo({src:A.src,uf:A.uf,reg:A.reg}); if(ids.some(id=>!S.bases[id])){ box.innerHTML='<tr class="hint"><td colspan="11">Carregando bancos de preços…</td></tr>'; await carregar(ids); if(my!==sgSeq) return; }
  let res; if(code){ res=[]; const nc=norm(code); for(const id of ids){ const b=S.bases[id]; if(!b) continue; const src=A.k==='C'?b.comps:b.ins; for(const c of Object.keys(src)){ const n=norm(c); if(n===nc||n.startsWith(nc)) res.push({b:id,t:A.k,c,s:n===nc?2:1}); if(res.length>200) break; } } res.sort((a,b)=>b.s-a.s); res=res.slice(0,30); }
  else res=fsearch(q,ids.filter(id=>S.bases[id]),A.k,30).res;
  if(my!==sgSeq) return; A.res=res; A.hl=0;
  box.innerHTML=res.length?res.map((r,i)=>{ const inf=refInfo(r.b,r.t,r.c)||{}; const u=refUnit(r.b,r.t,r.c);
    return `<tr class="sug ${i===0?'hl':''}" data-act="ofPick" data-i="${i}"><td></td><td class="cod">${esc(r.c)}<small>${esc(dataRef(r.b))}</small></td><td class="src">${esc(nomeFonte(r.b))}${S.bases[r.b]?.uf?' '+esc(S.bases[r.b].uf):''}</td><td colspan="2" class="ds">${hl(inf.d||'',q)}</td><td>${esc(inf.u||'')}</td><td></td><td class="r">${u==null?'—':R(u)}</td><td></td><td></td><td></td></tr>`; }).join('')
    :'<tr class="hint"><td colspan="11">Nada encontrado nesse banco. Tente outras palavras ou escolha “Todas as bases”.</td></tr>'; }
function afterPlan(){ const A=S.add; if(!A) return; const f=A.k==='E'||A.k==='S'?$('#ofAddD'):(A.pick?$('#ofAddN'):$(A.code?'#ofAddC':'#ofAddQ')); if(f){ f.focus(); const v=f.value; f.value=''; f.value=v; } rodaSug();
  const tr=$('tr.add'); if(tr&&tr.scrollIntoView) tr.scrollIntoView({block:'nearest'}); }
function novoAdd(k){ const o=S.cur; if(!o) return; const p=parseId(o.base)||{};
  let after=S.sel&&o.items.some(x=>x.id===S.sel)?S.sel:(o.items.length?o.items[o.items.length-1].id:null);
  if(k==='E'){ const i=after?o.items.findIndex(x=>x.id===after):-1; if(i>=0){ let j=i; while(j+1<o.items.length&&o.items[j+1].k!=='E') j++; after=o.items[j].id; } }
  if(k!=='E'&&!o.items.some(x=>x.k==='E')){ S.add={k:'E',after:null,next:k}; render(); return; }
  if(after){ const i=o.items.findIndex(x=>x.id===after); const ancestor=o.items.slice(0,i+1).reverse().find(x=>x.k==='E'); if(ancestor&&S.colap.has(ancestor.id)) S.colap.delete(ancestor.id); }
  const prev=S.add&&S.add.k!=='E'&&S.add.k!=='S'?S.add.src:(S.lastSrc||'ORC');
  S.add={k,after,src:prev,uf:p.uf||'SP',reg:p.reg||'SD',q:'',code:'',qty:'',pick:null}; render(); }
function confirmaAdd(){ const A=S.add, o=S.cur; if(!A||!o) return;
  if(A.k==='E'||A.k==='S'){ const d=($('#ofAddD')?.value||'').trim().toUpperCase(); if(!d){ toast('Digite o nome da '+(A.k==='E'?'etapa':'subetapa')+'.'); return; }
    const n={id:uid(),k:A.k,d}; S.sel=A.after; mutate(o=>insertItem(o,n),{rerender:false}); S.sel=n.id; const nx=A.next; S.add=null; if(nx){ novoAdd(nx); return; } render(); toast((A.k==='E'?'Etapa':'Subetapa')+' adicionada.'); return; }
  if(!A.pick){ if(A.res&&A.res.length){ pick(A.hl||0); return; } toast('Escolha um item da lista.'); return; }
  const q=num($('#ofAddN')?.value); if(!isFinite(q)||q<=0){ toast('Informe a quantidade.'); $('#ofAddN')?.focus(); return; }
  const {b,t,c}=A.pick, info=refInfo(b,t,c); S.sel=A.after; S.lastSrc=A.src;
  const n={id:uid(),k:'V',t,b,bl:baseShort(S.bases[b]),c,d:info.d,u:info.u,q,cu:r2(refUnit(b,t,c)||0)};
  mutate(o=>insertItem(o,n),{rerender:false}); S.sel=n.id;
  S.add={...A,after:n.id,q:'',code:'',qty:'',pick:null,res:null}; render(); }
function pick(i){ const A=S.add; const r=A&&A.res&&A.res[i]; if(!r) return; const inf=refInfo(r.b,r.t,r.c)||{}; A.pick={...r,u:inf.u,d:inf.d,p:refUnit(r.b,r.t,r.c)||0}; A.q=inf.d; A.code=''; A.typing=false; render(); }

/* menu da linha */
function closeMenu(){ const m=$('#ofMenu'); if(m) m.remove(); }
function openMenu(id,btn){ closeMenu(); const o=S.cur, it=o.items.find(x=>x.id===id); if(!it) return; S.sel=id;
  const r=btn.getBoundingClientRect(); const m=document.createElement('div'); m.className='ofmenu'; m.id='ofMenu';
  const isV=it.k==='V'; m.innerHTML=(isV&&it.t!=='M'?`<button data-act="comp" data-b="${esc(it.b)}" data-t="${it.t}" data-c="${esc(it.c)}">Abrir composição</button>`:'')+
    (isV?`<button data-act="ofNewAfter" data-k="C" data-id="${id}">Inserir composição abaixo</button><button data-act="ofNewAfter" data-k="I" data-id="${id}">Inserir insumo abaixo</button><button data-act="bd2" data-id="${id}">${it.bd2?'Usar BDI principal':'Usar BDI diferenciado'}</button>`:`<button data-act="ofNewAfter" data-k="C" data-id="${id}">Inserir composição nesta ${it.k==='E'?'etapa':'subetapa'}</button>${it.k==='E'?`<button data-act="ofNewAfter" data-k="S" data-id="${id}">Inserir subetapa</button>`:''}`)+
    `<button data-act="mv" data-id="${id}" data-d="-1">Mover para cima</button><button data-act="mv" data-id="${id}" data-d="1">Mover para baixo</button>${isV?`<button data-act="ofDup" data-id="${id}">Duplicar</button>`:''}<button class="dg" data-act="del" data-id="${id}">Excluir</button>`;
  document.body.appendChild(m); const w=m.offsetWidth, h=m.offsetHeight; m.style.left=Math.max(8,Math.min(r.right-w,innerWidth-w-8))+'px'; m.style.top=(r.bottom+h>innerHeight-8?Math.max(8,r.top-h):r.bottom)+'px'; }

/* ------------------------------------------------------------------ ações */
Object.assign(ACT,{
  ofNew:d=>novoAdd(d.k),
  ofNewAfter:d=>{ closeMenu(); S.sel=d.id; novoAdd(d.k); },
  ofOk:()=>confirmaAdd(),
  ofNo:()=>{ S.add=null; render(); },
  ofPick:d=>pick(+d.i),
  ofTog:d=>{ S.colap.has(d.id)?S.colap.delete(d.id):S.colap.add(d.id); render(); },
  ofMenu:(d,a)=>{ if($('#ofMenu')&&S._menuFor===d.id){ closeMenu(); S._menuFor=null; return; } S._menuFor=d.id; openMenu(d.id,a); },
  ofDup:d=>{ closeMenu(); mutate(o=>{ const i=o.items.findIndex(x=>x.id===d.id); if(i<0) return; const c={...o.items[i],id:uid()}; o.items.splice(i+1,0,c); S.sel=c.id; }); },
  ofMais:()=>{ S.pq.n+=100; rodaPesq(); },
  ofAddFrom:(d)=>{ const inf=refInfo(d.b,d.t,d.c)||{}; S._af=d; modal(()=>dlg('<h2 style="margin:0">Inserir no orçamento</h2><div class="note">'+esc(S.cur?.nome||'')+'</div>',
      `<p style="margin:0"><b class="mono">${esc(d.c)}</b> · ${esc(inf.d||'')}</p><label class="field" style="max-width:200px"><span>Quantidade (${esc(inf.u||'')})</span><input id="ofQtd" value="1" inputmode="decimal" autofocus></label><p class="note" style="margin:0">Entra abaixo da linha selecionada na planilha.</p>`,
      '<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="ofAddFromOk">Inserir</button>')); },
  ofAddFromOk:()=>{ const q=num($('#ofQtd')?.value); if(!isFinite(q)||q<=0){ toast('Informe a quantidade.'); return; } const d=S._af; closeModal(); addRef(d.b,d.t,d.c,q); },
  ofEdit:()=>{ const o=S.cur; modal(()=>dlg('<h2 style="margin:0">Dados da obra</h2>',`<div class="grid">
      <label class="field w2"><span>Nome do orçamento</span><input data-bind="nome" value="${esc(o.nome)}"></label><label class="field"><span>Cliente</span><input data-bind="cliente" value="${esc(o.cliente)}"></label>
      <label class="field"><span>Local</span><input data-bind="local" value="${esc(o.local)}"></label><label class="field"><span>Data-base</span><input type="month" data-bind="dataBase" value="${esc(o.dataBase)}"></label>
      <label class="field"><span>Área construída (m²)</span><input data-bind="area" data-num value="${o.area?Q(o.area):''}" inputmode="decimal"></label><label class="field"><span>Prazo (meses)</span><input data-bind="prazo" data-num value="${o.prazo||''}" inputmode="numeric"></label></div>`,'<button class="btn primary" data-act="close">Concluir</button>')); },
  ofRef:()=>{ const o=S.cur; S.pk.plan=S.pk.plan||pkFromId(o.base); modal(()=>{ const tgt=pkId(S.pk.plan), changed=tgt!==o.base;
      return dlg('<h2 style="margin:0">Banco e data-base do orçamento</h2><div class="note">Escolha o banco de referência, a data, o estado e os encargos. Ao aplicar, todos os serviços são reprecificados.</div>',
        `<div style="display:flex;gap:8px;flex-wrap:wrap">${picker('plan',false)}</div><p class="note" style="margin:0">Atual: ${esc(labelOf(o.base))}</p>`,
        `<button class="btn" data-act="close">Cancelar</button><button class="btn primary" data-act="ofApplyRef">${changed?'Aplicar ao orçamento':'Atualizar preços'}</button>`); }); },
  ofApplyRef:async()=>{ closeModal(); await ACT.applyRef(); },
  ofView:()=>{ const o=S.cur; const es=o.items.filter(x=>x.k==='E'); modal(()=>dlg('<h2 style="margin:0">Exibir</h2>',`<div class="stack" style="gap:8px">
      <button class="btn" data-act="ofColapAll">Recolher todas as etapas</button><button class="btn" data-act="ofExpAll">Expandir todas as etapas</button>
      <p class="note" style="margin:0">${es.length} etapa(s) no orçamento.</p></div>`,'<button class="btn" data-act="close">Fechar</button>')); },
  ofColapAll:()=>{ for(const e of S.cur.items) if(e.k==='E') S.colap.add(e.id); closeModal(); render(); },
  ofExpAll:()=>{ S.colap.clear(); closeModal(); render(); }
});
const _open=ACT.open; ACT.open=d=>{ S.add=null; S.colap=new Set(); _open(d); };

/* ------------------------------------------------------------------ eventos próprios */
document.addEventListener('input',e=>{ const t=e.target;
  if(t.id==='ofPq'){ S.pq.q=t.value; clearTimeout(t._d); t._d=setTimeout(rodaPesq,140); return; }
  if(t.id==='ofAddQ'||t.id==='ofAddC'){ const A=S.add; if(!A) return; if(t.id==='ofAddQ'){ A.q=t.value; A.code=''; const c=$('#ofAddC'); if(c) c.value=''; } else { A.code=t.value; }
    if(A.pick){ A.pick=null; } A.typing=true; clearTimeout(t._d); t._d=setTimeout(rodaSug,120); return; }
  if(t.id==='ofAddN'&&S.add) S.add.qty=t.value;
  if(t.id==='ofAddD'&&S.add) S.add.d=t.value; });
document.addEventListener('change',e=>{ const t=e.target, ds=t.dataset;
  if(ds.off==='pq'){ S.pq[ds.k]=t.value; if(ds.k==='src') S.pq.data=''; render(); return; }
  if(t.id==='ofAddB'&&S.add){ S.add.src=t.value; S.lastSrc=t.value; S.add.pick=null; S.add.typing=true; rodaSug(); return; }
  if(ds.ofq){ const v=num(t.value); mutate(o=>{ const it=o.items.find(x=>x.id===ds.ofq); if(it) it.q=isFinite(v)?v:0; }); return; }
  if(ds.ofcu){ const v=num(t.value); mutate(o=>{ const it=o.items.find(x=>x.id===ds.ofcu); if(it) it.cu=r2(isFinite(v)?v:0); }); return; }
  if(ds.ofd){ mutate(o=>{ const it=o.items.find(x=>x.id===ds.ofd); if(it) it.d=t.value.toUpperCase(); }); return; }
  if(ds.pk==='plan'&&!$('#modal').hidden) remodal(); });
document.addEventListener('keydown',e=>{ const t=e.target; const A=S.add;
  if(A&&(t.id==='ofAddQ'||t.id==='ofAddC')){ const n=A.res?A.res.length:0;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ if(!n) return; e.preventDefault(); A.hl=((A.hl||0)+(e.key==='ArrowDown'?1:-1)+n)%n; document.querySelectorAll('#ofSug tr.sug').forEach((r,i)=>r.classList.toggle('hl',i===A.hl)); document.querySelectorAll('#ofSug tr.sug')[A.hl]?.scrollIntoView({block:'nearest'}); return; }
    if(e.key==='Enter'){ e.preventDefault(); if(n) pick(A.hl||0); return; }
    if(e.key==='Escape'){ e.preventDefault(); S.add=null; render(); return; } }
  if(A&&(t.id==='ofAddN'||t.id==='ofAddD')){ if(e.key==='Enter'){ e.preventDefault(); confirmaAdd(); } else if(e.key==='Escape'){ e.preventDefault(); S.add=null; render(); } return; }
  if(t.matches&&t.matches('.qin,.hin')&&e.key==='Enter'){ e.preventDefault(); t.blur(); }
  if(e.key==='Escape') closeMenu(); });
document.addEventListener('click',e=>{ if(!e.target.closest('#ofMenu')&&!e.target.closest('[data-act="ofMenu"]')) closeMenu(); else if(e.target.closest('#ofMenu [data-act]')) setTimeout(closeMenu,0); },true);
window.addEventListener('scroll',closeMenu,true);

/* bases disponíveis */
VIEWS.bases=()=>{ const M=MAN(), si=M.sinapi; const imp=Object.values(S.bases).filter(b=>!b.pub&&b.id!=='PROPRIA');
  const rows=[]; if(si) rows.push(['SINAPI · Caixa',`${si.ufs.length} estados`,si.meses.map(fmtMes).join(', '),'Não desonerado, desonerado e sem encargos']);
  for(const [k,v] of Object.entries(PUBM())) rows.push([v.n,v.vers[0].ufs.length>3?v.vers[0].ufs.length+' estados':v.vers[0].ufs.join(', '),v.vers.map(x=>/^\d{4}-\d\d$/.test(x.v)?fmtMes(x.v):x.v+(x.m?' ('+fmtMes(x.m)+')':'')).join(', '),v.vers[0].regs.map(r=>REGN[r]).join(' e ')]);
  return ofHead('db','Bases disponíveis','Bancos de preços públicos baixados dos sites oficiais e atualizados automaticamente',`<button class="btn" data-act="go" data-v="pesqC">Pesquisar composições</button><button class="btn" data-act="imp">Importar outra base</button>`)+
   `<div class="ofsheet"><div class="scroll"><table class="ofp oflist"><thead><tr><th>Banco</th><th>Abrangência</th><th>Datas de referência</th><th>Encargos</th></tr></thead><tbody>${rows.map(r=>`<tr class="v"><td class="b">${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join('')}</tbody></table></div></div>
   <p class="note">Um robô confere a soma dos itens de cada composição contra o custo publicado antes de publicar cada edição. Ficam disponíveis as edições mais recentes de cada banco.</p>
   <h2 style="margin-top:18px">Bases importadas</h2>${imp.length?`<div class="ofsheet"><table class="ofp oflist"><tbody>${imp.map(b=>`<tr><td class="b">${esc(b.nome||baseLong(b))}</td><td>${esc(baseLong(b))}</td><td class="r">${nf0.format(Object.keys(b.comps).length)} composições</td><td class="r"><button class="btn sm danger" data-act="delBase" data-id="${b.id}">Remover</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="note">Para ORSE, SEINFRA, SETOP, EMOP, FDE ou outra tabela que o robô não alcança, baixe a planilha no site oficial e use “Importar outra base”.</p>'}`; };

/* abre direto na pesquisa quando não há orçamento */
if(S.view==='bases') S.view='pesqC';
try{ render(); }catch(err){ console.error(err); }
})();
