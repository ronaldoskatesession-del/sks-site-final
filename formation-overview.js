(function () {
  'use strict';
  const {FS_CATEGORIES, FS_UNITS, fsEscape: e, fsIcon: icon, fsImageStyle, fsLockIcon, fsMethodology, recommendations} = window.SKSFormationCatalog;
  const registry = window.SKSFormations;
  const all = FS_CATEGORIES[0];

  function dashboardHref(hash) {
    const prefix = typeof location !== 'undefined' && location.pathname.startsWith('/preview/') ? '../' : '';
    return prefix + '191026.html' + hash;
  }
  function recommendationHref(href) {
    if (href.startsWith('#/')) return dashboardHref(href);
    return href.replace('aluno.html#formacao/agencia','#formacao').replace(/^aluno\.html#/,'#');
  }
  function studentUnits(ctx) {
    const releases = registry.entries.map(entry => entry.id);
    return FS_UNITS.filter(unit => registry.studentIds.includes(unit.id)).map(unit => ({
      ...unit, course: registry.get(unit.id),
      allowed: unit.id === 'ia' || (registry.allowed(unit.id,ctx.user) && (!ctx.readOnly || unit.id === 'agencia'))
    })).sort((a,b) => {
      if (a.id === 'ia' || b.id === 'ia') return Number(b.id === 'ia') - Number(a.id === 'ia');
      if (a.allowed !== b.allowed) return Number(b.allowed) - Number(a.allowed);
      return a.allowed ? releases.indexOf(a.id) - releases.indexOf(b.id) : 0;
    });
  }
  function coursePercent(unit,ctx,rank) {
    if (unit.id === 'agencia') return rank.percent;
    const done = ctx.formationProgress?.[unit.id]?.completed;
    const total = unit.course?.topicCount;
    return (Array.isArray(done) && total) ? Math.min(100,Math.floor(new Set(done).size * 100 / total)) : null;
  }
  function card(unit,ctx,rank) {
    const name=e(unit.name), locked=!unit.allowed, count=unit.course?.moduleCount || 25;
    const value=coursePercent(unit,ctx,rank);
    const rule=locked ? (unit.id==='loja'?'Acesso individual':'Disciplinas bloqueadas') :
      (unit.id==='ia'?'Disponível desde o primeiro acesso':unit.id==='agencia'?'Formação inicial disponível':'Formação liberada para esta conta');
    const progress=unit.id==='ia'?'<span class="fs-access-status">Acessar Aprenda IA →</span>':locked?'<span class="fs-access-status">Bloqueado</span>':
      '<span class="fs-progress-line" role="progressbar" aria-label="Seu progresso em '+name+'" aria-valuemin="0" aria-valuemax="100" '+
      (value===null?'aria-valuetext="Indisponível"':'aria-valuenow="'+value+'"')+'><i style="width:'+(value??0)+'%"></i></span><span class="fs-progress-value">'+(value===null?'—':value+'%')+'</span>';
    return '<article class="fs-card '+(locked?'fs-card--locked':'fs-card--available')+'" data-formation="'+unit.id+'">'+
      (unit.id==='ia' ? '<a class="fs-card-open" href="'+dashboardHref('#/aprenda-ia')+'" aria-label="Abrir Laboratório de IA em Aprenda IA">' :
        '<button type="button" class="fs-card-open" data-fs-open="'+unit.id+'" aria-label="Ver detalhes de '+name+'" aria-haspopup="dialog" aria-controls="fsUnitDialog" aria-describedby="fs-unlock-'+unit.id+'">')+
      '<span class="fs-photo" style="'+fsImageStyle(unit.image)+'" role="img" aria-label="Ambiente de '+name+'"><span class="fs-icon-badge">'+icon(unit.icon)+'</span>'+
      (locked?'<span class="fs-access-badge">'+fsLockIcon()+' Bloqueado</span>':'')+'</span><span class="fs-card-copy">'+
      '<span class="fs-unit-label">Unidade de Aprendizagem SKS</span><strong class="fs-card-title">'+name+'</strong><span class="fs-card-description">'+e(unit.description)+'</span>'+
      '<span class="fs-unlock-rule" id="fs-unlock-'+unit.id+'">'+rule+'</span><span class="fs-card-bottom"><span class="fs-card-progress"><span class="fs-module-count">'+count+' módulos</span>'+
      progress+'</span><span class="fs-card-arrow">'+(locked?fsLockIcon():icon('arrow'))+'</span></span></span>'+(unit.id==='ia'?'</a>':'</button>')+'</article>';
  }
  function unitDetail(unit,ctx) {
    const current=ctx.formation?.id || 'agencia';
    const url=current===unit.id?'#formacao':'#formacao/'+unit.id;
    const action=unit.allowed?'<a class="btn btn--primary" href="'+url+'">Acessar formação '+icon('arrow')+'</a>':
      '<p class="fs-unlock-rule">'+(unit.id==='loja'?'Acesso individual.':'As disciplinas ainda não foram liberadas.')+'</p><button class="btn btn--primary" disabled>'+fsLockIcon()+' Sem acesso</button>';
    return '<div class="fs-dialog-photo fs-photo" style="'+fsImageStyle(unit.image)+'"><span class="fs-icon-badge">'+icon(unit.icon)+'</span>'+
      '<button type="button" class="fs-dialog-close" data-fs-close aria-label="Fechar detalhes">'+icon('x')+'</button></div><div class="fs-dialog-body">'+
      '<span class="fs-unit-label">Unidade de Aprendizagem SKS</span><h2 id="fsUnitTitle">'+e(unit.name)+'</h2><p>'+e(unit.description)+'</p>'+
      '<h3>Habilidades trabalhadas</h3><ul>'+unit.skills.map(skill=>'<li><span>'+e(skill.label)+'</span><small>'+e(skill.area)+'</small></li>').join('')+
      '</ul><p class="fs-dialog-method">Jornada completa: '+(unit.id==='agencia'?ctx.curriculum.phases.length:unit.id==='loja'?9:8)+' fases e '+(unit.course?.moduleCount||25)+' módulos.</p>'+action+'</div>';
  }
  function railItem(title,summary,symbol) {
    return '<div class="fs-rail-item">'+icon(symbol)+'<div><strong>'+title+'</strong><span>'+summary+'</span></div></div>';
  }
  function rail(rank) {
    return '<aside class="fs-rail" aria-label="Informações da formação">'+
      '<section class="fs-rail-panel"><div class="fs-rail-heading"><h3>Meu progresso geral</h3><a href="#progresso">Ver relatório</a></div>'+
      '<div class="fs-rank"><div class="fs-ring" style="--value:'+rank.percent+'%"><strong>'+rank.percent+'%</strong></div><div><span class="fs-kicker">'+e(rank.name)+'</span><b>Nível '+rank.level+' de 6</b><span>Continue evoluindo no HUB</span></div></div></section>'+
      '<section class="fs-rail-panel" id="fsHow" tabindex="-1"><span class="fs-kicker">Como funciona</span><h3>8 fases. 25 módulos.</h3>'+
      '<p>Cada formação combina conteúdo, prática, laboratório, entrega e dossiê final.</p>'+railItem('Conhecimento','Base e fundamentos','book')+railItem('Prática','Projetos aplicados','flask')+railItem('Dossiê final','Entrega que comprova evolução','award')+'</section>'+
      '<section class="fs-rail-panel fs-hub"><span class="fs-kicker">Hub Lifestyle</span><h3>Conecte e transforme.</h3><p>Aplique o que aprende em ambientes reais e construa seu portfólio.</p>'+
      '<a class="btn btn--primary" href="'+dashboardHref('#/dashboard')+'">Conheça o HUB</a></section>'+
      '<div class="fs-dossier"><button class="btn btn--ghost" type="button" data-fs-how>'+icon('arrow')+' Como funciona</button>'+
      '<a class="fs-dossier-link" href="#progresso">'+icon('book')+'<span>Dossiê final<br><strong>Prática e evolução</strong></span></a></div></aside>';
  }
  function render(ctx,units=studentUnits(ctx),rank=window.SKSStudentCore.agentLevel(ctx.curriculum,ctx.state,ctx.user)) {
    const categories=FS_CATEGORIES.filter(item=>item===all||units.some(unit=>unit.skills.some(skill=>skill.area===item)));
    const tabs=categories.map((category,i)=>'<button type="button" class="tab'+(i===0?' is-active':'')+'" role="tab" id="fs-tab-'+i+'" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'" aria-controls="fsUnits" data-fs-category="'+e(category)+'">'+e(category)+'</button>').join('');
    return '<div class="formation-overview"><h1 class="fs-sr">Formações SKS</h1><div class="fs-page-grid"><div class="fs-primary">'+
      '<nav class="fs-tabs" role="tablist" aria-label="Áreas de habilidades da formação">'+tabs+'</nav>'+fsMethodology(rank)+
      '<p class="fs-sr" id="fsResultCount" role="status" aria-live="polite">'+units.length+' ambientes de formação</p>'+
      '<div class="fs-grid fs-grid--student" id="fsUnits" role="tabpanel" aria-labelledby="fs-tab-0">'+units.map(unit=>card(unit,ctx,rank)).join('')+'</div>'+
      '<div class="fs-recommendations">'+recommendations(ctx.state,icon,recommendationHref)+'</div></div>'+rail(rank)+'</div>'+
      '<dialog class="fs-dialog" id="fsUnitDialog" aria-labelledby="fsUnitTitle"></dialog>'+
      '<dialog class="fs-dialog fs-search-dialog" id="fsSearchDialog" aria-labelledby="fsSearchTitle"><header><h2 id="fsSearchTitle">Buscar no SKS</h2><button class="fs-dialog-close" data-fs-close aria-label="Fechar busca">'+icon('x')+'</button></header>'+
      '<label class="fs-sr" for="fsSearchQuery">Buscar unidades, aulas, módulos e eventos</label><input id="fsSearchQuery" type="search" placeholder="Buscar unidades, aulas, módulos, eventos…" autocomplete="off"><div class="fs-search-results" aria-live="polite"></div></dialog></div>';
  }
  const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function searchResults(query,units,ctx) {
    const q=normalize(query.trim());
    const result=[];
    const link=(name,href,group)=>'<a href="'+e(href)+'"><span>'+e(name)+'</span><small>'+e(group)+'</small></a>';
    for(const unit of units)if(normalize(unit.name+' '+unit.description).includes(q)){
      if(unit.id==='ia'){result.push(link(unit.name,dashboardHref('#/aprenda-ia'),'Unidade'));continue;}
      result.push('<button type="button" data-fs-open="'+unit.id+'"><span>'+e(unit.name)+'</span><small>Unidade</small></button>');
    }
    if(q)for(const module of ctx.curriculum.modules){
      if(normalize('Módulo '+String(module.number).padStart(2,'0')+' '+module.title).includes(q))result.push(link(module.title,'#modulo/'+encodeURIComponent(module.id),'Módulo '+module.number));
    }
    if(q)for(const topic of window.SKSStudentTools.search(query,ctx.curriculum,ctx.materials)){
      result.push(link(topic.title,'#aula/'+encodeURIComponent(topic.id),'Módulo '+topic.module));
    }
    const shortcuts=[['Agenda e eventos',dashboardHref('#/eventos')],['Meu progresso geral','#progresso'],['Certificados','#certificados'],['Hub do Cliente','#projeto']];
    for(const [name,href] of shortcuts)if(normalize(name).includes(q))result.push(link(name,href,'Acesso'));
    return result.join('') || '<p>Nenhum resultado para esta busca.</p>';
  }
  function mount(main,ctx) {
    const units=studentUnits(ctx), rank=window.SKSStudentCore.agentLevel(ctx.curriculum,ctx.state,ctx.user);
    main.innerHTML=render(ctx,units,rank);
    const root=main.querySelector('.formation-overview'), grid=root.querySelector('#fsUnits');
    const tabs=Array.from(root.querySelectorAll('[data-fs-category]'));
    const detail=root.querySelector('#fsUnitDialog'), search=root.querySelector('#fsSearchDialog'), input=search.querySelector('input');
    const results=search.querySelector('.fs-search-results');
    function filter(selected) {
      const category=selected.dataset.fsCategory;
      const filtered=units.filter(unit=>category===all||unit.skills.some(skill=>skill.area===category));
      grid.innerHTML=filtered.map(unit=>card(unit,ctx,rank)).join('');
      grid.setAttribute('aria-labelledby',selected.id);
      root.querySelector('#fsResultCount').textContent=filtered.length+' ambientes de formação em '+category;
      for(const tab of tabs){
        const active=tab===selected;tab.tabIndex=active?0:-1;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));
      }
    }
    function openSearch() {
      input.value='';results.innerHTML=searchResults('',units,ctx);
      if(!search.open)search.showModal();input.focus();
    }
    const trigger=document.getElementById('formation-search');
    if(trigger)trigger.onclick=openSearch;
    input.addEventListener('input',()=>{results.innerHTML=searchResults(input.value,units,ctx);});
    root.addEventListener('click',event=>{
      const tab=event.target.closest('[data-fs-category]');
      if(tab){filter(tab);return;}
      const open=event.target.closest('[data-fs-open]');
      if(open){
        const unit=units.find(item=>item.id===open.dataset.fsOpen);
        if(!unit)return;
        if(search.open)search.close();
        detail.innerHTML=unitDetail(unit,ctx);detail.showModal();return;
      }
      const dialog=event.target.closest('dialog');
      if(dialog && (event.target.closest('[data-fs-close],a[href]') || event.target===dialog && (event.offsetX<0||event.offsetY<0||event.offsetX>dialog.clientWidth||event.offsetY>dialog.clientHeight)))dialog.close();
      if(event.target.closest('[data-fs-how]'))root.querySelector('#fsHow').focus();
    });
    root.addEventListener('keydown',event=>{
      const index=tabs.indexOf(event.target);
      if(index<0||!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      event.preventDefault();tabs[next].focus();filter(tabs[next]);
    });
  }
  if(typeof document!=='undefined')document.addEventListener('keydown',event=>{
    if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='k')return;
    const trigger=document.getElementById('formation-search');
    if(trigger&&!trigger.hidden){event.preventDefault();trigger.click();}
  });
  window.SKSFormationOverview=Object.freeze({render,mount});
})();
