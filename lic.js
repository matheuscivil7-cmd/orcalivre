/* OrçaLivre · tela de login e módulo de Licitações (radar PNCP com farol de prazos, minhas licitações,
   jurisprudência do TCU e ferramentas da Lei 14.133). Carregado depois de nx.js. */
(function(){
"use strict";
if(!window.OF) return;
const {ic,LIVRES}=OF;
const C=()=>window.ORCALIVRE||{};
const SV=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IL={
  radar:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>',
  pasta:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  lei:'<path d="M12 3v18M5 8h14M5 8l-3 6a4 4 0 0 0 6 0zM19 8l-3 6a4 4 0 0 0 6 0zM8 21h8"/>',
  tool:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  star:'<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  ext:'<path d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  spark:'<path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8z"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'};
const il=k=>SV(IL[k]);
const N=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase();
const dec=s=>{ const t=document.createElement('textarea'); t.innerHTML=String(s||''); return t.value; };
const brl=v=>v==null||!isFinite(v)?'—':'R$ '+R(v);
const dt=s=>{ if(!s) return null; const d=new Date(String(s).length<=10?s+'T00:00':s); return isNaN(d)?null:d; };
const fdt=d=>d?d.toLocaleDateString('pt-BR')+(d.getHours()||d.getMinutes()?' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):''):'—';
const uteis=(d,n)=>{ const x=new Date(d); const s=n<0?-1:1; let k=Math.abs(n); while(k>0){ x.setDate(x.getDate()+s); const w=x.getDay(); if(w!==0&&w!==6) k--; } return x; };

/* ================================================================ estilos */
const css=`
.lgw{position:fixed;inset:0;z-index:60;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);background:#fff;animation:nxup .3s ease}
.lgw .art{position:relative;overflow:hidden;background:#0b1020;color:#fff;padding:48px 56px;display:flex;flex-direction:column;justify-content:space-between}
.lgw .art::before{content:"";position:absolute;inset:-30%;background:radial-gradient(closest-side,rgba(139,92,246,.55),transparent 70%) 10% 20%/60% 60% no-repeat,radial-gradient(closest-side,rgba(20,200,176,.40),transparent 70%) 90% 80%/55% 55% no-repeat,radial-gradient(closest-side,rgba(79,124,255,.45),transparent 70%) 70% 10%/45% 45% no-repeat;animation:lgflow 18s ease-in-out infinite alternate}
@keyframes lgflow{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(-4%,3%) rotate(8deg)}}
.lgw .art>*{position:relative}
.lgw .brand2{display:flex;align-items:center;gap:12px;font:800 24px var(--f-body);letter-spacing:-.02em}
.lgw .brand2 b{background:var(--nx-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lgw h1{font:800 clamp(30px,3.6vw,46px)/1.08 var(--f-body);letter-spacing:-.035em;margin:0 0 14px;color:#fff}
.lgw h1 span{background:var(--nx-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lgw .lead{color:#b9c1d8;font-size:15px;max-width:520px;line-height:1.55;margin:0 0 26px}
.lgw .feats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:600px}
.lgw .feat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:14px;padding:14px;font-size:12.5px;color:#c9d0e4;line-height:1.45;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
.lgw .feat b{display:flex;gap:8px;align-items:center;color:#fff;font-size:13.5px;margin-bottom:4px}
.lgw .feat svg{width:16px;height:16px;color:#b8adff}
.lgw .foot{font-size:11.5px;color:#7f89a6}
.lgw .side2{display:flex;align-items:center;justify-content:center;padding:32px;background:radial-gradient(800px 400px at 100% 0,rgba(139,92,246,.08),transparent 60%),#fafbff}
.lgw .card{width:min(400px,100%)}
.lgw .card h2{font:800 26px var(--f-body);letter-spacing:-.02em;margin:0 0 4px}
.lgw .card .sub{color:var(--muted);font-size:13.5px;margin:0 0 20px}
.lgw .tabs{display:grid;grid-template-columns:1fr 1fr;background:#eef0f6;border-radius:12px;padding:4px;margin-bottom:18px}
.lgw .tabs button{border:0;background:none;border-radius:9px;padding:9px;font:700 13px var(--f-body);color:#596079;cursor:pointer}
.lgw .tabs button.on{background:#fff;color:var(--ink);box-shadow:0 2px 8px -3px rgba(18,24,38,.2)}
.lgw label{display:block;font:600 12.5px var(--f-body);color:#3a4257;margin:0 0 12px}
.lgw label input{display:block;width:100%;box-sizing:border-box;margin-top:6px;border:1px solid #dcdcea;border-radius:12px;padding:12px 14px;font:500 14.5px var(--f-body);background:#fff}
.lgw label input:focus{outline:0;border-color:#8b7cf8;box-shadow:0 0 0 4px rgba(91,79,240,.12)}
.lgw .go{width:100%;border:0;border-radius:12px;padding:13px;font:800 14.5px var(--f-body);color:#fff;background:var(--nx-grad);cursor:pointer;box-shadow:0 10px 24px -10px rgba(91,79,240,.7);margin-top:4px}
.lgw .go:hover{filter:brightness(1.06)}
.lgw .row{display:flex;justify-content:space-between;align-items:center;font-size:12.5px;margin:2px 0 14px}
.lgw .lk{border:0;background:none;color:var(--accent);font:600 12.5px var(--f-body);cursor:pointer;padding:0}
.lgw #authMsg{min-height:18px;font-size:12.5px;color:#b0392c;margin:10px 0 0}
.lgw .alt{margin-top:22px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--muted);text-align:center}
@media (max-width:860px){.lgw{grid-template-columns:1fr;overflow:auto}.lgw .art{padding:28px 22px;min-height:auto}.lgw .feats{grid-template-columns:1fr}.lgw .lead{margin-bottom:16px}.lgw .side2{padding:24px 18px}}
/* licitações */
.lcbar{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;box-shadow:var(--nx-sh)}
.lcbar .field{min-width:140px}
.lcbar .grow{flex:1 1 260px}
.lcbar input,.lcbar select{width:100%}
.lcchips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 2px}
.lcchips button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 11px;font:600 12px var(--f-body);color:#3a4257;cursor:pointer}
.lcchips button:hover,.lcchips button.on{border-color:#bdb5ff;background:#f4f2ff;color:var(--accent)}
.lcsum{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}
.lcsum div{flex:1;min-width:140px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px 14px;font-size:11.5px;color:var(--muted);box-shadow:var(--nx-sh)}
.lcsum b{display:block;font:800 20px var(--f-body);color:var(--ink)}
.far{display:inline-flex;align-items:center;gap:6px;font:700 11px var(--f-body);padding:3px 9px;border-radius:999px;white-space:nowrap}
.far i{width:8px;height:8px;border-radius:50%;display:inline-block}
.far.v{background:#e7f8f2;color:#0b7d5c}.far.v i{background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,.18)}
.far.a{background:#fff6e5;color:#9a6100}.far.a i{background:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.2)}
.far.r{background:#fdecec;color:#b42318}.far.r i{background:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.2);animation:lcpulse 1.4s ease infinite}
.far.c{background:#eef0f6;color:#596079}.far.c i{background:#9aa3b8}
@keyframes lcpulse{50%{box-shadow:0 0 0 6px rgba(239,68,68,.05)}}
.lclist{display:flex;flex-direction:column;gap:10px}
.lcc{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;box-shadow:var(--nx-sh);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;transition:border-color .15s,transform .15s}
.lcc:hover{border-color:#cfc9ff;transform:translateY(-1px)}
.lcc .top2{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11.5px;color:var(--muted)}
.lcc .obj{font:600 14px/1.4 var(--f-body);color:var(--ink);margin:2px 0}
.lcc .org{font-size:12.5px;color:#4a5268}
.lcc .meta{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted)}
.lcc .meta b{color:var(--ink);font-weight:700}
.lcc .acts{display:flex;flex-direction:column;gap:6px;align-items:flex-end;justify-content:center}
.lcc .acts .btn{white-space:nowrap}
.lcc .acts .btn.on{background:#fff6e5;border-color:#f6e2b5;color:#9a6100}
.tag2{font:700 10.5px var(--f-body);padding:2px 8px;border-radius:6px;background:#eef0f6;color:#4a5268}
.kan{display:grid;grid-template-columns:repeat(6,minmax(220px,1fr));gap:12px;overflow-x:auto;padding-bottom:8px}
.kcol{background:#f3f4fa;border:1px solid var(--line);border-radius:14px;padding:10px;min-height:200px}
.kcol h3{display:flex;justify-content:space-between;align-items:center;font:800 12px var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:#4a5268;margin:2px 4px 10px}
.kcol h3 span{background:#fff;border-radius:999px;padding:1px 8px;font-size:11px}
.kcard{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin-bottom:8px;cursor:pointer;box-shadow:0 4px 12px -10px rgba(18,24,38,.4);font-size:12.5px}
.kcard:hover{border-color:#bdb5ff}
.kcard .o{font-weight:700;color:var(--ink);line-height:1.35;margin:6px 0 4px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.kcard .m{color:var(--muted);font-size:11.5px}
.jr{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;box-shadow:var(--nx-sh)}
.jr .h{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11.5px;color:var(--muted);margin-bottom:6px}
.jr .h b{color:var(--ink);font-size:13px}
.jr .t{font-size:13.5px;line-height:1.55;color:#2b3245}
.jr mark{background:linear-gradient(transparent 55%,rgba(139,92,246,.25) 55%);color:inherit}
.jr .f{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.tgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.tcard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--nx-sh)}
.tcard h3{display:flex;gap:10px;align-items:center;margin:0 0 4px;font:800 15px var(--f-body)}
.tcard h3 .ci{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:#fff;background:var(--nx-grad)}
.tcard h3 .ci svg{width:16px;height:16px}
.tcard .d{font-size:12.5px;color:var(--muted);margin:0 0 12px}
.tcard .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.tres{margin-top:12px;border-radius:12px;padding:12px;background:#f6f7fb;font-size:13px;line-height:1.5}
.tres b.big{font:800 22px var(--f-body);display:block}
.tres table{width:100%;border-collapse:collapse;font-size:12.5px}.tres td{padding:5px 0;border-bottom:1px solid #e9ebf3;vertical-align:top}.tres td.r{text-align:right;font-weight:700;white-space:nowrap;padding-left:12px}
.chk{display:flex;flex-direction:column;gap:4px}
.chk h4{margin:10px 0 4px;font:800 12px var(--f-body);text-transform:uppercase;letter-spacing:.06em;color:#4a5268}
.chk label{display:flex;gap:8px;align-items:flex-start;font-size:13px;line-height:1.4;cursor:pointer}
.chk input{margin-top:3px}
.lcdet .kv{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.lcdet .kv div{background:#f6f7fb;border-radius:12px;padding:10px 12px;font-size:11.5px;color:var(--muted)}
.lcdet .kv b{display:block;color:var(--ink);font-size:13.5px;margin-top:2px}
.lcdet .arq{display:flex;flex-direction:column;gap:6px}
.lcdet .arq a{display:flex;gap:10px;align-items:center;padding:9px 12px;border:1px solid var(--line);border-radius:12px;text-decoration:none;color:var(--ink);font-size:13px}
.lcdet .arq a:hover{border-color:#bdb5ff;background:#faf9ff}
.lcdet .arq svg{width:18px;height:18px;color:#7c6cf6;flex:0 0 18px}
@media (max-width:860px){.tgrid{grid-template-columns:1fr}.lcc{grid-template-columns:1fr}.lcc .acts{flex-direction:row;justify-content:flex-start;flex-wrap:wrap}.lcdet .kv{grid-template-columns:1fr 1fr}}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ================================================================ tela de login */
let LG={mode:'in',estado:'?'};
const semConta=()=>{ try{ return sessionStorage.getItem('orcalivre.semconta')==='1'; }catch(e){ return false; } };
function lgHTML(){ const m=LG.mode;
  return `<div class="lgw" id="lgw" role="dialog" aria-label="Entrar no OrçaLivre">
  <section class="art"><div class="brand2"><svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6"/><stop offset=".5" stop-color="#4f7cff"/><stop offset="1" stop-color="#14c8b0"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#lgG)"/><path d="M7.5 22.5h4.6v-4.4H7.5zM13.7 22.5h4.6v-8.2h-4.6zM19.9 22.5h4.6V9.5h-4.6z" fill="#fff"/></svg><span>Orça<b>Livre</b></span></div>
   <div><h1>Orçamento de obras <span>inteligente</span> e gratuito.</h1><p class="lead">Todas as bases públicas atualizadas todo mês, assistente de IA que indica a composição certa e um radar de licitações com farol de prazos.</p>
   <div class="feats"><div class="feat"><b>${il('radar')}Bases oficiais</b>SINAPI dos 27 estados, SICRO, CDHU, SIURB, SUDECAP e outras, com cadernos técnicos.</div><div class="feat"><b>${il('spark')}Assistente de IA</b>Pergunte qual composição usar e peça a revisão do orçamento.</div><div class="feat"><b>${il('lei')}Licitações</b>Editais do PNCP, farol de prazos, funil das suas disputas e jurisprudência do TCU.</div><div class="feat"><b>${il('star')}Na nuvem</b>Seus orçamentos salvos na sua conta, em qualquer computador.</div></div></div>
   <div class="foot">Dados públicos de órgãos oficiais. Confira sempre a fonte antes de usar em proposta.</div></section>
  <section class="side2"><div class="card">
   <h2>${m==='reset'?'Recuperar senha':m==='up'?'Criar sua conta':'Bem-vindo de volta'}</h2><p class="sub">${m==='reset'?'Enviamos um link para você criar uma nova senha.':m==='up'?'Gratuito. Leva menos de um minuto.':'Entre para acessar seus orçamentos.'}</p>
   ${m!=='reset'?`<div class="tabs"><button class="${m==='in'?'on':''}" data-act="lgMode" data-m="in">Entrar</button><button class="${m==='up'?'on':''}" data-act="lgMode" data-m="up">Criar conta</button></div>`:''}
   <form id="fAuth" novalidate onsubmit="return false"><label>E-mail<input name="email" type="email" autocomplete="email" required></label>
   ${m!=='reset'?`<label>Senha<input name="senha" type="password" autocomplete="${m==='up'?'new-password':'current-password'}" minlength="6" required></label>`:''}
   ${m==='in'?`<div class="row"><span></span><button type="button" class="lk" data-act="lgMode" data-m="reset">Esqueci a senha</button></div>`:''}
   <button type="submit" class="go" data-act="lgGo">${m==='reset'?'Enviar link':m==='up'?'Criar conta grátis':'Entrar'}</button>
   <div id="authMsg" role="status"></div></form>
   ${m==='reset'?`<div class="row" style="justify-content:center;margin-top:12px"><button class="lk" data-act="lgMode" data-m="in">Voltar para entrar</button></div>`:''}
   <div class="alt">Prefere testar antes? <button class="lk" data-act="lgSem">Usar sem conta</button><br>Sem conta, os dados ficam só neste navegador.</div>
  </div></section></div>`; }
function lgPaint(){ const show=Store.sb&&!Store.user&&!semConta()&&LG.estado==='out'; let w=$('#lgw');
  if(!show){ if(w) w.remove(); return; }
  if(!w){ document.body.insertAdjacentHTML('beforeend',lgHTML()); setTimeout(()=>$('#lgw input[name=email]')?.focus(),50); } }
function lgRedraw(){ const w=$('#lgw'); if(!w) return; const em=$('#lgw input[name=email]')?.value||''; w.outerHTML=lgHTML(); const e=$('#lgw input[name=email]'); if(e){ e.value=em; (em?$('#lgw input[name=senha]')||e:e).focus(); } }
async function lgCheck(){ if(!Store.sb){ LG.estado='?'; return; }
  let ses=null; try{ const r=await Promise.race([Store.sb.auth.getSession(),new Promise(res=>setTimeout(()=>res('t'),4000))]); ses=r==='t'?(Store.user?{}:null):r?.data?.session; }catch(e){ ses=Store.user?{}:null; }
  LG.estado=ses||Store.user?'in':'out'; lgPaint(); }
ACT.lgMode=d=>{ LG.mode=d.m; S.authMode=d.m; lgRedraw(); };
ACT.lgGo=async()=>{ S.authMode=LG.mode; const b=$('#lgw .go'); if(b){ b.disabled=true; b.style.opacity=.7; } try{ await authGo(); }finally{ const b2=$('#lgw .go'); if(b2){ b2.disabled=false; b2.style.opacity=1; } } if(Store.user){ LG.estado='in'; lgPaint(); } };
ACT.lgSem=()=>{ try{ sessionStorage.setItem('orcalivre.semconta','1'); }catch(e){} lgPaint(); };
const _sair=ACT.sair; ACT.sair=async d=>{ try{ sessionStorage.removeItem('orcalivre.semconta'); }catch(e){} await _sair(d); LG.estado='out'; LG.mode='in'; lgPaint(); };
let lgTimer=null;
(function vigia(){ let tries=0; lgTimer=setInterval(()=>{ tries++; if(Store.sb){ clearInterval(lgTimer); lgCheck(); if(Store.sb.auth.onAuthStateChange) Store.sb.auth.onAuthStateChange(ev=>{ if(ev==='SIGNED_IN'){ LG.estado='in'; lgPaint(); } if(ev==='SIGNED_OUT'){ LG.estado='out'; lgPaint(); } }); } else if(tries>40) clearInterval(lgTimer); },150); })();

/* ================================================================ menu */
(function menu(){ const i=NAV.findIndex(x=>x[0]==='g'&&x[1]==='Orçamento aberto'); const add=[['g','Licitações'],['licRadar','Radar de licitações','search'],['licMinhas','Minhas licitações','list'],['licJuris','Jurisprudência TCU','rel'],['licFerr','Ferramentas 14.133','bdi']];
  NAV.splice(i<0?NAV.length:i,0,...add); for(const a of add) if(a[0]!=='g') LIVRES.push(a[0]); })();
const head=(k,t,s,a='')=>`<div class="head"><div class="ofh"><span class="ic">${il(k)}</span><div><h1>${t}</h1>${s?`<div class="sub">${s}</div>`:''}</div></div>${a?`<div class="actions">${a}</div>`:''}</div>`;

/* ================================================================ farol */
function farol(fim,ini){ const f=dt(fim); if(!f) return {c:'c',t:'Sem data'}; const d=(f-Date.now())/864e5;
  if(d<0) return {c:'c',t:'Encerrada'}; if(d<=2) return {c:'r',t:d<1?`Encerra hoje`:`${Math.ceil(d)} dias`}; if(d<=7) return {c:'a',t:`${Math.ceil(d)} dias`}; return {c:'v',t:`${Math.ceil(d)} dias`}; }
const farolHTML=(fim,ini)=>{ const f=farol(fim,ini); return `<span class="far ${f.c}" title="Prazo para envio de propostas"><i></i>${f.t}</span>`; };

/* ================================================================ radar (PNCP) */
const UFS='AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO'.split(' ');
const MODS=[['','Todas'],['4','Concorrência eletrônica'],['5','Concorrência presencial'],['6','Pregão eletrônico'],['7','Pregão presencial'],['8','Dispensa'],['9','Inexigibilidade'],['12','Credenciamento'],['2','Diálogo competitivo']];
const PRESET=[['Obras e reformas','obra reforma construção'],['Pavimentação','pavimentação asfáltica recapeamento'],['Edificações','construção edificação escola creche unidade básica'],['Saneamento','saneamento esgoto rede de água drenagem'],['Manutenção predial','manutenção predial preventiva corretiva'],['Elétrica','instalações elétricas iluminação pública'],['Projetos','elaboração de projeto executivo engenharia'],['Pontes e contenções','ponte contenção muro de arrimo']];
S.lr=S.lr||{q:'obra reforma construção',uf:'',mod:'',esf:'',st:'recebendo_proposta',ord:'',pag:1,res:null,total:0};
async function pncpBusca(){ const F=S.lr; F.busy=true; renderIf('licRadar');
  const p=new URLSearchParams({q:F.q||'obra',tipos_documento:'edital',pagina:String(F.pag),tam_pagina:'20',status:F.st||'recebendo_proposta'});
  if(F.uf) p.set('ufs',F.uf); if(F.mod) p.set('modalidades',F.mod); if(F.esf) p.set('esferas',F.esf); if(F.ord) p.set('ordenacao',F.ord);
  try{ const j=await fetch('https://pncp.gov.br/api/search/?'+p).then(r=>r.json()); F.res=(j.items||[]).map(norm); F.total=j.total||0; F.err=''; }
  catch(e){ F.res=[]; F.total=0; F.err='Não foi possível consultar o PNCP agora. Tente de novo em instantes.'; }
  F.busy=false; vistos(F.res); renderIf('licRadar'); }
function norm(x){ const m=String(x.item_url||'').match(/compras\/(\d+)\/(\d+)\/(\d+)/)||[];
  return {pid:x.numero_controle_pncp||x.id, cnpj:m[1], ano:m[2], seq:m[3], titulo:x.title, objeto:dec(x.description), orgao:x.orgao_nome, uf:x.uf, mun:x.municipio_nome, ibge:x.codigo_ibge,
    modalidade:x.modalidade_licitacao_nome, esfera:x.esfera_nome, valor:x.valor_global, ini:x.data_inicio_vigencia, fim:x.data_fim_vigencia, pub:x.data_publicacao_pncp, sit:x.situacao_nome,
    url:m[1]?`https://pncp.gov.br/app/editais/${m[1]}/${m[2]}/${m[3]}`:'https://pncp.gov.br'}; }
function vistos(l){ const v=lsGet('orcalivre.lic.vistos',{}); const now=Date.now(); for(const x of l||[]) if(!v[x.pid]) v[x.pid]=now; lsSet('orcalivre.lic.vistos',v); }
const minhas=()=>S.docs.filter(d=>d.kind==='lic');
const acompanhada=pid=>minhas().find(d=>d.pid===pid);
function cardLic(x){ const ac=acompanhada(x.pid);
  return `<article class="lcc"><div><div class="top2">${farolHTML(x.fim,x.ini)}<span class="tag2">${esc(x.modalidade||'')}</span><span>${esc(x.mun||'')}${x.uf?' / '+esc(x.uf):''}</span><span>· ${esc(x.titulo||'')}</span></div>
   <div class="obj">${esc(x.objeto||'')}</div><div class="org">${esc(x.orgao||'')}</div>
   <div class="meta"><span>Propostas: <b>${fdt(dt(x.ini))}</b> até <b>${fdt(dt(x.fim))}</b></span>${x.valor?`<span>Valor: <b>${brl(x.valor)}</b></span>`:''}<span>Esfera: ${esc(x.esfera||'')}</span></div></div>
   <div class="acts"><button class="btn sm primary" data-act="licDet" data-pid="${esc(x.pid)}">Detalhes</button><button class="btn sm ${ac?'on':''}" data-act="licSeguir" data-pid="${esc(x.pid)}">${il('star').replace('<svg','<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"')}${ac?'Acompanhando':'Acompanhar'}</button><a class="btn sm" href="${esc(x.url)}" target="_blank" rel="noopener">PNCP ↗</a></div></article>`; }
VIEWS.licRadar=()=>{ const F=S.lr; const res=F.res;
  if(!res&&!F.busy) setTimeout(pncpBusca,0);
  const cont={v:0,a:0,r:0,c:0}; for(const x of res||[]) cont[farol(x.fim).c]++;
  const salvas=lsGet('orcalivre.lic.buscas',[]);
  return head('radar','Radar de licitações','Editais publicados no PNCP (Portal Nacional de Contratações Públicas), atualizados em tempo real',`<button class="btn" data-act="licSalvar">${il('bell').replace('<svg','<svg style="width:15px;height:15px;vertical-align:-3px;margin-right:4px"')}Salvar esta busca</button>`)+
  `<div class="lcbar"><label class="field grow"><span>Palavras-chave do objeto</span><input id="lcq" value="${esc(F.q)}" placeholder="ex.: reforma de escola, pavimentação, UBS"></label>
   <label class="field"><span>Estado</span><select data-lr="uf"><option value="">Todos</option>${UFS.map(u=>`<option ${F.uf===u?'selected':''}>${u}</option>`).join('')}</select></label>
   <label class="field"><span>Modalidade</span><select data-lr="mod">${MODS.map(([v,l])=>`<option value="${v}" ${F.mod===v?'selected':''}>${l}</option>`).join('')}</select></label>
   <label class="field"><span>Esfera</span><select data-lr="esf"><option value="">Todas</option><option value="M" ${F.esf==='M'?'selected':''}>Municipal</option><option value="E" ${F.esf==='E'?'selected':''}>Estadual</option><option value="F" ${F.esf==='F'?'selected':''}>Federal</option></select></label>
   <label class="field"><span>Situação</span><select data-lr="st"><option value="recebendo_proposta" ${F.st==='recebendo_proposta'?'selected':''}>Recebendo propostas</option><option value="todos" ${F.st==='todos'?'selected':''}>Todas</option></select></label>
   <label class="field"><span>Ordem</span><select data-lr="ord"><option value="" ${!F.ord?'selected':''}>Mais relevantes</option><option value="-data" ${F.ord==='-data'?'selected':''}>Mais recentes</option></select></label>
   <button class="btn primary" data-act="licBuscar">Buscar</button></div>
   <div class="lcchips">${PRESET.map(([l,q])=>`<button class="${F.q===q?'on':''}" data-act="licPreset" data-q="${esc(q)}">${esc(l)}</button>`).join('')}</div>
   ${salvas.length?`<div class="lcchips"><span class="note" style="align-self:center">Buscas salvas:</span>${salvas.map((s,i)=>`<button data-act="licAbrirBusca" data-i="${i}">${il('bell').replace('<svg','<svg style="width:12px;height:12px;vertical-align:-2px;margin-right:3px"')}${esc(s.nome)}</button>`).join('')}</div>`:''}
   <div class="lcsum"><div>Encontradas<b>${F.busy?'…':nf0.format(F.total||0)}</b></div><div><span class="far r"><i></i>Até 2 dias</span><b>${cont.r}</b></div><div><span class="far a"><i></i>3 a 7 dias</span><b>${cont.a}</b></div><div><span class="far v"><i></i>Mais de 7 dias</span><b>${cont.v}</b></div><div>Acompanhando<b>${minhas().length}</b></div></div>
   ${F.err?`<div class="banner">${esc(F.err)}</div>`:''}
   <div class="lclist">${F.busy&&!res?'<div class="empty"><b>Consultando o PNCP…</b></div>':(res||[]).length?res.map(cardLic).join(''):'<div class="empty"><b>Nenhum edital encontrado</b>Tente outras palavras, outro estado ou "Todas" as situações.</div>'}</div>
   ${(F.total||0)>F.pag*20?`<div style="display:flex;gap:8px;justify-content:center;margin-top:14px">${F.pag>1?'<button class="btn" data-act="licPag" data-d="-1">Anteriores</button>':''}<span class="note" style="align-self:center">Página ${F.pag} de ${Math.ceil(F.total/20)}</span><button class="btn" data-act="licPag" data-d="1">Próximos</button></div>`:''}
   <p class="note">Fonte: API pública do PNCP. O farol considera a data-limite de envio de propostas publicada pelo órgão. Confira sempre o edital e eventuais retificações.</p>`; };
function renderIf(v){ if(S.view===v) render(); }
ACT.licBuscar=()=>{ S.lr.q=($('#lcq')?.value||'').trim(); S.lr.pag=1; pncpBusca(); };
ACT.licPreset=d=>{ S.lr.q=d.q; S.lr.pag=1; pncpBusca(); };
ACT.licPag=d=>{ S.lr.pag=Math.max(1,S.lr.pag+(+d.d)); pncpBusca(); scrollTo(0,0); };
ACT.licSalvar=()=>{ const F=S.lr; const nome=prompt('Nome desta busca (ex.: Pavimentação SP)',(F.q||'').slice(0,30)+(F.uf?' '+F.uf:'')); if(!nome) return; const l=lsGet('orcalivre.lic.buscas',[]); l.push({nome,q:F.q,uf:F.uf,mod:F.mod,esf:F.esf,st:F.st}); lsSet('orcalivre.lic.buscas',l); toast('Busca salva. Ela aparece no topo do radar.'); render(); };
ACT.licAbrirBusca=d=>{ const s=lsGet('orcalivre.lic.buscas',[])[+d.i]; if(!s) return; Object.assign(S.lr,s,{pag:1}); pncpBusca(); };
document.addEventListener('change',e=>{ const k=e.target.dataset?.lr; if(k){ S.lr[k]=e.target.value; S.lr.q=($('#lcq')?.value||S.lr.q).trim(); S.lr.pag=1; pncpBusca(); } });
document.addEventListener('keydown',e=>{ if(e.target.id==='lcq'&&e.key==='Enter'){ e.preventDefault(); ACT.licBuscar(); } if(e.target.id==='ljq'&&e.key==='Enter'){ e.preventDefault(); ACT.ljBuscar(); } });

/* ================================================================ detalhe do edital */
const achar=pid=>(S.lr.res||[]).find(x=>x.pid===pid)||minhas().find(d=>d.pid===pid);
async function detalhe(x){ const D={x,info:null,arq:null,itens:null};
  const base=`https://pncp.gov.br/api/pncp/v1/orgaos/${x.cnpj}/compras/${x.ano}/${x.seq}`;
  const J=u=>fetch(u).then(r=>r.ok?r.json():null).catch(()=>null);
  const [info,arq,itens]=await Promise.all([J(base),J(base+'/arquivos'),J(base+'/itens?pagina=1&tamanhoPagina=500')]);
  D.info=info; D.arq=Array.isArray(arq)?arq:[]; D.itens=Array.isArray(itens)?itens:[]; return D; }
ACT.licDet=async d=>{ const x=achar(d.pid); if(!x||!x.cnpj){ toast('Edital sem identificação do PNCP.'); return; }
  S.ld={x,carregando:true}; modal(detHTML);
  const D=await detalhe(x); if(S.ld?.x?.pid!==x.pid) return; S.ld=D; remodal(); };
function detHTML(){ const D=S.ld; const x=D.x; const i=D.info||{};
  const vEst=i.valorTotalEstimado??x.valor; const abre=i.dataAberturaProposta||x.ini, fecha=i.dataEncerramentoProposta||x.fim;
  const imp=dt(fecha)?uteis(dt(fecha),-3):null;
  const tot=(D.itens||[]).reduce((s,it)=>s+(+it.valorTotal||(+it.valorUnitarioEstimado||0)*(+it.quantidade||0)),0);
  const body=`<div class="lcdet stack" style="gap:14px">
   <div class="kv"><div>Farol${'<br>'}${farolHTML(fecha,abre)}</div><div>Valor estimado<b>${vEst?brl(vEst):tot?brl(tot)+' (soma dos itens)':'Sigiloso ou não informado'}</b></div><div>Modalidade<b>${esc(i.modalidadeNome||x.modalidade||'—')}</b></div>
    <div>Recebe propostas a partir de<b>${fdt(dt(abre))}</b></div><div>Data-limite das propostas<b>${fdt(dt(fecha))}</b></div><div>Impugnação / esclarecimento até<b>${imp?imp.toLocaleDateString('pt-BR'):'—'}</b><span style="font-size:10.5px">3 dias úteis antes (art. 164, Lei 14.133)</span></div>
    <div>Modo de disputa<b>${esc(i.modoDisputaNome||'—')}</b></div><div>Registro de preços<b>${i.srp===true?'Sim':i.srp===false?'Não':'—'}</b></div><div>Amparo legal<b>${esc(i.amparoLegal?.nome||'—')}</b></div></div>
   <div><div class="eyebrow">Objeto</div><p style="margin:4px 0 0;line-height:1.55">${esc(i.objetoCompra||x.objeto||'')}</p>${i.informacaoComplementar?`<p class="note" style="margin:6px 0 0">${esc(dec(i.informacaoComplementar)).slice(0,800)}</p>`:''}</div>
   <div><div class="eyebrow">Órgão</div><p style="margin:4px 0 0">${esc(i.orgaoEntidade?.razaoSocial||x.orgao||'')} · ${esc(i.unidadeOrgao?.municipioNome||x.mun||'')}/${esc(i.unidadeOrgao?.ufSigla||x.uf||'')}${i.unidadeOrgao?.nomeUnidade?' · '+esc(i.unidadeOrgao.nomeUnidade):''}</p></div>
   <div><div class="eyebrow">Arquivos do edital</div>${D.carregando?'<p class="note">Carregando…</p>':D.arq?.length?`<div class="arq">${D.arq.map(a=>`<a href="${esc(a.url||a.uri)}" target="_blank" rel="noopener">${il('file')}<span style="flex:1">${esc(a.titulo||'Arquivo')}</span><span class="note">${esc(a.tipoDocumentoNome||'')}</span></a>`).join('')}</div>`:'<p class="note">Nenhum arquivo publicado no PNCP.</p>'}</div>
   <div><div class="eyebrow">Itens (${D.itens?.length||0})</div>${D.carregando?'<p class="note">Carregando…</p>':D.itens?.length?`<div class="res"><table class="t"><thead><tr><th>Item</th><th>Descrição</th><th>Und</th><th class="r">Quant.</th><th class="r">Valor unit. estimado</th><th class="r">Total</th></tr></thead><tbody>${D.itens.slice(0,300).map(it=>`<tr><td>${it.numeroItem}</td><td class="desc">${esc(dec(it.descricao||''))}</td><td>${esc(it.unidadeMedida||'')}</td><td class="r">${Q(+it.quantidade||0)}</td><td class="r">${it.orcamentoSigiloso?'Sigiloso':brl(+it.valorUnitarioEstimado)}</td><td class="r">${it.orcamentoSigiloso?'—':brl(+it.valorTotal||(+it.valorUnitarioEstimado||0)*(+it.quantidade||0))}</td></tr>`).join('')}</tbody></table></div>`:'<p class="note">Itens não informados.</p>'}</div>
  </div>`;
  const ac=acompanhada(x.pid);
  return dlg(`<div class="eyebrow">${esc(x.titulo||'Edital')} · ${esc(x.modalidade||'')}</div><h2 style="margin:4px 0 0;font-size:17px;line-height:1.35">${esc((x.objeto||'').slice(0,220))}</h2>`,body,
   `<a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener">Abrir no PNCP ↗</a>${i.linkSistemaOrigem?`<a class="btn" href="${esc(i.linkSistemaOrigem)}" target="_blank" rel="noopener">Sistema da disputa ↗</a>`:''}<button class="btn" data-act="licIA" data-pid="${esc(x.pid)}">${il('spark').replace('<svg','<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"')}Perguntar à IA</button>${D.itens?.length?`<button class="btn" data-act="licOrc" data-pid="${esc(x.pid)}">Criar orçamento com os itens</button>`:''}<button class="btn primary" data-act="licSeguir" data-pid="${esc(x.pid)}">${ac?'Acompanhando ✓':'Acompanhar'}</button>`,true); }
ACT.licIA=d=>{ const x=achar(d.pid)||S.ld?.x; if(!x) return; closeModal(); ACT.nxChip&&ACT.nxChip({q:`Vou avaliar participar desta licitação: "${(x.objeto||'').slice(0,400)}" (${x.modalidade||''}, ${x.orgao||''} - ${x.mun||''}/${x.uf||''}). Quais composições das bases devo usar para os principais serviços e quais riscos de orçamento devo conferir no edital?`}); };
ACT.licOrc=async()=>{ const D=S.ld; if(!D?.itens?.length) return; const x=D.x;
  const o=newBudget({nome:('Licitação · '+(x.objeto||x.titulo||'')).slice(0,80),cliente:x.orgao||'',local:[x.mun,x.uf].filter(Boolean).join('/'),dataBase:new Date().toISOString().slice(0,7)});
  o.items.push({id:uid(),k:'E',d:'ITENS DO EDITAL (PREÇO ESTIMADO PELO ÓRGÃO)'});
  for(const it of D.itens){ o.items.push({id:uid(),k:'V',t:'M',c:'IT'+it.numeroItem,bl:'EDITAL',d:dec(it.descricao||'').toUpperCase().slice(0,400),u:String(it.unidadeMedida||'UN').toUpperCase(),q:+it.quantidade||0,cu:r2(+it.valorUnitarioEstimado||0)}); }
  await Store.save(o); const ac=acompanhada(x.pid); if(ac){ ac.orc=o.id; await Store.save(ac); }
  closeModal(); S.cur=o; S.sel=null; lsSet('orcalivre.last',o.id); go('plan'); toast('Orçamento criado com os itens e preços estimados do edital. Agora troque cada item pela composição da base.'); };
ACT.licSeguir=async d=>{ const ja=acompanhada(d.pid);
  if(ja){ if(!confirm('Parar de acompanhar esta licitação?')) return; await Store.del(ja.id); toast('Removida das suas licitações.'); }
  else { const x=achar(d.pid); if(!x) return; await Store.save({id:uid(),kind:'lic',...x,etapa:'analise',notas:'',check:{},orc:null,criado:Date.now()}); toast('Adicionada em Minhas licitações.'); }
  if(!$('#modal').hidden&&S.ld) remodal(); render(); };

/* ================================================================ minhas licitações (funil) */
const ETAPAS=[['analise','Em análise'],['participar','Vou participar'],['enviada','Proposta enviada'],['ganha','Ganha'],['perdida','Perdida'],['descartada','Descartada']];
VIEWS.licMinhas=()=>{ const L=minhas(); const by={}; for(const e of ETAPAS) by[e[0]]=[]; for(const d of L) (by[d.etapa]||by.analise).push(d);
  for(const k in by) by[k].sort((a,b)=>(dt(a.fim)||0)-(dt(b.fim)||0));
  const ab=L.filter(d=>['analise','participar','enviada'].includes(d.etapa)); const vAb=ab.reduce((s,d)=>s+(+d.valor||0),0);
  const dec2=L.filter(d=>['ganha','perdida'].includes(d.etapa)); const taxa=dec2.length?L.filter(d=>d.etapa==='ganha').length/dec2.length*100:null;
  const urg=ab.filter(d=>farol(d.fim).c==='r').length;
  return head('pasta','Minhas licitações','Acompanhe cada disputa da análise do edital até o resultado')+
   `<div class="lcsum"><div>Em andamento<b>${ab.length}</b></div><div><span class="far r"><i></i>Prazo crítico</span><b>${urg}</b></div><div>Valor em disputa<b>${brl(vAb)}</b></div><div>Taxa de sucesso<b>${taxa==null?'—':nf2.format(taxa)+'%'}</b></div></div>
   ${L.length?`<div class="kan">${ETAPAS.map(([k,l])=>`<div class="kcol"><h3>${l}<span>${by[k].length}</span></h3>${by[k].map(d=>`<div class="kcard" data-act="licCard" data-id="${d.id}">${farolHTML(d.fim)}<div class="o">${esc(d.objeto||'')}</div><div class="m">${esc(d.orgao||'')}<br>${esc(d.mun||'')}/${esc(d.uf||'')} · até ${fdt(dt(d.fim))}${d.valor?'<br>'+brl(d.valor):''}</div></div>`).join('')}</div>`).join('')}</div>`
   :`<div class="empty"><b>Nenhuma licitação acompanhada ainda</b>Use o Radar de licitações e clique em "Acompanhar" nos editais que interessam.<div style="margin-top:12px"><button class="btn primary" data-act="go" data-v="licRadar">Abrir o radar</button></div></div>`}`; };
const CHK=[['Habilitação jurídica (art. 66)',['Ato constitutivo / contrato social atualizado','Documento dos sócios e procuração, se houver']],
  ['Fiscal, social e trabalhista (art. 68)',['CNPJ','Regularidade com a Fazenda federal e INSS (certidão conjunta)','Regularidade estadual e municipal','FGTS (CRF)','Certidão negativa de débitos trabalhistas (CNDT)','Declaração de cumprimento do art. 7º, XXXIII da Constituição (menor aprendiz)']],
  ['Econômico-financeira (art. 69)',['Balanço patrimonial e demonstrações dos 2 últimos exercícios','Certidão negativa de falência','Índices de liquidez exigidos no edital','Capital ou patrimônio líquido mínimo, se exigido']],
  ['Técnica (art. 67)',['Registro no CREA/CAU da empresa e do responsável técnico','Atestados de capacidade técnico-operacional nas parcelas de maior relevância','CAT do profissional nas parcelas de maior relevância','Vínculo do responsável técnico com a empresa','Declaração de visita técnica ou de conhecimento do local']],
  ['Proposta',['Planilha orçamentária com composições, BDI e encargos sociais','Composição do BDI e dos encargos sociais detalhada','Cronograma físico-financeiro','Conferir preços unitários contra o orçamento do edital (sobrepreço)','Conferir exequibilidade (≥ 75% do valor orçado, art. 59 §4º)','Garantia de proposta, se exigida (até 1%, art. 58)']]];
ACT.licCard=d=>{ S.lc=d.id; modal(cardHTML); };
ACT.licAbrirOrc=d=>{ closeModal(); ACT.open({id:d.id}); };
function cardHTML(){ const L=minhas().find(x=>x.id===S.lc); if(!L) return dlg('<h2 style="margin:0">Licitação</h2>','<p>Não encontrada.</p>','<button class="btn" data-act="close">Fechar</button>');
  const orcs=S.docs.filter(d=>d.kind==='orc'); const ck=L.check||{}; let n=0, ok=0;
  const lista=CHK.map(([g,its],gi)=>`<h4>${g}</h4>${its.map((t,ii)=>{ const k=gi+'.'+ii; n++; if(ck[k]) ok++; return `<label><input type="checkbox" data-lck="${k}" ${ck[k]?'checked':''}>${esc(t)}</label>`; }).join('')}`).join('');
  const fecha=dt(L.fim), imp=fecha?uteis(fecha,-3):null;
  return dlg(`<div class="eyebrow">${esc(L.modalidade||'')} · ${esc(L.orgao||'')}</div><h2 style="margin:4px 0 0;font-size:17px;line-height:1.35">${esc((L.objeto||'').slice(0,220))}</h2>`,
   `<div class="lcdet stack" style="gap:14px"><div class="kv"><div>Farol<br>${farolHTML(L.fim)}</div><div>Data-limite das propostas<b>${fdt(fecha)}</b></div><div>Impugnação até<b>${imp?imp.toLocaleDateString('pt-BR'):'—'}</b></div></div>
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px"><label class="field"><span>Etapa</span><select data-lcf="etapa">${ETAPAS.map(([k,l])=>`<option value="${k}" ${L.etapa===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <label class="field"><span>Orçamento vinculado</span><select data-lcf="orc"><option value="">Nenhum</option>${orcs.map(o=>`<option value="${o.id}" ${L.orc===o.id?'selected':''}>${esc(o.nome)}</option>`).join('')}</select></label>
    <label class="field"><span>Valor da nossa proposta (R$)</span><input data-lcf="proposta" value="${L.proposta?R(L.proposta):''}" inputmode="decimal"></label><label class="field"><span>Valor vencedor (R$)</span><input data-lcf="vencedor" value="${L.vencedor?R(L.vencedor):''}" inputmode="decimal"></label></div>
    <label class="field"><span>Anotações</span><textarea data-lcf="notas" rows="3" style="width:100%">${esc(L.notas||'')}</textarea></label>
    <div><div class="eyebrow">Checklist de habilitação e proposta · ${ok}/${n}</div><div class="nxbar" style="margin:6px 0 4px"><i style="width:${n?ok/n*100:0}%"></i></div><div class="chk">${lista}</div><p class="note">Lista de referência da Lei 14.133/2021. Siga sempre as exigências específicas do edital.</p></div></div>`,
   `<button class="btn danger" data-act="licSeguir" data-pid="${esc(L.pid)}">Parar de acompanhar</button>${L.orc?`<button class="btn" data-act="licAbrirOrc" data-id="${L.orc}">Abrir orçamento</button>`:''}<button class="btn" data-act="licDet" data-pid="${esc(L.pid)}">Ver edital</button><button class="btn primary" data-act="close">Concluir</button>`,true); }
document.addEventListener('change',async e=>{ const t=e.target; const L=minhas().find(x=>x.id===S.lc); if(!L) return;
  if(t.dataset.lck!=null){ L.check=L.check||{}; L.check[t.dataset.lck]=t.checked; await Store.save(L); remodal(); return; }
  const f=t.dataset.lcf; if(f){ L[f]=(f==='proposta'||f==='vencedor')?(num(t.value)||null):t.value; await Store.save(L); if(f==='etapa') render(); } });
const _close=ACT.close; ACT.close=d=>{ _close(d); if(S.view==='licMinhas') render(); };

/* ================================================================ jurisprudência TCU */
S.lj=S.lj||{q:'',base:'selecionada',res:null,total:0,inicio:0};
const TEMAS=['BDI','sobrepreço obras','jogo de planilha','inexequibilidade obras','desoneração folha BDI','SINAPI referência de preço','aditivo 25% obras','reequilíbrio econômico-financeiro','atestado capacidade técnica parcela relevância','visita técnica obrigatória','subcontratação obra','medição serviços não executados','orçamento sigiloso','matriz de riscos contratação integrada'];
async function tcuBusca(){ const F=S.lj; if(!F.q){ F.res=null; renderIf('licJuris'); return; } F.busy=true; renderIf('licJuris');
  try{ const u=`${C().supabaseUrl}/functions/v1/tcu?base=${F.base}&qtd=20&inicio=${F.inicio}&q=${encodeURIComponent(F.q)}`; const j=await fetch(u).then(r=>r.json()); F.res=Array.isArray(j.docs)?j.docs:[]; F.total=j.total||F.res.length; F.err=j.erro?'O TCU não respondeu agora. Tente novamente.':''; }
  catch(e){ F.res=[]; F.err='Não foi possível consultar o TCU agora.'; }
  F.busy=false; renderIf('licJuris'); }
async function tcuRecentes(){ if(S.ljRec) return; S.ljRec='load'; try{ S.ljRec=await fetch('https://dados-abertos.apps.tcu.gov.br/api/acordao/recupera-acordaos?inicio=0&quantidade=12').then(r=>r.json()); }catch(e){ S.ljRec=[]; } renderIf('licJuris'); }
const hlT=s=>esc(String(s||'').replace(/<(?!\/?em>)[^>]+>/g,'')).replace(/&lt;em&gt;/g,'<mark>').replace(/&lt;\/em&gt;/g,'</mark>');
const noTag=s=>String(s||'').replace(/<[^>]+>/g,'');
function linkTCU(d,base){ if(d.NUMACORDAO&&d.ANOACORDAO) return `https://pesquisa.apps.tcu.gov.br/documento/acordao-completo/*/NUMACORDAO%253A${d.NUMACORDAO}%2520ANOACORDAO%253A${d.ANOACORDAO}${d.COLEGIADO?'%2520COLEGIADO%253A%2522'+encodeURIComponent(encodeURIComponent(noTag(d.COLEGIADO)))+'%2522':''}/DTRELEVANCIA%2520desc/0`;
  return `https://pesquisa.apps.tcu.gov.br/pesquisa/${base==='sumula'?'sumula':'jurisprudencia-selecionada'}?termo=${encodeURIComponent(S.lj.q)}`; }
function jrHTML(d){ const base=S.lj.base;
  const tit=base==='sumula'?`Súmula ${noTag(d.NUMSUMULA||d.NUMERO||'')}`:`Acórdão ${noTag(d.NUMACORDAO)}/${noTag(d.ANOACORDAO)} · ${noTag(d.COLEGIADO)}`;
  const txt=base==='acordao'?(d.SUMARIO||[d.FRAGMENTO1,d.FRAGMENTO2].filter(Boolean).join(' ')):(d.ENUNCIADO||d.TEXTOSUMULA||d.SUMARIO||'');
  const tema=[d.AREA,d.TEMA,d.SUBTEMA].filter(Boolean).map(noTag).join(' › ');
  return `<article class="jr"><div class="h"><b>${esc(tit)}</b>${d.DATASESSAOFORMATADA||d.DATASESSAO?`<span>· ${esc(noTag(d.DATASESSAOFORMATADA||d.DATASESSAO))}</span>`:''}${d.AUTORTESE||d.RELATOR?`<span>· Relator: ${esc(noTag(d.AUTORTESE||d.RELATOR))}</span>`:''}${tema?`<span class="tag2">${esc(tema)}</span>`:''}</div>
   <div class="t">${hlT(txt)}</div><div class="f"><a class="btn sm" href="${esc(linkTCU(d,base))}" target="_blank" rel="noopener">Abrir no TCU ↗</a><button class="btn sm" data-act="ljIA" data-t="${esc(noTag(txt).slice(0,700))}" data-n="${esc(tit)}">${il('spark').replace('<svg','<svg style="width:13px;height:13px;vertical-align:-2px;margin-right:4px"')}Explicar na prática</button></div></article>`; }
VIEWS.licJuris=()=>{ const F=S.lj; if(!F.q) tcuRecentes();
  const rec=Array.isArray(S.ljRec)?S.ljRec:[];
  return head('lei','Jurisprudência do TCU','Entendimentos do Tribunal de Contas da União sobre licitações e obras')+
   `<div class="lcbar"><label class="field grow"><span>Pesquisar</span><input id="ljq" value="${esc(F.q)}" placeholder="ex.: BDI diferenciado para equipamentos, jogo de planilha"></label>
    <label class="field"><span>Base</span><select id="ljb"><option value="selecionada" ${F.base==='selecionada'?'selected':''}>Jurisprudência selecionada (enunciados)</option><option value="acordao" ${F.base==='acordao'?'selected':''}>Acórdãos completos</option><option value="sumula" ${F.base==='sumula'?'selected':''}>Súmulas</option></select></label>
    <button class="btn primary" data-act="ljBuscar">Pesquisar</button></div>
   <div class="lcchips">${TEMAS.map(t=>`<button class="${F.q===t?'on':''}" data-act="ljTema" data-q="${esc(t)}">${esc(t)}</button>`).join('')}</div>
   ${F.err?`<div class="banner">${esc(F.err)}</div>`:''}
   ${F.q?`<p class="note">${F.busy?'Pesquisando no TCU…':`${nf0.format(F.total||0)} resultado(s) para "${esc(F.q)}"`}</p><div class="lclist">${(F.res||[]).map(jrHTML).join('')||(!F.busy?'<div class="empty"><b>Nada encontrado</b>Tente outros termos ou outra base.</div>':'')}</div>
     ${(F.total||0)>F.inicio+20?`<div style="text-align:center;margin-top:12px"><button class="btn" data-act="ljMais">Próximos resultados</button></div>`:''}`
   :`<h2 style="margin:18px 0 10px">Acórdãos mais recentes</h2><div class="lclist">${S.ljRec==='load'?'<div class="empty"><b>Carregando…</b></div>':rec.map(a=>`<article class="jr"><div class="h"><b>${esc(a.titulo||'')}</b><span>· ${esc(a.dataSessao||'')}</span><span>· Relator: ${esc(a.relator||'')}</span></div><div class="t">${esc(a.sumario||'')}</div><div class="f">${a.urlAcordao?`<a class="btn sm" href="${esc(a.urlAcordao)}" target="_blank" rel="noopener">Abrir ↗</a>`:''}${a.urlArquivoPdf?`<a class="btn sm" href="${esc(a.urlArquivoPdf)}" target="_blank" rel="noopener">PDF ↗</a>`:''}</div></article>`).join('')}</div>`}
   <p class="note">Fonte: pesquisa pública e dados abertos do TCU.</p>`; };
ACT.ljBuscar=()=>{ S.lj.q=($('#ljq')?.value||'').trim(); S.lj.base=$('#ljb')?.value||'selecionada'; S.lj.inicio=0; tcuBusca(); };
ACT.ljTema=d=>{ S.lj.q=d.q; S.lj.base=$('#ljb')?.value||S.lj.base; S.lj.inicio=0; tcuBusca(); };
ACT.ljMais=()=>{ S.lj.inicio+=20; tcuBusca(); scrollTo(0,0); };
ACT.ljIA=d=>{ ACT.nxChip&&ACT.nxChip({q:`Explique na prática, para quem faz orçamento de obra pública, o que muda com este entendimento do TCU (${d.n}): "${d.t}"`}); };
document.addEventListener('change',e=>{ if(e.target.id==='ljb'&&S.lj.q){ S.lj.base=e.target.value; S.lj.inicio=0; tcuBusca(); } });

/* ================================================================ ferramentas (Lei 14.133) */
S.lf=S.lf||{orcado:'',prop:'',abertura:'',orc:'',desc:''};
VIEWS.licFerr=()=>{ const F=S.lf; const orcs=S.docs.filter(d=>d.kind==='orc');
  const vo=num(F.orcado), vp=num(F.prop); let ex='';
  if(vo>0&&vp>0){ const p=vp/vo*100; const c=p<75?'r':p<85?'a':'v'; const gar=p<85?(0.85*vo-vp):0;
    ex=`<div class="tres"><span class="far ${c}"><i></i>${c==='r'?'Presunção de inexequibilidade':c==='a'?'Exige garantia adicional':'Sem restrições de exequibilidade'}</span><b class="big">${nf2.format(p)}% do valor orçado</b>
     ${c==='r'?'Abaixo de 75% do valor orçado pela Administração: a proposta é considerada inexequível (art. 59, §4º). Ainda assim, a jurisprudência do TCU admite que o licitante demonstre a exequibilidade.':c==='a'?`Entre 75% e 85%: será exigida garantia adicional igual à diferença entre 85% do valor orçado e a proposta (art. 59, §5º): <b>${brl(gar)}</b>.`:'Proposta igual ou acima de 85% do valor orçado.'}</div>`; }
  let pz='';
  const ab=dt(F.abertura); if(ab){ const imp=uteis(ab,-3);
    pz=`<div class="tres"><table><tr><td>Impugnação e pedido de esclarecimento (art. 164)</td><td class="r">até ${imp.toLocaleDateString('pt-BR')}</td></tr><tr><td>Resposta da Administração à impugnação</td><td class="r">até 3 dias úteis após o pedido</td></tr><tr><td>Recurso após a habilitação/julgamento (art. 165)</td><td class="r">3 dias úteis da intimação</td></tr><tr><td>Contrarrazões</td><td class="r">3 dias úteis do fim do prazo do recurso</td></tr></table><p class="note" style="margin:8px 0 0">Dias úteis contados sem feriados. Confira o calendário local e o edital.</p></div>`; }
  const o=orcs.find(x=>x.id===F.orc); let pr='';
  if(o){ const {tot}=calc(o); const d=num(F.desc)||0; const fin=tot.pv*(1-d/100);
    pr=`<div class="tres"><table><tr><td>Preço do orçamento (com BDI)</td><td class="r">${brl(tot.pv)}</td></tr><tr><td>Desconto linear</td><td class="r">${nf2.format(d)}%</td></tr><tr><td>Valor da proposta</td><td class="r">${brl(fin)}</td></tr>${vo>0?`<tr><td>Em relação ao valor orçado informado acima</td><td class="r">${nf2.format(fin/vo*100)}%</td></tr>`:''}</table>
     <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm primary" data-act="lfCopia">Criar cópia do orçamento com o desconto</button><button class="btn sm" data-act="lfUsar">Usar como valor da proposta</button></div><p class="note" style="margin:8px 0 0">Desconto linear em todos os itens evita o "jogo de planilha", vedado pelo TCU.</p></div>`; }
  const prazosPub=[['Bens: menor preço ou maior desconto','8 dias úteis'],['Serviços comuns e obras/serviços comuns de engenharia: menor preço ou maior desconto','10 dias úteis'],['Serviços especiais e obras/serviços especiais de engenharia: menor preço ou maior desconto','25 dias úteis'],['Contratação integrada','60 dias úteis'],['Contratação semi-integrada e demais casos de serviços/obras','35 dias úteis'],['Técnica e preço ou melhor técnica','35 dias úteis']];
  return head('tool','Ferramentas da Lei 14.133','Cálculos rápidos para quem participa de licitações de obras')+
   `<div class="tgrid">
    <section class="tcard"><h3><span class="ci">${il('lei')}</span>Exequibilidade da proposta</h3><p class="d">Obras e serviços de engenharia: art. 59, §§ 4º e 5º.</p>
     <div class="grid2"><label class="field"><span>Valor orçado pela Administração (R$)</span><input data-lf="orcado" value="${esc(F.orcado)}" inputmode="decimal"></label><label class="field"><span>Valor da proposta (R$)</span><input data-lf="prop" value="${esc(F.prop)}" inputmode="decimal"></label></div>${ex}</section>
    <section class="tcard"><h3><span class="ci">${il('bell')}</span>Prazos da disputa</h3><p class="d">A partir da data de abertura da sessão pública.</p>
     <label class="field"><span>Data de abertura</span><input type="date" data-lf="abertura" value="${esc(F.abertura)}"></label>${pz}</section>
    <section class="tcard"><h3><span class="ci">${il('tool')}</span>Proposta com desconto</h3><p class="d">Aplica um desconto linear sobre um orçamento seu.</p>
     <div class="grid2"><label class="field"><span>Orçamento</span><select data-lf="orc"><option value="">Escolha…</option>${orcs.map(x=>`<option value="${x.id}" ${F.orc===x.id?'selected':''}>${esc(x.nome)}</option>`).join('')}</select></label><label class="field"><span>Desconto (%)</span><input data-lf="desc" value="${esc(F.desc)}" inputmode="decimal"></label></div>${pr}</section>
    <section class="tcard"><h3><span class="ci">${il('file')}</span>Prazos mínimos de publicação do edital</h3><p class="d">Art. 55 da Lei 14.133/2021, contados da divulgação do edital.</p>
     <div class="tres" style="margin-top:0"><table>${prazosPub.map(([a,b])=>`<tr><td>${a}</td><td class="r">${b}</td></tr>`).join('')}</table></div></section>
   </div><p class="note">Ferramentas de apoio. Não substituem a leitura do edital nem a orientação jurídica.</p>`; };
document.addEventListener('change',e=>{ const k=e.target.dataset?.lf; if(k){ S.lf[k]=e.target.value; render(); } });
ACT.lfUsar=()=>{ const o=S.docs.find(x=>x.id===S.lf.orc); if(!o) return; const {tot}=calc(o); S.lf.prop=R(tot.pv*(1-(num(S.lf.desc)||0)/100)); render(); };
ACT.lfCopia=async()=>{ const o=S.docs.find(x=>x.id===S.lf.orc); if(!o) return; const d=num(S.lf.desc)||0; const c=JSON.parse(JSON.stringify(o)); c.id=uid(); c.nome=o.nome+` (proposta −${nf2.format(d)}%)`; c.upd=Date.now();
  for(const it of c.items) if(it.k==='V'){ const cu=it.t==='M'?it.cu:refUnit(it.b,it.t,it.c); if(cu!=null){ it.t='M'; it.bl=it.bl||baseShort(S.bases[it.b])||'BASE'; it.cu=r2(cu*(1-d/100)); } }
  await Store.save(c); toast('Cópia criada com os preços unitários reduzidos em '+nf2.format(d)+'%.'); S.cur=c; go('plan'); };

/* ================================================================ moldura */
const _r=render; render=function(){ _r(); lgPaint(); };
try{ render(); }catch(e){ console.error(e); }
})();
