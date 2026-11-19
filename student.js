(async () => {
  'use strict';
  const api = window.SKSAccount;
  const user = await api.ensureStudent();
  if (!user) return;
  const isPreview = user.role === 'preview';
  const isObserver = api.readOnly === true;
  let formation;
  try{formation=window.SKSFormations?.open?await window.SKSFormations.open(user):{id:'agencia',name:'Agência Escola',curriculum:window.SKS_CURRICULUM,seed:window.SKS_LESSONS};}catch(error){document.getElementById('main').textContent=error.message;return;}
  const isAgency=formation.id==='agencia';
  if(!isAgency)document.title='Disciplinas — '+formation.name+' SKS';
  const formationProgress={};
  if(isAgency&&!isObserver&&api.loadFormationProgress)for(const entry of window.SKSFormations.entries.filter(e=>e.id!=='agencia'&&window.SKSFormations.allowed(e.id,user))){try{formationProgress[entry.id]=(await api.loadFormationProgress(entry.id)).state;}catch{}}
  const [saved, courseData] = await Promise.all([api.loadStudent(),api.loadCourse()]);
  const hubApi = window.SKSProjectHub;
  const curriculum = formation.curriculum, seed = formation.seed;
  const core = window.SKSStudentCore.create(curriculum, seed);
  const key = isAgency?'sks-student-preview-v1':'sks-student-'+formation.id+'-v1';
  const topics = curriculum.modules.flatMap(m => m.lessons), study = topics.filter(t => t.type !== 'deliverable');
  const finalModule = curriculum.modules.at(-1);
  const main = document.getElementById('main'), sidebar = document.getElementById('sidebar');
  const dialog = document.getElementById('dialog'), dialogBody = document.getElementById('dialog-body');
  const read = storageKey => {try {return JSON.parse(localStorage.getItem(storageKey) || 'null');} catch {return null;}};
  let state = core.validate(saved.state), materials = core.materialMap(courseData.data), revision = saved.revision;
  if (isObserver) {state.notes={};state.feedback={};document.body.dataset.observer='true';}
  let query = '', phase = '', supportQuery = '', toastTimer, saveTimer, dirty = false, saving = false, saveBlocked = false, inFlight = null, review = saved.review || null, observerSessionChanged=false, identityLost=false;
  if (saved.userId && saved.userId !== user.id) throw new Error('A conta mudou durante o carregamento. Entre novamente.');
  if(!isAgency){const crumb=document.querySelector('.breadcrumb');if(crumb?.firstChild)crumb.firstChild.textContent=formation.name.toUpperCase()+' ';}
  function renderIdentity() {
    const name=user.preferredName||user.name||'Aluno';
    document.getElementById('account-name').textContent = isPreview ? 'Prévia do aluno · sem login' : name;
    const avatar=document.getElementById('account-avatar'),rank=window.SKSStudentCore.agentLevel(curriculum,state,user);
    if(avatar){
      document.getElementById('profile-initials').textContent=name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]||'').join('').toLocaleUpperCase('pt-BR')||'S';
      document.getElementById('profile-name').textContent=isPreview?'Prévia do aluno':name;
      document.getElementById('profile-agent-level').textContent=rank.name;
      const offline=typeof navigator!=='undefined'&&navigator.onLine===false;
      const presence=isObserver?'observer':isPreview?'preview':offline?'offline':'online';
      const status=isObserver?'em consulta':isPreview?'prévia':offline?'offline':'online';
      avatar.dataset.presence=presence;avatar.dataset.agentLevel=String(rank.level);
      document.getElementById('profile-presence').textContent='';
      document.getElementById('profile-presence-dot').hidden=true;
      avatar.setAttribute('aria-label',(isObserver?'Ver conta de ':'Abrir minha conta: ')+name+'. '+rank.name+', nível '+rank.level+' de 6.');
      avatar.title=rank.name+' · Nível '+rank.level+' de 6 · '+rank.done+'/'+rank.total+' etapas concluídas. Clique para ver sua evolução.'+(isObserver?' Conta em consulta.':isPreview?' Progresso apenas nesta prévia.':'');
    }
  }
  document.addEventListener('mousemove',event=>{
    const robot=document.querySelector('.sks-disciplines .sks-agent-robot-3d');
    if(!robot||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const rect=robot.getBoundingClientRect(),dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height*.30);
    const angle=Math.max(-12,Math.min(12,dx/42)),tilt=Math.max(-5,Math.min(5,dy/90)),panX=Math.max(-4,Math.min(4,dx/120)),panY=Math.max(-2.5,Math.min(2.5,dy/180));
    robot.style.transform=`translate3d(${panX}px,${panY}px,0) rotate(${angle}deg) rotateX(${tilt}deg)`;
  });
  renderIdentity();
  // The nickname is optional profile data; never block the learning area on it.
  if(!isPreview&&typeof api.loadAccount==='function')api.loadAccount().then(record=>{
    if(record.user?.id!==user.id||observerSessionChanged||identityLost)return;
    user.preferredName=record.profile?.preferredName||'';renderIdentity();
  }).catch(()=>{});
  document.getElementById('teacher-link').hidden = user.role !== 'teacher';
  if(user.role==='teacher'&&!isAgency){const link=document.getElementById('teacher-link');link.href=window.SKSFormations.href(formation.id,'conteudos','index.html');link.textContent='Editar disciplinas ↗';}
  if (isPreview) {
    const loginBase=location.protocol==='file:'?'http://127.0.0.1:4173':location.origin;
    document.querySelector('.student-preview').innerHTML='<span>PRÉVIA SEM LOGIN <b>Para aparecer no painel do professor, entre na sua conta de aluno.</b></span><div class="button-row"><a href="'+loginBase+'/entrar.html?role=student&amp;next=%2Faluno.html">Entrar como aluno ↗</a><a href="'+loginBase+'/entrar.html?role=teacher&amp;next=%2Fprofessor.html">Professor ↗</a></div>';
    document.getElementById('account-logout').textContent='Entrar como aluno';
  }
  if (isObserver) {
    const banner=document.querySelector('.student-preview');
    banner.replaceChildren();
    const label=document.createElement('span'),name=document.createElement('b'),back=document.createElement('a');
    label.textContent='VISÃO DO PROFESSOR · SOMENTE LEITURA ';name.textContent=user.name+' · Nenhum progresso será alterado nesta visita.';label.append(name);
    back.href='professor.html';back.textContent='← Voltar ao professor';banner.append(label,back);
    document.getElementById('account-logout').textContent='Voltar ao professor';
  }
  document.getElementById('account-logout').addEventListener('click',async()=>{if(isObserver){await api.logout();return;}await flushSave(); if (!dirty && !saveBlocked) await api.logout(); else notify('Exporte seu progresso antes de sair: há alterações que não foram salvas.');});
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const topic = id => topics.find(t => t.id === id);
  const moduleFor = id => curriculum.modules.find(m => m.lessons.some(t => t.id === id));
  const completed = id => state.completed.includes(id);
  const ready = id => !!(materials.content[id]?.body.trim() || materials.content[id]?.url || (id==='module-1-topic-1'&&(materials.content[id]?.pages?.length||materials.content[id]?.blocks?.length)));
  const typeName = type => ({lesson:'Aula',activity:'Atividade prática',assessment:'Avaliação',deliverable:'Entregável'})[type];
  const doneCount = list => list.filter(t => completed(t.id)).length;
  const reviewed = id => state.reviewed.includes(id);
  const newLocalId = () => typeof crypto!=='undefined'&&crypto.randomUUID ? crypto.randomUUID() : 'local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function notify(message) {
    const toast = document.getElementById('toast');
    clearTimeout(toastTimer); toast.textContent = message; toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
  }
  function persist() {
    if (isObserver) return false;
    renderIdentity();
    dirty = true;
    if (!saveBlocked) saveStatus('Alterações pendentes…','saving');
    clearTimeout(saveTimer); saveTimer = setTimeout(flushSave,550);
    return true;
  }
  function saveStatus(message,status='saved') {
    if(isObserver){message='Somente leitura · '+(user.preferredName||user.name);status='readonly';}
    if(isPreview)message=message.replaceAll('na sua conta','neste navegador');
    const element=document.getElementById('save-state');
    element.textContent=message; element.dataset.status=status;
    const hubStatus=document.getElementById('hub-save-status'); if (hubStatus) hubStatus.textContent=message;
  }
  function flushSave() {
    if (isObserver) return Promise.resolve();
    clearTimeout(saveTimer);
    if (inFlight) return inFlight;
    if (!dirty || saveBlocked) return Promise.resolve();
    inFlight=(async()=>{
      saving=true;
      try {
      while (dirty) {
        dirty=false; saveStatus('Salvando na sua conta…','saving');
        const result=await api.saveStudent(core.validate(state),revision);
        revision=result.revision;
      }
      saveStatus('Salvo na sua conta');
    } catch(error) {
      dirty=true; saveBlocked=[401,403,409].includes(error.status);
      saveStatus(error.status===409?'Conflito entre abas · exporte antes de recarregar':'Não salvo · tente novamente','error');
      notify(error.message+' Seu rascunho continua nesta tela. Exporte um backup antes de recarregar.');
      } finally {saving=false;inFlight=null;}
    })();
    return inFlight;
  }
  function navigate(hash) {if (location.hash === hash) renderRoute(); else location.hash = hash;}
  function showDialog(body) {dialogBody.innerHTML = body; if(isObserver)dialogBody.querySelectorAll(mutationSelector).forEach(control=>{control.hidden=true;control.disabled=true;}); if (!dialog.open) dialog.showModal();}
  const mutationSelector='[data-import],[data-export],[data-save-now],[data-legacy],[data-confirm-legacy],[data-complete],[data-unsubmit],[data-review],[data-hub-submit],[data-hub-unsubmit],[data-formation-choice]';
  function enforceObserverReadOnly() {
    if (!isObserver) return;
    main.querySelectorAll(mutationSelector).forEach(control=>{control.hidden=true;control.disabled=true;});
    main.querySelectorAll('input,textarea,select').forEach(field=>{
      if (['catalog-search','phase-filter','study-query','fsSearchQuery'].includes(field.id)||field.hasAttribute('data-learning-search')) return;
      if (field.matches('textarea,input:not([type="checkbox"]):not([type="radio"])')) {field.readOnly=true;field.setAttribute('aria-readonly','true');}
      else field.disabled=true;
    });
    main.querySelectorAll('form:not(#study-search-form) button').forEach(button=>{button.hidden=true;button.disabled=true;});
    const hubStatus=document.getElementById('hub-save-status');if(hubStatus)hubStatus.textContent='Registros do aluno · consulta sem alterações';
    const responseStatus=document.getElementById('response-status');if(responseStatus)responseStatus.textContent=state.responses[responseStatus.closest('form')?.dataset.topic]?.submitted?'Resposta registrada pelo aluno.':'Rascunho do aluno, ainda não enviado.';
  }
  function renderText(text) {
    let result = '', paragraph = [], list = [];
    const flush = () => {
      if (paragraph.length) {result += `<p>${paragraph.map(escape).join('<br>')}</p>`; paragraph = [];}
      if (list.length) {result += `<ul>${list.map(x => `<li>${escape(x)}</li>`).join('')}</ul>`; list = [];}
    };
    for (const line of String(text || '').replace(/\r/g,'').split('\n')) {
      const heading = line.match(/^#{1,6}\s+(.+)$/), bullet = line.match(/^[-*]\s+(.+)$/);
      if (heading) {flush(); result += `<h2>${escape(heading[1])}</h2>`;}
      else if (bullet) {if (paragraph.length) flush(); list.push(bullet[1]);}
      else if (!line.trim()) flush();
      else {if (list.length) flush(); paragraph.push(line);}
    }
    flush(); return result;
  }
  function setMenu(open) {
    sidebar.classList.toggle('open',open);
    const hidden = matchMedia('(max-width:800px)').matches && !open;
    sidebar.inert = hidden;
    if (hidden) sidebar.setAttribute('aria-hidden','true'); else sidebar.removeAttribute('aria-hidden');
    document.getElementById('menu-toggle').setAttribute('aria-expanded',String(open));
  }
  function theme(value) {
    const dark = value === 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const button = document.getElementById('theme-toggle');
    button.setAttribute('aria-pressed',String(dark));
    button.setAttribute('aria-label',dark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
    button.querySelector('[data-theme-icon]').textContent = dark ? '☀' : '☾';
    button.querySelector('[data-theme-label]').textContent = dark ? 'Modo claro' : 'Modo escuro';
  }
  async function switchFormation(id,hash='formacao'){
    if(isObserver&&id!=='agencia'){notify('Esta formação não está disponível no modo de consulta.');return;}
    await flushSave();
    if(dirty||saveBlocked){notify('Aguarde o salvamento ou exporte seu progresso antes de trocar de formação.');return;}
    const url=new URL(window.SKSFormations.href(id,hash),location.href);
    const currentParams=new URLSearchParams(location.search);
    for(const param of ['aluno','preview'])if(currentParams.has(param))url.searchParams.set(param,currentParams.get(param));
    if(hash==='escolher-formacao')location.replace(url.href);else location.assign(url.href);
  }
  function home() {
    if(!isAgency){switchFormation('agencia','inicio');return;}
    main.innerHTML=window.SKSSchool.renderHome({curriculum,state,hub:state.hub,hubSummary:hubApi.summary(state.hub,curriculum),user,escape,formationProgress});
  }
  function catalogResults() {
    let count = 0;
    const q = normalize(query), groups = [...curriculum.phases,{id:'final',number:25,title:'PROJETO FINAL SKS'}];
    const sections = groups.filter(g => !phase || phase === g.id).map(g => {
      const modules = curriculum.modules.filter(m => m.phaseId === g.id && (!q || normalize(m.title+' '+m.lessons.map(t=>t.title).join(' ')).includes(q)));
      if (!modules.length) return ''; count += modules.length;
      return `<section class="catalog-section"><div class="module-grid">${modules.map(m => {
        const done = m.number===25?hubApi.summary(state.hub).submitted:doneCount(m.lessons), percent = Math.round(done/m.lessons.length*100);
        return `<a class="module-tile panel" href="#modulo/${m.id}"><div class="tile-top">MÓDULO ${String(m.number).padStart(2,'0')}<span>${done === m.lessons.length ? 'CONCLUÍDO' : done ? 'EM ANDAMENTO' : 'DISPONÍVEL'}</span></div><h3>${escape(m.title)}</h3><p>${escape(m.lessons.slice(0,3).map(t=>t.title).join(' · '))}</p><div class="meter"><i style="width:${percent}%"></i></div><div class="tile-bottom"><span>${done}/${m.lessons.length} ${m.number === 25 ? 'entregáveis' : 'tópicos'}</span><strong>↗</strong></div></a>`;
      }).join('')}</div></section>`;
    }).join('');
    document.getElementById('catalog-results').innerHTML = sections || '<div class="empty-state panel">Nenhum módulo encontrado. Tente outro assunto.</div>';
    document.getElementById('catalog-count').textContent = `${count} de ${curriculum.modules.filter(m=>m.phaseId===phase).length} módulos desta fase`;
  }
  function catalog() {
    phase='';query='';
    main.innerHTML=window.SKSSchool.renderDisciplines({curriculum,state,user,escape,formation});
  }
  function phasePage(id) {
    const selected=curriculum.phases.find(p=>p.id===id);
    if(!selected)return notFound();
    if(!isAgency){const m=curriculum.modules.find(m=>m.phaseId===id);if(m){location.hash='modulo/'+m.id;return;}}
    if(phase!==id)query='';
    phase=id;
    main.innerHTML=`<a class="back-link" href="#formacao">← Voltar às disciplinas</a><div class="page-heading"><p class="eyebrow">DISCIPLINAS · FASE ${String(selected.number).padStart(2,'0')}</p><h1>${escape(selected.title)}</h1><p>Escolha um módulo desta fase para acessar suas aulas.</p></div><div class="toolbar"><div class="search-field"><span>⌕</span><input id="catalog-search" type="search" aria-label="Buscar módulo ou assunto nesta fase" placeholder="Buscar nesta fase…" value="${escape(query)}"></div><select id="phase-filter" aria-label="Escolher outra fase">${curriculum.phases.map(p=>`<option value="${p.id}" ${p.id===id?'selected':''}>Fase ${p.number} · ${escape(p.title)}</option>`).join('')}</select></div><p class="subtext" id="catalog-count"></p><div id="catalog-results"></div>`;
    catalogResults();
  }
  function modulePage(id) {
    const m = curriculum.modules.find(x=>x.id===id); if (!m) return notFound();
    const done = doneCount(m.lessons);
    main.innerHTML = `<a class="back-link" href="${isAgency&&curriculum.phases.some(p=>p.id===m.phaseId)?'#fase/'+escape(m.phaseId):'#formacao'}">← ${isAgency?'Voltar aos módulos da fase':'Voltar às disciplinas'}</a><div class="page-heading"><p class="eyebrow">MÓDULO ${String(m.number).padStart(2,'0')}</p><h1>${escape(m.title)}</h1><p>${m.lessons.length} ${m.number === 25 ? 'entregáveis para integrar o aprendizado' : 'tópicos para estudar, praticar e avaliar'}.</p></div><div class="module-detail"><section class="lesson-list panel"><div class="topic-view-toolbar"><span>Tópicos do módulo</span><div role="group" aria-label="Visualização dos tópicos"><button type="button" data-topic-view="list" aria-pressed="true">Lista</button><button type="button" data-topic-view="grid" aria-pressed="false">Grade</button></div></div><div class="module-topics">${m.lessons.map((t,i)=>`<a class="lesson-row" href="#aula/${t.id}"><span class="lesson-order">${String(i+1).padStart(2,'0')}</span><span class="lesson-copy"><b>${escape(t.title)}</b><small><i class="status-dot ${completed(t.id) ? 'complete' : ready(t.id) ? 'ready' : ''}"></i>${typeName(t.type)} · ${completed(t.id) ? 'Concluído' : ready(t.id) ? 'Disponível' : 'Aguardando material'}</small></span><span>→</span></a>`).join('')}</div></section><aside class="module-side panel"><span class="tag">MEU MÓDULO</span><div class="stat-number">${Math.round(done/m.lessons.length*100)}%</div><p>${done} de ${m.lessons.length} tópicos concluídos</p><div class="meter"><i style="width:${done/m.lessons.length*100}%"></i></div><a class="button" href="#aula/${(m.lessons.find(t=>!completed(t.id)&&ready(t.id))||m.lessons[0]).id}">Estudar módulo →</a><button class="outline review-module" data-review="${m.id}">${reviewed(m.id) ? 'Módulo revisado ✓' : 'Marcar módulo como revisado'}</button><p class="subtext">A revisão é sua validação manual do conteúdo; não altera a conclusão das aulas.</p></aside></div>`;
    const topicsPanel = main.querySelector('.module-topics');
    const viewButtons = main.querySelectorAll('[data-topic-view]');
    function setView(view) {
      topicsPanel.classList.toggle('module-topics--grid', view === 'grid');
      viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.topicView === view)));
    }
    try { setView(localStorage.getItem('sks-module-topic-view') === 'grid' ? 'grid' : 'list'); } catch {}
    viewButtons.forEach(button => button.addEventListener('click', () => {
      setView(button.dataset.topicView);
      try { localStorage.setItem('sks-module-topic-view', button.dataset.topicView); } catch {}
    }));
  }
  function quizForm(id) {
    const questions = seed.quizzes[id], result = state.results[id];
    if (!questions?.length) return '<p class="subtext">As questões desta avaliação ainda precisam ser configuradas.</p>';
    return `<section class="practice-section"><h2>Teste o que você aprendeu</h2><p class="subtext">Escolha uma alternativa por pergunta. Aprovação de teste: 75% (3 de 4 acertos). Você pode tentar novamente.</p>${result ? `<div class="quiz-result ${result.passed ? 'passed' : 'retry'}" role="status"><b>${result.score}/${result.total} acertos · ${result.percent}%</b><span>${result.passed ? 'Avaliação aprovada nesta simulação.' : 'Revise as justificativas e tente novamente.'}</span></div>` : ''}<form id="quiz-form" data-topic="${id}">${questions.map((q,i)=>`<fieldset class="quiz-question"><legend>${i+1}. ${escape(q.question)}</legend>${q.options.map((option,j)=>`<label class="quiz-option"><input type="radio" name="q${i}" value="${j}" required ${result?.answers[i]===j ? 'checked' : ''}><span>${escape(option)}</span></label>`).join('')}${result ? `<div class="quiz-explanation ${result.answers[i] === q.correct ? 'correct' : 'incorrect'}"><b>${result.answers[i] === q.correct ? '✓ Resposta correta' : '↺ Resposta a revisar'}</b><p>Alternativa correta: ${escape(q.options[q.correct])}</p><p>${escape(q.explanation)}</p></div>` : ''}</fieldset>`).join('')}<button class="button" type="submit">${result ? 'Corrigir nova tentativa' : 'Corrigir avaliação'} ✓</button></form></section>`;
  }
  function activityForm(t) {
    const response = state.responses[t.id];
    return `<section class="practice-section"><h2>Registre sua atividade</h2><p class="subtext">Descreva sua proposta e seu raciocínio. A resposta fica salva na sua conta e pode ser acompanhada pelo professor local.</p><form id="response-form" data-topic="${t.id}"><div class="field"><label for="practice-response">Minha resposta</label><textarea id="practice-response" data-topic="${t.id}" required maxlength="20000" placeholder="Escreva sua resposta, decisões e próximos passos…">${escape(response?.body || '')}</textarea><small id="response-status">${response?.submitted ? 'Resposta registrada e tópico concluído.' : 'Rascunho salvo automaticamente. Registre abaixo para concluir.'}</small></div><button class="button" type="submit">Registrar resposta e concluir ✓</button>${response?.submitted ? `<button class="quiet" type="button" data-unsubmit="${t.id}">Reabrir como rascunho</button>` : ''}</form></section>`;
  }
  const welcomeLesson = body => window.SKSWelcomLesson.render(body,renderText,escape);
  function lessonPage(id) {
    const t = topic(id), m = moduleFor(id); if (!t || !m) return notFound();
    if (!isObserver && state.lastTopic !== id) {state.lastTopic = id; persist();}
    const item = materials.content[id] || {body:'',url:'',sources:[]};
    const index = topics.findIndex(x=>x.id===id), next = topics[index+1], previous = topics[index-1];
    main.innerHTML = `<a class="back-link" href="#modulo/${m.id}">← ${escape(m.title)}</a><div class="lesson-layout"><article class="reading-panel panel"><header><p class="eyebrow">MÓDULO ${String(m.number).padStart(2,'0')} · ${typeName(t.type).toUpperCase()}</p><h1>${escape(t.title)}</h1><small>${escape(item.duration || 'Estude no seu ritmo')} · ${item.custom ? 'Material ajustado no editor local' : 'Edição inicial para validação'}</small></header>${item.url ? `<a class="video-link" href="${escape(item.url)}" target="_blank" rel="noopener noreferrer"><span>Abrir vídeo ou material complementar</span><b>↗</b></a>` : ''}${item.body || item.blocks?.length || item.pages?.length ? `<div class="lesson-body">${id === 'module-1-topic-1' ? (item.pages?.length ? window.SKSVisualLesson.renderPages(item.pages) : item.blocks?.length ? window.SKSWelcomLesson.renderBlocks(item.blocks,renderText,escape) : welcomeLesson(item.body)) : renderText(item.body)}</div>` : !item.url ? '<div class="pending-content"><h2>Este tópico precisa de material.</h2><p>Informe isso no campo de revisão abaixo para ajustar o conteúdo no editor.</p></div>' : ''}
      ${item.sources?.length ? `<section class="lesson-sources"><h2>Referências complementares</h2><p>Consulte as orientações oficiais e confira mudanças antes de aplicar em um negócio real.</p>${item.sources.map(s=>`<a href="${escape(core.safeUrl(s.url))}" target="_blank" rel="noopener noreferrer">${escape(s.title)} ↗</a>`).join('')}</section>` : ''}
      ${t.type === 'assessment' ? quizForm(id) : t.type === 'activity' ? activityForm(t) : ''}
      ${isObserver?'<p class="subtext">O caderno privado e as observações pessoais não são exibidos na visão do professor.</p>':`<div class="notes-field"><label for="lesson-notes">Meu caderno de anotações</label><textarea id="lesson-notes" data-topic="${id}" maxlength="50000" placeholder="Ideias, dúvidas e aprendizados…">${escape(state.notes[id] || '')}</textarea><small>Caderno privado, salvo na sua conta local.</small></div><details class="lesson-review"><summary>Revisão para o lançamento: algo precisa mudar?</summary><div class="notes-field"><label for="lesson-feedback">Observações sobre esta aula</label><textarea id="lesson-feedback" data-topic="${id}" maxlength="50000" placeholder="Anote erros, dúvidas, exemplos que faltam ou melhorias…">${escape(state.feedback[id] || '')}</textarea><small>Suas observações podem ser acompanhadas pelo professor.</small></div></details>`}
      <div class="lesson-footer"><span class="subtext">${completed(id) ? 'Tópico concluído ✓' : 'Tópico em estudo'}</span><div class="button-row">${t.type === 'lesson' ? `<button class="button" data-complete="${id}" ${!ready(id) ? 'disabled' : ''}>${completed(id) ? 'Reabrir aula' : 'Concluir aula'} ✓</button>` : ''}${next ? `<a class="outline" href="#aula/${next.id}">Próximo tópico →</a>` : '<a class="outline" href="#progresso">Ver meu progresso →</a>'}</div></div>${previous ? `<a class="back-link previous-topic" href="#aula/${previous.id}">← Tópico anterior</a>` : ''}</article><aside class="reader-toc panel"><h3>Neste módulo</h3><div class="toc-links">${m.lessons.map((x,i)=>`<a href="#aula/${x.id}" class="${x.id === id ? 'active' : ''}" ${x.id === id ? 'aria-current="page"' : ''}>${completed(x.id) ? '✓' : String(i+1).padStart(2,'0')} · ${escape(x.title)}</a>`).join('')}</div><a class="quiet module-overview-link" href="#modulo/${m.id}">Ver resumo do módulo →</a></aside></div>`;
  }
  function projectPage(sectionId) {
    main.innerHTML=window.SKSStudentOperation.render({curriculum,state,user,materials,review,readOnly:isObserver},sectionId?'editar-'+sectionId:'visao');
  }
  function library() {
    main.innerHTML = `<div class="page-heading"><p class="eyebrow">FERRAMENTAS PARA APLICAR</p><h1>Biblioteca & bônus</h1><p>14 recursos textuais iniciais: modelos, checklists e roteiros para adaptar ao seu projeto.</p></div><div class="resource-grid">${curriculum.bonuses.map((b,i)=>`<article class="resource panel"><span class="tag">RECURSO TEXTUAL</span><h3>${escape(b)}</h3><p>Material de apoio para estudo e validação. Grupos, contratos e serviços não são ativados por esta prévia.</p><button class="quiet" data-bonus="${i}">Abrir material →</button></article>`).join('')}</div>`;
  }
  function bonusDialog(index) {
    if (!Number.isInteger(index) || index < 0 || index >= curriculum.bonuses.length) return;
    const item = materials.bonus['bonus-'+index] || {};
    showDialog(`<p class="eyebrow">BIBLIOTECA & BÔNUS</p><h2 id="dialog-title">${escape(curriculum.bonuses[index])}</h2><div class="lesson-body">${renderText(item.body || 'Material ainda em preparação.')}</div>${item.url ? `<a class="button" target="_blank" rel="noopener noreferrer" href="${escape(item.url)}">Abrir complemento ↗</a>` : ''}`);
  }
  function progressPage() {
    const done = doneCount(study), passed = Object.values(state.results).filter(r=>r.passed).length;
    main.innerHTML = `<div class="page-heading split"><div><p class="eyebrow">MEUS REGISTROS LOCAIS</p><h1>Meu progresso</h1><p>${isAgency?'Seus registros ficam separados por conta e ligados ao seu hub do cliente.':'Seus registros pertencem exclusivamente à Loja Escola.'}</p></div><div class="button-row"><button class="outline" data-import>Importar progresso ↑</button><button class="outline" data-export>Exportar progresso ↓</button></div></div><div class="validation-stats"><div class="panel"><b>${done}/${study.length}</b><span>tópicos de estudo</span></div><div class="panel"><b>${passed}/${study.filter(t=>t.type==='assessment').length}</b><span>avaliações aprovadas</span></div><div class="panel"><b>${isAgency?hubApi.summary(state.hub).submitted:doneCount(finalModule.lessons)}/${isAgency?17:finalModule.lessons.length}</b><span>${isAgency?'entregáveis para revisão':'tópicos de certificação'}</span></div><div class="panel"><b>${state.reviewed.length}/${curriculum.modules.length}</b><span>módulos revisados por você</span></div></div><div class="catalog-note"><span>◔</span><div><b>Guarde seu progresso</b><br>Os dados ficam na sua conta, no banco deste computador. Exporte seu progresso para guardar uma cópia. Este MVP ainda não oferece sincronização online ou emissão formal de certificados.</div></div><div class="section-heading"><h2>Módulos e avaliações</h2></div><section class="progress-module-list panel">${curriculum.modules.map(m=>{
      const assessment = m.lessons.find(t=>t.type === 'assessment'), result = assessment && state.results[assessment.id], count = m.number===25?hubApi.summary(state.hub).submitted:doneCount(m.lessons);
      return `<div class="progress-module"><div><a href="#modulo/${m.id}">${String(m.number).padStart(2,'0')} · ${escape(m.title)}</a><span>${count}/${m.lessons.length} tópicos · ${reviewed(m.id) ? 'Revisado ✓' : 'Revisão pendente'}</span></div><div class="module-grade">${assessment ? `<a href="#aula/${assessment.id}">${result ? result.score+'/'+result.total+' · '+result.percent+'% · '+(result.passed ? 'Aprovado' : 'Revisar') : 'Fazer avaliação →'}</a>` : isAgency?`${count}/17 entregáveis para revisão`:`${count}/${m.lessons.length} tópicos registrados`}</div></div>`;
    }).join('')}</section>`;
  }
  function info() {
    showDialog(`<p class="eyebrow">SOBRE ESTA EDIÇÃO</p><h2 id="dialog-title">${escape(formation.name)}</h2><p>${isAgency?'9 fases, 25 módulos, 301 tópicos de estudo e 17 entregáveis finais.':curriculum.modules.length+' módulos e '+study.length+' tópicos de estudo.'}</p><div class="dialog-list"><div><b>Primeira versão textual para revisão</b>${escape(seed.origin)}</div><div><b>Carga horária planejada</b>${escape(curriculum.workload)} na grade; ainda precisa ser validada com o tempo real de estudo e prática.</div><div><b>Sem publicação ou certificação</b>Há contas locais, progresso por aluno e acompanhamento pelo professor neste computador. Vídeos hospedados, IA generativa e emissão formal de certificados ficam para a próxima etapa.</div></div><p>Você pode estudar todo o material inicial, responder aos testes e registrar atividades. Revise a qualidade pedagógica antes do lançamento.</p>`);
  }
  function help() {
    showDialog(`<p class="eyebrow">COMO ESTUDAR</p><h2 id="dialog-title">Da leitura à prática</h2><div class="dialog-list"><div><b>1. Comece pela formação</b>Abra um módulo, leia a aula e realize a prática proposta no seu projeto.</div><div><b>2. Registre o aprendizado</b>Use seu caderno. As atividades possuem campo de resposta. Os 17 entregáveis são construídos nos quadros do hub do cliente e marcados separadamente para revisão; isso não representa aprovação.</div><div><b>3. Faça as avaliações</b>Há quatro perguntas por módulo. Acerte pelo menos três para concluir a avaliação; veja as justificativas e tente novamente quando precisar.</div><div><b>4. Valide antes do lançamento</b>Em cada aula, abra Revisão para o lançamento e anote melhorias. No resumo do módulo, marque-o como revisado quando terminar a conferência.</div><div><b>5. Exporte seu progresso</b>O backup do aluno guarda anotações, respostas, notas e observações, sem modificar o editor.</div></div><div class="button-row"><a class="button" href="#formacao" data-close-dialog>Explorar formação →</a><button class="outline" data-export>Exportar progresso</button></div>`);
  }
  function notFound() {
    main.innerHTML = '<section class="empty-state panel"><h2>Escolha um conteúdo da formação.</h2><p>Esta é a área do aluno. A edição dos conteúdos fica no ambiente do criador.</p><a class="button" href="#formacao">Ver formação →</a></section>';
  }
  function accountPage() {
    if (!window.SKSStudentAccount?.render) {main.innerHTML='<section class="panel empty-state"><h1>Minha conta</h1><p>Recarregue a plataforma para carregar esta área.</p></section>';return;}
    window.SKSStudentAccount.render({target:main,user,state,curriculum,api,isPreview,isObserver,onUserUpdated:updated=>{Object.assign(user,updated);renderIdentity();},notify});
  }
  function observerSessionNotice() {
    if(dialog.open)dialog.close();
    main.innerHTML='<section class="empty-state panel"><h1>A sessão do professor mudou.</h1><p>O acesso aos registros do aluno foi interrompido. Volte ao painel e entre como professor para continuar a consulta.</p><a class="button" href="professor.html">Voltar ao painel do professor</a></section>';
    const status=document.getElementById('save-state');status.textContent='Sessão do professor alterada';status.dataset.status='error';
  }
  function studentSessionNotice() {
    if(dialog.open)dialog.close();
    dialogBody.replaceChildren();
    main.innerHTML='<section class="empty-state panel"><h1>A conta foi alterada em outra aba.</h1><p>Seu rascunho não será salvo em outra conta. Exporte uma cópia antes de sair. Para professor e aluno simultâneos, use uma janela anônima ou outro perfil do navegador.</p><div class="button-row"><button class="button" data-export>Exportar meu rascunho</button><a class="outline" href="entrar.html?role=student&amp;next=%2Faluno.html">Ir para o login do aluno</a></div></section>';
    saveStatus('Conta alterada · edição bloqueada','error');
  }

  function learningContext() {
    return {main,curriculum,state,user,formation,materials,review,isObserver,isPreview,hub:hubApi,ready,
      phaseCovers:curriculum.phases.map((_,i)=>'assets/learning/phase-'+(i+1)+'.webp'),
      safeUrl:value=>core.safeUrl(value)||(/^\/api\/lesson-asset\/[a-f0-9-]{36}$/.test(String(value||''))?value:'')};
  }
  function mountLearning(route,id) {
    if(!window.SKSLearning||!isAgency)return;
    const allowed=['formacao','fase','modulo','aula'].includes(route);
    const module=route==='aula'?moduleFor(id):curriculum.modules.find(m=>m.id===id);
    const active=allowed&&module?.number!==25&&!(route==='formacao'&&id&&id!==formation.id)&&!(route==='fase'&&!curriculum.phases.some(p=>p.id===id))&&!(['aula','modulo'].includes(route)&&!module);
    if(!active){main.classList.remove('sks-learning');delete main.dataset.learningModule;return;}
    window.SKSLearning.mount(learningContext(),route,id);
    const nav=document.querySelector('.sidebar [data-nav="formacao"]');
    if(nav&&nav.lastChild?.nodeType===3)nav.lastChild.textContent='Disciplina';
    const title=document.getElementById('page-title');if(title)title.textContent=module?module.title:'Aulas e Trilhas';
  }
  async function learningGo({hash,tab,section}) {
    await flushSave();
    if(dirty||saveBlocked){notify('Aguarde o salvamento ou exporte seus dados antes de trocar de aba.');return;}
    const url=new URL(location.href);
    url.searchParams.delete('aba');url.searchParams.delete('secao');
    if(tab)url.searchParams.set('aba',tab);
    if(section)url.searchParams.set('secao',section);
    url.hash=hash;
    history.pushState(null,'',url.pathname+url.search+url.hash);
    renderRoute();
  }
  function learningTab(tab,section) {
    const module=curriculum.modules.find(m=>m.id===main.dataset.learningModule);
    if(!module||module.number===25)return;
    const type=({conteudo:'lesson',pratica:'activity',avaliacao:'assessment'})[tab];
    const current=topic(location.hash.slice(1).split('/')[1]);
    const selected=type&&(current?.type===type&&module.lessons.some(t=>t.id===current.id)?current:module.lessons.find(t=>t.type===type));
    const hash=section&&current?'#aula/'+current.id:selected?'#aula/'+selected.id:'#modulo/'+module.id;
    learningGo({hash,tab,section}).catch(error=>notify(error.message));
  }
  function renderRoute() {
    if(identityLost){studentSessionNotice();return;}
    if(isObserver&&observerSessionChanged){observerSessionNotice();return;}
    renderIdentity();
    let raw=location.hash.slice(1)||'formacao';
    if(raw==='inicio'){history.replaceState(null,'',location.pathname+location.search+'#formacao');raw='formacao';}
    // Keep links from the reverted central usable without restoring that extra area.
    if(raw.startsWith('/')||/^(dashboard|jornadas|formacoes|meu-progresso)([/?]|$)/.test(raw)){
      const oldRoute=raw.replace(/^\//,'').split(/[/?]/)[0];
      raw=({formacoes:'escolher-formacao','meu-progresso':'progresso',conta:'conta',certificados:'certificados',eventos:'agenda',comunidade:'comunidade',downloads:'biblioteca','ia-sks':'assistente','operacao-sks':'projeto'})[oldRoute]||'inicio';
    }
    let [route,id] = raw.split('/');
    if(isAgency&&route==='modulo'&&id!=='module-25'){
      const unit=curriculum.modules.find(m=>m.id===id);
      const items=unit?.lessons||[];
      const tab=new URLSearchParams(location.search).get('aba');
      const preferred=tab==='avaliacao'?'assessment':tab==='pratica'?'activity':null;
      const entry=items.find(t=>t.type===preferred)||items.find(t=>t.id===state.lastTopic)||items.find(t=>!state.completed.includes(t.id))||items[0];
      if(entry){route='aula';id=entry.id;history.replaceState(null,'',location.pathname+location.search+'#aula/'+id);}
    }
    if(route==='formacao'&&id&&window.SKSFormations.allowed(id,user)&&id!==formation.id){switchFormation(id);return;}
    if(!isAgency&&['inicio','conta','projeto','operacao','escolher-formacao'].includes(route)){switchFormation('agencia',route);return;}
    if(route==='escolher-formacao'){
      const catalogUrl=new URL(location.href);
      catalogUrl.searchParams.delete('aba');catalogUrl.searchParams.delete('secao');catalogUrl.hash='escolher-formacao';
      if(catalogUrl.href!==location.href)history.replaceState(null,'',catalogUrl.href);
      document.title='Formações — SKS';
    }else if(document.title==='Formações — SKS'){document.title='Disciplina — '+formation.name+' SKS';}
    const searchButton=document.getElementById('formation-search');
    if(searchButton)searchButton.hidden=route!=='escolher-formacao';
    main.classList.toggle('has-formation-overview',route==='escolher-formacao');
    if(route==='modulo'&&id==='module-25'){location.hash='projeto';return;}
    const labels = {inicio:'Minha Jornada SKS',formacao:'Disciplina','escolher-formacao':'Formações',fase:'Módulos da fase',modulo:formation.name,aula:formation.name,projeto:'Projeto final · Hub',biblioteca:'Biblioteca & bônus',progresso:'Progresso e relatórios',certificados:'Certificados',assistente:'Apoio de estudo',agenda:'Minha agenda',comunidade:'Comunidade SKS',conta:'Minha conta'};
    document.getElementById('page-title').textContent = route==='formacao'&&id?(window.SKSFormationJourney.catalog.find(item=>item.id===id)?.name||'Formação'):['operacao','projeto'].includes(route)?'Hub do Cliente':labels[route] || 'Meu aprendizado';
    const nav = route==='operacao'?'projeto':['fase','modulo','aula'].includes(route) ? 'formacao' : route;
    document.querySelectorAll('[data-nav]').forEach(a=>{a.classList.toggle('active',a.dataset.nav===nav); if (a.dataset.nav===nav) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');});
    setMenu(false); if (dialog.open) dialog.close();
    const ctx={curriculum,state,user,formation,formationProgress,materials,review,readOnly:isObserver,hubSummary:hubApi.summary(state.hub,curriculum)};
    ({inicio:home,formacao:()=>{if(id===formation.id||!id)catalog();else main.innerHTML=window.SKSSchool.renderFormationDetail(ctx,id);},'escolher-formacao':()=>window.SKSFormationOverview.mount(main,ctx),fase:()=>phasePage(id),modulo:()=>id==='module-25'?projectPage():modulePage(id),aula:()=>lessonPage(id),projeto:()=>projectPage(id),operacao:()=>{main.innerHTML=window.SKSStudentOperation.render(ctx,id);},biblioteca:library,progresso:progressPage,conta:accountPage,
      certificados:()=>{main.innerHTML=window.SKSStudentTools.renderCertificates(ctx);},assistente:()=>{main.innerHTML=window.SKSStudentTools.renderAssist(ctx,supportQuery);},agenda:()=>{main.innerHTML=window.SKSStudentTools.renderAgenda(state);},comunidade:()=>{main.innerHTML=window.SKSStudentTools.renderCommunity();}}[route] || notFound)();
    if (isAgency && ['modulo','aula'].includes(route) && id!=='module-25') {
      const m=route==='aula'?moduleFor(id):curriculum.modules.find(m=>m.id===id);
      if (m) {
        const connection=route==='aula'&&topic(id)?.type==='deliverable'?hubApi.deliverableCta(id,state.hub,escape):hubApi.moduleCta(m.number,state.hub,escape);
        const anchor=route==='aula'?main.querySelector('.practice-section,.notes-field'):main.querySelector('.module-detail');
        if (anchor) anchor.insertAdjacentHTML('beforebegin',connection);
      }
    }
    if (route==='progresso') {
      const seconds=Object.values(state.learningSeconds).reduce((sum,n)=>sum+n,0);
      main.insertAdjacentHTML('beforeend',`<section class="source-card panel"><div><b>Tempo de estudo registrado: ${Math.floor(seconds/3600)}h ${Math.floor(seconds/60)%60}min</b><p>Conta apenas aulas abertas com a página visível e em foco. Não comprova a carga horária planejada.</p></div><div class="button-row"><button class="outline" data-report>Baixar relatório</button><button class="outline" data-save-now>Tentar salvar agora</button>${read(key)?'<button class="outline" data-legacy>Recuperar prévia antiga</button>':''}</div></section>`);
    }
    mountLearning(route,id);
    if(isPreview){
      if(route==='aula'){
        const practice=main.querySelector('.practice-section:has(#response-form) > .subtext');
        if(practice)practice.textContent='Descreva sua proposta e seu raciocínio. A resposta fica apenas nesta prévia do navegador, sem envio ao professor.';
        const feedback=main.querySelector('.lesson-review small');
        if(feedback)feedback.textContent='Observações guardadas apenas nesta prévia. Exporte seu progresso para manter uma cópia.';
      }
      const privateLabel=document.querySelector('label[for="lesson-notes"]+textarea+small');
      if(privateLabel)privateLabel.textContent='Salvo só nesta prévia do navegador. Use Exportar progresso para guardar uma cópia.';
      if(route==='progresso'){
        const intro=main.querySelector('.page-heading p:not(.eyebrow)');if(intro)intro.textContent='Seu estudo e seu hub ficam guardados nesta prévia do navegador.';
        const note=main.querySelector('.catalog-note');if(note)note.innerHTML='<span>◔</span><div><b>Prévia sem login</b><br>O progresso e o hub ficam neste navegador e endereço. Não são enviados ao professor ou às contas. Exporte uma cópia antes de limpar os dados.</div>';
      }
      if(route==='assistente'){
        const note=main.querySelector('#question-form .subtext');if(note)note.textContent='Na prévia, a dúvida é guardada só neste navegador; não é enviada ao professor. As contas são uma opção separada.';
      }
      if(route==='projeto'){
        const info=main.querySelector('.hub-info');if(info)info.insertAdjacentHTML('beforeend',' <b>Você está na prévia sem login: os rascunhos não são enviados a contas ou professores.</b>');
      }
    }
    if(isObserver){
      const note=main.querySelector('.catalog-note');if(note)note.innerHTML='<span>◎</span><div><b>Consulta do professor</b><br>Os registros exibidos pertencem ao aluno selecionado. Navegar por esta área não altera aulas, tempo de estudo ou entregas.</div>';
      const intro=main.querySelector('#hub-form .hub-form-intro');if(intro)intro.textContent='Conteúdo registrado pelo aluno. Estes campos estão disponíveis apenas para consulta.';
      enforceObserverReadOnly();
    }
    window.scrollTo(0,0);
  }
  function exportProgress() {
    if(isObserver){notify('Use Baixar relatório para consultar os registros visíveis do aluno.');return;}
    const blob = new Blob([JSON.stringify({version:1,scope:'sks-student-preview',formation:curriculum.title,exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = isAgency?'formacao-sks-progresso-aluno.json':'loja-escola-progresso.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    notify('Backup do aluno preparado. Guarde o arquivo para recuperar seus registros.');
  }
  function downloadJson(data,name) {
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function applyHubForm(form,quiet=false) {
    if(isObserver)return false;
    const fields=Object.fromEntries(new FormData(form).entries()),result=hubApi.update(state.hub,fields);
    state.hub=result.hub; persist();
    const errors=Array.isArray(result.errors)?result.errors:Object.values(result.errors||{});
    if (errors.length && !quiet) notify(errors.join(' '));
    return errors.length===0;
  }
  document.addEventListener('click',event=>{
    const target = event.target.closest('button,a'); if (!target) return;
    if(isObserver&&observerSessionChanged&&target.matches('[data-hub-report],[data-report],[data-bonus]')){event.preventDefault();return;}
    if (isObserver&&target.matches(mutationSelector)) {event.preventDefault();notify('Visão do professor: este ambiente é somente leitura.');return;}

    if(window.SKSLearning&&isAgency&&main.classList.contains('sks-learning')){
      if(target.dataset.learningTab){event.preventDefault();learningTab(target.dataset.learningTab);return;}
      if(target.dataset.learningSection){event.preventDefault();const ctx=learningContext(),currentTopic=topic(location.hash.slice(1).split('/')[1]);const tab=window.SKSLearning.tabFor({...ctx,topic:currentTopic});learningTab(['pratica','projeto'].includes(tab)?tab:'projeto',target.dataset.learningSection);return;}
      const href=target.getAttribute('href');
      if(target.tagName==='A'&&/^#(aula|modulo|fase|formacao)(\/|$)/.test(href||'')&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey){
        event.preventDefault();const [route,id]=href.slice(1).split('/');const selected=route==='aula'?topic(id):null;
        const tab=selected?.type==='activity'?'pratica':selected?.type==='assessment'?'avaliacao':null;
        learningGo({hash:href,tab}).catch(error=>notify(error.message));return;
      }
    }
    if (target.classList.contains('skip-link')) {event.preventDefault(); main.focus(); main.scrollIntoView(); return;}
    if (target.id==='help-button') help();
    if (target.id==='course-info') info();
    if (target.id==='menu-toggle') setMenu(!sidebar.classList.contains('open'));
    if (target.id==='menu-close') {setMenu(false); document.getElementById('menu-toggle').focus();}
    if (target.id==='theme-toggle') {const value=document.documentElement.dataset.theme==='dark'?'light':'dark'; theme(value); try {localStorage.setItem('sks-theme-v2',value);} catch {notify('Tema alterado; a preferência não pôde ser salva.');}}
    if (target.matches('.dialog-close') || target.hasAttribute('data-close-dialog')) dialog.close();
    if (target.hasAttribute('data-bonus')) bonusDialog(Number(target.dataset.bonus));
    if (target.hasAttribute('data-export')) exportProgress();
    if (target.hasAttribute('data-import')) document.getElementById('import-file').click();
    if (target.hasAttribute('data-save-now')) flushSave();
    if (target.hasAttribute('data-report')) downloadJson({formation:curriculum.title,student:user.name,generatedAt:new Date().toISOString(),modules:curriculum.modules.map(m=>({number:m.number,title:m.title,completed:m.number===25?hubApi.summary(state.hub).submitted:doneCount(m.lessons),total:m.lessons.length,status:m.number===25?'entregáveis para revisão':'tópicos registrados'})),assessments:state.results,hub:hubApi.summary(state.hub,curriculum),learningSeconds:state.learningSeconds},'relatorio-estudo-sks.json');
    if(target.dataset.formationChoice) {
      const journey=window.SKSFormationJourney,id=target.dataset.formationChoice;
      if(!window.SKSFormations.studentIds.includes(id)||!window.SKSFormations.allowed(id,user))return;
      if(!journey.canChoose(curriculum,state)){notify('Conclua as etapas da Agência Escola antes de escolher outra formação.');return;}
      const choices=journey.validateChoices([...(state.formationChoices||[]),id]);
      if(choices.length===(state.formationChoices||[]).length)return;
      state.formationChoices=choices;persist();flushSave();navigate('#formacao');notify('Formação adicionada à sua jornada. Acompanhe o salvamento no topo.');
    }
    if (target.hasAttribute('data-operation-banca')) main.querySelector('#sop-banca')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    if (target.hasAttribute('data-hub-download')) {
      if(identityLost||observerSessionChanged){event.preventDefault();return;}
      const html='<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Registros do projeto</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;line-height:1.7;overflow-wrap:anywhere}section{border-top:1px solid #ddd;padding:16px 0}h3{font-size:16px}p{white-space:pre-wrap}</style>'+hubApi.reportHtml(state.hub,{escape,curriculum})+'</html>';
      const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'})),a=document.createElement('a');
      a.href=url;a.download='hub-do-cliente-registros.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      notify('Registros do projeto preparados para download.');
    }
    if (target.hasAttribute('data-hub-report')) showDialog(`<h2 id="dialog-title">Meu hub do cliente</h2>${hubApi.reportHtml(state.hub,{escape,curriculum})}<p class="subtext">Seus registros completos também estão em Exportar progresso, na área de relatórios.</p><button class="outline" data-export>Exportar meu progresso e hub</button>`);
    if (target.dataset.hubSubmit) {
      const form=document.getElementById('hub-form'); if (form&&!applyHubForm(form)) return;
      const result=hubApi.submit(state.hub,target.dataset.hubSubmit);
      if (!result.ok) {notify('Preencha antes: '+result.missing.join(', '));return;}
      state.hub=result.hub; persist(); renderRoute(); notify(isPreview?'Entregável marcado apenas nesta prévia, sem envio ao professor.':'Entregável marcado para revisão do professor. Isso não emite nota ou certificado.');
    }
    if (target.dataset.hubUnsubmit) {state.hub=hubApi.unsubmit(state.hub,target.dataset.hubUnsubmit);persist();renderRoute();notify('Entregável reaberto como rascunho.');}
    if (target.dataset.searchTerm) {supportQuery=target.dataset.searchTerm;renderRoute();}
    if (target.hasAttribute('data-legacy')) showDialog('<h2 id="dialog-title">Recuperar registros anteriores?</h2><p>Isso copia o progresso da prévia antiga deste navegador para a conta atual. Use somente se os registros antigos forem seus. O material antigo será preservado como está.</p><button class="button" data-confirm-legacy>Importar na minha conta atual</button>');
    if (target.hasAttribute('data-confirm-legacy')) {const old=core.validate(read(key));state=core.validate({...state,...old,formationChoices:state.formationChoices,hub:state.hub,agenda:state.agenda,questions:state.questions,notes:{...state.notes,...old.notes},completed:[...state.completed,...old.completed]});persist();dialog.close();renderRoute();notify('Registros antigos recuperados na conta atual.');}
    if (target.dataset.complete && topic(target.dataset.complete)?.type==='lesson' && ready(target.dataset.complete)) {
      const id=target.dataset.complete; state.completed=completed(id)?state.completed.filter(x=>x!==id):[...state.completed,id];
      if (persist()) {renderRoute(); notify(completed(id)?'Aula concluída. Acompanhe o salvamento no topo.':'Aula reaberta para estudar novamente.');}
    }
    if (target.dataset.unsubmit && state.responses[target.dataset.unsubmit]) {
      const id=target.dataset.unsubmit; state.responses[id].submitted=false; state.completed=state.completed.filter(x=>x!==id);
      if (persist()) {renderRoute(); notify('Resposta reaberta como rascunho.');}
    }
    if (target.dataset.review && curriculum.modules.some(m=>m.id===target.dataset.review)) {
      const id=target.dataset.review; state.reviewed=reviewed(id)?state.reviewed.filter(x=>x!==id):[...state.reviewed,id];
      if (persist()) {renderRoute(); notify(reviewed(id)?'Módulo marcado como revisado no painel do criador.':'Revisão do módulo desmarcada.');}
    }
  });
  document.addEventListener('input',event=>{
    const field=event.target, id=field.dataset.topic;
    if (field.id==='catalog-search') {query=field.value; catalogResults();}
    if (isObserver) return;
    if (field.hasAttribute('data-hub-field')) {
      const result=hubApi.update(state.hub,{[field.name]:field.value});
      field.setCustomValidity(result.errors.join(' '));field.setAttribute('aria-invalid',String(result.errors.length>0));
      if(result.errors.length){saveStatus('Link inválido · use HTTPS','error');return;}
      state.hub=result.hub;persist();
    }
    if (field.id==='lesson-notes' && topic(id)) {state.notes[id]=field.value; persist();}
    if (field.id==='lesson-feedback' && topic(id)) {state.feedback[id]=field.value; persist();}
    if (field.id==='practice-response' && ['activity','deliverable'].includes(topic(id)?.type)) {
      state.responses[id]={body:field.value,submitted:false}; state.completed=state.completed.filter(x=>x!==id); persist();
      document.getElementById('response-status').textContent='Rascunho alterado. Registre novamente para concluir.';
      const unsubmit=document.querySelector('[data-unsubmit]'); if (unsubmit) unsubmit.remove();
      const status=document.querySelector('.lesson-footer > .subtext'); if (status) status.textContent='Tópico em estudo';
    }
  });
  document.addEventListener('change',event=>{
    const field=event.target;
    if (field.id==='phase-filter') navigate('#fase/'+field.value);
    if (isObserver) return;
    if (field.dataset.agendaDone) {const item=state.agenda.find(x=>x.id===field.dataset.agendaDone);if(item){item.done=field.checked;persist();field.closest('.deliverable').classList.toggle('done',field.checked);}}
    if (field.dataset.project && finalModule.lessons.some(t=>t.id===field.dataset.project)) {
      const id=field.dataset.project; state.project=field.checked?[...new Set([...state.project,id])]:state.project.filter(x=>x!==id);
      persist(); field.closest('.deliverable').classList.toggle('done',field.checked); document.getElementById('prepared-count').textContent=state.project.length;
    }
  });
  document.addEventListener('submit',event=>{
    const form=event.target, id=form.dataset.topic;
    if (isObserver&&form.id!=='study-search-form') {event.preventDefault();notify('Visão do professor: não é possível alterar os registros do aluno.');return;}
    if (form.id==='hub-brand-form') {
      event.preventDefault();
      const data=new FormData(form),result=window.SKSStudentOperation.updateBrand(state.hub.fields.visual_system,{logo:String(data.get('logo')||'').trim(),cover:String(data.get('cover')||'').trim(),accent:String(data.get('accent')||'').trim()});
      if(result.error){notify(result.error);return;}
      const updated=hubApi.update(state.hub,{visual_system:result.value});
      if(updated.errors.length){notify(updated.errors.join(' '));return;}
      state.hub=updated.hub;persist();flushSave();renderRoute();notify('Identidade atualizada. Acompanhe o salvamento no topo.');
    }
    if (form.id==='hub-form') {event.preventDefault();if(applyHubForm(form)){const scroll=window.scrollY;flushSave();renderRoute();window.scrollTo(0,scroll);notify('Rascunho do hub atualizado. Acompanhe a confirmação de salvamento no topo.');}}
    if (form.id==='disciplinesAgentForm') {event.preventDefault();supportQuery=String(new FormData(form).get('query')||'').trim();if(supportQuery)navigate('#assistente');return;}
    if (form.id==='study-search-form') {event.preventDefault();supportQuery=new FormData(form).get('query').trim();renderRoute();}
    if (form.id==='question-form') {event.preventDefault();const body=String(new FormData(form).get('body')||'').trim();if(!body)return;if(state.questions.length>=100){notify('Limite de 100 dúvidas atingido.');return;}state.questions.push({id:newLocalId(),body,topicId:form.dataset.topic||'',status:'open'});persist();renderRoute();notify(isPreview?'Dúvida guardada nesta prévia, sem envio ao professor.':'Dúvida registrada para o professor no painel local.');}
    if (form.id==='agenda-form') {event.preventDefault();const data=new FormData(form);if(state.agenda.length>=100){notify('Limite de 100 atividades atingido.');return;}state.agenda.push({id:newLocalId(),title:String(data.get('title')).trim(),date:String(data.get('date')),time:String(data.get('time')||''),done:false});persist();renderRoute();notify('Atividade adicionada à sua agenda.');}
    if (form.id==='response-form') {
      event.preventDefault(); const body=document.getElementById('practice-response').value.trim();
      if (!body) {notify('Registre sua resposta antes de concluir.'); return;}
      state.responses[id]={body,submitted:true}; state.completed=[...new Set([...state.completed,id])];
      if (topic(id)?.type==='deliverable') state.project=[...new Set([...state.project,id])];
      if (persist()) {renderRoute(); document.querySelector('.practice-section')?.scrollIntoView({block:'start'}); notify('Resposta atualizada. Acompanhe o salvamento no topo.');}
    }
    if (form.id==='quiz-form') {
      event.preventDefault(); const data=new FormData(form), questions=seed.quizzes[id];
      const answers=questions.map((_,i)=>data.has('q'+i)?Number(data.get('q'+i)):null), result=core.grade(id,answers);
      if (!result) {notify('Responda todas as perguntas antes de corrigir.'); return;}
      state.results[id]=result; state.completed=state.completed.filter(x=>x!==id); if (result.passed) state.completed.push(id);
      if (persist()) {if(window.SKSLearning&&isAgency)renderRoute();else lessonPage(id); document.querySelector('.quiz-result')?.scrollIntoView({block:'center'}); notify(result.passed?'Avaliação aprovada. Veja as justificativas.':'Resultado calculado. Acompanhe o salvamento no topo e revise as justificativas.');}
    }
  });
  document.getElementById('import-file').addEventListener('change',async event=>{
    if (isObserver) {event.target.value='';return;}
    const file=event.target.files[0]; if (!file) return;
    try {
      if (file.size>6000000) throw new Error(); const backup=JSON.parse(await file.text());
      if (backup.version!==1 || backup.scope!=='sks-student-preview' || backup.formation!==curriculum.title || !backup.data || typeof backup.data!=='object') throw new Error();
      const incoming=core.validate(backup.data);
      state=core.validate({...state,...incoming,hub:{fields:{...state.hub.fields,...incoming.hub.fields},submitted:[...state.hub.submitted,...incoming.hub.submitted],reviewNotes:{...state.hub.reviewNotes,...incoming.hub.reviewNotes}},notes:{...state.notes,...incoming.notes},responses:{...state.responses,...incoming.responses},results:{...state.results,...incoming.results},feedback:{...state.feedback,...incoming.feedback},completed:[...state.completed,...incoming.completed],project:[...state.project,...incoming.project],reviewed:[...state.reviewed,...incoming.reviewed]});
      if (persist()) {renderRoute(); notify('Progresso importado. Os conteúdos do editor não foram alterados.');}
    } catch {notify('Arquivo inválido. Escolha um backup de progresso exportado pela área do aluno.');}
    finally {event.target.value='';}
  });
  dialog.addEventListener('click',event=>{
    if (event.target===dialog) {const rect=dialog.getBoundingClientRect(); if (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) dialog.close();}
  });
  window.addEventListener('hashchange',renderRoute);
  if(window.SKSLearning)window.addEventListener('popstate',renderRoute);
  window.addEventListener('online',renderIdentity);
  window.addEventListener('offline',renderIdentity);
  window.addEventListener('resize',()=>setMenu(sidebar.classList.contains('open')));
  window.addEventListener('storage',event=>{
    if (event.key==='sks-theme-v2') theme(event.newValue);
  });
  window.addEventListener('beforeunload',event=>{if(dirty||saving){event.preventDefault();event.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSave();});
  let lastTick=Date.now();
  setInterval(()=>{
    if(isObserver)return;
    const now=Date.now(),elapsed=Math.min(20,Math.floor((now-lastTick)/1000));lastTick=now;
    const [route,id]=location.hash.slice(1).split('/');
    if(route==='aula'&&topic(id)&&document.visibilityState==='visible'&&document.hasFocus()&&elapsed>0&&!saveBlocked){state.learningSeconds[id]=(state.learningSeconds[id]||0)+elapsed;persist();}
  },15000);
  function accountChanged(){
    if(isPreview)return;
    if(isObserver){observerSessionChanged=true;observerSessionNotice();return;}
    identityLost=true;saveBlocked=true;clearTimeout(saveTimer);
    studentSessionNotice();
  }
  window.addEventListener('sks-account-changed',accountChanged);
  window.addEventListener('focus',async()=>{
    if(isPreview||isObserver||identityLost)return;
    try{
      const current=await fetch('/api/session',{cache:'no-store',credentials:'same-origin'}).then(r=>r.json());
      if(current.user?.id!==user.id)accountChanged();
    }catch{saveStatus('Servidor indisponível','error');}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && sidebar.classList.contains('open')) {setMenu(false); document.getElementById('menu-toggle').focus();}});
  theme(document.documentElement.dataset.theme); saveStatus(saved.persistenceUnavailable?'Armazenamento bloqueado · exporte uma cópia':isPreview?'Prévia neste navegador':'Salvo na sua conta',saved.persistenceUnavailable?'error':'saved'); renderRoute();
})().catch(error=>{const main=document.getElementById('main');if(main){main.replaceChildren();const heading=document.createElement('h1');heading.textContent='Não foi possível abrir sua conta.';const p=document.createElement('p');p.textContent=error.message;const a=document.createElement('a');a.href='entrar.html';a.textContent='Voltar à entrada';a.className='button';main.append(heading,p,a);}});
