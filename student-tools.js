(() => {
  'use strict';
  const e = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function search(query,curriculum,materials) {
    const stop=new Set(['como','para','qual','quais','uma','que','por','das','dos','com','sobre','meu','minha']);
    const terms=normalize(query).split(/\W+/).filter(t=>t.length>2&&!stop.has(t));
    if(!terms.length)return [];
    return curriculum.modules.flatMap(m=>m.lessons.map(t=>{
      const title=normalize(t.title+' '+m.title),body=normalize(materials.content[t.id]?.body||'');
      const score=terms.reduce((n,term)=>n+(title.includes(term)?8:0)+(body.includes(term)?1:0),0);
      return {id:t.id,title:t.title,module:m.number,moduleTitle:m.title,score};
    })).filter(t=>t.score>0).sort((a,b)=>b.score-a.score).slice(0,8);
  }
  function renderAssist(ctx,query='') {
    const results=search(query,ctx.curriculum,ctx.materials),questions=ctx.state.questions;
    const quickLinksHTML=`<div class="button-row">${['Persona','Planejamento','Conteúdo','Vendas','Métricas'].map(term=>`<button class="outline" data-search-term="${e(term)}">${e(term)}</button>`).join('')}</div>`;
    const resultsHTML=!query?quickLinksHTML:results.length
      ?results.map(t=>`<a class="lesson-row" href="#aula/${e(t.id)}"><span class="lesson-order">${String(t.module).padStart(2,'0')}</span><span class="lesson-copy"><b>${e(t.title)}</b><small>Fonte: módulo ${t.module} · ${e(t.moduleTitle)}</small></span><span>→</span></a>`).join('')
      :'<p class="subtext">Não encontrei uma aula para esses termos. Tente palavras mais simples ou registre sua dúvida abaixo.</p>';
    const questionsHTML=questions.length
      ?`<h3 class="tool-subheading">Minhas dúvidas registradas</h3>${questions.map(q=>`<article class="tool-question"><p>${e(q.body).replace(/\n/g,'<br>')}</p><small>Aguardando retorno do professor</small></article>`).join('')}`
      :'<p class="subtext tool-subheading">Você ainda não registrou dúvidas.</p>';
    return `<div class="page-heading"><p class="eyebrow">APOIO AO APRENDIZADO</p><h1>Encontre a próxima resposta.</h1><p>Busca guiada nas aulas da Agência Escola. Este recurso não é uma IA e não gera respostas sem fonte.</p></div><section class="panel tool-panel"><form id="study-search-form"><div class="field"><label for="study-query">Qual assunto você quer entender?</label><input id="study-query" name="query" type="search" value="${e(query)}" placeholder="Ex.: persona, planejamento, Meta Ads" maxlength="300"></div><button class="button" type="submit">Buscar nas aulas →</button></form></section><div class="section-heading"><h2>${query?'Materiais encontrados':'Comece pelos assuntos do seu projeto'}</h2></div><section class="panel tool-panel">${resultsHTML}</section><div class="section-heading"><h2>Leve uma dúvida ao professor</h2></div><section class="panel tool-panel"><form id="question-form"><div class="field"><label for="student-question">Minha dúvida</label><textarea id="student-question" name="body" required maxlength="5000" placeholder="Explique sua dúvida e o que você já tentou…"></textarea></div><p class="subtext">O registro fica disponível no painel do professor deste MVP local. Não envia e-mail ou mensagem externa.</p><button class="button" type="submit">Registrar dúvida</button></form>${questionsHTML}</section>`;
  }
  function renderAgenda(state) {
    return `<div class="page-heading"><p class="eyebrow">ROTINA DO ALUNO</p><h1>Minha agenda de estudo</h1><p>Planeje atividades do curso e do cliente. Somente os seus registros aparecem aqui.</p></div><section class="panel tool-panel"><form id="agenda-form"><div class="field"><label for="agenda-title">Próxima atividade</label><input id="agenda-title" name="title" required maxlength="150" placeholder="Ex.: concluir diagnóstico do cliente"></div><div class="form-pair"><div class="field"><label for="agenda-date">Data</label><input id="agenda-date" type="date" name="date" required></div><div class="field"><label for="agenda-time">Horário (opcional)</label><input id="agenda-time" type="time" name="time"></div></div><button class="button">Adicionar à minha agenda</button></form></section><div class="section-heading"><h2>Meus próximos passos</h2></div><section class="panel tool-panel">${state.agenda.length?[...state.agenda].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(item=>`<div class="deliverable ${item.done?'done':''}"><input type="checkbox" id="agenda-${e(item.id)}" data-agenda-done="${e(item.id)}" ${item.done?'checked':''}><label for="agenda-${e(item.id)}"><b>${e(item.title)}</b><small>${e(item.date.split('-').reverse().join('/'))}${item.time?' · '+e(item.time):''}</small></label></div>`).join(''):'<p class="subtext">Sua agenda está vazia. Não há eventos fictícios ou convites automáticos.</p>'}</section>`;
  }
  function renderCertificates(ctx) {
    const topics=ctx.curriculum.modules.filter(m=>m.number!==25).flatMap(m=>m.lessons),done=topics.filter(t=>ctx.state.completed.includes(t.id)).length,passed=Object.values(ctx.state.results).filter(r=>r.passed).length,hub=ctx.hubSummary,isAgency=!ctx.formation||ctx.formation.id==='agencia';
    return `<div class="page-heading"><p class="eyebrow">CONCLUSÃO COM CRITÉRIO</p><h1>Certificados</h1><p>Acompanhe os requisitos. Preencher campos ou marcar uma aula não emite um certificado automaticamente.</p></div><section class="panel tool-panel"><span class="tag">NENHUM CERTIFICADO EMITIDO</span><h2 class="tool-subheading">Sua preparação para a conclusão</h2><div class="dialog-list"><div><b>Estudo e prática</b>${done}/${topics.length} tópicos registrados.</div><div><b>Avaliações</b>${isAgency?passed+'/24 avaliações com pelo menos 75%.':'Revisão das práticas pelo professor.'}</div><div><b>Projeto do cliente</b>${isAgency?hub.submitted+'/17 entregáveis marcados para revisão.':'Projeto final, portfólio e apresentação no módulo de Certificação.'}</div><div><b>Revisão pedagógica</b>A certificação depende de critérios, carga horária e aprovação definidos pelo responsável pela formação. A emissão formal ainda não está ativada neste MVP.</div></div><div class="button-row"><a class="button" href="${isAgency?'#projeto':'#modulo/'+ctx.curriculum.modules.at(-1).id}">Continuar meu projeto →</a><button class="outline" data-report>Baixar relatório de estudo</button></div></section>`;
  }
  function renderCommunity() {
    return '<div class="page-heading"><p class="eyebrow">CONEXÃO E TROCA</p><h1>Comunidade SKS</h1><p>A comunidade compartilhada será conectada em uma próxima etapa.</p></div><section class="panel tool-panel"><h2>Sem publicações simuladas.</h2><p class="subtext">Neste MVP, você já pode levar suas dúvidas ao professor e compartilhar o projeto pelo painel local. Não há feed público, participantes fictícios ou mensagens externas.</p><div class="button-row tool-subheading"><a class="button" href="#assistente">Registrar uma dúvida →</a><a class="outline" href="#projeto">Trabalhar no meu hub</a></div></section>';
  }
  window.SKSStudentTools={search,renderAssist,renderAgenda,renderCertificates,renderCommunity};
})();
