(() => {
  'use strict';
  const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tabs=[['conteudo','Conteúdo','play'],['pratica','Prática','target'],['projeto','Projeto','layers'],['materiais','Materiais','file'],['avaliacao','Avaliação','award']];
  const labels=['Fundamentos','Operação Digital','Marca e Comunicação','Conteúdo','Aquisição','Conversão','Inteligência Artificial','Performance','Consultoria e Agência'];
  const paths={play:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',target:'<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 9-10m-5 0h5v5"/>',layers:'<path d="m3 7 9-5 9 5-9 5zM3 12l9 5 9-5M3 17l9 5 9-5"/>',file:'<path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h8"/>',award:'<circle cx="12" cy="8" r="6"/><path d="m8 13-2 9 6-4 6 4-2-9"/>',book:'<path d="M12 5C8 2 5 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-6-2-10 1v16"/>',shop:'<path d="M3 10h18l-3-7H6zM4 10v11h16V10M9 21v-8h6v8"/>',tool:'<path d="m14 6 4 4 4-4c1 7-4 10-8 7L5 22l-3-3 9-9C7 5 11 1 17 2z"/>',check:'<circle cx="12" cy="12" r="9"/><path d="m7 12 4 4 6-8"/>',search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 7 7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',flag:'<path d="M4 22V3c6-5 10 5 16 0v11c-6 5-10-5-16 0"/>',arrow:'<path d="M3 12h18m-7-7 7 7-7 7"/>',download:'<path d="M12 2v13m-5-5 5 5 5-5M3 17v5h18v-5"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>'};
  const icon=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.file)+'</svg>';
  const panel=(title,body,i,extra='')=>'<section class="sl-card '+extra+'"><h2>'+(i?icon(i):'')+e(title)+'</h2>'+body+'</section>';
  const disabled=(label,reason,i)=>'<span class="sl-unavailable"><button type="button" disabled aria-disabled="true" title="'+e(reason)+'">'+(i?icon(i):'')+e(label)+'</button><small>'+e(reason)+'</small></span>';
  const link=(label,href,primary=false)=>'<a class="sl-button'+(primary?' sl-primary':'')+'" href="'+e(href)+'">'+e(label)+icon('arrow')+'</a>';
  const stats=(ctx,items)=>{const done=items.filter(t=>ctx.state.completed.includes(t.id)).length;return {done,total:items.length,percent:items.length?Math.round(done*100/items.length):0};};
  const meter=p=>'<div class="sl-meter" role="progressbar" aria-label="Tópicos concluídos" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'"><i style="width:'+p+'%"></i></div>';
  const tag=text=>'<span class="sl-tag">'+e(text)+'</span>';
  const phaseName=(c,m)=>c.curriculum.phases.find(p=>p.id===m?.phaseId)?.title||'Formação SKS';
  const subtitle=c=>c.isObserver?'Consulta do professor · registros do aluno, sem alterações':c.isPreview?'Prévia local · sem envio a contas':'Registros da sua conta · progresso real';
  function breadcrumb(parts){return '<nav class="sl-breadcrumb" aria-label="Caminho da aprendizagem"><a href="#escolher-formacao">Formações</a><span>›</span><a href="#formacao">Aulas e Trilhas</a>'+parts.map(p=>'<span>›</span><span>'+e(p)+'</span>').join('')+'</nav>';}
  function support(){return panel('Agente IA SKS','<div class="sl-agent"><img src="assets/disciplines-rail/agent-robot.png" alt="Mascote SKS" width="58" height="58"><p>Busca nas aulas e dúvidas ao professor.<small>IA generativa indisponível nesta área.</small></p></div>'+link('Abrir apoio de estudo','#assistente'),'','sl-support');}
  function progress(c,items,title){const s=stats(c,items);return panel('Progresso '+(title==='Formação'?'na formação':'do módulo'),'<div class="sl-progress"><div class="sl-ring" style="--sl-angle:'+s.percent*3.6+'deg"><b>'+s.percent+'%</b></div><div><b>'+e(title)+'</b><p>'+s.done+' de '+s.total+' tópicos concluídos</p></div></div>'+link('Ver detalhes','#progresso'));}
  function nextCard(label,tab){return panel('Próximo passo','<p>'+e(label)+'</p><button type="button" class="sl-button sl-next" data-learning-tab="'+tab+'">'+e(({pratica:'Ir para prática',projeto:'Abrir projeto',materiais:'Ir para materiais',avaliacao:'Ir para avaliação',conteudo:'Voltar ao conteúdo'})[tab])+icon('arrow')+'</button>','flag');}
  function topics(c,m,type){return m.lessons.filter(t=>!type||t.type===type).map((t,i)=>'<a class="sl-topic '+(c.topic?.id===t.id?'active':'')+'" href="#aula/'+e(t.id)+'">'+icon(c.state.completed.includes(t.id)?'check':'play')+'<span>'+e(t.title)+'<small>'+e(({lesson:'Aula',activity:'Atividade',assessment:'Avaliação',deliverable:'Entregável'})[t.type])+'</small></span><span class="sl-topic-state">'+(c.state.completed.includes(t.id)?'Concluído':c.ready(t.id)?'Disponível':'Sem material')+'</span></a>').join('');}
  function projectLinks(c,m){const sections=c.hub.sectionsForModule(m.number);return sections.map(s=>'<button type="button" class="sl-section-link" data-learning-section="'+e(s.id)+'">'+icon('shop')+'<span>'+e(s.title)+'</span>'+icon('arrow')+'</button>').join('');}
  function banner(c,m){return '<section class="sl-hero"><img class="sl-hero-photo" src="assets/learning/'+(m?'module-banner':'catalog-banner')+'.webp" alt="Ambiente de trabalho e aprendizado SKS"><div class="sl-hero-copy"><p class="sl-kicker">'+e(m?'TRILHA: '+phaseName(c,m):'DISCIPLINA')+'</p><h1>'+e(m?'Módulo '+String(m.number).padStart(2,'0')+' — '+m.title:'Aulas e Trilhas')+'</h1><p>'+e(m?'Estude, aplique no seu projeto e acompanhe seus registros.':'Acesse aulas, siga as nove fases e avance no seu desenvolvimento.')+'</p><div class="sl-tags">'+(m?[tag(m.lessons.filter(t=>t.type==='lesson').length+' aulas'),tag(m.lessons.length+' tópicos'),tag('Estude no seu ritmo')].join(''):[tag('Aulas'),tag('Atividades'),tag('Projeto'),tag('Materiais')].join(''))+'</div></div></section>';}
  function phaseCards(c,selected){return '<div class="sl-tracks">'+c.curriculum.phases.map((p,i)=>{const items=c.curriculum.modules.filter(m=>m.phaseId===p.id).flatMap(m=>m.lessons),s=stats(c,items);return '<a class="sl-track '+(selected===p.id?'active':'')+'" href="#fase/'+e(p.id)+'"><img src="'+e(c.phaseCovers?.[i]||'assets/formacoes/agencia.webp')+'" alt="" loading="lazy"><div>'+icon(['target','file','book','play','arrow','layers','tool','award','shop'][i])+'<h3>'+e(labels[i]||p.title)+'</h3><p>'+items.length+' tópicos</p>'+meter(s.percent)+'<small>'+s.percent+'%</small></div></a>';}).join('')+'</div>';}
  function catalog(c,selected){
    const phase=c.curriculum.phases.find(p=>p.id===selected)||c.curriculum.phases[0];
    const modules=c.curriculum.modules.filter(m=>m.phaseId===phase.id);
    const study=c.curriculum.modules.flatMap(m=>m.lessons).filter(t=>t.type!=='deliverable');
    const next=study.find(t=>!c.state.completed.includes(t.id));
    const cards=modules.map(m=>{const s=stats(c,m.lessons);return '<article class="sl-module-card" data-learning-module-card data-search="'+e((m.title+' '+m.lessons.map(t=>t.title).join(' ')).toLocaleLowerCase('pt-BR'))+'"><div class="sl-module-picture"><img src="assets/learning/module-banner.webp" alt="" loading="lazy"><span>'+e(String(m.number).padStart(2,'0'))+'</span></div><div><h3>'+e(m.title)+'</h3><p>'+m.lessons.length+' tópicos · '+s.done+' concluídos</p>'+meter(s.percent)+link('Abrir módulo','#modulo/'+m.id)+'</div></article>';}).join('');
    return breadcrumb(selected?[phase.title]:[])+ '<div class="sl-layout"><div class="sl-main">'+banner(c)+panel('Escolha sua trilha','<p class="sl-muted">Todas as nove fases da grade original, na mesma ordem.</p>'+phaseCards(c,phase.id))+panel('Trilha: '+phase.title,'<div class="sl-search"><label>'+icon('search')+'<input type="search" data-learning-search="modules" aria-label="Buscar módulos desta fase" placeholder="Buscar módulo ou assunto…"></label><a href="#formacao">Todas as trilhas →</a></div><div class="sl-module-grid">'+cards+'</div><p class="sl-no-results" hidden>Nenhum módulo corresponde à busca.</p>')+panel('Prática final preservada','<p>Os 17 entregáveis e seus critérios continuam no Hub do Cliente.</p>'+link('Abrir Hub do Cliente','#projeto'),'layers')+'</div><aside class="sl-rail">'+support()+progress(c,study,'Formação')+panel('Próximas atividades',next?link(next.title,'#aula/'+next.id):'<p>Todos os tópicos de estudo estão registrados como concluídos.</p>')+panel('Projeto da formação','<p>Continue no projeto já vinculado à sua conta.</p>'+link('Ver meu Hub do Cliente','#projeto'),'shop')+'</aside></div>';
  }
  function shell(c,m,tab){
    const lesson=c.topic||m.lessons[0];
    const item=c.materials.content[lesson.id]||{};
    const elements=[...(item.blocks||[]),...(item.pages||[]).flatMap(p=>p.elements||[])];
    const video=elements.find(b=>b.type==='video'&&c.safeUrl(b.src));
    const media=video?c.safeUrl(video.src):(/\.(mp4|webm)(?:[?#]|$)/i.test(item.url||'')?c.safeUrl(item.url):'');
    const resources=[...(item.sources||[]),...elements.filter(b=>b.type==='document').map(b=>({url:b.src,title:b.title||'Documento da aula'}))];
    if(item.url&&item.url!==media)resources.unshift({url:item.url,title:'Material da aula'});
    const files=resources.filter(r=>c.safeUrl(r.url)).map(r=>link(r.title||'Abrir recurso',c.safeUrl(r.url))).join('');
    const sections=c.hub.sectionsForModule(m.number);
    const selected=sections.find(s=>s.id===new URLSearchParams(location.search).get('secao'));
    const project='<details class="sl-card" '+(['pratica','projeto'].includes(tab)?'open':'')+'><summary>Aplicação no cliente</summary>'+projectLinks(c,m)+'<div data-learning-hub="'+e((selected||sections[0])?.id||'')+'"></div></details>';
    const ordered=[...m.lessons.filter(t=>t.type!=='assessment'),...m.lessons.filter(t=>t.type==='assessment')];
    const next=ordered[ordered.findIndex(t=>t.id===lesson.id)+1];
    const comments=c.state.questions.filter(q=>q.topicId===lesson.id).map(q=>'<p>'+e(q.body)+'</p>').join('');
    const discussion=c.isObserver?'':panel('Comentários da aula',comments+'<form id="question-form" data-topic="'+e(lesson.id)+'"><label>Mensagem ao professor<textarea name="body" required maxlength="2000"></textarea></label><button class="sl-button">Enviar ao professor</button></form>');
    return breadcrumb([phaseName(c,m),m.title])+'<div class="sl-layout"><div class="sl-main">'+banner(c,m)+'<div class="sl-study-grid"><div class="sl-study-column"><section class="sl-card sl-reading">'+(media?'<video controls preload="metadata" src="'+e(media)+'"></video>':'')+'<div data-learning-native></div></section><div class="sl-study-tools">'+panel('Ferramentas de apoio',files||'<p>Sem arquivos complementares nesta aula.</p>','tool')+project+'</div>'+discussion+'</div>'+panel('Aulas do módulo',topics(c,{...m,lessons:ordered}),'book')+'</div></div><aside class="sl-rail">'+support()+progress(c,m.lessons,m.title)+panel('Próximo passo',next?link(next.title,'#aula/'+next.id):link('Ver progresso','#progresso'),'flag')+'</aside></div>';
  }
  function tabFor(c){const requested=new URLSearchParams(location.search).get('aba');return tabs.some(([id])=>id===requested)?requested:c.topic?.type==='assessment'?'avaliacao':c.topic?.type==='activity'?'pratica':'conteudo';}
  function filter(main){const input=main.querySelector('[data-learning-search]');if(!input)return;const q=input.value.toLocaleLowerCase('pt-BR'),resource=input.dataset.learningSearch==='materials';const kind=main.querySelector('[data-learning-filter][aria-pressed="true"]')?.dataset.learningFilter||'all';const items=[...main.querySelectorAll(resource?'[data-learning-resource]':'[data-learning-module-card]')];items.forEach(item=>{item.hidden=!item.dataset.search.includes(q)||(resource&&kind!=='all'&&item.dataset.kind!==kind);});const empty=main.querySelector('.sl-no-results');if(empty)empty.hidden=items.some(item=>!item.hidden);}
  function mount(c,route,id){
    const main=c.main;
    if(!['formacao','fase','modulo','aula'].includes(route)||route==='formacao'&&id&&id!==c.formation.id)return false;
    const m=route==='modulo'?c.curriculum.modules.find(m=>m.id===id):route==='aula'?c.curriculum.modules.find(m=>m.lessons.some(t=>t.id===id)):null;
    if(m?.number===25||(['modulo','aula'].includes(route)&&!m)||(route==='fase'&&!c.curriculum.phases.some(p=>p.id===id)))return false;
    const native=main.querySelector('.reading-panel'),moduleNative=main.querySelector('.module-detail');
    c.topic=route==='aula'?m?.lessons.find(t=>t.id===id):null;
    main.classList.add('sks-learning');main.dataset.learningModule=m?.id||'';
    main.innerHTML=m?shell(c,m,tabFor(c)):catalog(c,route==='fase'?id:null);
    const nativeSlot=main.querySelector('[data-learning-native]');
    if(nativeSlot&&native)nativeSlot.append(native);
    const moduleSlot=main.querySelector('[data-learning-module-native]');if(moduleSlot&&moduleNative)moduleSlot.append(moduleNative);
    const hubSlot=main.querySelector('[data-learning-hub]');
    if(hubSlot?.dataset.learningHub){const temp=document.createElement('div');temp.innerHTML=c.hub.renderSection(hubSlot.dataset.learningHub,c.state.hub,{escape:e,curriculum:c.curriculum});const form=temp.querySelector('.hub-form-panel');if(form)hubSlot.append(form);}
    main.querySelectorAll('[data-learning-search]').forEach(input=>input.addEventListener('input',()=>filter(main)));
    main.querySelectorAll('[data-learning-filter]').forEach(button=>button.addEventListener('click',()=>{main.querySelectorAll('[data-learning-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter(main);}));
    return true;
  }
  window.SKSLearning=Object.freeze({mount,tabFor});
})();
