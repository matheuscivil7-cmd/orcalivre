/* OrçaLivre · bases públicas adicionais (SICRO, SUDECAP, SIURB, DER-ES, GOINFRA, SECID-PR, COMPESA, SANEPAR, CDHU).
   Os arquivos ficam em dados/pub/<BASE>/<edição>/<UF>.json e são atualizados pelo robô (robo/bases_publicas.py).
   Identificador de base: P:<BASE>:<edição>:<UF>:<regime>. */
(function(){
  const REGN={SD:'Não desonerado',CD:'Desonerado',SE:'Sem encargos complementares'};
  const DESC={
    'SICRO':['Infraestrutura de transportes (DNIT), por estado · trimestral','https://www.gov.br/dnit/pt-br/assuntos/planejamento-e-pesquisa/custos-referenciais/sistemas-de-custos/sicro'],
    'SUDECAP':['Edificações e infraestrutura urbana · Belo Horizonte','https://prefeitura.pbh.gov.br/sudecap/tabela-de-precos'],
    'SIURB':['Edificações e infraestrutura · Prefeitura de São Paulo','https://prefeitura.sp.gov.br/web/obras/w/tabelas_de_custos/355179'],
    'DER-ES':['Edificações · Espírito Santo · mensal','https://der.es.gov.br/referencial-de-precos-edificacoes'],
    'GOINFRA-ROD':['Terraplenagem, pavimentação e obras de arte · Goiás','https://goias.gov.br/goinfra/?p=235994'],
    'GOINFRA-CIV':['Obras civis · Goiás','https://goias.gov.br/goinfra/tabela-de-composicao114/'],
    'SECID-PR':['Edificações (derivada do SINAPI) · Paraná','https://www.secid.pr.gov.br/Pagina/Custos-de-Edificacoes'],
    'COMPESA':['Saneamento · Pernambuco · somente preços dos serviços','https://servicos.compesa.com.br/engenharia/'],
    'SANEPAR':['Saneamento · Paraná · somente preços dos serviços','https://www.sanepar.com.br/tabelas-de-precos'],
    'CDHU':['Composição sintética de serviços (pública) · São Paulo','https://www.cdhu.sp.gov.br/cdhu/Transpar%C3%AAncia/Licitacoes%20e%20Contratos/Tabela%20de%20Composicao%20de%20Servicos']
  };
  const PM=()=>(PUB.man&&PUB.man.pub)||{};
  const isMes=v=>/^\d{4}-\d\d$/.test(v||'');
  const verLabel=v=>isMes(v.v)?fmtMes(v.v):`${v.v}${v.m&&isMes(v.m)?' · '+fmtMes(v.m):''}`;
  function normP(pk){ const I=PM()[String(pk.src).slice(2)]; if(!I||!I.vers.length) return pk;
    const V=I.vers.find(v=>v.v===pk.pv)||I.vers[0]; pk.pv=V.v;
    if(!V.ufs.includes(pk.pu)) pk.pu=V.ufs.includes(pk.uf)?pk.uf:V.ufs.includes('SP')?'SP':V.ufs[0];
    if(!V.regs.includes(pk.pr)) pk.pr=V.regs.includes(pk.reg)?pk.reg:V.regs[0];
    return pk; }

  const _parseId=parseId, _pkId=pkId, _pkFromId=pkFromId, _ensureBase=ensureBase, _srcList=srcList, _picker=picker, _labelOf=labelOf, _baseShort=baseShort, _baseLong=baseLong;

  parseId=function(id){ const p=String(id||'').split(':'); if(p[0]==='P'&&p.length===5) return {src:'P',s:p[1],ver:p[2],uf:p[3],reg:p[4]}; return _parseId(id); };
  pkId=function(pk){ if(pk&&String(pk.src).startsWith('P:')){ normP(pk); return `P:${String(pk.src).slice(2)}:${pk.pv}:${pk.pu}:${pk.pr}`; } return _pkId(pk); };
  pkFromId=function(id){ const p=parseId(id); if(p&&p.src==='P') return {...defPk(),src:'P:'+p.s,pv:p.ver,pu:p.uf,pr:p.reg}; return _pkFromId(id); };

  ensureBase=function(id){
    const p=parseId(id); if(!p||p.src!=='P') return _ensureBase(id);
    if(S.bases[id]) return Promise.resolve(S.bases[id]); if(PUB.pend[id]) return PUB.pend[id];
    return PUB.pend[id]=(async()=>{ try{
      const k=`pub|${p.s}|${p.ver}|${p.uf}`;
      const d=await (PUB.cat[k]||(PUB.cat[k]=getJSON(`dados/pub/${p.s}/${p.ver}/${p.uf}.json`).catch(e=>{ delete PUB.cat[k]; throw e; })));
      const R=d.px[p.reg]; if(!R) return null;
      const b={id,pub:true,fonte:p.s,fnome:d.n,uf:d.uf,data:d.m||p.ver,ver:p.ver,regime:p.reg,nome:`${d.n} ${d.uf}`,ins:{},comps:{}};
      d.ins.forEach((r,i)=>{ b.ins[r[0]]={d:r[1],u:r[2],t:r[3],p:R.i[i]}; });
      d.comp.forEach((r,i)=>{ const f=r[4]||[], it=[]; for(let j=0;j<f.length;j+=3) it.push({t:f[j],c:f[j+1],q:f[j+2]}); b.comps[r[0]]={d:r[1],u:r[2],g:d.g[r[3]]||'',c:R.c[i],it}; });
      S.bases[id]=b; S.cache.clear(); return b;
    }catch(e){ return null; } finally{ delete PUB.pend[id]; } })();
  };

  srcList=function(own){ const L=_srcList(own); const extra=Object.entries(PM()).map(([k,v])=>['P:'+k,v.n]);
    let n=L.findIndex(x=>x[0]!=='SINAPI'&&x[0]!=='CDHU'); if(n<0) n=L.length; L.splice(n,0,...extra); return L; };

  picker=function(key,own){ const pk=key==='plan'||key==='new'?S.pk[key]:qState(key).pk;
    if(!pk||!String(pk.src).startsWith('P:')) return _picker(key,own);
    normP(pk); const I=PM()[String(pk.src).slice(2)];
    const sel=(k,opts,lab)=>`<select data-pk="${key}" data-k="${k}" aria-label="${lab}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(pk[k])===String(v)?'selected':''}>${esc(l)}</option>`).join('')}</select>`;
    let h=sel('src',srcList(own),'Base'); if(!I) return h;
    const V=I.vers.find(v=>v.v===pk.pv)||I.vers[0];
    h+=sel('pv',I.vers.map(v=>[v.v,verLabel(v)]),'Edição');
    if(V.ufs.length>1) h+=sel('pu',V.ufs.map(u=>[u,u]),'Estado');
    h+=sel('pr',V.regs.map(r=>[r,REGN[r]||r]),'Regime');
    return h; };

  baseShort=function(b){ if(b&&b.fnome) return `${b.fonte} ${b.uf} ${REGS[b.regime]||''}`.trim(); return _baseShort(b); };
  baseLong=function(b){ if(b&&b.fnome) return `${b.fnome} · ${b.uf} · ${isMes(b.data)?fmtMes(b.data):b.data}${b.ver&&b.ver!==b.data?' ('+b.ver+')':''} · ${REGN[b.regime]||b.regime}`; return _baseLong(b); };
  labelOf=function(id){ if(S.bases[id]) return baseLong(S.bases[id]); const p=parseId(id);
    if(p&&p.src==='P'){ const I=PM()[p.s]; return `${I?I.n:p.s} · ${p.uf} · ${isMes(p.ver)?fmtMes(p.ver):p.ver} · ${REGN[p.reg]||p.reg}`; }
    return _labelOf(id); };

  /* página Bases: lista todas as bases incorporadas */
  VIEWS.bases=()=>{
    S.q.pk=S.q.pk||defPk(); const M=PUB.man;
    const imp=Object.values(S.bases).filter(b=>!b.pub&&b.id!=='PROPRIA');
    const own=S.docs.filter(d=>d.kind==='cpu'||d.kind==='ins').sort((a,b)=>String(a.c).localeCompare(String(b.c)));
    const si=M?.sinapi?.info||{};
    const pubs=Object.entries(PM());
    return `<div class="head"><div><div class="eyebrow">Consulta pública de preços</div><h1>Composições e insumos</h1><div class="sub">Pesquise antes de montar o orçamento: escolha a base, a data de referência, o estado e o regime. Clique no código para abrir a composição, ver os insumos totais e comparar datas.</div></div>
     <div class="actions"><button class="btn" data-act="newIns">Novo insumo / cotação</button><button class="btn" data-act="newCpu">Nova composição própria</button><button class="btn" data-act="imp">Importar outra base</button></div></div>
    <div class="panel flush" style="margin-bottom:16px"><div class="toolbar">${searchBar('q')}</div><div class="scroll" id="res-q">${resTable(S.q,'q')}</div></div>
    <div class="two">
     <div class="panel"><h2>Bases públicas incorporadas</h2>${M?`<div class="stack">
       ${M.sinapi?`<div><div class="b">SINAPI · Caixa Econômica Federal</div><div class="note">${M.sinapi.ufs.length} estados · não desonerado, desonerado e sem encargos complementares · insumos, composições e analítico</div>
         <div class="scroll" style="margin-top:6px"><table class="t"><thead><tr><th>Mês de referência</th><th>Publicado em</th><th class="r">Insumos</th><th class="r">Composições</th></tr></thead><tbody>${M.sinapi.meses.map(m=>`<tr><td class="b">${fmtMes(m)}</td><td>${esc(si[m]?.emissao||'')}</td><td class="r">${nf0.format(si[m]?.ins||0)}</td><td class="r">${nf0.format(si[m]?.comp||0)}</td></tr>`).join('')}</tbody></table></div></div>`:''}
       ${pubs.length?`<div class="scroll"><table class="t"><thead><tr><th>Base</th><th>Edição</th><th>Estados</th><th>Regimes</th></tr></thead><tbody>${pubs.map(([k,v])=>{ const V=v.vers[0], D=DESC[k]; return `<tr><td><div class="b">${D?`<a href="${esc(D[1])}" target="_blank" rel="noopener">${esc(v.n)}</a>`:esc(v.n)}</div>${D?`<div class="note">${esc(D[0])}</div>`:''}</td><td>${esc(verLabel(V))}</td><td>${V.ufs.length>3?V.ufs.length+' estados':esc(V.ufs.join(', '))}</td><td>${esc(V.regs.map(r=>REGN[r]||r).join(' e '))}</td></tr>`; }).join('')}</tbody></table></div>`:''}
       <p class="note" style="margin:0">Todas as bases são baixadas dos sites oficiais por um robô que confere a soma dos itens de cada composição contra o custo publicado antes de publicar. Novas edições entram automaticamente; ficam disponíveis as duas mais recentes de cada base.</p></div>`
       :'<p class="note">Não foi possível carregar as bases incorporadas agora. Recarregue a página.</p>'}</div>
     <div class="panel"><h2>Bases importadas</h2><div class="stack">${imp.length?imp.map(b=>`<div style="display:flex;gap:10px;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:10px"><div style="min-width:0"><div class="b">${esc(b.nome||baseLong(b))}</div><div class="note">${esc(baseLong(b))} · ${nf0.format(Object.keys(b.ins).length)} insumos · ${nf0.format(Object.keys(b.comps).length)} composições</div></div><button class="btn sm danger" data-act="delBase" data-id="${b.id}">Remover</button></div>`).join(''):'<p class="note" style="margin:0">Para ORSE, SEINFRA, SETOP, EMOP, FDE ou outra tabela que o robô não alcança, baixe a planilha no site oficial e use “Importar outra base”.</p>'}
       <div class="src"><a href="https://orse.cehop.se.gov.br/" target="_blank" rel="noopener"><b>ORSE · CEHOP/SE</b><span>Composições e insumos (programa próprio).</span></a></div>
       <p class="note" style="margin:0">Bases importadas ficam guardadas neste navegador.</p></div></div></div>
    <div class="panel" style="margin-top:16px"><h2>Composições e insumos próprios</h2>${own.length?`<div class="scroll"><table class="t"><thead><tr><th>Código</th><th>Tipo</th><th>Descrição</th><th>Und</th><th class="r">Custo unit.</th><th></th></tr></thead><tbody>${own.map(d=>`<tr><td class="mono"><button class="linkish mono" data-act="comp" data-b="PROPRIA" data-t="${d.kind==='cpu'?'C':'I'}" data-c="${esc(d.c)}">${esc(d.c)}</button></td><td><span class="tt tt-${d.kind==='cpu'?'C':(d.t||'MAT')}">${d.kind==='cpu'?'COMP':TS[d.t||'MAT']}</span></td><td class="desc">${esc(d.d)}</td><td>${esc(d.u)}</td><td class="r">${R(refUnit('PROPRIA',d.kind==='cpu'?'C':'I',d.c))}</td><td class="act"><button class="btn sm" data-act="${d.kind==='cpu'?'editCpu':'editIns'}" data-id="${d.id}">Editar</button> <button class="btn sm danger" data-act="delOwn" data-id="${d.id}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`
      :'<p class="note">Crie composições próprias (CPU) combinando insumos e composições de qualquer base, ou cadastre insumos de cotação de mercado.</p>'}</div>`;
  };
  /* ---------- Pesquisa de composições e insumos (sem precisar de orçamento) ---------- */
  { const i=NAV.findIndex(x=>x[0]==='bases'); if(i>=0){ NAV.splice(i,1); const g=NAV.findIndex(x=>x[0]==='g'&&x[1]==='Referências'); if(g>=0&&(!NAV[g+1]||NAV[g+1][0]==='g')) NAV.splice(g,1); NAV.unshift(['g','Pesquisa'],['bases','Composições e insumos','00']); } }

  /* insumos totais: abre a composição até o último nível e soma os coeficientes */
  function explode(bid,code,mult,acc,depth){ const c=S.bases[bid]?.comps[code]; if(!c) return;
    for(const it of c.it||[]){ const b2=it.b||bid, q=mult*(+it.q||0);
      if(it.t==='C'){ const sub=S.bases[b2]?.comps[it.c]; if(sub&&sub.it&&sub.it.length&&depth<12){ explode(b2,it.c,q,acc,depth+1); continue; } }
      const k=b2+'|'+it.t+'|'+it.c; const e=acc.get(k)||{b:b2,t:it.t,c:it.c,q:0}; e.q+=q; acc.set(k,e); } }
  function flatBody(b,c){ const acc=new Map(); explode(b,c,1,acc,0); const rows=[...acc.values()].map(x=>{ const info=refInfo(x.b,x.t,x.c)||{}; const un=x.t==='I'?(S.bases[x.b]?.ins[x.c]?.p??null):compUnit(x.b,x.c); const tp=x.t==='C'?'SV':(info.t||'OUT'); return {...x,info,un,tp,v:(un||0)*x.q}; }).sort((a,z)=>z.v-a.v);
    if(!rows.length) return '<p class="note">Esta composição não tem itens detalhados nesta base.</p>';
    const tot=rows.reduce((s,x)=>s+x.v,0), by={}; rows.forEach(x=>by[x.tp]=(by[x.tp]||0)+x.v);
    const kp=['MAT','MO','EQ','SV','OUT'].filter(k=>by[k]).map(k=>`<div class="kpi"><div class="l">${TL[k]}</div><div class="v">R$ ${R(by[k])}</div><div class="s">${P(tot?by[k]/tot*100:0)}</div></div>`).join('');
    return `<div class="kpis" style="margin-bottom:10px">${kp}</div><div class="res"><table class="t"><thead><tr><th>Código</th><th>Tipo</th><th>Descrição</th><th>Und</th><th class="r">Quant. por unidade</th><th class="r">Custo unit.</th><th class="r">Total</th><th class="r">%</th></tr></thead><tbody>${rows.map(x=>`<tr><td class="mono">${x.t==='C'?`<button class="linkish mono" data-act="comp" data-b="${esc(x.b)}" data-t="C" data-c="${esc(x.c)}">${esc(x.c)}</button>`:esc(x.c)}</td><td><span class="tt tt-${x.t==='C'?'C':x.tp}">${x.t==='C'?'SERV':TS[x.tp]||x.tp}</span></td><td class="desc">${esc(x.info.d||'(não encontrado)')}</td><td>${esc(x.info.u||'')}</td><td class="r">${Q(x.q)}</td><td class="r">${x.un==null?'—':R(x.un)}</td><td class="r">${R(x.v)}</td><td class="r muted">${P(tot?x.v/tot*100:0)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="6" class="b">Soma dos insumos</td><td class="r b">${R(tot)}</td><td></td></tr></tfoot></table></div>
      <p class="note" style="margin:0">Quantidade de cada insumo por unidade do serviço, já multiplicada pelos coeficientes das composições auxiliares. A soma pode diferir do custo oficial quando a base inclui parcelas próprias (FIC, transporte, arredondamentos).</p>`; }

  /* mesmas referências em outras datas */
  function versoes(b){ const p=parseId(b); if(!p) return [];
    if(p.src==='SINAPI') return (PUB.man?.sinapi?.meses||[]).map(m=>[`SINAPI:${m}:${p.uf}:${p.reg}`,fmtMes(m)]);
    if(p.src==='P'){ const I=PM()[p.s]; return (I?.vers||[]).filter(v=>v.ufs.includes(p.uf)&&v.regs.includes(p.reg)).map(v=>[`P:${p.s}:${v.v}:${p.uf}:${p.reg}`,verLabel(v)]); }
    return []; }
  async function loadHist(){ const {b,t,c}=S.det, key=b+'|'+t+'|'+c; if(S.hist&&S.hist.key===key) return; S.hist={key,rows:null}; remodal();
    const vs=versoes(b); const rows=[]; for(const [id,l] of vs){ const bb=await ensureBase(id); rows.push({id,l,v:bb?refUnit(id,t,c):null}); }
    if(S.hist&&S.hist.key===key){ S.hist.rows=rows; remodal(); } }
  function histBody(b){ const H=S.hist; if(!H||!H.rows) return '<div class="empty"><b>Carregando as datas de referência…</b></div>';
    if(H.rows.length<2) return '<p class="note">Esta base tem só uma data de referência disponível no momento. As próximas edições entram automaticamente.</p>';
    const cur=H.rows.find(r=>r.id===b)?.v;
    return `<div class="res"><table class="t"><thead><tr><th>Data de referência</th><th class="r">Custo unitário</th><th class="r">Variação vs. selecionada</th><th></th></tr></thead><tbody>${H.rows.map(r=>{ const d=cur&&r.v!=null?(r.v/cur-1)*100:null; return `<tr${r.id===b?' class="r-s"':''}><td class="b">${esc(r.l)}</td><td class="r">${r.v==null?'—':R(r.v)}</td><td class="r muted">${d==null||r.id===b?'':(d>0?'+':'')+nf2.format(d)+'%'}</td><td>${r.id!==b&&r.v!=null?`<button class="btn sm" data-act="comp" data-b="${esc(r.id)}" data-t="${esc(S.det.t)}" data-c="${esc(S.det.c)}">Abrir</button>`:''}</td></tr>`; }).join('')}</tbody></table></div>`; }

  const _compModal=compModal;
  compModal=function(b,t,c){ S.detV='arv'; return _compModal(b,t,c); };
  const _renderComp=renderComp;
  renderComp=function(){ const {b,t,c}=S.det, info=refInfo(b,t,c); const V=S.detV||'arv';
    if(!info) return _renderComp();
    const abas=t==='C'?[['arv','Abertura da composição'],['flat','Insumos totais'],['hist','Datas de referência']]:[['arv','Insumo'],['hist','Datas de referência']];
    const seg=`<div class="seg" style="margin-top:10px">${abas.map(([k,l])=>`<button class="${V===k?'on':''}" data-act="detV" data-v="${k}">${l}</button>`).join('')}</div>`;
    let h=_renderComp();
    h=h.replace(/(<div class="dh"><div>)([\s\S]*?)(<\/div><button class="ib")/,(m,a,x,z)=>a+x+seg+z);
    if(V==='arv') return h;
    const body=V==='flat'?flatBody(b,c):histBody(b);
    return h.replace(/<div class="db">[\s\S]*?<\/div>(<div class="df">)/,(m,df)=>`<div class="db">${body}</div>${df}`); };
  ACT.detV=d=>{ S.detV=d.v; if(d.v==='hist') loadHist(); remodal(); };

  if(typeof render==='function') try{ render(); }catch(e){}
})();
