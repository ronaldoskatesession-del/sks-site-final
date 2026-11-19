(() => {
  'use strict';
  const agentLevels=Object.freeze([
    {level:1,name:'Agente em Formação',minPercent:0},
    {level:2,name:'Agente Júnior',minPercent:20},
    {level:3,name:'Agente Pleno',minPercent:40},
    {level:4,name:'Agente Sênior',minPercent:60},
    {level:5,name:'Agente Líder',minPercent:80},
    {level:6,name:'Agente Mentor',minPercent:100}
  ].map(level=>Object.freeze(level)));
  // Read-only progress indicator, not a certificate or pedagogical approval.
  // Callers pass state already validated by create(...).validate(...).
  function agentLevel(curriculum,state,user) {
    const modules=Array.isArray(curriculum?.modules)?curriculum.modules:[];
    const topics=modules.flatMap(module=>Array.isArray(module?.lessons)?module.lessons:[]).filter(topic=>topic&&typeof topic.id==='string'&&topic.id);
    const study=topics.filter(topic=>topic.type!=='deliverable'),deliverables=topics.filter(topic=>topic.type==='deliverable');
    const studyIds=new Set(study.map(topic=>topic.id));
    const completed=Array.isArray(state?.completed)?state.completed:[];
    const studyDone=new Set(completed.filter(id=>studyIds.has(id))).size;
    let submitted=0;
    if(state?.hub&&typeof window.SKSProjectHub?.summary==='function') {
      try {
        const count=window.SKSProjectHub.summary(state.hub).submitted;
        if(Number.isFinite(count))submitted=Math.min(deliverables.length,Math.max(0,Math.floor(count)));
      }catch{/* An unavailable or malformed hub never grants progress. */}
    }
    const total=study.length+deliverables.length,done=Math.min(total,studyDone+submitted);
    const percent=total?Math.max(0,Math.min(100,Math.floor(done*100/total))):0;
    let index=0;
    // Compare exact counts: rounding a displayed percentage cannot grant a level.
    if(total)for(let i=1;i<agentLevels.length;i++)if(done*100>=agentLevels[i].minPercent*total)index=i;
    // A teacher's institutional title is independent of study completion.
    // It is presentation only: no role, permission or stored progress is changed.
    const institutionalMentor=user?.role==='teacher';
    if(institutionalMentor)index=agentLevels.length-1;
    const current=agentLevels[index],next=agentLevels[index+1];
    return {...current,index:current.level,percent,done,total,institutionalMentor,nextName:next?.name||null,nextPercent:next?.minPercent??null,remainingToNext:next&&total?Math.max(0,Math.ceil(next.minPercent*total/100)-done):0};
  }
  // Pure validation shared by the student preview and the creator's review report.
  window.SKSStudentCore = {
    agentLevels,agentLevel,
    create(curriculum, seed) {
      const topics = curriculum.modules.flatMap(m => m.lessons);
      const byId = new Map(topics.map(t => [t.id, t]));
      const finalIds = new Set(topics.filter(t => t.type === 'deliverable').map(t => t.id));
      const moduleIds = new Set(curriculum.modules.map(m => m.id));
      const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      const text = value => typeof value === 'string' ? value.slice(0, 50000) : '';
      const safeUrl = value => {
        if (typeof value !== 'string') return '';
        try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
        catch { return ''; }
      };
      const blank = () => ({notes:{}, completed:[], project:[], responses:{}, results:{}, feedback:{}, reviewed:[], lastTopic:'', formationChoices:[], hub:window.SKSProjectHub?.blank() || {fields:{},submitted:[],reviewNotes:{}}, agenda:[], questions:[], learningSeconds:{}});
      function grade(id, answers) {
        const quiz = seed.quizzes[id];
        if (!Array.isArray(quiz) || !Array.isArray(answers) || answers.length !== quiz.length ||
            !answers.every((a, i) => Number.isInteger(a) && a >= 0 && a < quiz[i].options.length)) return null;
        const score = quiz.reduce((n, q, i) => n + Number(q.correct === answers[i]), 0);
        return {answers:[...answers], score, total:quiz.length, percent:Math.round(score / quiz.length * 100), passed:score / quiz.length >= .75};
      }
      function validate(input) {
        const out = blank(), source = record(input);
        for (const key of ['notes','feedback']) {
          for (const [id, value] of Object.entries(record(source[key]))) if (byId.has(id) && typeof value === 'string') out[key][id] = text(value);
        }
        for (const [id, value] of Object.entries(record(source.responses))) {
          if (!['activity','deliverable'].includes(byId.get(id)?.type)) continue;
          const response = record(value), body = text(response.body);
          out.responses[id] = {body, submitted:response.submitted === true && !!body.trim()};
        }
        for (const [id, value] of Object.entries(record(source.results))) {
          const result = grade(id, record(value).answers);
          if (result) out.results[id] = result;
        }
        out.completed = [...new Set((Array.isArray(source.completed) ? source.completed : []).filter(id => {
          const t = byId.get(id); if (!t) return false;
          if (t.type === 'assessment') return out.results[id]?.passed === true;
          if (t.type === 'activity' || t.type === 'deliverable') return out.responses[id]?.submitted === true;
          return true;
        }))];
        out.project = [...new Set((Array.isArray(source.project) ? source.project : []).filter(id => finalIds.has(id)))];
        out.reviewed = [...new Set((Array.isArray(source.reviewed) ? source.reviewed : []).filter(id => moduleIds.has(id)))];
        out.lastTopic = byId.has(source.lastTopic) ? source.lastTopic : '';
        out.formationChoices = window.SKSFormationJourney?.validateChoices(source.formationChoices)||[];
        out.hub = window.SKSProjectHub ? window.SKSProjectHub.validate(source.hub) : out.hub;
        out.agenda = (Array.isArray(source.agenda) ? source.agenda : []).slice(0,100).filter(item => item && typeof item.id === 'string' && typeof item.title === 'string').map(item => ({id:item.id.slice(0,100), title:item.title.slice(0,150), date:/^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : '', time:/^\d{2}:\d{2}$/.test(item.time) ? item.time : '', done:item.done === true}));
        out.questions = (Array.isArray(source.questions) ? source.questions : []).slice(0,100).filter(item => item && typeof item.id === 'string' && typeof item.body === 'string').map(item => ({id:item.id.slice(0,100), body:text(item.body), topicId:byId.has(item.topicId) ? item.topicId : '', status:'open'}));
        for (const [id,value] of Object.entries(record(source.learningSeconds))) if (byId.has(id) && Number.isFinite(value)) out.learningSeconds[id] = Math.max(0,Math.min(2000000,Math.floor(value)));
        return out;
      }
      function materialMap(input) {
        const source = record(input), content = {...seed.content}, bonus = {...seed.bonus};
        function validMaterial(value) {
          const item = record(value);
          const material={body:typeof item.body === 'string' ? item.body.slice(0,200000) : '', url:safeUrl(item.url),
            duration:typeof item.duration === 'string' ? item.duration.slice(0,100) : '', custom:true, sources:[]};
          if(Array.isArray(item.blocks))material.blocks=item.blocks;
          if(Array.isArray(item.pages))material.pages=item.pages;
          return material;
        }
        for (const [id, value] of Object.entries(record(source.content))) if (byId.has(id)) content[id] = validMaterial(value);
        for (const [id, value] of Object.entries(record(source.bonus))) {
          if (/^bonus-\d+$/.test(id) && Number(id.slice(6)) < curriculum.bonuses.length) bonus[id] = validMaterial(value);
        }
        return {content, bonus};
      }
      return {blank, validate, grade, materialMap, safeUrl};
    }
  };
})();
