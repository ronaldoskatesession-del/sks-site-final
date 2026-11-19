(() => {
  'use strict';
  // Page chrome is independent of roster refreshes and never changes learning data.
  function initTeacherShell(){
    const root=document.documentElement;
    if(!root)return;
    const sidebar=document.getElementById('sidebar'),toggle=document.getElementById('menu-toggle'),themeButton=document.getElementById('theme-toggle');
    if(!sidebar||!toggle||!themeButton)return;
    function applyTheme(value){
      const dark=value!=='light';
      root.dataset.theme=dark?'dark':'light';
      themeButton.setAttribute('aria-pressed',String(dark));
      themeButton.setAttribute('aria-label',dark?'Alternar para modo claro':'Alternar para modo escuro');
      themeButton.title=dark?'Modo claro':'Modo escuro';
      const icon=themeButton.querySelector('[data-theme-icon]'),label=themeButton.querySelector('[data-theme-label]');
      if(icon)icon.textContent=dark?'☀':'☾';
      if(label)label.textContent=dark?'Modo claro':'Modo escuro';
      const meta=document.querySelector?.('meta[name="theme-color"]');if(meta)meta.setAttribute('content',dark?'#08090b':'#f5f5f7');
    }
    function setMenu(open){
      sidebar.classList.toggle('open',Boolean(open));
      const hidden=window.matchMedia('(max-width:800px)').matches&&!open;
      sidebar.inert=hidden;
      if(hidden)sidebar.setAttribute('aria-hidden','true');else sidebar.removeAttribute('aria-hidden');
      toggle.setAttribute('aria-expanded',String(Boolean(open)));
    }
    applyTheme(root.dataset.theme);setMenu(false);
    themeButton.addEventListener('click',()=>{
      const next=root.dataset.theme==='dark'?'light':'dark';applyTheme(next);
      try{localStorage.setItem('sks-theme-v2',next);}catch{/* The current page theme still works with blocked storage. */}
    });
    toggle.addEventListener('click',()=>setMenu(!sidebar.classList.contains('open')));
    document.getElementById('menu-close')?.addEventListener('click',()=>{setMenu(false);toggle.focus();});
    sidebar.addEventListener('click',event=>{if(event.target.closest?.('a'))setMenu(false);});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sidebar.classList.contains('open')){setMenu(false);toggle.focus();}});
    window.addEventListener('resize',()=>setMenu(sidebar.classList.contains('open')));
    window.addEventListener('storage',event=>{if(event.key==='sks-theme-v2'||event.key===null)applyTheme(event.newValue);});
    const help=document.getElementById('teacher-help-dialog');
    document.getElementById('help-button')?.addEventListener('click',()=>{if(help&&!help.open)help.showModal();});
    document.getElementById('close-teacher-help')?.addEventListener('click',()=>help?.close());
    return {applyTheme,setMenu};
  }
  initTeacherShell();
  const api=window.SKSAccount,main=document.getElementById('teacher-content');
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const curriculum=window.SKS_CURRICULUM,all=curriculum.modules.flatMap(m=>m.lessons),byId=new Map(all.map(t=>[t.id,t]));
  const moduleByTopic=new Map(curriculum.modules.flatMap(module=>module.lessons.map(topic=>[topic.id,module])));
  const topicLabel=id=>{const module=moduleByTopic.get(id),title=byId.get(id)?.title||id;return module?`Módulo ${String(module.number).padStart(2,'0')} · ${module.title} — ${title}`:title;};
  const hub=window.SKSProjectHub,hubLabels=new Map(hub.schema.sections.flatMap(section=>section.fields.map(field=>[field.id,field.label])));
  let students=[],selected=null,query='',kind='real',creating=false,panelView='overview';
  let authorized=false,refreshing=false,pollTimer=null,lastSummary='',feedbackDraft=null,feedbackDirty=false,feedbackSaving=false;
  const date=value=>value?new Date(value).toLocaleString('pt-BR'):'Ainda não estudou';
  const accessDialog=document.getElementById('student-access-dialog'),accessContent=document.getElementById('student-access-content');
  const testEnrollment=document.getElementById('create-test-students-form');
  const scenario=value=>({'iniciante':'Iniciante','em-andamento':'Em andamento','precisa-apoio':'Precisa de apoio'})[value]||String(value||'Cenário de validação');
  const badge=student=>student.isTest?`<span class="teacher-test-badge">TESTE</span><span class="teacher-test-scenario">${escape(scenario(student.testScenario))} · dados de demonstração</span>`:'';
  function status(id,message,error=false){const element=document.getElementById(id);if(!element)return;element.setAttribute('role',error?'alert':'status');element.setAttribute('aria-live',error?'assertive':'polite');element.textContent=message;}
  function busy(value){creating=value;document.getElementById('test-enrollment-fields').disabled=value;}
  function showAccess(records,createdCount){
    const cards=records.map(record=>{
      const student=record.student,created=record.created!==false,credential=typeof record.initialPassword==='string'&&record.initialPassword;
      return `<article class="teacher-access-card"><h3>${escape(student.name)}${student.isTest?'<span class="teacher-test-badge">TESTE</span>':''}</h3>${student.isTest?`<p class="teacher-small">${escape(scenario(record.scenario||student.testScenario))} · progresso inicial simulado para validar a plataforma</p>`:''}<dl><dt>E-mail de acesso</dt><dd><code>${escape(student.email)}</code></dd>${credential?`<dt>Senha inicial · copie agora</dt><dd><code>${escape(credential)}</code></dd>`:''}</dl>${!created||!credential?'<p class="teacher-small"><strong>Esta conta já existe.</strong> Use a senha que você guardou. A senha não pode ser recuperada nesta tela e não foi redefinida.</p>':'<p class="teacher-small">A senha inicial não possui expiração automática nem troca obrigatória neste MVP.</p>'}</article>`;
    }).join('');
    const entry=new URL('entrar.html?role=student&next=%2Faluno.html',location.href).href;
    accessContent.innerHTML=`<p class="teacher-access-summary">${createdCount} contas criadas. Nenhuma senha de conta existente foi alterada.</p>${cards}<p class="teacher-access-summary"><strong>Abas comuns compartilham o mesmo login.</strong> Para manter professor e aluno conectados ao mesmo tempo, use uma janela anônima/privada ou outro perfil do navegador. Abra a entrada do aluno nessa janela e digite as credenciais copiadas. Se preferir usar esta janela, saia primeiro da conta do professor.</p><p class="teacher-access-summary">Entrada do aluno: <code>${escape(entry)}</code></p>`;
    if(!accessDialog.open)accessDialog.showModal();
  }
  accessDialog.addEventListener('close',()=>accessContent.replaceChildren());
  window.addEventListener('pagehide',()=>{accessContent.replaceChildren();if(accessDialog.open)accessDialog.close();});
  document.getElementById('close-student-access').addEventListener('click',()=>accessDialog.close());

  const icon=(name)=>{
    const paths={people:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"/>',calendar:'<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 6-7"/>',chart:'<path d="M4 21V11m5 10V3m6 18V7m5 14V1"/>',book:'<path d="M4 3h16v18H4zM7 7h10M7 11h10M7 15h10"/>',edit:'<path d="m16 3 5 5-12 12-6 1 1-6zM14 5l5 5"/>',gear:'<circle cx="12" cy="12" r="4"/><path d="M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z"/>'};
    return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.people)+'</svg>';
  };
  function dashboard(real){
    const submitted=real.filter(s=>s.hubSubmitted>0),questions=real.filter(s=>s.openQuestions>0);
    const initials=name=>String(name).trim().split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase();
    const tabs=[['overview','Visão geral','chart'],['groups','Minhas turmas','people'],['deliveries','Entregas','file'],['assessments','Avaliações','check'],['agenda','Agenda','calendar'],['reports','Relatórios','chart']];
    const action=(s,label)=>'<button type="button" class="pi-action" data-action="detail" data-id="'+escape(s.id)+'">'+label+'</button>';
    const nav='<nav class="pi-tabs" aria-label="Seções do painel">'+tabs.map(([id,label,i])=>'<button type="button" data-action="panel-view" data-view="'+id+'" aria-pressed="'+(panelView===id)+'" class="'+(panelView===id?'active':'')+'">'+icon(i)+escape(label)+'</button>').join('')+'</nav>';
    const kpis='<div class="pi-kpis">'+[
      ['people','Agentes cadastrados',real.length,'Contas reais, sem incluir TESTE.'],
      ['file','Entregáveis registrados',real.reduce((n,s)=>n+s.hubSubmitted,0),'Marcações do Hub para revisão; sem aprovação individual.'],
      ['calendar','Encontros hoje','—','Agenda institucional ainda não cadastrada.'],
      ['people','Dúvidas abertas',questions.reduce((n,s)=>n+s.openQuestions,0),'Dúvidas registradas pelas contas reais.']
    ].map(([i,label,value,hint])=>'<section class="panel pi-kpi" title="'+escape(hint)+'"><span class="pi-kpi-icon">'+icon(i)+'</span><div><span>'+label+'</span><strong>'+value+'</strong></div></section>').join('')+'</div>';
    const rows=submitted.slice(0,8).map((s,i)=>'<tr><td><span class="pi-person"><span class="pi-avatar tone-'+i%3+'">'+escape(initials(s.name))+'</span>'+escape(s.name)+'</span></td><td>'+s.hubSubmitted+' entregáveis no Hub</td><td>'+action(s,'Consultar')+'</td></tr>').join('');
    const deliveries='<section class="panel pi-panel"><div class="pi-section-title"><h2>Entregas para acompanhar</h2><button type="button" class="pi-text" data-action="panel-view" data-view="deliveries">Ver todas →</button></div><p class="pi-subtitle">Registros enviados para revisão · contas reais</p>'+(rows?'<div class="table-wrap"><table class="teacher-table pi-delivery-table"><thead><tr><th>Agente</th><th>Entrega</th><th>Ação</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="pi-empty">Nenhum entregável marcado para revisão pelas contas reais.</p>')+'</section>';
    const groups='<section id="pi-groups" class="panel pi-panel"><h2>Minhas turmas</h2><p class="pi-empty">Ainda não há cadastro de turmas nesta versão. O acompanhamento disponível é individual, por Agente.</p><button type="button" class="pi-text" data-action="panel-view" data-view="students">Acompanhar Agentes →</button></section>';
    const shortcuts='<section class="panel pi-panel"><h2>Gestão do conteúdo</h2><div class="pi-shortcuts">'+[['book','Formações','Consultar fases e módulos','index.html#formacoes'],['edit','Gerenciar conteúdos','Editar aulas e materiais','index.html#agencia/conteudos'],['check','Revisar curso','Conferir o conteúdo existente','index.html#validacao']].map(([i,title,sub,url])=>'<a href="'+url+'">'+icon(i)+'<span><b>'+title+'</b><small>'+sub+'</small></span></a>').join('')+'</div></section>';
    const meeting='<section id="pi-agenda" class="panel pi-panel"><h2>Próximo encontro</h2><div class="pi-meeting">'+icon('calendar')+'<div><b>Sem encontro cadastrado</b><p class="pi-subtitle">A agenda institucional ainda não está conectada.</p></div></div></section>';
    const follow='<section class="panel pi-panel"><h2>Acompanhamento</h2>'+(questions.length?questions.slice(0,5).map((s,i)=>'<div class="pi-follow"><span class="pi-avatar tone-'+i%3+'">'+escape(initials(s.name))+'</span><div><b>'+escape(s.name)+'</b><small>'+s.openQuestions+' dúvidas abertas</small></div>'+action(s,'Ver')+'</div>').join(''):'<p class="pi-empty">Nenhuma dúvida aberta nas contas reais.</p>')+'<button type="button" class="pi-text" data-action="panel-view" data-view="students">Consultar Agentes →</button></section>';
    const admin='<section class="panel pi-panel pi-administration">'+icon('gear')+'<div><h2>Administração</h2><p class="pi-subtitle">Acessos e cenários de teste existentes</p></div><a class="pi-action" href="#professor-test-tools" data-action="test-tools">Abrir gestão</a></section>';
    const overview=panelView==='overview';
    let view=overview?'<div class="pi-layout"><div>'+deliveries+groups+shortcuts+'</div><aside>'+meeting+follow+admin+'</aside></div>':panelView==='groups'?groups:panelView==='agenda'?meeting:'';
    return nav+kpis+view;
  }
  function render(){
    const real=students.filter(s=>!s.isTest),tests=students.filter(s=>s.isTest);
    const average=real.length?Math.round(real.reduce((sum,s)=>sum+s.percent,0)/real.length):0;
    const filtered=students.filter(s=>(kind==='all'||(kind==='test'?s.isTest:!s.isTest))&&(s.name+' '+s.email).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
    main.innerHTML=dashboard(real)+`<div class="pi-roster" ${['overview','groups','agenda'].includes(panelView)&&!selected?'hidden':''}><div class="teacher-stats"><div class="panel teacher-stat"><small>Alunos reais</small><strong>${real.length}</strong><span class="teacher-small">Contas de alunos sem identificação TESTE.</span></div><div class="panel teacher-stat"><small>Alunos de teste</small><strong>${tests.length}</strong><span class="teacher-small">${tests.reduce((n,s)=>n+s.passedAssessments,0)} avaliações de demonstração; não entram nos totais reais.</span></div><div class="panel teacher-stat"><small>Progresso médio · alunos reais</small><strong>${average}%</strong><span class="teacher-small">Contas TESTE não entram nesta média.</span></div><div class="panel teacher-stat"><small>Aprendizado · alunos reais</small><strong>${real.reduce((n,s)=>n+s.passedAssessments,0)}</strong><span class="teacher-small">Avaliações aprovadas · ${real.reduce((n,s)=>n+s.hubSubmitted,0)} entregáveis para revisão.</span></div></div>
      <div class="section-heading"><div><h2>Seus alunos</h2><p class="teacher-small">${filtered.length} de ${students.length} contas nesta visualização. Atualização automática a cada 12 segundos enquanto esta página estiver visível.</p></div><div class="teacher-actions"><button class="outline" data-action="refresh">Atualizar</button><button class="outline" data-action="export" ${students.length?'':'disabled'}>Exportar relatório</button></div></div>
      <div class="teacher-filter-row"><div><label for="student-search" class="teacher-small">Buscar por nome ou e-mail</label><input id="student-search" class="teacher-search" type="search" placeholder="Buscar aluno" value="${escape(query)}"></div><div><label for="student-kind" class="teacher-small">Tipo de conta</label><select id="student-kind"><option value="real" ${kind==='real'?'selected':''}>Alunos reais (${real.length})</option><option value="test" ${kind==='test'?'selected':''}>Contas TESTE (${tests.length})</option><option value="all" ${kind==='all'?'selected':''}>Todos (${students.length})</option></select></div></div>
      <div class="panel table-wrap">${students.length?`<table class="teacher-table"><thead><tr><th>Aluno</th><th>Progresso</th><th>Avaliações</th><th>HUB</th><th>Último registro</th><th>Ações</th></tr></thead><tbody>${filtered.map(s=>`<tr><td><b>${escape(s.name)}</b>${badge(s)}<br><span class="teacher-small">${escape(s.email)}</span></td><td>${s.percent}%<br><span class="teacher-small">${s.completed}/${s.total} itens${s.isTest?' · cenário de teste':''}</span></td><td>${s.passedAssessments}/${s.totalAssessments}</td><td>${s.hubFields} campos<br><span class="teacher-small">${s.hubSubmitted} entregáveis para revisão</span></td><td>${escape(date(s.updatedAt))}</td><td><div class="teacher-student-actions"><a class="quiet" data-action="view-student" href="aluno.html?aluno=${encodeURIComponent(s.id)}#inicio">Ver aluno →</a><button class="quiet" data-action="detail" data-id="${escape(s.id)}">Relatório e parecer</button></div></td></tr>`).join('')}</tbody></table>${filtered.length?'':'<p class="teacher-empty">Nenhum aluno corresponde a esta busca e ao filtro.</p>'}`:'<div class="teacher-empty"><h2>Sua primeira turma começa aqui.</h2><p class="teacher-small">Os alunos aparecem aqui depois do autocadastro. Compartilhe o link de cadastro acima; não é necessário recriar contas no painel.</p></div>'}</div>
      <section id="student-detail">${selected?renderDetail(selected):''}</section></div>`;
  }
  function renderDetail(data){
    const {student:s,state}=data;
    const rows=curriculum.modules.map(m=>{const done=m.number===25?state.hub.submitted.length:m.lessons.filter(t=>state.completed.includes(t.id)).length;return `<tr><td>${m.number}. ${escape(m.title)}${m.number===25?'<br><small class="teacher-small">Entregáveis marcados para revisão, ainda sem aprovação.</small>':''}</td><td>${done}/${m.lessons.length}</td><td>${Math.round(done/m.lessons.length*100)}%</td></tr>`;}).join('');
    const assessments=Object.entries(state.results),responses=Object.entries(state.responses).filter(([,r])=>r.submitted),fields=Object.entries(state.hub?.fields||{}).filter(([,v])=>v.trim()),feedback=Object.entries(state.feedback).filter(([,v])=>v.trim());
    return `<div class="panel teacher-detail"><div class="section-heading" style="margin-top:0"><div><p class="eyebrow">ACOMPANHAMENTO INDIVIDUAL</p><h2>${escape(s.name)}${badge(s)}</h2><p class="teacher-small">${escape(s.email)} · ${s.percent}% do percurso · Último registro: ${escape(date(s.updatedAt))}</p></div><button class="outline" data-action="close">Fechar</button></div>${s.isTest?`<p class="teacher-test-warning"><strong>Conta TESTE · ${escape(scenario(s.testScenario))}.</strong> Os registros iniciais foram simulados para validar o painel. Alterações feitas no curso são salvas nesta conta de teste e não representam dados de um aluno real.</p>`:''}
      <details open><summary>Progresso por módulo</summary><div class="table-wrap"><table class="teacher-table"><thead><tr><th>Módulo</th><th>Concluídos</th><th>Progresso</th></tr></thead><tbody>${rows}</tbody></table></div></details>
      <details><summary>Avaliações (${assessments.length})</summary>${assessments.length?assessments.map(([id,r])=>`<article><b>${escape(topicLabel(id))}</b><p class="teacher-small">${r.score}/${r.total} · ${r.percent}% · ${r.passed?'Aprovada':'Ainda não aprovada'}</p></article>`).join(''):'<p class="teacher-small">Nenhuma avaliação respondida.</p>'}</details>
      <details><summary>Atividades e entregas enviadas (${responses.length})</summary>${responses.length?responses.map(([id,r])=>`<article><b>${escape(topicLabel(id))}</b><pre>${escape(r.body)}</pre></article>`).join(''):'<p class="teacher-small">Nenhuma entrega enviada.</p>'}</details>
      <details><summary>HUB do cliente (${fields.length} campos preenchidos)</summary><p class="teacher-small">Somente os campos que o aluno preencheu. Campos vazios não são inventados. ${state.hub.submitted.length}/17 entregáveis marcados pelo aluno para revisão.</p>${fields.length?fields.map(([id,value])=>`<article><b>${escape(hubLabels.get(id)||id)}</b><pre>${escape(value)}</pre></article>`).join(''):'<p class="teacher-small">O aluno ainda não começou seu HUB.</p>'}</details>
      <details><summary>Dúvidas abertas (${state.questions?.length||0})</summary>${state.questions?.length?state.questions.map(q=>`<article><b>${escape(byId.get(q.topicId)?.title||'Dúvida geral')}</b><pre>${escape(q.body)}</pre></article>`).join(''):'<p class="teacher-small">Nenhuma dúvida registrada.</p>'}</details>
      <details><summary>Observações de validação (${feedback.length})</summary>${feedback.length?feedback.map(([id,value])=>`<article><b>${escape(byId.get(id)?.title||id)}</b><pre>${escape(value)}</pre></article>`).join(''):'<p class="teacher-small">Nenhuma observação registrada.</p>'}</details>
      <section style="margin-top:27px"><h2>Seu parecer para o aluno</h2><p class="teacher-small">Escreva orientações, pontos de melhoria e respostas às dúvidas. Este parecer não aprova automaticamente o projeto e não emite certificado.</p><form id="teacher-feedback-form" data-student-id="${escape(s.id)}"><label for="teacher-feedback" class="teacher-small">Feedback do professor</label><textarea id="teacher-feedback" name="feedback" rows="7" maxlength="50000" style="width:100%;display:block;margin:10px 0 14px;padding:14px;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--ink);font:inherit">${escape(feedbackDraft?.studentId===s.id?feedbackDraft.value:data.review?.feedback||'')}</textarea><button class="button" type="submit">Salvar parecer</button><button class="quiet" type="button" data-action="discard-feedback" ${feedbackDirty?'':'disabled'}>Descartar rascunho</button><span class="teacher-small" id="feedback-status" role="status" style="margin-left:12px">${data.review?'Último parecer: '+escape(date(data.review.updatedAt)):''}</span></form></section></div>`;
  }
  function stopPolling(){if(pollTimer!==null)clearInterval(pollTimer);pollTimer=null;}
  function handleRefreshError(error){
    if([401,403].includes(error.status)){authorized=false;stopPolling();busy(true);status('teacher-operation-status','A sessão do professor precisa ser renovada. Entre novamente para acompanhar os alunos.',true);}
    else status('teacher-operation-status','Não foi possível atualizar agora: '+error.message,true);
  }
  function editingFilter(){return Boolean(document.activeElement?.matches?.('#student-search,#student-kind,#teacher-feedback'));}
  function protectFeedback(){
    if(!feedbackDirty&&!feedbackSaving)return false;
    status('teacher-operation-status',feedbackSaving?'Salvando parecer. A atualização aguarda a conclusão.':'Atualização automática pausada: há um parecer não salvo. Salve ou descarte o rascunho e clique em Atualizar.');
    return true;
  }
  async function refresh({automatic=false}={}){
    if(!authorized||refreshing)return false;
    if(protectFeedback())return false;
    if(automatic&&(document.hidden||creating||editingFilter()||accessDialog.open))return false;
    refreshing=true;
    try{
      const result=await api.students(),signature=JSON.stringify(result.students);
      if(protectFeedback()||(automatic&&(document.hidden||editingFilter()||accessDialog.open)))return false;
      if(automatic&&signature===lastSummary)return false;
      const detail=selected?await api.student(selected.student.id):null;
      if(protectFeedback()||(automatic&&(document.hidden||editingFilter()||accessDialog.open)))return false;
      students=result.students;lastSummary=signature;selected=detail;render();
      status('teacher-operation-status',automatic?'Lista atualizada automaticamente.':'Lista e progresso atualizados.');
      return true;
    }finally{refreshing=false;}
  }
  function autoRefresh(){if(!authorized||document.hidden)return;refresh({automatic:true}).catch(handleRefreshError);}
  function startPolling(){stopPolling();if(authorized)pollTimer=setInterval(autoRefresh,12000);}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoRefresh();});
  window.addEventListener('focus',autoRefresh);
  async function refreshAfterCreation(){try{await refresh();}catch(error){handleRefreshError(error);}}
  testEnrollment.addEventListener('submit',async event=>{
    event.preventDefault();if(creating||!authorized)return;
    if(protectFeedback())return;
    const count=Number(new FormData(testEnrollment).get('count'));if(![2,3].includes(count))return;
    busy(true);status('create-test-status','Preparando contas de teste sem alterar contas existentes…');
    try{const result=await api.createTestStudents(count);showAccess(result.students,result.createdCount);kind='test';query='';status('create-test-status',result.createdCount+' contas novas de teste. As contas que já existiam foram preservadas.');await refreshAfterCreation();}
    catch(error){status('create-test-status',error.message,true);if([401,403].includes(error.status))handleRefreshError(error);}
    finally{busy(!authorized);}
  });
  document.getElementById('test-student-count').addEventListener('change',event=>{document.getElementById('prepare-test-students').textContent='Preparar '+event.target.value+' alunos de teste';});
  const signOut=()=>{if(protectFeedback())return;authorized=false;stopPolling();api.logout().catch(error=>status('teacher-operation-status',error.message,true));};
  document.getElementById('teacher-logout').addEventListener('click',signOut);
  document.getElementById('teacher-sidebar-logout')?.addEventListener('click',signOut);
  document.addEventListener('click',event=>{const link=event.target.closest?.('.sidebar a, .teacher-top a, .pi-shortcuts a');if(link&&protectFeedback())event.preventDefault();});
  main.addEventListener('submit',async event=>{
    if(event.target.id!=='teacher-feedback-form')return;event.preventDefault();const form=event.target,button=form.querySelector('button'),element=document.getElementById('feedback-status'),studentId=form.dataset.studentId,body=form.elements.feedback.value;button.disabled=true;feedbackSaving=true;
    try{const result=await api.saveFeedback(studentId,body);if(selected?.student.id===studentId){selected.review=result.review;const current=feedbackDraft?.studentId===studentId?feedbackDraft.value:body;feedbackDirty=current!==body;feedbackDraft=feedbackDirty?{studentId,value:current}:null;}element.setAttribute('role','status');element.textContent=feedbackDirty?'Parecer salvo. Há novas alterações no rascunho que ainda precisam ser salvas.':'Parecer salvo. O aluno verá no seu projeto ao atualizar a página.';status('teacher-operation-status',feedbackDirty?'Salve as novas alterações do parecer antes de atualizar.':'Parecer salvo. A atualização automática foi retomada.');}
    catch(error){element.setAttribute('role','alert');element.textContent=error.message;if([401,403].includes(error.status))handleRefreshError(error);}finally{button.disabled=false;feedbackSaving=false;const discard=main.querySelector('[data-action="discard-feedback"]');if(discard)discard.disabled=!feedbackDirty;}
  });
  main.addEventListener('input',event=>{
    if(event.target.id==='teacher-feedback'&&selected){feedbackDraft={studentId:selected.student.id,value:event.target.value};feedbackDirty=event.target.value!==(selected.review?.feedback||'');const discard=main.querySelector('[data-action="discard-feedback"]');if(discard)discard.disabled=!feedbackDirty;if(feedbackDirty)protectFeedback();return;}
    if(event.target.id!=='student-search')return;const position=event.target.selectionStart;query=event.target.value;render();const input=document.getElementById('student-search');input.focus();input.setSelectionRange(position,position);
  });
  main.addEventListener('change',event=>{if(event.target.id!=='student-kind')return;kind=event.target.value;render();document.getElementById('student-kind').focus();});
  main.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    if(button.dataset.action==='view-student'){if(protectFeedback())event.preventDefault();return;}
    if(button.dataset.action==='panel-view'){if(protectFeedback())return;panelView=button.dataset.view;selected=null;render();return;}
    if(button.dataset.action==='test-tools'){event.preventDefault();if(protectFeedback())return;const tools=document.getElementById('professor-test-tools');if(tools){tools.open=true;tools.scrollIntoView({behavior:'smooth',block:'start'});}return;}
    status('teacher-operation-status','');
    try{
      if(button.dataset.action==='refresh'){button.disabled=true;await refresh();}
      if(button.dataset.action==='detail'){if(protectFeedback())return;button.disabled=true;selected=await api.student(button.dataset.id);feedbackDraft=null;feedbackDirty=false;render();document.getElementById('student-detail').scrollIntoView({behavior:'smooth',block:'start'});}
      if(button.dataset.action==='close'){if(protectFeedback())return;selected=null;feedbackDraft=null;render();}
      if(button.dataset.action==='discard-feedback'){feedbackDirty=false;feedbackDraft=null;render();status('teacher-operation-status','Rascunho descartado. O último parecer salvo foi preservado.');}
      if(button.dataset.action==='export'){
        const blob=new Blob([JSON.stringify({formation:curriculum.title,generatedAt:new Date().toISOString(),scope:'teacher-aggregate-report',counts:{real:students.filter(s=>!s.isTest).length,test:students.filter(s=>s.isTest).length},students},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='relatorio-alunos-sks.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    }catch(error){handleRefreshError(error);}finally{button.disabled=false;}
  });
  (async()=>{try{const user=await api.ensureTeacher();if(user){authorized=true;const name=document.getElementById('teacher-account-name');if(name)name.textContent=(user.name||'Professor')+' · Professor';const greeting=document.getElementById('professor-greeting');if(greeting)greeting.textContent='Olá, '+(user.name||'Professor')+'. Acompanhe Agentes, entregas e conteúdos em um só lugar.';busy(false);await refresh();startPolling();}}catch(error){authorized=false;stopPolling();main.innerHTML=`<p class="panel teacher-status" role="alert">${escape(error.message)}</p>`;busy(true);}})();
})();
