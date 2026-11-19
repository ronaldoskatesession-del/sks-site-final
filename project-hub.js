(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const field = (id, label, prompt, options = {}) => ({id, label, prompt, type:'textarea', required:true, ...options});
  const sections = [
    {id:'cliente', icon:'01', title:'Cliente e negócio', subtitle:'O ponto de partida da operação.', modules:[1,2,3,22,23,24], fields:[
      field('client_name','Nome do projeto ou cliente','Defina o nome de um projeto fictício ou de um cliente autorizado.',{type:'text'}),
      field('business_context','Briefing e contexto do negócio','O que o negócio oferece, para quem e em qual momento está?'),
      field('business_model','Modelo de negócio e proposta comercial','Explique como a operação gera receita, sua oferta e o escopo do trabalho.'),
      field('business_setup','Estrutura e limites da operação','Registre os papéis, responsabilidades, recursos, custos e cuidados de formalização. Não informe documentos pessoais ou dados bancários.')
    ]},
    {id:'estrategia', icon:'02', title:'Pesquisa e estratégia', subtitle:'Decisões fundamentadas, não respostas prontas.', modules:[3,4,8,11,22,24], fields:[
      field('market_research','Estudo e pesquisa de mercado','Registre perguntas, método de pesquisa, fontes, datas e descobertas. Identifique hipóteses que ainda precisam ser verificadas.'),
      field('territory_analysis','Análise mercadológica e territorial','Descreva área de influência, concorrentes, demanda e características do território com suas fontes.'),
      field('swot','SWOT completa','Separe forças, fraquezas, oportunidades e ameaças. Conecte cada item a uma evidência e a uma ação.'),
      field('persona','Persona Master','Descreva contexto, necessidades, dores, desejos, objeções e hábitos. Diferencie pesquisa de hipótese; evite dados pessoais de terceiros.'),
      field('strategic_plan','Planejamento estratégico','Defina objetivos, metas, prioridades, canais, orçamento planejado, responsáveis, prazos e critérios de revisão.')
    ]},
    {id:'marca', icon:'03', title:'Marca e comunicação', subtitle:'Uma identidade coerente em cada ponto de contato.', modules:[9,10,11,12,14,24], fields:[
      field('brand_positioning','Branding e posicionamento','Registre propósito, proposta de valor, diferenciação, posicionamento e limites das promessas da marca.'),
      field('brand_voice','Arquétipo e tom de voz','Explique a escolha didática do arquétipo e traduza-a em orientações de linguagem, exemplos e termos a evitar.'),
      field('visual_system','Direção visual','Defina cores, tipografia, referências e regras de consistência. Descreva como verificar legibilidade e acessibilidade.'),
      field('copy_library','Banco de mensagens e copy','Escreva mensagens, headlines e chamadas para ação para o projeto. Identifique canal, público e objetivo de cada uma.')
    ]},
    {id:'canais', icon:'04', title:'Canais e experiência', subtitle:'A presença digital conectada à operação.', modules:[5,6,7,8,16,18], fields:[
      field('channel_map','Mapa de canais e jornada','Defina o papel de cada canal, sua prioridade e como o visitante avança entre descoberta, compra e pós-venda.'),
      field('store_plan','Loja, catálogo e experiência de compra','Organize categorias, descrições, apresentação dos produtos e testes de navegação e compra.'),
      field('operation_checklist','Checklist técnico e de lançamento','Planeje domínio, configuração, estoque, políticas, pagamentos e logística. Não salve senhas, tokens ou dados de pagamento.'),
      field('landing_page','Landing page','Redija a estrutura da página: oferta, headline, argumentos, evidências reais, CTA e plano de teste.'),
      field('landing_url','Link HTTPS da página ou protótipo','https://seu-prototipo.example',{type:'url',required:false})
    ]},
    {id:'conteudo', icon:'05', title:'Conteúdo e produção', subtitle:'Do planejamento à peça pronta para revisar.', modules:[10,12,13,14,20], fields:[
      field('content_pillars','Pilares e objetivos de conteúdo','Defina as linhas editoriais, o público, o papel no funil e os critérios de qualidade.'),
      field('content_plan','Plano de conteúdo e calendário','Registre pautas, formatos, canais, datas, responsáveis, objetivos e chamadas para ação.'),
      field('production_bank','Banca de produção e peças','Crie roteiros, legendas, descrições ou briefs de criativos. Registre o status de cada peça e o que falta revisar.'),
      field('content_distribution','Distribuição e reaproveitamento','Planeje publicação, adaptação por canal, reaproveitamento e acompanhamento. As publicações não são executadas por este hub.')
    ]},
    {id:'campanhas', icon:'06', title:'Campanhas e aquisição', subtitle:'Planeje e teste sem ativar gastos reais.', modules:[8,12,14,15,16,18,21], fields:[
      field('meta_campaign','Campanha Meta Ads','Planeje objetivo, oferta, público, território, criativos, orçamento simulado, eventos e critérios de otimização. Não ative anúncios para concluir o exercício.'),
      field('seo_google_plan','Estratégia de SEO e campanha Google Ads','Registre intenção de busca, palavras-chave, ações orgânicas, estrutura da campanha, anúncios, orçamento simulado e conversões.'),
      field('testing_plan','Plano de testes e aprendizado','Defina hipótese, variável a testar, evidências necessárias, critério de decisão e limite do teste.')
    ]},
    {id:'vendas', icon:'07', title:'Vendas e negociação', subtitle:'Um processo comercial que pode ser acompanhado.', modules:[3,8,12,19,22,24], fields:[
      field('sales_plan','Plano de vendas e negociação','Defina objetivos, oferta, etapas comerciais, critérios de qualificação, abordagem, negociação e follow-up.'),
      field('sales_pipeline','Funil e oportunidades simuladas','Desenhe etapas, responsáveis, regras de movimentação e próximos passos. Use oportunidades fictícias, sem dados pessoais.'),
      field('proposal_scope','Proposta, escopo e critérios de aceite','Registre entregas, limites, cronograma, precificação planejada e condições que precisam de validação profissional.')
    ]},
    {id:'atendimento', icon:'08', title:'CRM e relacionamento', subtitle:'A experiência continua depois do primeiro contato.', modules:[6,7,8,12,19,20,23], fields:[
      field('crm_flow','CRM, automação e fluxo de atendimento','Desenhe etapas, campos mínimos, gatilhos, mensagens, responsáveis, prazos e encaminhamento humano. Não inclua listas reais de contatos.'),
      field('service_playbook','Padrões de atendimento','Escreva orientações de abordagem, objeções, reclamações, tempos de resposta e escalonamento de situações.'),
      field('relationship_plan','Plano de relacionamento e pós-venda','Planeje onboarding, acompanhamento, pós-venda, fidelização e recuperação de confiança com respeito à privacidade.')
    ]},
    {id:'metricas', icon:'09', title:'Dados e performance', subtitle:'Evidências que orientam a próxima decisão.', modules:[4,15,16,17,18,21,23], fields:[
      field('tracking_plan','Rastreamento completo','Defina eventos, conversões, UTMs, ferramentas, consentimento, responsáveis e testes de validação. Não insira tokens ou identificadores secretos.'),
      field('metrics_dashboard','Dashboard de métricas','Relacione objetivos, KPIs, fórmulas, fontes, periodicidade, metas e decisões. Identifique explicitamente números simulados.'),
      field('performance_report','Relatório e decisões','Registre resultados observados ou simulados, limitações, hipóteses e recomendações. Não invente resultados de campanhas reais.'),
      field('dashboard_url','Link HTTPS do dashboard ou protótipo','https://seu-dashboard.example',{type:'url',required:false})
    ]},
    {id:'acervo', icon:'10', title:'Acervo e IA aplicada', subtitle:'Referências organizadas e revisão humana.', modules:[5,13,14,20,23], fields:[
      field('asset_register','Acervo de peças e referências','Liste peças, versões, localização dos arquivos, autoria e autorizações de uso. Não envie materiais sem permissão.'),
      field('ai_workflow','Rotina de IA e revisão humana','Registre onde a IA ajuda, os prompts usados, critérios de checagem, restrições de dados e o responsável pela revisão.'),
      field('portfolio_index','Índice do portfólio','Organize o que será apresentado e vincule cada peça ao objetivo e ao módulo correspondente.')
    ]},
    {id:'rotina', icon:'11', title:'Operação e entrega final', subtitle:'Uma banca operacional construída ao longo do curso.', modules:[1,2,6,7,13,19,21,22,23,24,25], fields:[
      field('operating_routine','Rotina, demandas e responsabilidades','Organize tarefas, prioridades, responsáveis, prazos, status e critérios de aprovação. Combine isso com os módulos já estudados.'),
      field('client_alignment','Alinhamento e acompanhamento','Planeje onboarding, reuniões, comunicação, gestão de expectativas, conflitos e revisão de escopo.'),
      field('final_presentation','Apresentação final do projeto','Monte o roteiro da apresentação: contexto, diagnóstico, escolhas, execução, indicadores, limitações e próximos passos.'),
      field('final_review','Revisão e próximos passos','Registre pendências, aprendizados, pontos a validar com o professor e melhorias priorizadas.')
    ]}
  ];
  const deliverableFields = [
    ['market_research'], ['territory_analysis'], ['swot'], ['brand_positioning'], ['brand_voice'], ['persona'], ['strategic_plan'], ['content_pillars','content_plan'], ['meta_campaign'], ['seo_google_plan'], ['tracking_plan'], ['landing_page'], ['crm_flow'], ['sales_plan'], ['metrics_dashboard'], ['relationship_plan'], ['final_presentation','final_review']
  ];
  const curriculum = window.SKS_CURRICULUM;
  const finalModule = curriculum?.modules?.find(m => m.number === 25);
  const deliverables = deliverableFields.map((ids, index) => ({id:finalModule?.lessons[index]?.id || `module-25-topic-${index+1}`, number:index+1, title:finalModule?.lessons[index]?.title || `Entregável ${index+1}`, fields:ids}));
  const fieldMap = new Map(sections.flatMap(section => section.fields.map(item => [item.id,{...item,sectionId:section.id}])));
  const moduleMap = Object.fromEntries(Array.from({length:25},(_,index) => [index+1,sections.filter(s => s.modules.includes(index+1)).map(s => s.id)]));
  const schema = {version:1,sections,deliverables,moduleMap};
  const blank = () => ({fields:{},submitted:[],reviewNotes:{}});
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const safeUrl = value => {try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;} catch {return false;}};
  function missing(hub, id) {
    const item = deliverables.find(d=>d.id===id);
    return item ? item.fields.filter(fieldId => !String(hub?.fields?.[fieldId] || '').trim()) : [];
  }
  function validate(raw) {
    const result=blank();
    if (!object(raw)) return result;
    if (object(raw.fields)) for (const [id,definition] of fieldMap) {
      const value=raw.fields[id];
      if (typeof value!=='string') continue;
      const limited=value.slice(0,definition.type==='url'?2048:20000);
      if (!limited || definition.type!=='url' || safeUrl(limited.trim())) result.fields[id]=definition.type==='url'?limited.trim():limited;
    }
    if (Array.isArray(raw.submitted)) result.submitted=[...new Set(raw.submitted)].filter(id=>deliverables.some(d=>d.id===id)&&missing(result,id).length===0);
    if (object(raw.reviewNotes)) for (const d of deliverables) if (typeof raw.reviewNotes[d.id]==='string') result.reviewNotes[d.id]=raw.reviewNotes[d.id].slice(0,5000);
    return result;
  }
  function update(raw,changes) {
    const hub=validate(raw), errors=[];
    if (object(changes)) for (const [id,value] of Object.entries(changes)) {
      const definition=fieldMap.get(id);
      if (!definition || typeof value!=='string') continue;
      if (definition.type==='url'&&value.trim()&&!safeUrl(value.trim())) {errors.push(`${definition.label}: use um endereço HTTPS sem usuário ou senha.`);continue;}
      hub.fields[id]=value.slice(0,definition.type==='url'?2048:20000);
    }
    return {hub:validate(hub),errors};
  }
  function submit(raw,id) {
    const hub=validate(raw), item=deliverables.find(d=>d.id===id), absent=item?missing(hub,id):['Entregável inválido'];
    if (!item||absent.length) return {ok:false,hub,missing:absent.map(fieldId=>fieldMap.get(fieldId)?.label||fieldId)};
    if (!hub.submitted.includes(id)) hub.submitted.push(id);
    return {ok:true,hub,missing:[]};
  }
  function unsubmit(raw,id) {const hub=validate(raw);hub.submitted=hub.submitted.filter(value=>value!==id);return hub;}
  function sectionsForModule(number) {return sections.filter(section=>section.modules.includes(Number(number)));}
  function sectionStats(section,hub) {
    const required=section.fields.filter(item=>item.required), filled=required.filter(item=>String(hub.fields[item.id]||'').trim()).length;
    return {filled,total:required.length,percent:Math.round(filled/required.length*100)};
  }
  function summary(raw) {
    const hub=validate(raw), required=[...fieldMap.values()].filter(item=>item.required), filled=required.filter(item=>String(hub.fields[item.id]||'').trim()).length;
    return {fields:required.length,total:required.length,filled,percent:Math.round(filled/required.length*100),sections:sections.length,startedSections:sections.filter(s=>sectionStats(s,hub).filled>0).length,ready:deliverables.filter(d=>!missing(hub,d.id).length).length,submitted:hub.submitted.length,deliverables:deliverables.length,totalDeliverables:deliverables.length};
  }
  function moduleTitle(number,ctx={}) {return (ctx.curriculum||curriculum)?.modules?.find(m=>m.number===number)?.title||`Módulo ${number}`;}
  function references(section,ctx,e) {
    return `<div class="hub-module-links" aria-label="Módulos que alimentam esta área">${section.modules.map(n=>`<a href="#modulo/module-${n}" title="${e(moduleTitle(n,ctx))}">Módulo ${n} · ${e(moduleTitle(n,ctx))}</a>`).join('')}</div>`;
  }
  function moduleCta(number,raw,escape=esc) {
    const linked=sectionsForModule(number), hub=validate(raw);
    if (!linked.length) return '';
    return `<aside class="hub-lesson-cta"><div><span class="hub-kicker">APRENDER + CONSTRUIR</span><h3>Leve este módulo para o seu cliente.</h3><p>O estudo alimenta seu hub aos poucos. Salvar um rascunho não conclui aulas nem aprova o projeto.</p></div><div class="hub-cta-links">${linked.map(s=>`<a class="outline" href="#projeto/${s.id}">${escape(s.title)} <span>${sectionStats(s,hub).filled}/${sectionStats(s,hub).total} campos</span> ↗</a>`).join('')}</div></aside>`;
  }
  function deliverableCard(item,hub,e) {
    const absent=missing(hub,item.id), submitted=hub.submitted.includes(item.id), linked=[...new Set(item.fields.map(id=>fieldMap.get(id).sectionId))];
    return `<article class="hub-deliverable ${submitted?'is-submitted':''}"><div class="hub-deliverable-title"><span class="hub-number">${String(item.number).padStart(2,'0')}</span><div><h3>${e(item.title)}</h3><p>${submitted?'Marcado por você para revisão':absent.length?`${item.fields.length-absent.length} de ${item.fields.length} campos-base preenchidos`:'Campos-base preenchidos · revise antes de marcar'}</p></div></div><div class="hub-deliverable-links">${linked.map(id=>`<a href="#projeto/${id}">${e(sections.find(s=>s.id===id).title)} →</a>`).join('')}<a href="#aula/${e(item.id)}">Ver orientação da entrega ↗</a></div><button class="${submitted?'quiet':'outline'}" type="button" ${submitted?`data-hub-unsubmit="${e(item.id)}"`:`data-hub-submit="${e(item.id)}"`} ${!submitted&&absent.length?'disabled':''}>${submitted?'Voltar para rascunho':'Marcar para revisão'}</button>${hub.reviewNotes[item.id]?`<p class="hub-review-note">Observação: ${e(hub.reviewNotes[item.id])}</p>`:''}</article>`;
  }
  function render(raw,ctx={}) {
    const hub=validate(raw), e=ctx.escape||esc, stats=summary(hub);
    return `<div class="page-heading"><p class="eyebrow">AGÊNCIA ESCOLA · APRENDIZAGEM APLICADA</p><h1>Meu hub do cliente</h1><p>Um projeto em branco. Cada módulo transforma conhecimento em uma parte da sua operação.</p></div><section class="hub-intro panel"><div><span class="hub-kicker">◇ PROJETO FINAL SKS</span><h2>${e(hub.fields.client_name?.trim()||'Seu cliente começa aqui.')}</h2><p>Não espere o módulo 25. Pesquise, escreva, teste em simulação e organize suas entregas enquanto estuda os 24 primeiros módulos. O projeto final reúne o que você construiu.</p><a class="button mint" href="#projeto/cliente">${stats.filled?'Continuar meu projeto':'Definir meu projeto'} ↗</a></div><div class="hub-progress"><b>${stats.percent}%</b><span>dos campos-base preenchidos</span><progress max="${stats.fields}" value="${stats.filled}" aria-label="Campos-base preenchidos">${stats.percent}%</progress><small>${stats.filled}/${stats.fields} campos · ${stats.submitted}/17 entregáveis marcados para revisão</small></div></section><div class="hub-info"><strong>Você constrói. O professor revisa.</strong> O hub começa sem conteúdos preenchidos. Textos de ajuda não são respostas. Este indicador mede preenchimento, não qualidade, aprovação ou conclusão do curso. Use dados fictícios ou autorizados; nunca inclua senhas, documentos ou dados de pagamento.</div><div class="section-heading"><div><h2>Sua banca operacional</h2><p>Abra uma área para criar os materiais e voltar às aulas relacionadas.</p></div><button type="button" class="outline" data-hub-report>Ver relatório do hub</button></div><div class="hub-grid">${sections.map(section=>{const status=sectionStats(section,hub);return `<a class="hub-section-card panel" href="#projeto/${section.id}"><div class="hub-card-top"><span class="hub-number">${section.icon}</span><span class="hub-status">${status.filled?'Em construção':'Em branco'}</span></div><h3>${e(section.title)}</h3><p>${e(section.subtitle)}</p><progress max="${status.total}" value="${status.filled}" aria-label="${e(section.title)}: campos preenchidos">${status.percent}%</progress><div class="hub-card-foot"><span>${status.filled}/${status.total} campos-base</span><span>Construir ↗</span></div></a>`;}).join('')}</div><section class="hub-roadmap panel"><h2>Estude e construa em paralelo</h2><p>A grade original de 25 módulos foi preservada. Cada módulo aponta para as áreas que você pode desenvolver.</p><div class="hub-roadmap-list">${Array.from({length:25},(_,i)=>{const number=i+1;return `<div><a href="#modulo/module-${number}"><b>${String(number).padStart(2,'0')}</b><span>${e(moduleTitle(number,ctx))}</span></a><div>${sectionsForModule(number).map(s=>`<a href="#projeto/${s.id}">${e(s.title)}</a>`).join('')}${number===25?'<a href="#projeto">Revisão dos 17 entregáveis</a>':''}</div></div>`;}).join('')}</div></section><div class="section-heading" id="entregaveis"><div><h2>As 17 entregas do projeto final</h2><p>Marque para revisão apenas após preencher e conferir os campos relacionados. Isso não é aprovação do professor.</p></div></div><div class="hub-deliverable-grid">${deliverables.map(item=>deliverableCard(item,hub,e)).join('')}</div>`;
  }
  function renderSection(id,raw,ctx={}) {
    const section=sections.find(item=>item.id===id);
    if (!section) return render(raw,ctx);
    const hub=validate(raw),e=ctx.escape||esc,status=sectionStats(section,hub),related=deliverables.filter(d=>d.fields.some(fieldId=>fieldMap.get(fieldId).sectionId===id));
    return `<a class="quiet" href="#projeto">← Voltar à banca operacional</a><div class="page-heading hub-section-heading"><p class="eyebrow">MEU HUB DO CLIENTE · ÁREA ${section.icon}</p><h1>${e(section.title)}</h1><p>${e(section.subtitle)} ${status.filled}/${status.total} campos-base preenchidos.</p></div><div class="hub-workspace"><section class="panel hub-form-panel"><form id="hub-form" data-hub-form data-section="${section.id}"><p class="hub-form-intro">Escreva com suas palavras. Os campos estão vazios para você construir a partir das aulas; as instruções abaixo servem apenas de orientação.</p>${section.fields.map(item=>`<div class="hub-field"><label for="hub-${item.id}">${e(item.label)} ${item.required?'<span class="hub-required">campo-base</span>':'<span class="hub-optional">opcional</span>'}</label><p id="hint-${item.id}">${e(item.prompt)}</p>${item.type==='textarea'?`<textarea id="hub-${item.id}" name="${item.id}" data-hub-field="${item.id}" aria-describedby="hint-${item.id}" rows="7" maxlength="20000" placeholder="Construa seu conteúdo aqui…">${e(hub.fields[item.id]||'')}</textarea>`:`<input id="hub-${item.id}" name="${item.id}" data-hub-field="${item.id}" aria-describedby="hint-${item.id}" type="${item.type}" maxlength="${item.type==='url'?2048:20000}" ${item.type==='url'?'pattern="https://.*"':''} value="${e(hub.fields[item.id]||'')}" placeholder="${item.type==='url'?'https://…':'Digite o nome do seu projeto'}">`}</div>`).join('')}<div class="hub-save-bar"><button class="button mint" type="submit">Salvar rascunho</button><span id="hub-save-status" role="status">Salve o rascunho para atualizar os indicadores e marcar entregáveis para revisão.</span></div></form></section><aside class="hub-workspace-aside"><section class="panel"><span class="hub-kicker">APRENDA PARA APLICAR</span><h2>Módulos relacionados</h2><p>Consulte as aulas e volte para desenvolver esta área.</p>${references(section,ctx,e)}</section><section class="panel"><h2>Cuidados do projeto</h2><p>Use um cliente fictício ou um trabalho autorizado. Não registre informações confidenciais. Campanhas, automações e publicações aqui são planejamentos: nenhuma ação externa é executada.</p><p>Salvar não significa aprovar. A qualidade das entregas depende de revisão humana.</p></section></aside></div>${related.length?`<div class="section-heading"><div><h2>Entregáveis que usam esta área</h2><p>Retome o roteiro final sem perder o trabalho feito ao longo dos módulos.</p></div></div><div class="hub-deliverable-grid">${related.map(item=>deliverableCard(item,hub,e)).join('')}</div>`:''}`;
  }
  function reportHtml(raw,ctx={}) {
    const hub=validate(raw),e=ctx.escape||esc;
    return `<article class="hub-print-report"><h1>Projeto Final SKS · ${e(hub.fields.client_name?.trim()||'Projeto sem nome')}</h1><p>Rascunho do aluno. Conteúdo preenchido não equivale a aprovação ou certificação. Nenhum resultado externo é verificado por este documento.</p>${sections.map(section=>`<section><h2>${section.icon} · ${e(section.title)}</h2>${section.fields.map(item=>`<div><h3>${e(item.label)}</h3><p>${hub.fields[item.id]?.trim()?e(hub.fields[item.id]).replace(/\r?\n/g,'<br>'):'<em>Não preenchido.</em>'}</p></div>`).join('')}</section>`).join('')}<section><h2>Entregas para revisão</h2><ol>${deliverables.map(item=>`<li>${e(item.title)} — ${hub.submitted.includes(item.id)?'Marcado pelo aluno para revisão':'Rascunho'}</li>`).join('')}</ol></section></article>`;
  }
  function sectionsForDeliverable(id) {
    const item=deliverables.find(d=>d.id===id);
    return item?sections.filter(s=>item.fields.some(fieldId=>s.fields.some(f=>f.id===fieldId))):[];
  }
  function deliverableCta(id,raw,escape=esc) {
    const linked=sectionsForDeliverable(id),hub=validate(raw);
    if(!linked.length)return '';
    return `<aside class="hub-lesson-cta"><span class="hub-kicker">ESTA ENTREGA NO SEU HUB</span><h3>Construa a entrega na sua banca operacional.</h3><p>As instruções da aula orientam o trabalho. Abra os campos do hub, escreva seu material e depois marque o entregável para revisão. Nenhum conteúdo da aula é copiado automaticamente.</p><div class="hub-cta-links">${linked.map(s=>`<a class="outline" href="#projeto/${s.id}">${escape(s.title)} <span>${sectionStats(s,hub).filled}/${sectionStats(s,hub).total} campos</span> ↗</a>`).join('')}</div></aside>`;
  }
  window.SKSProjectHub={schema,blank,validate,update,submit,unsubmit,summary,sectionsForModule,sectionsForDeliverable,render,renderSection,moduleCta,deliverableCta,reportHtml};
})();
