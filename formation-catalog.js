(() => {
'use strict';
const FS_CATEGORIES=['Todas as unidades','Negócios','Conteúdo','Tecnologia','Lifestyle','Infraestrutura','Sustentabilidade','Bem-estar'];
const fsSkill=(area,label)=>({area,label});
const FS_UNITS=[
  {id:'ia',name:'Laboratório de IA',description:'Onde o aluno aprende a usar IA para valer.',icon:'robot',progress:79,image:8,skills:[fsSkill('Tecnologia','Prompts, agentes e automações'),fsSkill('Conteúdo','Criação e revisão assistidas por IA'),fsSkill('Negócios','Aplicação de IA aos processos do negócio')]},
  {id:'agencia',name:'Agência Escola',description:'A operação completa de marketing sob demanda.',icon:'laptop',progress:80,image:2,skills:[fsSkill('Negócios','Planejamento de campanhas e posicionamento'),fsSkill('Conteúdo','Branding, criação e comunicação'),fsSkill('Tecnologia','Mídia digital, ferramentas e métricas')]},
  {id:'loja',name:'Loja Escola',description:'Varejo real, do balcão ao marketplace.',icon:'store',progress:75,image:0,skills:[fsSkill('Negócios','Atendimento e operação de varejo'),fsSkill('Negócios','Gestão visual de loja e vendas'),fsSkill('Lifestyle','Marcas, consumo e comunidades'),fsSkill('Sustentabilidade','Consumo e estoque responsáveis')]},
  {id:'cafe',name:'Café Escola',description:'Hospitalidade do grão à experiência.',icon:'coffee',progress:68,image:1,skills:[fsSkill('Negócios','Gestão de ponto e experiência do cliente'),fsSkill('Lifestyle','Hospitalidade e convivência'),fsSkill('Sustentabilidade','Uso consciente de insumos')]},
  {id:'estudio',name:'Estúdio de Conteúdo',description:'Da captura à publicação, sem fricção.',icon:'camera',progress:78,image:3,skills:[fsSkill('Conteúdo','Roteiro, captação e edição'),fsSkill('Tecnologia','Ferramentas de produção audiovisual'),fsSkill('Infraestrutura','Organização de estúdio e equipamentos')]},
  {id:'radio',name:'Rádio Escola',description:'A voz como ferramenta profissional.',icon:'mic',progress:72,image:4,skills:[fsSkill('Conteúdo','Locução, entrevistas e podcast'),fsSkill('Tecnologia','Captação, edição e distribuição de áudio')]},
  {id:'tv',name:'TV Escola',description:'Programa de TV, do roteiro à transmissão.',icon:'tv',progress:72,image:5,skills:[fsSkill('Conteúdo','Roteiro e linguagem audiovisual'),fsSkill('Tecnologia','Produção e transmissão de vídeo'),fsSkill('Infraestrutura','Operação de estúdio e equipamentos')]},
  {id:'marketplace',name:'Marketplace Escola',description:'Do cadastro à venda, em qualquer marketplace.',icon:'cart',progress:63,image:6,skills:[fsSkill('Negócios','Catálogo, vendas e operação de marketplace'),fsSkill('Tecnologia','Integrações e canais de comércio digital')]},
  {id:'logistico',name:'Centro Logístico',description:'Movimento, estoque e expedição com eficiência.',icon:'package',progress:58,image:7,skills:[fsSkill('Infraestrutura','Armazenagem, expedição e transporte'),fsSkill('Negócios','Gestão de estoque e fluxo operacional'),fsSkill('Sustentabilidade','Redução de perdas e uso de recursos')]},
  {id:'dados',name:'Centro de Dados',description:'Decisão baseada em dado, não em achismo.',icon:'chart',progress:72,image:9,skills:[fsSkill('Tecnologia','Coleta, análise e visualização de dados'),fsSkill('Negócios','Indicadores para tomada de decisão'),fsSkill('Infraestrutura','Organização e qualidade da informação')]},
  {id:'negocios',name:'Centro de Negócios',description:'Da ideia ao negócio estruturado.',icon:'briefcase',progress:69,image:10,skills:[fsSkill('Negócios','Modelo de negócio, estratégia e gestão'),fsSkill('Negócios','Propostas, negociação e crescimento')]},
  {id:'atendimento',name:'Central de Atendimento',description:'Cada contato vira uma oportunidade.',icon:'headset',progress:92,image:11,skills:[fsSkill('Negócios','Relacionamento, CRM e pós-venda'),fsSkill('Tecnologia','Canais e automações de atendimento')]},
  {id:'coworking',name:'Coworking Escola',description:'Trabalhar junto muda o jogo.',icon:'users',progress:67,image:12,skills:[fsSkill('Negócios','Colaboração e organização do trabalho'),fsSkill('Lifestyle','Comunidade, convivência e networking'),fsSkill('Infraestrutura','Uso compartilhado dos ambientes')]},
  {id:'eventos',name:'Centro de Eventos',description:'A experiência do evento importa.',icon:'star',progress:62,image:13,skills:[fsSkill('Conteúdo','Comunicação e produção de eventos'),fsSkill('Infraestrutura','Planejamento, montagem e operação'),fsSkill('Lifestyle','Experiências e encontros da comunidade')]},
  {id:'biblioteca',name:'Biblioteca Inteligente',description:'Saber pesquisar é saber decidir.',icon:'book',progress:80,image:14,skills:[fsSkill('Conteúdo','Pesquisa e organização do conhecimento'),fsSkill('Tecnologia','Curadoria e busca de informação'),fsSkill('Infraestrutura','Organização do acervo de aprendizagem')]},
  {id:'sustentabilidade',name:'Laboratório de Sustentabilidade',description:'Negócios que cuidam do entorno.',icon:'leaf',progress:53,image:15,skills:[fsSkill('Sustentabilidade','Práticas sustentáveis e impacto local'),fsSkill('Negócios','Responsabilidade na operação dos negócios')]},
  {id:'idiomas',name:'Escola de Idiomas',description:'Outra língua, outra carreira.',icon:'globe',progress:58,image:16,skills:[fsSkill('Conteúdo','Comunicação e repertório intercultural'),fsSkill('Negócios','Comunicação aplicada ao trabalho'),fsSkill('Lifestyle','Intercâmbio e conexão entre culturas')]},
  {id:'bem-estar',name:'Centro de Bem-Estar e Práticas Integrativas',description:'Saúde, equilíbrio e qualidade de vida.',icon:'heart',progress:55,image:17,skills:[fsSkill('Bem-estar','Autocuidado, equilíbrio e bem-estar'),fsSkill('Lifestyle','Rotina, convivência e qualidade de vida')]}
];
const FS_PHASES=[['Fundamentos','book'],['Operação','briefcase'],['Marketing','chart'],['Comportamento','users'],['Tráfego','globe'],['CRM e Vendas','headset'],['Inteligência Artificial','robot'],['Escala','star']];
function fsEscape(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function fsIcon(name){
  const paths={
    award:'<circle cx="12" cy="8" r="5"/><path d="M8.8 12 7 22l5-3 5 3-1.8-10"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    flask:'<path d="M9 3h6"/><path d="M10 3v6l-5.2 8.7A2.2 2.2 0 0 0 6.7 21h10.6a2.2 2.2 0 0 0 1.9-3.3L14 9V3"/><path d="M7.2 16h9.6"/>',
    bot:'<rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 3v4M8 12h.01M16 12h.01M8 16h8"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',

    store:'<path d="M3 9h18l-2-6H5Zm1 0v12h16V9M8 21v-7h8v7M3 9v2a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 2-2V9"/>',
    coffee:'<path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Zm12 1h2a3 3 0 0 1 0 6h-2M3 22h17M8 2v3m4-3v3m4-3v3"/>',
    laptop:'<rect x="4" y="3" width="16" height="13" rx="1.5"/><path d="M2 19h20l-1 2H3ZM8 19h8"/>',
    camera:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="m8 7 1-3h6l1 3M10 11l6 3-6 3Z"/>',
    mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2m-6 8v4m-4 0h8M10 6h4m-4 3h4"/>',
    tv:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="m8 2 4 4 4-4M8 10h8v7H8Z"/>',
    cart:'<path d="M2 3h3l3 13h11l3-9H6m2 6h12M10 7v6m5-6v6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
    package:'<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10v10M3 7l9 5 9-5M7 4l10 6"/>',
    robot:'<rect x="3" y="7" width="18" height="14" rx="4"/><path d="M12 7V4m-4 13h8M1 12v5m22-5v5"/><circle cx="12" cy="2.5" r="1.5"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>',
    chart:'<path d="M3 3v18h19M7 17v-5m5 5V9m5 8V6M6 8l6-4 5 1 4-3"/>',
    briefcase:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V3h8v4M2 12l10 3 10-3m-10 1v4"/>',
    headset:'<path d="M4 15v-4a8 8 0 0 1 16 0v4M4 13H2v7h5v-7Zm16 0h2v7h-5v-7Zm0 7v1a2 2 0 0 1-2 2h-5"/>',
    users:'<circle cx="12" cy="6" r="3"/><circle cx="4" cy="8" r="2"/><circle cx="20" cy="8" r="2"/><path d="M6 22v-5a6 6 0 0 1 12 0v5M1 20v-5a3 3 0 0 1 4-3m18 8v-5a3 3 0 0 0-4-3"/>',
    star:'<path d="m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z"/>',
    book:'<path d="M12 5C9 3 6 3 3 4v17c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v17M6 7h3m6 0h3M6 10h3m6 0h3"/>',
    leaf:'<path d="M5 18C-1 7 13 2 21 2c0 12-4 20-13 17M3 22 17 7M9 15l-2-5m6 1 5 1"/>',
    globe:'<circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4.5" ry="10"/><path d="M2 12h20M4 6h16M4 18h16"/>',
    heart:'<path d="M12 22 3 13C-3 6 6-2 12 5c6-7 15 1 9 8Z"/>',
    arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
    x:'<path d="m6 6 12 12M6 18 18 6"/>'
  };
  return '<svg class="fs-symbol" viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.book)+'</svg>';
}
function fsImageStyle(index){
  const row=Math.floor(index/3),column=index%3;
  // O atlas tem 3 colunas e 6 linhas. O recorte 16:9 preserva a proporção das cenas.
  const y=(row*(2/3)+(2/3-9/16)/2)/(4-9/16)*100;
  if(index===2)return 'background-image:url(assets/formacoes/agencia.webp);background-size:cover;background-position:center;';
  if(index===0)return 'background-image:url(assets/formacoes/loja.webp);background-size:cover;background-position:center;';
  return '--fs-image-x:'+(column*50)+'%;--fs-image-y:'+y.toFixed(6)+'%;';
}
function fsLockIcon(){return '<svg class="fs-symbol" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></svg>';}
function fsMethodology(rank){
  const levels=window.SKSStudentCore?.agentLevels||[];
  const icons=['book','users','star','award','briefcase','star'];
  return '<section class="fs-methodology fs-agent-track" aria-label="Evolução do Agente SKS"><span>Evolução do Agente SKS'+(rank?' · '+rank.done+'/'+rank.total+' etapas concluídas':'')+'</span><ol>'+levels.map((level,index)=>{
    const institutional=!!rank?.institutionalMentor;
    const status=rank?.level===level.level?'is-current':rank&&!institutional&&rank.level>level.level?'is-reached':'is-future';
    const next=levels[index+1]?.minPercent??100;
    const fill=rank&&!institutional?(index===levels.length-1?(rank.percent>=100?100:0):Math.max(0,Math.min(100,(rank.percent-level.minPercent)*100/Math.max(1,next-level.minPercent)))):0;
    const count=rank?(status==='is-current'?(institutional?'Mentor institucional':rank.percent+'% de evolução'):status==='is-reached'?'Nível alcançado':level.minPercent+'% para alcançar'):'Progresso indisponível';
    return '<li class="'+status+'" title="'+fsEscape(level.name)+' — '+fsEscape(count)+'"><span class="fs-phase-icon">'+fsIcon(icons[index])+'</span><span class="fs-phase-number">'+String(level.level).padStart(2,'0')+'</span><span class="fs-agent-name">'+fsEscape(level.name.replace('Agente ','').replace('em Formação','Formação'))+'</span><span class="fs-agent-count">'+fsEscape(count)+'</span><span class="fs-agent-meter" role="progressbar" aria-label="'+fsEscape(level.name)+'" aria-valuemin="0" aria-valuemax="100"'+(rank?' aria-valuenow="'+Math.round(fill)+'"':' aria-valuetext="Indisponível"')+'><i style="width:'+fill+'%"></i></span></li>';
  }).join('')+'</ol></section>';
}
function recommendations(state, svg, resolveHref = href => href){
  const curriculum=window.SKS_CURRICULUM,done=new Set(state?.completed||[]);
  const next=state?curriculum.modules.find(module=>module.lessons.some(topic=>topic.type!=='deliverable'&&!done.has(topic.id))):null;
  const allDone=!!state&&!next;
  const moduleTitle=next?'Módulo '+String(next.number).padStart(2,'0')+' · '+next.title:allDone?'Revise seu percurso':'Sua próxima etapa';
  const moduleHref=next?'aluno.html#modulo/'+encodeURIComponent(next.id):'aluno.html#formacao/agencia';
  const items=[
    ['Módulo',moduleTitle,next?'Continue de onde seu aprendizado está.':allDone?'Confira seu percurso e as entregas pendentes.':'Abra sua formação para consultar as aulas.',moduleHref,next?'Continuar':'Ver formação','book','#f45b66'],
    ['Laboratório','Laboratório de IA','Explore ferramentas para aplicar no seu projeto.','#/ferramentas-ia','Explorar','bot','#ad83f8'],
    ['Certificação','Sua certificação SKS','Consulte os critérios e a situação da sua formação.','aluno.html#certificados','Ver certificação','award','#e7ab4d'],
    ['Evento','Encontros da comunidade','Consulte as atividades disponíveis na Agenda SKS.','#/eventos','Ver agenda','calendar','#f45b66']
  ];
  return '<section class="sd-next" aria-labelledby="sd-next-title"><div class="sd-section-head"><h3 id="sd-next-title">Próximos passos recomendados para você</h3><span>Aprenda. Aplique. Conecte.</span></div><div class="sd-next-grid">'+items.map(([category,title,description,href,cta,ico,color])=>'<article class="sd-next-card" style="--sd-accent:'+color+'"><span class="sd-next-icon">'+svg(ico)+'</span><div class="sd-next-copy"><span class="sd-kicker">'+category+'</span><h4>'+fsEscape(title)+'</h4><p>'+description+'</p></div><a class="btn btn--ghost" href="'+fsEscape(resolveHref(href))+'">'+cta+' '+svg('arrow')+'</a></article>').join('')+'</div></section>';
}

window.SKSFormationCatalog = Object.freeze({FS_CATEGORIES, FS_UNITS, FS_PHASES, fsEscape, fsIcon, fsImageStyle, fsLockIcon, fsMethodology, recommendations});
})();
