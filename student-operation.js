(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    link:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
    store:'<path d="M3 10V6l2-3h14l2 3v4M4 10v11h16V10M2 10c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0M9 21v-7h6v7"/>',
    palette:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-3-4-5-9-5Z"/><path d="M7 8h.01M11 6h.01M16 7h.01M6 13h.01"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="m12 12 7-7M17 3h4v4"/>',
    flag:'<path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
    folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l3 4h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
    chart:'<path d="M4 3v18h17M8 16v-4m5 4V6m5 10v-7"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6M9 3v3h6V3"/>',
    chat:'<path d="M21 14a3 3 0 0 1-3 3H8l-5 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z"/><path d="M7 8h10M7 12h6"/>',
    cart:'<path d="M2 3h3l3 12h11l3-9H6M9 21h.01M18 21h.01"/>',
    globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
  };
  const icon = name => `<svg class="sop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.grid}</svg>`;
  const areas = [
    ['cliente','perfil','Cliente e negócio','store','business_context','cyan'],
    ['estrategia','estrategia','Pesquisa e estratégia','target','strategic_plan','purple'],
    ['marca','identidade','Marca e comunicação','palette','brand_positioning','rose'],
    ['canais','canais','Canais e experiência','globe','channel_map','blue'],
    ['conteudo','conteudo','Conteúdo e produção','folder','content_plan','amber'],
    ['campanhas','campanhas','Campanhas e aquisição','flag','meta_campaign','purple'],
    ['vendas','vendas','Vendas e negociação','cart','sales_plan','green'],
    ['atendimento','atendimento','CRM e relacionamento','chat','crm_flow','blue'],
    ['metricas','resultados','Dados e performance','chart','performance_report','cyan'],
    ['acervo','materiais','Acervo e IA aplicada','folder','asset_register','amber'],
    ['rotina','acoes','Operação e entrega final','arrow','operating_routine','green']
  ];
  const views = [
    ['visao','Visão geral','grid','Seu negócio'],['acessos','Acessos rápidos','link','Seu negócio'],
    ['personalizar','Personalizar central','palette','Seu negócio'],
    ...areas.map(([section,id,title,symbol])=>[id,title,symbol,'Banca operacional']),
    ['entregas','Entregas do projeto','check','Acompanhamento']
  ];
  function safeUrl(raw) {
    try {const u=new URL(String(raw).trim());return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';} catch {return '';}
  }
  function imageFromDirection(text,label) {
    const line=String(text).split(/\r?\n/).find(item=>new RegExp('^\\s*'+label+'\\s*:', 'i').test(item));
    return line ? safeUrl(line.slice(line.indexOf(':')+1)) : '';
  }
  function brandSettings(direction) {
    const text=String(direction||'');
    return {logo:imageFromDirection(text,'Logo'),cover:imageFromDirection(text,'Capa'),accent:text.match(/(?:^|\n)\s*Cor\s*:\s*(#[0-9a-f]{6})\b/i)?.[1]||text.match(/#[0-9a-f]{6}\b/i)?.[0]||''};
  }
  function updateBrand(direction,values) {
    for(const label of ['logo','cover'])if(values[label]&&!safeUrl(values[label]))return {error:'Use um link HTTPS válido para '+(label==='logo'?'o logo.':'a capa.')};
    if(values.accent&&!/^#[0-9a-f]{6}$/i.test(values.accent))return {error:'Escolha uma cor válida.'};
    const original=String(direction||'').split(/\r?\n/).filter(line=>!/^\s*(Logo|Capa|Cor)\s*:/i.test(line)).join('\n').trim();
    const lines=[original,values.logo?'Logo: '+safeUrl(values.logo):'',values.cover?'Capa: '+safeUrl(values.cover):'',values.accent?'Cor: '+values.accent:''].filter(Boolean);
    const result=lines.join('\n');
    return result.length>20000?{error:'A direção visual atingiu o limite. Reduza o texto antes de salvar.'}:{value:result};
  }
  const edit = (section,label='Construir nesta área') => `<a class="outline" href="#operacao/editar-${esc(section)}">${esc(label)} ↗</a>`;
  function unifiedLinks(markup) {
    return markup.replace(/href="#projeto\/([^"/]+)"/g,'href="#operacao/editar-$1"').replace(/href="#projeto"/g,'href="#operacao"');
  }
  function fieldCard(field,section,fields) {
    const value=(fields[field.id] || '').trim();
    return `<article class="sop-card ${value?'':'sop-card--empty'}"><div class="sop-card-heading"><h3>${esc(field.label)}</h3><span class="sop-status">${value?'Registrado':'A preencher'}</span></div>${value?`<p class="sop-field-value">${esc(value)}</p>`:'<p class="sop-empty">Nenhuma informação registrada nesta área.</p>'}<div class="sop-card-actions">${edit(section,value?'Editar registro':'Começar a construir')}</div></article>`;
  }
  function sectionCards(section,fields) {
    return `<section class="sop-section" aria-labelledby="sop-section-${esc(section.id)}"><div class="sop-section-heading"><div><span class="sop-eyebrow">ÁREA ${esc(section.icon)}</span><h2 id="sop-section-${esc(section.id)}">${esc(section.title)}</h2><p>${esc(section.subtitle)}</p></div>${edit(section.id,'Editar esta área')}</div><div class="sop-fields">${section.fields.map(f=>fieldCard(f,section.id,fields)).join('')}</div></section>`;
  }
  function quickLinks(fields,schema) {
    const found=new Map();
    for (const section of schema.sections) for(const field of section.fields) {
      if(field.id==='visual_system')continue;
      const value=(fields[field.id]||'').trim();
      const candidates=field.type==='url'?[value]:value.match(/https:\/\/[^\s<>"']+/g)||[];
      for(const raw of candidates){const url=safeUrl(raw.replace(/[),.;]+$/,''));if(url&&!found.has(url))found.set(url,{url,label:field.label,section:section.id});}
    }
    return [...found.values()];
  }
  function linksMarkup(links) {
    return links.length?`<div class="sop-links-grid">${links.map(item=>`<a class="sop-link-card" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${icon('link')}<span><strong>${esc(item.label)}</strong><small>${esc(new URL(item.url).hostname)}</small></span><span aria-hidden="true">↗</span></a>`).join('')}</div>`:'<div class="sop-card sop-empty-state">'+icon('link')+'<h3>Seus acessos começam aqui</h3><p>Cadastre os links do seu negócio nas áreas da banca operacional.</p>'+edit('canais','Cadastrar meus canais')+'</div>';
  }
  function fileLinks(fields) {
    const links=[];
    for(const line of String(fields.asset_register||'').split(/\r?\n/)){
      const raw=line.match(/https:\/\/[^\s<>"']+/)?.[0];
      const url=raw&&safeUrl(raw.replace(/[),.;]+$/,''));if(!url||links.some(item=>item.url===url))continue;
      const label=line.slice(0,line.indexOf(raw)).replace(/[|:\s–—-]+$/,'').trim().slice(0,160)||'Arquivo do projeto';links.push({url,label});
    }
    return links;
  }
  function filesMarkup(fields) {
    const files=fileLinks(fields);
    return `<section class="sop-section"><div class="sop-section-heading"><div><span class="sop-eyebrow">MATERIAIS DO SEU PROJETO</span><h2>Arquivos e downloads</h2><p>Links dos materiais que você registrou no acervo.</p></div>${edit('acervo','Organizar arquivos')}</div>${files.length?`<div class="sop-links-grid">${files.map(file=>`<a class="sop-link-card" href="${esc(file.url)}" target="_blank" rel="noopener noreferrer" download>${icon('download')}<span><strong>${esc(file.label)}</strong><small>Abrir / baixar arquivo ↗</small></span></a>`).join('')}</div><p class="sop-footnote">O arquivo abre no serviço onde está guardado. O download depende das permissões desse serviço.</p>`:'<div class="sop-card sop-empty-state">'+icon('folder')+'<h3>Seu acervo ainda está vazio</h3><p>Registre cada material em uma linha: nome da peça e link HTTPS do arquivo compartilhado.</p>'+edit('acervo','Adicionar meus materiais')+'</div>'}<div class="sop-actions"><button class="outline" type="button" data-hub-download>${icon('download')} Baixar registros do projeto</button></div></section>`;
  }
  function creationTools() {
    return `<div class="sop-creative-grid"><article class="sop-creative-card"><img src="assets/hub-criacao.webp" alt="Bancada de produção de conteúdo" loading="lazy"><div><span class="sop-eyebrow">CRIE E EXPERIMENTE</span><h3>Da ideia ao criativo</h3><p>Abra o Canva para produzir suas peças. Depois, registre o link do material no acervo.</p><a class="outline" href="https://www.canva.com/" target="_blank" rel="noopener noreferrer">Abrir Canva ↗</a></div></article><article class="sop-creative-card"><img src="assets/hub-identidade.webp" alt="Referências de identidade e comunicação visual" loading="lazy"><div><span class="sop-eyebrow">O SEU NEGÓCIO, A SUA IDENTIDADE</span><h3>Uma central com a sua marca</h3><p>Escolha o logo, a capa e a cor que representam o seu projeto.</p><a class="outline" href="#operacao/personalizar">Personalizar central ↗</a></div></article></div>`;
  }
  function deliveries(hub,schema) {
    return `<div class="sop-deliveries">${schema.deliverables.map(item=>{
      const missing=item.fields.filter(id=>!String(hub.fields[id]||'').trim()),submitted=hub.submitted.includes(item.id);
      const sections=schema.sections.filter(s=>s.fields.some(f=>item.fields.includes(f.id)));
      return `<article class="sop-delivery"><span class="sop-delivery-number">${String(item.number).padStart(2,'0')}</span><div><h3>${esc(item.title)}</h3><p>${submitted?'Marcado pelo aluno para revisão':missing.length?'Rascunho · faltam campos-base':'Campos-base preenchidos · aguardando envio para revisão'}</p>${hub.reviewNotes[item.id]?`<p class="hub-review-note">Observação: ${esc(hub.reviewNotes[item.id])}</p>`:''}<div class="sop-actions">${sections.map(s=>edit(s.id,'Editar '+s.title)).join('')}<a class="outline" href="#aula/${esc(item.id)}">Orientação da entrega ↗</a><button class="outline" type="button" ${submitted?`data-hub-unsubmit="${esc(item.id)}"`:`data-hub-submit="${esc(item.id)}"`} ${!submitted&&missing.length?'disabled':''}>${submitted?'Voltar para rascunho':'Marcar para revisão'}</button></div></div></article>`;
    }).join('')}</div><p class="sop-footnote">O preenchimento e o envio para revisão não equivalem à aprovação ou à certificação.</p>`;
  }
  function overview(model) {
    const {fields,stats,links,brand,logo,cover,schema,hub}=model;
    const initials=brand.split(/\s+/).filter(Boolean).slice(0,2).map(p=>Array.from(p)[0]).join('').toLocaleUpperCase('pt-BR');
    return `<section class="sop-hero sop-hero--photo"><img class="sop-cover" src="${esc(cover||'assets/hub-bancada.webp')}" alt="${cover?'Capa cadastrada para '+esc(brand):'Ambiente de trabalho criativo'}" referrerpolicy="no-referrer"><div class="sop-hero-copy"><span class="sop-eyebrow">SEU NEGÓCIO · HUB DO CLIENTE</span><h1>${esc(brand)}</h1><p class="sop-hero-headline">Marca, campanha e<br>operação em<br><span>uma única bancada.</span></p><p class="sop-hero-description">Aprenda, construa e coloque suas ideias em movimento. Tudo o que você desenvolve para o seu negócio fica aqui.</p><div class="sop-actions"><button class="outline" type="button" data-operation-banca>Explorar minha bancada ↓</button><a class="outline" href="#operacao/editar-cliente">${stats.filled?'Continuar meu projeto':'Definir meu projeto'} ↗</a></div></div><div class="sop-brand-tile">${logo?`<img src="${esc(logo)}" alt="Logo de ${esc(brand)}" referrerpolicy="no-referrer">`:`<span class="sop-brand-initials" aria-hidden="true">${esc(initials)}</span>`}<strong>${esc(brand)}</strong><span>${logo?'Identidade do projeto':'Seu negócio, seu espaço'}</span>${!logo?'<small>Logo ainda não cadastrado</small>':''}</div></section>
      <section class="sop-stats" aria-label="Indicadores do projeto"><article class="sop-stat">${icon('chart')}<div><strong>${stats.percent}%</strong><span>Campos-base preenchidos</span><small>${stats.filled} de ${stats.fields} campos</small><progress max="${stats.fields}" value="${stats.filled}" aria-label="Preenchimento do projeto">${stats.percent}%</progress></div></article><article class="sop-stat">${icon('check')}<div><strong>${stats.submitted}<small> / ${stats.deliverables}</small></strong><span>Entregas para revisão</span><small>Registradas pelo aluno</small></div></article><article class="sop-stat">${icon('grid')}<div><strong>${stats.startedSections}<small> / ${stats.sections}</small></strong><span>Áreas em construção</span><small>Com pelo menos um campo-base</small></div></article></section>
      <section class="sop-section" id="sop-banca"><div class="sop-section-heading"><div><span class="sop-eyebrow">DO APRENDIZADO À PRÁTICA</span><h2>Sua banca operacional</h2><p>Uma área para cada parte do seu negócio. Construa com as aulas e retome de onde parou.</p></div><button class="outline" type="button" data-hub-report>Ver relatório do projeto</button></div><div class="sop-overview-grid">${areas.map(([section,view,title,symbol,id,color])=>{
        const definition=schema.sections.find(s=>s.id===section),required=definition.fields.filter(f=>f.required),filled=required.filter(f=>String(hub.fields[f.id]||'').trim()).length;
        return `<article class="sop-overview-card sop-tone-${color}"><div class="sop-area-top"><span class="sop-area-icon">${icon(symbol)}</span><span class="sop-status">${filled?'Em construção':'Em branco'}</span></div><h3>${title}</h3><p class="sop-preview-text">${fields[id]?.trim()?esc(fields[id].trim().slice(0,170))+(fields[id].trim().length>170?'…':''):esc(definition.subtitle)}</p><div class="sop-area-progress"><progress max="${required.length}" value="${filled}" aria-label="${title}: campos preenchidos">${Math.round(filled/required.length*100)}%</progress><span>${filled}/${required.length} campos-base</span></div><div class="sop-actions">${edit(section,filled?'Continuar':'Construir')}<a class="quiet" href="#operacao/${view}" aria-label="Ver registros de ${title}">Ver registros ↗</a></div></article>`;
      }).join('')}</div></section>
      <section class="sop-section"><div class="sop-section-heading"><div><span class="sop-eyebrow">SUA MESA DE CRIAÇÃO</span><h2>Crie, organize e compartilhe</h2></div></div>${creationTools()}</section>
      <section class="sop-section"><div class="sop-section-heading"><div><span class="sop-eyebrow">SEUS AMBIENTES</span><h2>Acessos rápidos</h2></div><a class="outline" href="#operacao/acessos">Ver todos ↗</a></div>${linksMarkup(links.slice(0,4))}</section>${filesMarkup(fields)}
      <section class="sop-card sop-review-strip"><div>${icon('check')}<h3>As entregas que constroem seu projeto</h3><p>Acompanhe as 17 entregas e as observações registradas durante a formação.</p></div><a class="outline" href="#operacao/entregas">Acompanhar entregas ↗</a></section>
      <p class="sop-footnote">O progresso desta central mede os registros do projeto. Resultados comerciais aparecem somente quando documentados por você.</p>`;
  }
  function personalize(model) {
    return `<header class="sop-page-heading"><span class="sop-eyebrow">${esc(model.brand)}</span><h1>Uma central com a sua marca</h1><p>Use as imagens e as cores do seu negócio para dar identidade à bancada.</p></header><form id="hub-brand-form" class="sop-card sop-brand-form"><label for="sop-logo">Link do logo</label><input id="sop-logo" name="logo" type="url" maxlength="2048" placeholder="https://…" value="${esc(model.logo)}"><small>Link HTTPS de uma imagem compartilhada do seu negócio.</small><label for="sop-cover">Link da foto de capa</label><input id="sop-cover" name="cover" type="url" maxlength="2048" placeholder="https://…" value="${esc(model.cover)}"><small>Sem capa própria, usamos uma fotografia de ambiente criativo.</small><label for="sop-accent">Cor da marca</label><input id="sop-accent" name="accent" type="color" value="${esc(model.accent||'#64d9cb')}"><p class="sop-footnote">A cor personaliza os detalhes da central. Os botões mantêm o padrão do ecossistema.</p><div class="sop-actions"><button class="outline" type="submit">Salvar identidade</button><a class="outline" href="#operacao">Voltar à visão geral</a></div><p role="status" id="hub-save-status">As alterações ficam vinculadas ao seu projeto.</p></form>`;
  }
  function render(ctx,requested='visao') {
    const hubApi=window.SKSProjectHub,hub=hubApi.validate(ctx.state?.hub),schema=hubApi.schema,fields=hub.fields,stats=hubApi.summary(hub);
    const editing=String(requested).startsWith('editar-')?schema.sections.find(s=>s.id===String(requested).slice(7)):null;
    const view=editing?'editar-'+editing.id:views.some(v=>v[0]===requested)?requested:'visao';
    const brand=fields.client_name?.trim() || 'Seu negócio',settings=brandSettings(fields.visual_system),links=quickLinks(fields,schema);
    const model={fields,hub,schema,stats,links,brand,...settings};
    let body='';
    if(editing)body=unifiedLinks(hubApi.renderSection(editing.id,hub,{escape:esc,curriculum:ctx.curriculum}));
    else if(view==='visao')body=overview(model);
    else if(view==='personalizar')body=personalize(model);
    else {
      const selected=views.find(v=>v[0]===view);
      body=`<header class="sop-page-heading"><span class="sop-eyebrow">${esc(brand)}</span><h1>${esc(selected[1])}</h1><p>Os registros e materiais que você constrói para o seu negócio.</p></header>`;
      if(view==='acessos')body+=linksMarkup(links)+`<div class="sop-actions">${edit('canais','Cadastrar canais e links')}</div>`;
      else if(view==='entregas')body+=deliveries(hub,schema);
      else {
        const section=areas.find(a=>a[1]===view)?.[0];
        body+=sectionCards(schema.sections.find(s=>s.id===section),fields);
        if(view==='materiais')body+=filesMarkup(fields);
        if(view==='conteudo')body+=creationTools();
        if(view==='identidade')body+=`<div class="sop-actions"><a class="outline" href="#operacao/personalizar">Personalizar logo, capa e cor ↗</a></div>`;
      }
    }
    if(ctx.review?.feedback)body=`<section class="sop-card sop-feedback"><span class="sop-eyebrow">DEVOLUTIVA DO PROFESSOR</span><p class="sop-field-value">${esc(ctx.review.feedback)}</p></section>`+body;
    const active=editing?areas.find(a=>a[0]===editing.id)?.[1]:view;
    let previousGroup='';
    const nav=views.map(([id,label,symbol,group])=>{
      const heading=group!==previousGroup?`<span class="sop-nav-group">${group}</span>`:'';previousGroup=group;
      return `${heading}<a href="#operacao/${id}" class="sop-nav-link ${active===id?'is-active':''}" ${active===id?'aria-current="page"':''}>${icon(symbol)}<span>${label}</span></a>`;
    }).join('');
    return `<div class="sop-root"${settings.accent?` style="--sop-project-accent:${settings.accent}"`:''}><div class="sop-topline"><a class="outline" href="#inicio">← Voltar à minha jornada</a><span>${ctx.readOnly?'Consulta do professor · somente leitura':ctx.user?.role==='preview'?'Prévia local · dados deste navegador':'Projeto vinculado à sua conta'}</span></div><div class="sop-shell"><aside class="sop-sidebar"><div class="sop-brand-heading"><span class="sop-brand-mark" aria-hidden="true">${icon('store')}</span><div><strong>${esc(brand)}</strong><span>HUB DO CLIENTE · SKS</span></div></div><nav aria-label="Áreas da central operacional">${nav}</nav><div class="sop-sidebar-foot">SMART · KEY · SOCIAL<span>Construído ao longo da formação</span></div></aside><div class="sop-main">${body}</div></div></div>`;
  }
  document.addEventListener('error',event=>{
    const image=event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest('.sop-root')) return;
    if(image.matches('.sop-cover')&&!image.src.endsWith('/assets/hub-bancada.webp')){image.src='assets/hub-bancada.webp';image.alt='Ambiente de trabalho criativo';return;}
    image.hidden=true;
    if(image.matches('.sop-brand-tile img')){const notice=document.createElement('small');notice.textContent='Logo indisponível. Confira o link na personalização.';image.parentElement.append(notice);}
  },true);
  window.SKSStudentOperation=Object.freeze({render,updateBrand});
})();
