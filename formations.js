(() => {
  'use strict';
  // Add new formations here and provide their own curriculum/seed file.
  // Existing Agency data and identifiers remain unchanged.
  const entries=[
    {id:'agencia',name:'Agência Escola',description:'A operação de marketing com desafios reais.',teacherOnly:false,moduleCount:25,hero:'assets/formacoes/agencia.webp'},
    {id:'loja',name:'Loja Escola',description:'Varejo real, do balcão ao marketplace.',teacherOnly:true,moduleCount:9,topicCount:33,file:'loja-course.js',hero:'assets/loja-escola/banner.webp',covers:Array.from({length:9},(_,i)=>`assets/loja-escola/modulo-${i+1}.webp`)}
  ];
  const datasets=new Map();
  const agency={curriculum:window.SKS_CURRICULUM,seed:window.SKS_LESSONS};
  datasets.set('agencia',agency);
  let currentId='agencia';
  const get=id=>entries.find(item=>item.id===id);
  const lojaStudentEmail='ronaldo.skatesession@gmail.com';
  const allowed=(id,user)=>!!get(id)&&(!get(id).teacherOnly||user?.role==='teacher'||(id==='loja'&&user?.role==='student'&&String(user.email||'').trim().toLowerCase()===lojaStudentEmail));
  const href=(id,hash='formacao',file='aluno.html')=>file==='index.html'?file+'#'+encodeURIComponent(id)+(hash==='formacao'?'':'/'+hash):file+(id==='agencia'?'':'?formacao='+encodeURIComponent(id))+'#'+hash;
  async function open(user,options={}) {
    const id=options.id||new URLSearchParams(location.search).get('formacao')||'agencia',entry=get(id);
    if(!allowed(id,user))throw new Error('Esta formação não está disponível para sua conta.');
    if(!datasets.has(id))await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=entry.file;script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar esta formação.'));document.head.append(script);});
    if(!datasets.has(id))throw new Error('O conteúdo desta formação não foi carregado.');
    currentId=id;
    return {...entry,...datasets.get(id)};
  }
  window.SKSFormations=Object.freeze({studentIds:Object.freeze(["agencia","loja","estudio","ia"]),entries,get,allowed,href,open,register:(id,data)=>{if(!get(id))throw new Error('Formação desconhecida');datasets.set(id,data);},dataset:id=>datasets.get(id),get currentId(){return currentId;}});
})();
