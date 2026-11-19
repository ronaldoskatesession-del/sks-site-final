(async () => {
  'use strict';
  if(location.protocol==='file:')return;
  const accountApi=window.SKSAccount;
  const teacher=await accountApi.ensureTeacher();if(!teacher)return;
  const teacherRoutes=window.SKSTeacherDisciplines;
  const initialRoute=teacherRoutes.route(location.hash,location.search);
  const initialId=window.SKSFormations.get(initialRoute.formationId)?initialRoute.formationId:'agencia';
  let formation;try{formation=await window.SKSFormations.open(teacher,{id:initialId});}catch(error){document.getElementById('main').textContent=error.message;return;}
  const isAgency=formation.id==='agencia';
  if(!isAgency){document.title='Editor — '+formation.name+' SKS';document.querySelector('.sidebar-footer small').textContent='Editor do professor · '+formation.name;}
  const courseSnapshot=await accountApi.loadCourse();
  const curriculum = formation.curriculum;
  const seed = formation.seed || {content:{},bonus:{},quizzes:{}};
  const allTopics = curriculum.modules.flatMap(m => m.lessons);
  const studyModules = curriculum.modules.filter(m => m.number !== 25);
  const studyTopics = studyModules.flatMap(m => m.lessons);
  const topicIds = new Set(allTopics.map(t => t.id));
  const key = isAgency?'sks-do-zero-ao-digital-v2':'sks-editor-'+formation.id+'-v1';
  const blankState = () => ({ content: {}, bonus: {}, notes: {}, completed: [], project: [] });
  let state;
  state = validateState(courseSnapshot.data);
  let contentPending=false, contentSaving=null, contentSaveError=false;
  const main = document.getElementById('main');
  const sidebar = document.getElementById('sidebar');
  const dialog = document.getElementById('dialog');
  const dialogBody = document.getElementById('dialog-body');
  const toast = document.getElementById('toast');
  let toastTimer, catalogQuery = '', phaseFilter = '', selectedEditorTopic = studyTopics[0].id,teacherCategory='Todas as unidades',reloadingFormation=false;
  const colors = [ ['#e5edff','#577dd5'], ['#e8f2e9','#5c9364'], ['#f5e8eb','#b57785'], ['#f2ecff','#9377c6'], ['#fff0dc','#bd8d49'], ['#e5f3f2','#5d9a94'], ['#e9eafa','#7b7fc0'], ['#e8f0fc','#7091c1'], ['#f1eae4','#ab8b6a'] ];
  const html = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = v => String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const moduleById = id => curriculum.modules.find(m => m.id === id);
  const moduleForTopic = id => curriculum.modules.find(m => m.lessons.some(t => t.id === id));
  const topicById = id => allTopics.find(t => t.id === id);
  function applyTheme(value) {
    const dark=value==='dark';
    document.documentElement.dataset.theme=dark?'dark':'light';
    const button=document.getElementById('theme-toggle');
    button.setAttribute('aria-pressed',String(dark));
    button.setAttribute('aria-label',dark?'Alternar para modo claro':'Alternar para modo escuro');
    button.title=dark?'Modo escuro ativado — alternar para claro':'Modo claro ativado — alternar para escuro';
    button.querySelector('[data-theme-icon]').textContent=dark?'☀':'☾';
    button.querySelector('[data-theme-label]').textContent=dark?'Modo claro':'Modo escuro';
  }
  applyTheme(document.documentElement.dataset.theme);
  const contentFor = id => state.content[id] || seed.content[id];
  const bonusFor = id => state.bonus[id] || seed.bonus[id];
  const ready = id => !!(contentFor(id)?.body.trim() || contentFor(id)?.url || (welcomeTopic(id)&&(contentFor(id)?.pages?.length || contentFor(id)?.blocks?.length)));
  const complete = id => state.completed.includes(id);
  const phaseName = id => curriculum.phases.find(p => p.id === id)?.title || 'PROJETO FINAL SKS';
  const typeName = type => ({lesson:'Aula',activity:'Atividade prática',assessment:'Avaliação',deliverable:'Entregável'})[type];

  function safeUrl(value) {
    if (!value) return '';
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function validateState(input) {
    const result = blankState();
    if (!input || typeof input !== 'object') return result;
    for (const [id, item] of Object.entries(input.content || {})) {
      if (!topicIds.has(id) || !item || typeof item !== 'object') continue;
      result.content[id] = {body:typeof item.body === 'string' ? item.body.slice(0,200000) : '',url:safeUrl(item.url),duration:typeof item.duration === 'string' ? item.duration.slice(0,40) : ''};
      if(id==='module-1-topic-1'&&Array.isArray(item.blocks))result.content[id].blocks=item.blocks;
      if(id==='module-1-topic-1'&&Array.isArray(item.pages))result.content[id].pages=item.pages;
    }
    for (const [id, item] of Object.entries(input.bonus || {})) {
      if (!/^bonus-\d+$/.test(id) || Number(id.split('-')[1]) >= curriculum.bonuses.length || !item || typeof item !== 'object') continue;
      result.bonus[id] = {body:typeof item.body === 'string' ? item.body.slice(0,200000) : '',url:safeUrl(item.url)};
    }
    for (const [id, text] of Object.entries(input.notes || {})) if(topicIds.has(id) && typeof text === 'string') result.notes[id]=text.slice(0,50000);
    result.completed = [...new Set(Array.isArray(input.completed) ? input.completed.filter(id => topicIds.has(id) && ((result.content[id] || seed.content[id])?.body.trim() || (result.content[id] || seed.content[id])?.url)) : [])];
    const finalIds = new Set(allTopics.filter(t=>t.type==='deliverable').map(t=>t.id));
    result.project = [...new Set(Array.isArray(input.project) ? input.project.filter(id=>finalIds.has(id)) : [])];
    return result;
  }
  function persist() {
    contentPending=true;contentSaveError=false;saveCourse();return true;
  }
  function saveCourse() {
    if(contentSaving)return contentSaving;
    if(!contentPending)return Promise.resolve();
    const status=document.getElementById('editor-save-status');
    contentSaving=(async()=>{
      try{while(contentPending){contentPending=false;status.textContent='Salvando material…';status.dataset.status='saving';await accountApi.saveCourse({content:state.content,bonus:state.bonus});}status.textContent='Material salvo para os alunos';status.dataset.status='saved';}
      catch(error){contentPending=true;contentSaveError=true;status.textContent='Não salvo · exporte backup';status.dataset.status='error';notify(error.message+' Exporte o backup antes de sair.');}
      finally{contentSaving=null;}
    })();return contentSaving;
  }
  document.getElementById('editor-logout').addEventListener('click',async()=>{await saveCourse();if(!contentPending&&!contentSaveError)await accountApi.logout();});
  window.addEventListener('beforeunload',event=>{if(contentPending||contentSaving){event.preventDefault();event.returnValue='';}});
  document.getElementById('editor-save-status').textContent='Material da edição local';
  function notify(text) {clearTimeout(toastTimer);toast.textContent=text;toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),4200);}
  function openDialog(content) {dialogBody.innerHTML=content;if(!dialog.open)dialog.showModal();}
  function renderText(text) {
    const lines=String(text).replace(/\r/g,'').split('\n'); let result='',paragraph=[],list=[];
    const flush=()=>{if(paragraph.length){result+=`<p>${paragraph.map(html).join('<br>')}</p>`;paragraph=[];}if(list.length){result+=`<ul>${list.map(t=>`<li>${html(t)}</li>`).join('')}</ul>`;list=[];}};
    for(const line of lines){const heading=line.match(/^#{1,6}\s+(.+)$/);const bullet=line.match(/^[-*]\s+(.+)$/);if(heading){flush();result+=`<h2>${html(heading[1])}</h2>`;}else if(bullet){if(paragraph.length)flush();list.push(bullet[1]);}else if(!line.trim())flush();else{if(list.length)flush();paragraph.push(line);}}
    flush();return result;
  }
  function progress() {const done=studyTopics.filter(t=>complete(t.id)).length;return {done,total:studyTopics.length,percent:Math.round(done/studyTopics.length*100),available:studyTopics.filter(t=>ready(t.id)).length};}
  const localRoutes=new Set(['inicio','formacao','modulo','aula','projeto','biblioteca','conteudos','validacao']);
  function selectedHash(hash,id=formation.id){const raw=hash.replace(/^#/,''),parts=raw.split('/');return localRoutes.has(parts[0])?teacherRoutes.hash(id,parts[0],parts.slice(1).join('/')):hash;}
  function navigate(hash) {hash=selectedHash(hash);if(location.hash===hash)renderRoute();else location.hash=hash;}
  function setMenu(open) {
    sidebar.classList.toggle('open',open);
    const hidden=window.matchMedia('(max-width:800px)').matches&&!open;
    sidebar.inert=hidden;
    if(hidden)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');
    document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));
  }
  function courseInfo() {
    openDialog(`<p class="eyebrow">FORMAÇÃO SKS</p><h2 id="dialog-title">Do Zero ao Digital</h2><p>A formação que conecta fundamentos de negócio, marketing, vendas, tecnologia e crescimento.</p><div class="dialog-list"><div><b>Carga horária planejada</b>${html(curriculum.workload)} — ainda requer validação pedagógica.</div><div><b>Certificação prevista na grade</b>${html(curriculum.certification)} — não emitida por esta prévia.</div><div><b>Estrutura</b>9 fases, 25 módulos e projeto final integrado.</div></div><h3>Competências centrais</h3><div class="competency-tags">${curriculum.competencies.map(c=>`<span>${html(c)}</span>`).join('')}</div>`);
  }
  function help() {
    openDialog(`<p class="eyebrow">GUIA RÁPIDO</p><h2 id="dialog-title">Seu novo portal SKS</h2><div class="dialog-list"><div><b>1. Explore Minha formação</b>A grade segue o arquivo atualizado. Cada tópico abre uma página de aula, atividade ou avaliação.</div><div><b>2. Teste como aluno</b>Abra Testar como aluno para ler aulas, registrar atividades e fazer as avaliações. O progresso do aluno é separado do editor.</div><div><b>3. Revise e ajuste</b>As observações do aluno aparecem em Revisar curso. Em Gerenciar conteúdos, você pode ajustar os textos e acrescentar links de vídeos e materiais.</div><div><b>4. Guarde um backup</b>Use Exportar backup para baixar seus conteúdos e progresso. Para usá-los em outro navegador ou endereço, use Importar backup.</div></div><p>O material cadastrado fica no servidor local deste computador. Para compartilhá-lo com outros alunos, envie o backup aqui para integrarmos à versão publicada.</p><div class="button-row"><a class="button" href="#conteudos" data-close-dialog>Gerenciar conteúdos →</a><button class="outline" data-export>Exportar backup</button></div>`);
  }

  function renderHome() {
    if(!isAgency)return renderCatalog();
    const p=progress(); const first=studyTopics.find(t=>ready(t.id)&&!complete(t.id));
    const cta=first?`#aula/${first.id}`:'#formacao';
    const date=new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long',timeZone:'America/Sao_Paulo'}).format(new Date());
    main.innerHTML=`<div class="page-heading"><p class="eyebrow">SUA JORNADA DIGITAL · ${html(date.toUpperCase())}</p><h1>Aprenda. Aplique. Cresça.</h1><p>Um caminho completo para transformar conhecimento em resultado.</p></div>
      <div class="hero-grid"><section class="hero panel"><span class="tag">FORMAÇÃO SKS</span><h2>Do zero<br>ao <em>digital.</em></h2><p>Da estrutura do negócio à estratégia de crescimento. Uma formação para conectar marketing, vendas e execução.</p><a class="button mint" href="${cta}">${first?'Continuar aprendizado':'Explorar a formação'} <span>↗</span></a><div class="hero-bottom"><span><b>25</b> módulos</span><span><b>9</b> fases</span><span><b>150–200</b> h previstas</span></div></section>
      <section class="progress-panel panel"><p class="eyebrow">SEU PROGRESSO</p><div class="progress-ring" style="--angle:${p.percent*3.6}deg"><div><b>${p.percent}%</b><small>CONCLUÍDO</small></div></div><p>${p.done} de ${p.total} tópicos concluídos<br>${p.available} conteúdos cadastrados</p><a class="outline" href="#formacao">Ver minha formação →</a></section></div>
      <div class="section-heading"><div><h2>O método que guia a jornada</h2><p>Três princípios. Uma direção: crescimento com estratégia.</p></div></div><div class="method-grid">${curriculum.method.map((m,i)=>`<article class="method-card panel"><span class="method-icon">${['↗','⌘','◎'][i]}</span><div><b>${html(m.name)}</b><p>${html(m.text)}</p></div></article>`).join('')}</div>
      <div class="section-heading"><div><h2>O próximo passo é seu.</h2><p>Explore os módulos ou valide a experiência do aluno.</p></div><a class="quiet" href="#formacao">Ver todos os módulos →</a></div>
      <div class="overview-bottom"><section class="phase-preview panel"><span class="tag">FASE 01 · FUNDAMENTOS</span><h3>Um negócio digital começa pela base.</h3><p>Introdução ao digital, estruturação empresarial, modelos de negócio e planejamento estratégico.</p><div class="phase-mini-grid"><span><b>4</b> módulos</span><span><b>${studyModules.filter(m=>m.phaseId==='phase-1').reduce((n,m)=>n+m.lessons.length,0)}</b> tópicos</span><span><b>01</b> ponto de partida</span></div><a class="outline" href="#modulo/module-1">Conhecer o primeiro módulo →</a></section><section class="editor-promo panel"><span class="tag">ESPAÇO DO CRIADOR</span><h3>Revise a primeira edição.</h3><p>As aulas textuais, exercícios e testes iniciais estão disponíveis. Faça o curso como aluno, registre melhorias e ajuste os materiais antes de publicar.</p><a class="outline" href="aluno.html">Testar como aluno ↗</a></section></div>`;
  }

  function tile(m,color) {
    const count=m.lessons.filter(t=>ready(t.id)).length;
    return `<a class="module-tile panel" href="#${m.number===25?'projeto':`modulo/${m.id}`}" style="--phase-bg:${color[0]}"><div class="tile-top">MÓDULO ${String(m.number).padStart(2,'0')}<span>${count?'CONTEÚDO INICIAL':'GRADE DEFINIDA'}</span></div><h3>${html(m.title)}</h3><p>${html(m.lessons.slice(0,3).map(t=>t.title).join(' · '))}</p><div class="tile-bottom"><span>${m.lessons.length} ${m.number===25?'entregáveis':'tópicos'}${count?' · '+count+' disponíveis':''}</span><strong>↗</strong></div></a>`;
  }
  function catalogSections() {
    const q=normalize(catalogQuery); let count=0;
    const groups=[...curriculum.phases,{id:'final',number:25,title:'PROJETO FINAL SKS'}];
    const result=groups.filter(g=>!phaseFilter||phaseFilter===g.id).map((g,index)=>{
      const modules=curriculum.modules.filter(m=>m.phaseId===g.id&&(!q||normalize(m.title+' '+m.lessons.map(t=>t.title).join(' ')).includes(q)));
      if(!modules.length)return '';count+=modules.length;const color=colors[index%colors.length];
      return `<section class="catalog-section"><div class="phase-heading" style="--phase-bg:${color[0]};--phase-color:${color[1]}"><span class="phase-number">${g.id==='final'?'↗':String(g.number).padStart(2,'0')}</span><div><h2>${html(g.title)}</h2><small>${modules.length} ${modules.length===1?'módulo':'módulos'} · ${g.id==='final'?'Aplicação integrada do método SKS':'Conhecimento, prática e avaliação'}</small></div></div><div class="module-grid">${modules.map(m=>tile(m,color)).join('')}</div></section>`;
    }).join('');
    document.getElementById('catalog-results').innerHTML=result||'<div class="empty-state panel">Nenhum módulo encontrado. Experimente outro termo.</div>';
    document.getElementById('catalog-count').textContent=`${count} de ${curriculum.modules.length} módulos`;
  }
  function renderCatalog() {
    main.innerHTML=`<div class="page-heading split"><div><p class="eyebrow">${html(formation.name.toUpperCase())}</p><h1>Formações</h1><p>Do fundamento à execução: toda a sua grade em um só lugar.</p></div><a class="outline" href="${isAgency?'grade-formacao-sks.md':'grade-loja-escola.md'}" download>Baixar grade ↓</a></div><div class="catalog-note"><span>▤</span><div><b>Grade oficial atualizada</b><br>Os tópicos seguem o arquivo enviado. A primeira edição textual foi redigida com apoio de IA para sua revisão; não há vídeos gravados.</div></div><div class="toolbar"><div class="search-field"><span>⌕</span><input id="catalog-search" type="search" placeholder="Buscar módulo ou assunto…" aria-label="Buscar módulo ou assunto" value="${html(catalogQuery)}"></div><select id="phase-filter" aria-label="Filtrar por fase"><option value="">Todas as fases</option>${curriculum.phases.map(p=>`<option value="${p.id}" ${phaseFilter===p.id?'selected':''}>Fase ${p.number} · ${html(p.title)}</option>`).join('')}${isAgency?`<option value="final" ${phaseFilter==='final'?'selected':''}>Projeto final</option>`:''}</select></div><p class="subtext" id="catalog-count"></p><div id="catalog-results"${isAgency?'':' class="catalog-results--compact"'}></div>`;catalogSections();
  }
  function renderModule(id) {
    const m=moduleById(id);if(!m)return renderNotFound();const done=m.lessons.filter(t=>complete(t.id)).length;const available=m.lessons.filter(t=>ready(t.id)).length;
    main.innerHTML=`<a class="back-link" href="#formacao">← Voltar à formação</a><div class="page-heading"><p class="eyebrow">MÓDULO ${String(m.number).padStart(2,'0')} · ${html(phaseName(m.phaseId))}</p><h1>${html(m.title)}</h1><p>${m.lessons.length} tópicos para você estudar, praticar e aplicar.</p></div><div class="module-detail"><section class="lesson-list panel">${m.lessons.map((t,i)=>`<a class="lesson-row" href="#aula/${t.id}"><span class="lesson-order">${String(i+1).padStart(2,'0')}</span><span class="lesson-copy"><b>${html(t.title)}</b><small><i class="status-dot ${complete(t.id)?'complete':ready(t.id)?'ready':''}"></i>${typeName(t.type)} · ${complete(t.id)?'Concluído':ready(t.id)?'Conteúdo disponível':'Aguardando conteúdo'}</small></span><span>→</span></a>`).join('')}</section><aside class="module-side panel"><span class="tag">SEU MÓDULO</span><div class="stat-number">${Math.round(done/m.lessons.length*100)}%</div><p>${done} tópicos concluídos<br>${available} conteúdos cadastrados</p><div class="meter"><i style="width:${done/m.lessons.length*100}%"></i></div><a class="button" href="#aula/${(m.lessons.find(t=>ready(t.id)&&!complete(t.id))||m.lessons[0]).id}">Abrir módulo →</a><a class="quiet" href="#conteudos/${m.lessons[0].id}">Preparar conteúdos deste módulo ✎</a></aside></div>`;
  }
  function renderLesson(id) {
    const t=topicById(id),m=moduleForTopic(id);if(!t||!m)return renderNotFound();const item=contentFor(id)||{body:'',url:'',duration:''};const index=m.lessons.findIndex(x=>x.id===id);const next=m.lessons[index+1];
    const pending=`<div class="pending-content"><div class="pending-icon">✎</div><h2>Este conteúdo está em preparação.</h2><p>O tópico faz parte da nova grade SKS. Adicione o texto da aula, um link de vídeo ou as instruções da atividade para disponibilizá-lo aqui.</p><a class="button" href="#conteudos/${id}">Adicionar conteúdo →</a></div>`;
    main.innerHTML=`<a class="back-link" href="#modulo/${m.id}">← ${html(m.title)}</a><div class="lesson-layout"><article class="reading-panel panel"><header><p class="eyebrow">MÓDULO ${String(m.number).padStart(2,'0')} · ${typeName(t.type).toUpperCase()}</p><h1>${html(t.title)}</h1><small>${isAgency&&id==='module-1-topic-1'?html(item.duration||'Estude no seu ritmo')+' · '+(state.content[id]?'Material ajustado no editor local':'Edição inicial para validação'):(item.duration?html(item.duration)+' · ':'')+(ready(id)?'Material da Formação SKS':'Tópico previsto na grade')}</small></header>${item.url?`<a class="video-link" href="${html(item.url)}" target="_blank" rel="noopener noreferrer"><span>▶ Abrir vídeo ou material da aula</span><b>↗</b></a>`:''}${item.body||item.blocks?.length||item.pages?.length?`<div class="lesson-body">${isAgency&&id==='module-1-topic-1'?(item.pages?.length?window.SKSVisualLesson.renderPages(item.pages):item.blocks?.length?window.SKSWelcomLesson.renderBlocks(item.blocks,renderText,html):window.SKSWelcomLesson.render(item.body,renderText,html)):renderText(item.body)}</div>`:!item.url?pending:'<p class="subtext">Acesse o material acima para estudar este tópico.</p>'}<div class="notes-field"><label for="lesson-notes">Meu caderno de anotações</label><textarea id="lesson-notes" data-topic="${id}" placeholder="Guarde suas ideias, dúvidas e aprendizados…">${html(state.notes[id]||'')}</textarea><small>Salvo automaticamente neste navegador.</small></div><div class="lesson-footer"><a class="quiet" href="#conteudos/${id}">Editar material ✎</a><div class="button-row">${next?`<a class="outline" href="#aula/${next.id}">Próximo →</a>`:''}<button class="button" data-complete="${id}" ${!ready(id)?'disabled':''}>${complete(id)?'Concluído ✓':'Concluir tópico ✓'}</button></div></div></article><aside class="reader-toc panel"><h3>Neste módulo</h3><div class="toc-links">${m.lessons.map((x,i)=>`<a href="#aula/${x.id}" class="${x.id===id?'active':''}">${String(i+1).padStart(2,'0')} · ${html(x.title)}</a>`).join('')}</div></aside></div>`;
  }
  function renderProject() {
    if(!isAgency){navigate('#modulo/'+curriculum.modules.at(-1).id);return;}
    const m=curriculum.modules[24];const done=m.lessons.filter(t=>state.project.includes(t.id)).length;
    main.innerHTML=`<div class="page-heading"><p class="eyebrow">MÓDULO 25 · PROJETO FINAL SKS</p><h1>Transforme a formação em um projeto.</h1><p>Integre estratégia, marca, conteúdo, aquisição, vendas e performance.</p></div><section class="project-hero panel"><div><span class="tag">ENTREGA FINAL</span><h2>Um negócio. Uma estratégia completa.</h2><p>Use a lista de entregáveis do seu programa como roteiro de trabalho. Marque cada etapa preparada e guarde as instruções e materiais no respectivo tópico.</p></div><div class="project-score" id="project-score">${done}/${m.lessons.length}<small>etapas preparadas</small></div></section><div class="module-detail"><div class="panel">${m.lessons.map(t=>`<div class="deliverable ${state.project.includes(t.id)?'done':''}"><input type="checkbox" id="check-${t.id}" data-project="${t.id}" ${state.project.includes(t.id)?'checked':''}><label for="check-${t.id}"><b>${html(t.title)}</b></label><a class="quiet" href="#aula/${t.id}" aria-label="Abrir ${html(t.title)}">↗</a></div>`).join('')}</div><aside class="module-side panel"><span class="tag">MÉTODO SKS</span><h2 style="margin-top:15px">Da ideia à apresentação</h2><p>Os entregáveis são exatamente os previstos na grade. A marcação registra sua organização pessoal, sem emitir nota ou certificação.</p><a class="outline" href="#conteudos/${m.lessons[0].id}">Adicionar orientações →</a></aside></div>`;
  }
  function renderLibrary() {
    main.innerHTML=`<div class="page-heading"><p class="eyebrow">RECURSOS DA FORMAÇÃO</p><h1>Biblioteca & bônus</h1><p>${curriculum.bonuses.length} recursos textuais desta formação.</p></div><div class="resource-grid">${curriculum.bonuses.map((b,i)=>{const item=bonusFor('bonus-'+i);const available=!!(item?.body||item?.url);return `<article class="resource panel"><span class="tag">${available?'MATERIAL DISPONÍVEL':'EM PREPARAÇÃO'}</span><h3>${html(b)}</h3><p>${available?'Modelo ou roteiro inicial para revisão. Não ativa serviços, grupos ou contratos.':'Cadastre um texto ou link para disponibilizar este recurso.'}</p><button class="quiet" data-bonus="${i}">${available?'Abrir material':'Preparar material'} →</button></article>`;}).join('')}</div><section class="source-card panel"><div><b>A grade que orienta este portal</b><p>FORMAÇÃO SKS — DO ZERO AO DIGITAL · versão atualizada enviada por você.</p></div><a class="outline" href="${isAgency?'grade-formacao-sks.md':'grade-loja-escola.md'}" download>Baixar documento ↓</a></section>`;
  }
  function bonusDialog(index,edit=false) {
    if(!Number.isInteger(index)||index<0||index>=curriculum.bonuses.length)return;
    const id='bonus-'+index,item=bonusFor(id)||{body:'',url:''};
    if(edit||(!item.body&&!item.url))openDialog(`<p class="eyebrow">BIBLIOTECA & BÔNUS</p><h2 id="dialog-title">${html(curriculum.bonuses[index])}</h2><form id="bonus-form" data-bonus-id="${id}"><div class="field"><label for="bonus-body">Descrição ou conteúdo do material</label><textarea id="bonus-body">${html(item.body)}</textarea></div><div class="field"><label for="bonus-url">Link do material</label><input id="bonus-url" type="url" placeholder="https://…" value="${html(item.url)}"></div><p>O material fica salvo neste navegador e é incluído no backup.</p><button class="button" type="submit">Salvar material ✓</button></form>`);
    else openDialog(`<p class="eyebrow">BIBLIOTECA & BÔNUS</p><h2 id="dialog-title">${html(curriculum.bonuses[index])}</h2><div class="lesson-body">${renderText(item.body)}</div><div class="button-row">${item.url?`<a class="button" target="_blank" rel="noopener noreferrer" href="${html(item.url)}">Abrir material ↗</a>`:''}<button class="outline" data-edit-bonus="${index}">Editar conteúdo</button></div>`);
  }
  let editableWelcomeBlocks=null,visualLessonEditor=null;
  const welcomeTopic=id=>isAgency&&id==='module-1-topic-1';
  function welcomeBlocks(){return editableWelcomeBlocks||(editableWelcomeBlocks=structuredClone(contentFor('module-1-topic-1')?.blocks?.length?contentFor('module-1-topic-1').blocks:window.SKSWelcomLesson.fromBody(contentFor('module-1-topic-1')?.body||'')));}
  function syncWelcomeBlocks(){
    document.querySelectorAll('[data-block-index]').forEach(row=>{const block=welcomeBlocks()[Number(row.dataset.blockIndex)];if(!block)return;block.title=row.querySelector('[data-block-title]').value;const text=row.querySelector('[data-block-text]');if(text)block.text=text.value;});
  }
  function welcomeBlockRows(){
    return welcomeBlocks().map((block,index)=>`<div class="welcome-editor-block" draggable="true" data-block-index="${index}"><div class="welcome-editor-bar"><span class="welcome-drag" title="Arraste para alterar a ordem">⋮⋮</span><strong>${index+1}. ${html(({text:'Texto',box:'Caixa de destaque',image:'Imagem',video:'Vídeo',document:'Documento'})[block.type]||'Texto')}</strong><button type="button" class="quiet" data-block-move="up" aria-label="Mover bloco para cima">↑</button><button type="button" class="quiet" data-block-move="down" aria-label="Mover bloco para baixo">↓</button><button type="button" class="quiet" data-block-remove aria-label="Remover bloco">Remover</button></div><label>Título<input data-block-title maxlength="120" value="${html(block.title||'')}"></label>${['text','box'].includes(block.type)?`<label>Conteúdo<textarea data-block-text rows="5">${html(block.text||'')}</textarea></label>`:''}${['text','box','image','video','document'].includes(block.type)?`<div class="welcome-editor-file">${block.src?`<span>Arquivo atual: ${html(block.src.split('/').at(-1))}</span>`:'<span>Nenhum arquivo selecionado</span>'}<label>Enviar ${block.type==='video'?'vídeo':block.type==='document'?'documento':'imagem'}<input type="file" data-block-upload accept="${block.type==='video'?'video/mp4,video/webm':block.type==='document'?'application/pdf,.docx':'image/png,image/jpeg,image/webp'}"></label></div>`:''}</div>`).join('');
  }
  function welcomeEditor(){return '<div id="visual-lesson-editor"></div>';}
  function refreshWelcomeEditor(){const list=document.getElementById('welcome-editor-list');if(list)list.innerHTML=welcomeBlockRows();}
  function renderEditor(topicId) {
    if(topicId&&topicIds.has(topicId))selectedEditorTopic=topicId;
    const t=topicById(selectedEditorTopic),m=moduleForTopic(selectedEditorTopic),item=contentFor(t.id)||{body:'',url:'',duration:''};
    main.innerHTML=`<div class="page-heading split"><div><p class="eyebrow">ESPAÇO DO CRIADOR</p><h1>Gerenciar conteúdos</h1><p>Coloque o seu material em cada tópico da nova Formação SKS.</p></div><div class="button-row"><button class="outline" data-import>Importar backup ↑</button><button class="outline" data-export>Exportar backup ↓</button></div></div><div class="editor-layout"><form id="lesson-editor" class="editor-form panel"><h2>Prepare uma aula ou atividade</h2><div class="form-pair"><div class="field"><label for="editor-module">Módulo</label><select id="editor-module">${curriculum.modules.map(x=>`<option value="${x.id}" ${x.id===m.id?'selected':''}>${String(x.number).padStart(2,'0')} · ${html(x.title)}</option>`).join('')}</select></div><div class="field"><label for="editor-topic">Tópico</label><select id="editor-topic">${m.lessons.map(x=>`<option value="${x.id}" ${x.id===t.id?'selected':''}>${html(x.title)}</option>`).join('')}</select></div></div>${welcomeTopic(t.id)?welcomeEditor():`<div class="field"><label for="editor-body">Texto da aula, exercício ou avaliação</label><textarea id="editor-body" class="body-input" placeholder="Cole seu conteúdo completo aqui. Use # para títulos e - para listas.">${html(item.body)}</textarea><small>O texto é apresentado com títulos, parágrafos e listas. O conteúdo continua sendo seu.</small></div>`}<div class="form-pair"><div class="field"><label for="editor-url">Link do vídeo ou material</label><input id="editor-url" type="url" placeholder="https://…" value="${html(item.url)}"><small>Um link seguro para YouTube, Vimeo, documento ou outro material.</small></div><div class="field"><label for="editor-duration">Duração ou carga da atividade</label><input id="editor-duration" maxlength="40" placeholder="Ex.: 25 min ou 2 horas" value="${html(item.duration)}"></div></div><div class="editor-save-row"><span>${ready(t.id)?'Material disponível para revisão.':'Este tópico ainda aguarda conteúdo.'}</span><button class="button" type="submit">Salvar e visualizar →</button></div></form><aside><section class="editor-side panel"><span class="tag">COMO FUNCIONA</span><h3 style="margin-top:14px">Da grade para a aula.</h3><p>Selecione o módulo e o tópico, insira seu texto ou vídeo e salve. O material aparece imediatamente na página da aula.</p><ul><li>${allTopics.length} tópicos e entregáveis desta formação.</li><li>Textos e links organizados por módulo.</li><li>Anotações e conclusão por tópico.</li></ul><h3>Guarde o que você construir</h3><p>Os conteúdos revisados são salvos no servidor local para os alunos. Exporte o backup para levar o material a outro dispositivo ou enviá-lo aqui para integrar à versão publicada.</p><button class="outline" data-export>Baixar backup dos conteúdos ↓</button></section><section class="source-card panel"><div><b>${isAgency?'Somente a nova grade SKS':'Grade da Loja Escola'}</b><p>${isAgency?'Aulas antigas removidas desta versão.':'Conteúdos organizados exclusivamente para esta formação.'}</p></div></section></aside></div>`;
    visualLessonEditor=welcomeTopic(t.id)?window.SKSVisualLesson.mount(document.getElementById('visual-lesson-editor'),item.pages?.length?item.pages:window.SKSVisualLesson.fromBlocks(welcomeBlocks())):null;
  }
  async function renderValidation() {
    const core=window.SKSStudentCore.create(curriculum,seed);
    let student;try{student=core.validate((await accountApi.loadStudent()).state);}catch{student=core.blank();}
    if(teacherRoutes.route(location.hash,location.search).route!=='validacao')return;
    const feedback=allTopics.filter(t=>student.feedback[t.id]?.trim());
    const passed=Object.values(student.results).filter(r=>r.passed).length;
    const available=allTopics.filter(t=>ready(t.id)).length;
    main.innerHTML=`<div class="page-heading split"><div><p class="eyebrow">VALIDAÇÃO ANTES DO LANÇAMENTO</p><h1>Revisar curso</h1><p>Conteúdo presente não significa conteúdo aprovado. Faça o curso como aluno e revise a qualidade de cada módulo.</p></div><a class="button" href="aluno.html">Testar como aluno ↗</a></div><div class="validation-stats"><div class="panel"><b>${available}/${allTopics.length}</b><span>textos ou materiais disponíveis</span></div><div class="panel"><b>${Object.keys(seed.quizzes).length}/${allTopics.filter(t=>t.type==='assessment').length}</b><span>avaliações configuradas</span></div><div class="panel"><b>${student.reviewed.length}/${curriculum.modules.length}</b><span>módulos revisados por você</span></div><div class="panel"><b>${feedback.length}</b><span>aulas com observações</span></div></div><div class="catalog-note"><span>✎</span><div><b>${html(seed.edition)}</b><br>${html(seed.origin)} A carga horária ainda precisa ser validada. Esta prévia não tem vídeos gravados, login, banca ou certificado.</div></div><div class="source-card panel"><div><b>Leia também fora do portal</b><p>A edição textual reúne as aulas, recursos e gabaritos iniciais. Ajustes salvos no editor ficam no backup dos conteúdos.</p></div><div class="button-row"><a class="outline" href="${isAgency?'curso-para-validacao.md':'loja-para-validacao.md'}" download>Baixar edição textual ↓</a><button class="outline" data-export>Backup dos conteúdos ↓</button></div></div><div class="section-heading"><div><h2>Conferência por módulo</h2><p>O aluno de teste aprovou ${passed} avaliações. A marcação de revisão é manual e não emite certificação.</p></div><button class="quiet" data-refresh-review>Atualizar relatório ↻</button></div><section class="progress-module-list panel">${curriculum.modules.map(m=>{
      const exam=m.lessons.find(t=>t.type==='assessment'),result=exam&&student.results[exam.id];
      return `<div class="progress-module"><div><a href="${window.SKSFormations.href(formation.id,'modulo/'+m.id)}">${String(m.number).padStart(2,'0')} · ${html(m.title)}</a><span>${m.lessons.filter(t=>ready(t.id)).length}/${m.lessons.length} materiais · ${student.completed.filter(id=>m.lessons.some(t=>t.id===id)).length} tópicos concluídos no teste</span></div><div class="module-grade"><b>${student.reviewed.includes(m.id)?'Revisado ✓':'Revisão pendente'}</b><span>${result?'Teste: '+result.score+'/'+result.total+' · '+(result.passed?'aprovado':'revisar'):exam?'Avaliação ainda não testada':isAgency?'17 entregáveis finais':m.lessons.length+' aulas para revisão'}</span></div></div>`;
    }).join('')}</section><div class="section-heading"><div><h2>Observações feitas como aluno</h2><p>Abra a aula para conferir ou vá ao editor para ajustar o texto.</p></div></div>${feedback.length?`<div class="review-feedback-list">${feedback.map(t=>`<article class="panel review-feedback"><span class="tag">MÓDULO ${moduleForTopic(t.id).number}</span><h3>${html(t.title)}</h3><p>${html(student.feedback[t.id]).replace(/\n/g,'<br>')}</p><div class="button-row"><a class="quiet" href="${window.SKSFormations.href(formation.id,'aula/'+t.id)}">Conferir como aluno ↗</a><a class="quiet" href="#conteudos/${t.id}">Editar texto ✎</a></div></article>`).join('')}</div>`:'<div class="empty-state panel">Nenhuma observação registrada. Na área do aluno, use “Revisão para o lançamento” ao final de cada aula.</div>'}`;
    decorateTeacherLinks(teacherRoutes.route(location.hash,location.search));
  }
  function renderNotFound() {main.innerHTML='<div class="empty-state panel"><h2>Este conteúdo não foi encontrado.</h2><p>Escolha um módulo da nova Formação SKS.</p><a class="button" href="#formacao">Ver formação →</a></div>';}
  function decorateTeacherLinks(selection) {
    document.querySelectorAll('[data-nav="formacao"]').forEach(a=>a.href='#formacoes');
    const selected=!selection.gallery,selectedId=selection.formationId;
    document.querySelectorAll('.sidebar [data-nav]').forEach(a=>{
      if(a.dataset.nav==='formacao'||a.dataset.nav==='professor')return;
      if(selected&&localRoutes.has(a.dataset.nav))a.href=teacherRoutes.hash(selectedId,a.dataset.nav);
      else if(!selected&&a.dataset.nav==='conteudos')a.href='#formacoes';
    });
    if(selected)main.querySelectorAll('a[href^="#"]').forEach(a=>{const value=a.getAttribute('href');if(value!=='#main'&&value!=='#formacoes')a.setAttribute('href',selectedHash(value,selectedId));});
    document.querySelectorAll('a[href="aluno.html"]').forEach(a=>a.href=window.SKSFormations.href(formation.id));
  }
  async function renderRoute() {
    if(reloadingFormation)return;
    const selection=teacherRoutes.route(location.hash,location.search),{route,id}=selection;
    if(!selection.gallery&&window.SKSFormations.get(selection.formationId)&&selection.formationId!==formation.id){
      reloadingFormation=true;await saveCourse();
      if(contentPending||contentSaveError){reloadingFormation=false;notify('Exporte o backup antes de mudar de formação: há conteúdo pendente de salvamento.');return;}
      location.reload();return;
    }
    const crumb=document.querySelector('.breadcrumb');
    if(crumb?.firstChild)crumb.firstChild.textContent=selection.gallery?'FORMAÇÃO SKS ':String(teacherRoutes.find(selection.formationId)?.name||formation.name).toUpperCase()+' ';
    document.querySelector('.sidebar-footer small').textContent=selection.gallery?'Editor do professor':'Editor do professor · '+(teacherRoutes.find(selection.formationId)?.name||formation.name);
    document.title=selection.gallery?'Formações — SKS':'Editor — '+(teacherRoutes.find(selection.formationId)?.name||formation.name)+' SKS';
    const titles={inicio:'Visão geral',formacao:'Disciplinas',modulo:formation.name,aula:formation.name,projeto:'Projeto final',biblioteca:'Biblioteca & bônus',conteudos:'Gerenciar conteúdos',validacao:'Revisar curso',disciplinas:'Formações'};
    document.getElementById('page-title').textContent=titles[route]||'Disciplinas';
    const nav=selection.gallery||['formacao','modulo','aula'].includes(route)?'formacao':route;
    document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===nav);if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    setMenu(false);if(dialog.open)dialog.close();
    if(selection.gallery){
      if(location.hash!=='#formacoes')history.replaceState(null,'',location.pathname+location.search+'#formacoes');
      main.innerHTML=teacherRoutes.render(teacherCategory);
    }
    else if(!window.SKSFormations.get(selection.formationId))main.innerHTML=teacherRoutes.pending(selection.formationId);
    else ({inicio:renderHome,formacao:renderCatalog,modulo:()=>renderModule(id),aula:()=>renderLesson(id),projeto:renderProject,biblioteca:renderLibrary,conteudos:()=>renderEditor(id),validacao:renderValidation}[route]||renderNotFound)();
    decorateTeacherLinks(selection);
    if(!selection.gallery&&window.SKSFormations.get(selection.formationId)){
      const canonical=teacherRoutes.hash(formation.id,route,id),params=new URLSearchParams(location.search);params.delete('formacao');
      if(location.hash!==canonical||new URLSearchParams(location.search).has('formacao'))history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+canonical);
    }
    window.scrollTo(0,0);
  }
  function exportBackup() {
    const data={...state,content:{...seed.content,...state.content},bonus:{...seed.bonus,...state.bonus}};
    const blob=new Blob([JSON.stringify({version:2,formation:curriculum.title,exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=isAgency?'formacao-sks-conteudos-backup.json':'loja-escola-conteudos-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup preparado. Guarde o arquivo para recuperar seu material.');
  }
  function legacyEditor() {try{return validateState(JSON.parse(localStorage.getItem(key)||'null'));}catch{return blankState();}}
  document.addEventListener('click',event=>{
    const target=event.target.closest('button,a');if(!target)return;
    const row=target.closest('[data-block-index]');
    if(target.dataset.blockAdd){syncWelcomeBlocks();if(welcomeBlocks().length>=80){notify('Limite de 80 blocos por aula.');return;}welcomeBlocks().push({id:crypto.randomUUID(),type:target.dataset.blockAdd,title:'',text:'',src:''});refreshWelcomeEditor();return;}
    if(row&&(target.dataset.blockMove||target.hasAttribute('data-block-remove'))){syncWelcomeBlocks();const blocks=welcomeBlocks(),index=Number(row.dataset.blockIndex);if(target.hasAttribute('data-block-remove'))blocks.splice(index,1);else{const next=index+(target.dataset.blockMove==='up'?-1:1);if(next>=0&&next<blocks.length)[blocks[index],blocks[next]]=[blocks[next],blocks[index]];}refreshWelcomeEditor();return;}
    if(target.dataset.teacherCategory){teacherCategory=target.dataset.teacherCategory;renderRoute();return;}
    if(target.classList.contains('skip-link')){event.preventDefault();main.focus();main.scrollIntoView();return;}
    if(target.id==='help-button')help();
    if(target.id==='theme-toggle'){const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(theme);try{localStorage.setItem('sks-theme-v2',theme);}catch{notify('O tema foi alterado, mas não foi possível guardar a preferência neste navegador.');}}
    if(target.id==='course-info')courseInfo();
    if(target.id==='menu-toggle')setMenu(!sidebar.classList.contains('open'));
    if(target.id==='menu-close'){setMenu(false);document.getElementById('menu-toggle').focus();}
    if(target.matches('.dialog-close')||target.hasAttribute('data-close-dialog'))dialog.close();
    if(target.hasAttribute('data-export'))exportBackup();
    if(target.hasAttribute('data-refresh-review'))renderValidation();
    if(target.hasAttribute('data-legacy-editor')){
      const old=legacyEditor();openDialog(`<h2 id="dialog-title">Recuperar o editor anterior?</h2><p>Há ${Object.keys(old.content).length} aulas ajustadas e ${Object.keys(old.bonus).length} bônus no navegador anterior. A importação substituirá apenas os tópicos correspondentes do curso local atual. Nenhum registro antigo será apagado.</p><button class="button" data-confirm-editor-import>Recuperar materiais na Agência Escola</button>`);
    }
    if(target.hasAttribute('data-confirm-editor-import')){const old=legacyEditor();state.content={...state.content,...old.content};state.bonus={...state.bonus,...old.bonus};persist();dialog.close();renderRoute();notify('Materiais recuperados. Confira o status de salvamento no topo.');}
    if(target.hasAttribute('data-import'))document.getElementById('import-file').click();
    if(target.hasAttribute('data-bonus'))bonusDialog(Number(target.dataset.bonus));
    if(target.hasAttribute('data-edit-bonus'))bonusDialog(Number(target.dataset.editBonus),true);
    if(target.dataset.complete&&ready(target.dataset.complete)){const id=target.dataset.complete;state.completed=complete(id)?state.completed.filter(x=>x!==id):[...state.completed,id];if(persist()){renderLesson(id);notify(complete(id)?'Tópico concluído. Seu progresso foi salvo.':'Conclusão desmarcada. Você pode estudar este tópico novamente.');}}
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='catalog-search'){catalogQuery=event.target.value;catalogSections();}
    if(event.target.id==='lesson-notes'){state.notes[event.target.dataset.topic]=event.target.value;persist();}
  });
  document.addEventListener('change',event=>{
    if(event.target.matches('[data-block-upload]')){
      const input=event.target,file=input.files?.[0],row=input.closest('[data-block-index]');if(!file||!row)return;
      syncWelcomeBlocks();const block=welcomeBlocks()[Number(row.dataset.blockIndex)];
      const allowed=block.type==='video'?['video/mp4','video/webm']:block.type==='document'?['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']:['image/png','image/jpeg','image/webp'];
      const mime=file.type||(block.type==='document'&&file.name.toLowerCase().endsWith('.docx')?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'');
      if(!allowed.includes(mime)){notify('Formato de arquivo não permitido neste bloco.');input.value='';return;}
      (async()=>{try{
        const runtimeResponse=await fetch('/api/runtime',{credentials:'same-origin',cache:'no-store'});
        const runtime=runtimeResponse.ok?await runtimeResponse.json():null;
        if(runtime?.app!=='SKS'||runtime.lessonAssets!=='v1')throw new Error('O servidor SKS em execução é de uma versão anterior. Encerre-o e abra Iniciar-SKS.cmd na pasta atualizada.');
        const response=await fetch('/api/lesson-asset',{method:'POST',headers:{'Content-Type':mime},body:file,credentials:'same-origin'});
        const data=await response.json();if(response.status===404)throw new Error('O envio não existe no servidor em execução. Reinicie o SKS pela pasta atualizada.');
        if(!response.ok)throw new Error(data.error||'Falha no envio.');block.src=data.src;refreshWelcomeEditor();notify('Arquivo enviado. Salve a aula para vinculá-lo.');
      }catch(error){notify(error.message||'Não foi possível enviar o arquivo.');}finally{input.value='';}})();return;
    }
    if(event.target.id==='phase-filter'){phaseFilter=event.target.value;catalogSections();}
    if(event.target.id==='editor-module'){const m=moduleById(event.target.value);if(m)navigate('#conteudos/'+m.lessons[0].id);}
    if(event.target.id==='editor-topic')navigate('#conteudos/'+event.target.value);
    if(event.target.dataset.project){const id=event.target.dataset.project;state.project=event.target.checked?[...new Set([...state.project,id])]:state.project.filter(x=>x!==id);persist();event.target.closest('.deliverable').classList.toggle('done',event.target.checked);document.getElementById('project-score').innerHTML=`${state.project.length}/${curriculum.modules[24].lessons.length}<small>etapas preparadas</small>`;}
  });
  let draggedWelcomeBlock=-1;
  document.addEventListener('dragstart',event=>{const row=event.target.closest('.welcome-editor-block');if(!row)return;syncWelcomeBlocks();draggedWelcomeBlock=Number(row.dataset.blockIndex);event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(draggedWelcomeBlock));});
  document.addEventListener('dragover',event=>{if(draggedWelcomeBlock>=0&&event.target.closest('.welcome-editor-block'))event.preventDefault();});
  document.addEventListener('drop',event=>{const row=event.target.closest('.welcome-editor-block');if(!row||draggedWelcomeBlock<0)return;event.preventDefault();const blocks=welcomeBlocks(),target=Number(row.dataset.blockIndex);if(target!==draggedWelcomeBlock)blocks.splice(target,0,blocks.splice(draggedWelcomeBlock,1)[0]);draggedWelcomeBlock=-1;refreshWelcomeEditor();});
  document.addEventListener('dragend',()=>{draggedWelcomeBlock=-1;});
  document.addEventListener('submit',event=>{
    if(event.target.id==='lesson-editor'){
      event.preventDefault();const visual=welcomeTopic(selectedEditorTopic);if(visual)syncWelcomeBlocks();const blocks=visual?welcomeBlocks():null,pages=visual?visualLessonEditor?.getPages():null,body=visual?blocks.filter(block=>['text','box'].includes(block.type)).map(block=>'# '+(block.title||'Conteúdo da aula')+'\n\n'+(block.text||'')).join('\n\n'):document.getElementById('editor-body').value.trim(),raw=document.getElementById('editor-url').value.trim(),url=safeUrl(raw),duration=document.getElementById('editor-duration').value.trim();
      if(raw&&!url){notify('Use um link completo começando com https://.');return;}if(!body&&!url&&!(visual&&(blocks.some(block=>block.src)||pages?.some(page=>page.elements.length)))){notify('Insira texto, arquivo ou link antes de salvar.');return;}
      state.content[selectedEditorTopic]={body,url,duration,...(visual?{blocks:structuredClone(blocks),pages}:{})};if(persist()){navigate('#aula/'+selectedEditorTopic);notify('Material atualizado na tela. Confira a confirmação de salvamento no topo.');}
    }
    if(event.target.id==='bonus-form'){
      event.preventDefault();const body=document.getElementById('bonus-body').value.trim(),raw=document.getElementById('bonus-url').value.trim(),url=safeUrl(raw);if(raw&&!url){notify('Use um link começando com https://.');return;}if(!body&&!url){notify('Adicione um texto ou link ao material.');return;}
      state.bonus[event.target.dataset.bonusId]={body,url};if(persist()){dialog.close();renderLibrary();notify('Material salvo na biblioteca.');}
    }
  });
  document.getElementById('import-file').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{if(file.size>12000000)throw new Error();const backup=JSON.parse(await file.text());if(backup.version!==2||backup.formation!==curriculum.title||!backup.data||typeof backup.data!=='object')throw new Error();const incoming=validateState(backup.data);state=validateState({content:{...state.content,...incoming.content},bonus:{...state.bonus,...incoming.bonus},notes:{...state.notes,...incoming.notes},completed:[...state.completed,...incoming.completed],project:[...state.project,...incoming.project]});if(persist()){renderRoute();notify('Backup importado. Seus conteúdos estão disponíveis.');}}
    catch{notify('Arquivo inválido. Escolha um backup exportado deste portal SKS.');}finally{event.target.value='';}
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  window.addEventListener('hashchange',renderRoute);
  window.addEventListener('resize',()=>setMenu(sidebar.classList.contains('open')));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('open')){setMenu(false);document.getElementById('menu-toggle').focus();}});
  await renderRoute();
  const old=legacyEditor();
  if(Object.keys(old.content).length||Object.keys(old.bonus).length){const button=document.createElement('button');button.className='outline';button.dataset.legacyEditor='';button.textContent='Recuperar editor anterior';button.style.marginTop='12px';document.querySelector('.sidebar-footer').append(button);}
})().catch(error=>{const main=document.getElementById('main');if(main){main.textContent='Não foi possível abrir o editor: '+error.message;}});
