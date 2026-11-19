(() => {
  'use strict';
  const catalog=Object.freeze([{"id": "agencia", "name": "Agência Escola", "description": "A operação completa de marketing sob demanda.", "image": 2}, {"id": "cafe", "name": "Café Escola", "description": "Hospitalidade do grão à experiência.", "image": 1}, {"id": "loja", "name": "Loja Escola", "description": "Varejo real, do balcão ao marketplace.", "image": 0}, {"id": "estudio", "name": "Estúdio de Conteúdo", "description": "Da captura à publicação, sem fricção.", "image": 3}, {"id": "radio", "name": "Rádio Escola", "description": "A voz como ferramenta profissional.", "image": 4}, {"id": "tv", "name": "TV Escola", "description": "Programa de TV, do roteiro à transmissão.", "image": 5}, {"id": "marketplace", "name": "Marketplace Escola", "description": "Do cadastro à venda, em qualquer marketplace.", "image": 6}, {"id": "logistico", "name": "Centro Logístico", "description": "Movimento, estoque e expedição com eficiência.", "image": 7}, {"id": "ia", "name": "Laboratório de IA", "description": "Onde o aluno aprende a usar IA para valer.", "image": 8}, {"id": "dados", "name": "Centro de Dados", "description": "Decisão baseada em dado, não em achismo.", "image": 9}, {"id": "negocios", "name": "Centro de Negócios", "description": "Da ideia ao negócio estruturado.", "image": 10}, {"id": "atendimento", "name": "Central de Atendimento", "description": "Cada contato vira uma oportunidade.", "image": 11}, {"id": "coworking", "name": "Coworking Escola", "description": "Trabalhar junto muda o jogo.", "image": 12}, {"id": "eventos", "name": "Centro de Eventos", "description": "A experiência do evento importa.", "image": 13}, {"id": "biblioteca", "name": "Biblioteca Inteligente", "description": "Saber pesquisar é saber decidir.", "image": 14}, {"id": "sustentabilidade", "name": "Laboratório de Sustentabilidade", "description": "Negócios que cuidam do entorno.", "image": 15}, {"id": "idiomas", "name": "Escola de Idiomas", "description": "Outra língua, outra carreira.", "image": 16}, {"id": "bem-estar", "name": "Centro de Bem-Estar e Práticas Integrativas", "description": "Saúde, equilíbrio e qualidade de vida.", "image": 17}].map(item=>Object.freeze(item)));
  const choiceIds=new Set(catalog.filter(item=>item.id!=='agencia').map(item=>item.id));
  function validateChoices(raw) {
    const registered=new Set([...choiceIds,...(window.SKSFormations?.entries||[]).filter(item=>item.id!=='agencia').map(item=>item.id)]);
    return Array.isArray(raw)?[...new Set(raw.filter(id=>typeof id==='string'&&registered.has(id)))].slice(0,registered.size):[];
  }
  function progress(curriculum,state) {
    const lessons=(curriculum?.modules||[]).flatMap(m=>m.lessons||[]),study=lessons.filter(t=>t.type!=='deliverable'),deliveries=lessons.filter(t=>t.type==='deliverable');
    const completed=new Set(Array.isArray(state?.completed)?state.completed:[]);
    const studyDone=study.filter(t=>completed.has(t.id)).length;
    const submitted=Math.min(deliveries.length,window.SKSProjectHub?.summary(state?.hub).submitted||0);
    const done=studyDone+submitted,total=study.length+deliveries.length;
    return {done,total,studyDone,studyTotal:study.length,submitted,deliverables:deliveries.length,percent:study.length?Math.round(studyDone*100/study.length):0,complete:total>0&&done===total};
  }
  function canChoose(curriculum,state) {return progress(curriculum,state).complete;}
  window.SKSFormationJourney=Object.freeze({catalog,validateChoices,progress,canChoose});
})();
