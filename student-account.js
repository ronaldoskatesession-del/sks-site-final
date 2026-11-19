(() => {
  'use strict';
  const drafts=new Map();
  let generation=0,savingCount=0;
  const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials=name=>String(name||'S').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
  const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'Não informado':d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});};
  const fields=record=>({name:record.user.name||'',preferredName:record.profile?.preferredName||'',phone:record.profile?.phone||'',city:record.profile?.city||'',region:record.profile?.region||''});
  function rankIcon(index,status){
    const paths=[
      '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z"/><path d="M12 5v15"/>',
      '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>',
      '<path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
      '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
      '<path d="m3 17 6-6 4 4 8-10M15 5h6v6"/>',
      '<circle cx="12" cy="9" r="6"/><path d="m8 14-1 8 5-3 5 3-1-8"/>'
    ];
    const path=status==='locked'?'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>':status==='complete'?'<path d="m5 12 4 4L19 6"/>':paths[index];
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
  }
  function renderRank(curriculum,state,user){
    const rank=window.SKSStudentCore.agentLevel(curriculum,state,user);
    const levels=window.SKSStudentCore.agentLevels,mentor=rank.institutionalMentor===true;
    const next=mentor?'Agente Mentor é o título do perfil de Professor, independente da conclusão de atividades.':rank.nextName?`Faltam <b>${rank.remainingToNext} ${rank.remainingToNext===1?'etapa':'etapas'}</b> para ${e(rank.nextName)}.`:'Você concluiu todas as etapas e chegou a Agente Mentor.';
    const steps=levels.map((level,index)=>{
      const current=level.level===rank.level,reached=mentor?current:level.level<=rank.level;
      const status=mentor?(current?'current':'reference'):current?'current':reached?'complete':'locked';
      const threshold=mentor?(current?'Professor · Seu título':'Hierarquia dos Agentes SKS'):level.minPercent===100?'100% das etapas':`A partir de ${level.minPercent}%`;
      return `<li data-current="${current}" data-reached="${reached}" data-rank-state="${status}" ${current?'aria-current="step"':''}><span class="rank-step-symbol">${rankIcon(index,status)}</span><span class="rank-step-number" aria-hidden="true">${String(level.level).padStart(2,'0')}</span><span class="rank-step-copy"><b>${e(level.name)}</b><small>${threshold}${current&&!mentor?' · Seu nível':''}</small></span></li>`;
    }).join('');
    return `<section class="panel account-rank-card" aria-labelledby="account-rank-title" data-rank-profile="${mentor?'teacher':'student'}"><div class="account-rank-heading"><div><span class="account-kicker">SUA EVOLUÇÃO SKS</span><h2 id="account-rank-title">${e(rank.name)}</h2></div><strong>NÍVEL ${rank.level} <span>DE ${levels.length}</span></strong></div><div class="account-rank-meter" role="progressbar" aria-label="${mentor?'Progresso pessoal de estudo':'Evolução do nível de agente'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${rank.percent}" aria-valuetext="${rank.done} de ${rank.total} etapas concluídas"><span style="width:${rank.percent}%"></span></div><p class="account-rank-next">${next} <span>${rank.done}/${rank.total} etapas · ${rank.percent}%</span></p><ol class="account-rank-steps">${steps}</ol><p class="account-rank-note">${mentor?'Identificação funcional: Professor. O título institucional não altera suas permissões nem conclui atividades. O percentual acima mostra somente os registros reais de estudo.':'Atualização automática pelos tópicos de estudo concluídos e pelos 17 entregáveis marcados para revisão no hub. Rascunhos e tempo com a página aberta não contam. Este nível indica progresso, não certificado ou aprovação do professor.'}</p></section>`;
  }
  window.addEventListener('beforeunload',event=>{if(drafts.size||savingCount){event.preventDefault();event.returnValue='';}});
  function render(ctx){
    const ticket=++generation,root=ctx.target,isObserver=ctx.isObserver===true||ctx.api.readOnly===true;
    root.innerHTML=`<section id="student-account-page" class="student-account-page"><div class="page-heading"><p class="eyebrow">MEU CADASTRO SKS</p><h1>Minha conta</h1><p>${isObserver?'Perfil do aluno em modo de consulta. A sessão continua sendo a do professor.':'Seu cadastro, sua formação e suas preferências em um só lugar.'}</p></div><div id="student-account-content" aria-live="polite"><p class="subtext">Carregando dados da conta…</p></div></section>`;
    const shell=root.querySelector('#student-account-page'),content=shell.querySelector('#student-account-content');
    const active=()=>ticket===generation&&root.contains(shell);
    if(ctx.isPreview){
      content.innerHTML=`<section class="panel account-preview"><span class="tag">PRÉVIA SEM LOGIN</span><h2>Seu cadastro começa com uma conta.</h2><p>A prévia não possui matrícula nem dados pessoais. Entre na sua conta para consultar seu perfil e salvar o estudo com acompanhamento do professor.</p><a class="button" href="${e(ctx.api.loginUrl||'entrar.html?role=student&amp;next=%2Faluno.html')}">Entrar como aluno →</a></section>`;
      return;
    }
    ctx.api.loadAccount().then(record=>{
      if(!active())return;
      if(record.user?.id!==ctx.user.id)throw new Error('A conta consultada não corresponde a esta sessão. Entre novamente.');
      if(!isObserver)ctx.onUserUpdated?.({...record.user,preferredName:record.profile?.preferredName||''});
      let current=record,editVersion=0;
      const values=drafts.get(record.user.id)||fields(record),enrollment=record.enrollment||{};
      const done=ctx.curriculum.modules.flatMap(m=>m.lessons).filter(t=>t.type!=='deliverable'&&ctx.state.completed.includes(t.id)).length;
      const total=ctx.curriculum.modules.flatMap(m=>m.lessons).filter(t=>t.type!=='deliverable').length;
      const approved=Object.values(ctx.state.results).filter(result=>result.passed).length;
      const rank=window.SKSStudentCore.agentLevel(ctx.curriculum,ctx.state,record.user);
      const field=(id,label,value,extra='')=>`<div class="field"><label for="account-profile-${id}">${label}</label><input id="account-profile-${id}" name="${id}" value="${e(value)}" ${extra}></div>`;
      content.innerHTML=`<section class="panel account-identity"><div class="account-portrait" aria-hidden="true">${e(initials(record.profile?.preferredName||record.user.name))}</div><div><span class="account-kicker">${isObserver?'VISÃO DO PROFESSOR · SOMENTE LEITURA':'SEU ESPAÇO PESSOAL'}</span><h2 id="account-display-name">${e(record.profile?.preferredName||record.user.name)}</h2><p class="account-agent-label">${e(rank.name)} <span>· ${record.user.role==='teacher'?'Professor · ':''}Nível ${rank.level} de 6</span></p><p>${e(record.user.email)}</p></div><span class="account-status">${e(enrollment.status||'Ativa')}</span></section>

      ${isObserver?'<p class="account-notice">Dados de contato e localização pessoais não são exibidos ao professor nesta consulta. Não é possível editar este perfil ou alterar o progresso.</p>':''}
      <div class="account-layout"><section class="panel account-profile"><div class="account-section-title"><h2>Dados pessoais</h2><span>${isObserver?'Consulta':'Você controla seus dados'}</span></div>
      <form id="student-account-form"><div class="account-fields">${field('name','Nome completo',values.name,`required minlength="2" maxlength="100" autocomplete="name" ${isObserver?'readonly':''}`)}${field('preferredName','Como prefere ser chamado(a)?',values.preferredName,`maxlength="100" autocomplete="nickname" ${isObserver?'readonly':''}`)}${isObserver?'':field('phone','Celular (opcional)',values.phone,'type="tel" maxlength="30" autocomplete="tel"')+field('city','Cidade (opcional)',values.city,'maxlength="100" autocomplete="address-level2"')+field('region','UF (opcional)',values.region,'maxlength="2" pattern="[A-Za-z]{2}" autocomplete="address-level1" placeholder="Ex.: PR"')}</div>
      ${isObserver?'':`<div class="account-form-actions"><button class="button" type="submit">Salvar meus dados</button><button class="outline" id="discard-account-draft" type="button">Descartar alterações</button></div>`}<p id="student-account-status" class="account-form-status" role="status">${drafts.has(record.user.id)?'Rascunho ainda não salvo.':''}</p></form>
      <div class="account-login-data"><h3>Dados de acesso</h3><dl><div><dt>E-mail de login</dt><dd>${e(record.user.email)}</dd></div><div><dt>Tipo de conta</dt><dd>${record.user.role==='teacher'?'Professor':'Aluno'}</dd></div><div><dt>Cadastro criado em</dt><dd>${e(date(enrollment.registeredAt))}</dd></div></dl><p>O e-mail de acesso é somente leitura. Alteração de senha ainda não está disponível neste MVP local.</p></div></section>
      <aside class="account-course"><section class="panel account-course-card"><span class="account-kicker">MINHA FORMAÇÃO</span><h2>Agência Escola</h2><p>${e(enrollment.formation||ctx.curriculum.title)}</p><dl><div><dt>Identificação local SKS</dt><dd class="account-local-id">${e(enrollment.id||'Não informada')}</dd></div><div><dt>Módulos da formação</dt><dd>${Number(enrollment.modules)||25}</dd></div><div><dt>Tópicos de estudo concluídos</dt><dd>${done}/${total}</dd></div><div><dt>Avaliações aprovadas</dt><dd>${approved}/24</dd></div></dl><a class="outline" href="${ctx.inDashboard?'aluno.html#formacao':'#formacao'}">Acessar minha formação →</a><small>Identificador interno desta plataforma. Não é matrícula universitária nem certificado.</small></section><section class="panel account-privacy"><h3>Privacidade desde o cadastro</h3><p>Não solicitamos CPF, RG, endereço residencial ou dados bancários para validar esta formação. Seus registros ficam neste computador; esta versão não está publicada.</p></section></aside></div>`;
      const form=content.querySelector('#student-account-form'),status=content.querySelector('#student-account-status');
      if(isObserver)return;
      const read=()=>Object.fromEntries(['name','preferredName','phone','city','region'].map(key=>[key,form.elements[key].value.trim()]));
      const say=(message,error=false)=>{status.textContent=message;status.setAttribute('role',error?'alert':'status');};
      form.addEventListener('input',()=>{
        editVersion++;
        const data=read();
        if(JSON.stringify(data)===JSON.stringify(fields(current)))drafts.delete(current.user.id);else drafts.set(current.user.id,data);
        say(drafts.has(current.user.id)?'Alterações ainda não salvas.':'');
      });
      content.querySelector('#discard-account-draft').addEventListener('click',()=>{
        editVersion++;
        for(const [key,value]of Object.entries(fields(current)))form.elements[key].value=value;
        drafts.delete(current.user.id);say('O último cadastro salvo foi preservado.');
      });
      form.addEventListener('submit',async event=>{
        event.preventDefault();const button=form.querySelector('button[type="submit"]');if(button.disabled)return;
        const data=read(),sent=JSON.stringify(data),sentVersion=editVersion;drafts.set(current.user.id,data);button.disabled=true;savingCount++;say('Salvando seus dados…');
        try{
          const result=await ctx.api.saveAccount(data,current.revision);
          current=result;ctx.onUserUpdated?.({...result.user,preferredName:result.profile?.preferredName||''});
          const editedDuringSave=editVersion!==sentVersion;
          const latest=drafts.get(result.user.id)||(editedDuringSave?read():null);
          const pending=latest&&(editedDuringSave||JSON.stringify(latest)!==sent)&&JSON.stringify(latest)!==JSON.stringify(fields(result));
          if(pending)drafts.set(result.user.id,latest);else drafts.delete(result.user.id);
          if(active()){
            if(!pending)for(const [key,value]of Object.entries(fields(result)))form.elements[key].value=value;
            content.querySelector('#account-display-name').textContent=result.profile?.preferredName||result.user.name;
            content.querySelector('.account-portrait').textContent=initials(result.profile?.preferredName||result.user.name);
            say(pending?'Dados salvos. Há novas alterações no rascunho que ainda precisam ser salvas.':'Seus dados foram salvos.');
          }
        }catch(error){if(active())say(error.status===409?'O perfil mudou em outra aba. Seu rascunho foi mantido nesta tela; confira antes de tentar novamente.':error.message,true);}
        finally{savingCount--;button.disabled=false;}
      });
    }).catch(error=>{if(active())content.innerHTML=`<section class="panel account-preview"><h2>Não foi possível consultar a conta.</h2><p role="alert">${e(error.message)}</p><a class="outline" href="${isObserver?'professor.html':'entrar.html?role=student&amp;next=%2Faluno.html%23conta'}">${isObserver?'Voltar ao professor':'Voltar ao login'}</a></section>`;});
  }
  window.SKSStudentAccount={render,renderRank};
})();
