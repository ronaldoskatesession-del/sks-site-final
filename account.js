(() => {
  'use strict';
  const previewRequested=location.protocol==='file:'||location.pathname.startsWith('/preview/')||new URLSearchParams(location.search).get('preview')==='1';
  if(previewRequested){
    if(window.SKSPreview?.create){window.SKSAccount=window.SKSPreview.create();return;}
    const error=new Error('A prévia não carregou todos os arquivos. Reabra a área do aluno pelo atalho atualizado ou pelo endereço /preview/aluno.html.');
    window.SKSAccount={ready:Promise.resolve({user:null,unavailable:true,error}),ensureStudent:async()=>{throw error;},ensureTeacher:async()=>{throw error;}};
    const show=()=>{const target=document.getElementById('main')||document.body;if(!target)return;const message=document.createElement('p');message.textContent=error.message;message.setAttribute('role','alert');target.replaceChildren(message);};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',show,{once:true});else show();
    return;
  }
  let current=null,boundUserId=null;
  async function request(path,options={}) {
    let response;
    try {response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});}
    catch {throw new Error('O servidor local SKS não está disponível. Inicie o servidor de contas para continuar.');}
    let data;
    try{data=await response.json();}catch{throw new Error('Este endereço está no servidor estático antigo. Inicie o servidor SKS com contas e banco de dados.');}
    if(!response.ok){const error=new Error(data.error||'Não foi possível concluir a operação.');error.status=response.status;error.revision=data.revision;throw error;}
    return data;
  }
  const send=(path,data,method='POST')=>request(path,{method,body:JSON.stringify(data)});
  async function session(){
    const result=await request('/api/session');
    if(boundUserId&&result.user?.id!==boundUserId){const error=new Error('Sua conta mudou em outra aba. Entre novamente antes de continuar.');error.status=403;throw error;}
    current=result;if(result.user&&!boundUserId)boundUserId=result.user.id;return current;
  }
  const ready=session().catch(error=>{current={user:null,setupRequired:false,unavailable:true,error};return current;});
  function returnPath(){return location.pathname+location.search+location.hash;}
  async function requireRole(teacherOnly) {
    const result=await ready;
    if(result.unavailable)throw result.error;
    if(!result.user){location.replace('entrar.html?next='+encodeURIComponent(returnPath()));return null;}
    if(teacherOnly&&result.user.role!=='teacher'){location.replace('191026.html#/dashboard');return null;}
    return result.user;
  }
  async function logout(){await send('/api/auth/logout',{});current={user:null,setupRequired:false};location.assign('entrar.html');}
  const formationQuery=(prefix='?')=>window.SKSFormations?.currentId&&window.SKSFormations.currentId!=='agencia'?prefix+'formacao='+encodeURIComponent(window.SKSFormations.currentId):'';
  async function loadStudent(){
    const result=await request('/api/student?userId='+encodeURIComponent(boundUserId||'')+formationQuery('&'));
    if(result.userId!==boundUserId){const error=new Error('A conta desta página não corresponde à sessão atual. Entre novamente.');error.status=403;throw error;}
    return result;
  }
  async function loadAccount(){
    const result=await request('/api/account?userId='+encodeURIComponent(boundUserId||''));
    if(result.user?.id!==boundUserId){const error=new Error('A conta foi alterada. Entre novamente antes de consultar seus dados.');error.status=403;throw error;}
    return result;
  }
  async function saveAccount(data,revision){
    const result=await send('/api/account',{data,revision,userId:boundUserId},'PUT');
    if(current?.user?.id===result.user?.id)Object.assign(current.user,result.user);
    return result;
  }
  async function checkIdentity(){
    if(!boundUserId||document.body.dataset.mode==='login')return;
    try{const result=await request('/api/session');if(result.user?.id!==boundUserId){
      if(document.body.dataset.mode==='student')window.dispatchEvent(new CustomEvent('sks-account-changed'));
      else location.replace('entrar.html');
    }}catch{}
  }
  window.addEventListener('focus',checkIdentity);
  window.addEventListener('pageshow',event=>{if(event.persisted)checkIdentity();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkIdentity();});
  window.SKSAccount={
    ready,session,ensureStudent:()=>requireRole(false),ensureTeacher:()=>requireRole(true),
    loadStudent,
    loadFormationProgress:id=>request('/api/student?userId='+encodeURIComponent(boundUserId||'')+'&formacao='+encodeURIComponent(id)),
    loadAccount,saveAccount,
    saveStudent:(state,revision)=>send('/api/student'+formationQuery(),{state,revision,userId:boundUserId},'PUT'),
    loadCourse:()=>request('/api/course'+formationQuery()),saveCourse:data=>send('/api/course'+formationQuery(),{data},'PUT'),
    login:data=>send('/api/auth/login',data),register:data=>send('/api/auth/register',data),setup:data=>send('/api/auth/setup',data),
    students:()=>request('/api/teacher/students'),student:id=>request('/api/teacher/students/'+encodeURIComponent(id)),
    studentAccount:id=>request('/api/teacher/students/'+encodeURIComponent(id)+'/account'),
    createStudent:data=>send('/api/teacher/students',data),
    createTestStudents:count=>send('/api/teacher/test-students',{count}),
    saveFeedback:(id,feedback)=>send('/api/teacher/students/'+encodeURIComponent(id)+'/feedback',{feedback}),logout
  };
  if(document.body.dataset.mode!=='login')return;
  const form=document.getElementById('account-form'),error=document.getElementById('account-error'),nameField=document.getElementById('name-field');
  const params=new URLSearchParams(location.search);
  const requestedRole=params.get('role')==='teacher'||params.get('next')==='/professor.html'?'teacher':params.get('role')==='student'?'student':'';
  document.querySelectorAll('[data-login-role]').forEach(link=>{if(link.dataset.loginRole===requestedRole)link.setAttribute('aria-current','page');});
  let mode='login';
  function setMode(value){
    mode=value;nameField.hidden=value==='login';form.elements.name.required=value!=='login';
    document.getElementById('account-title').textContent=value==='setup'?'Configure o professor':value==='register'?'Crie sua conta de aluno':requestedRole==='teacher'?'Entrar como professor':requestedRole==='student'?'Entrar como aluno':'Entre na sua Agência Escola';
    document.getElementById('account-submit').textContent=value==='setup'?'Criar conta do professor':value==='register'?'Criar minha conta':'Entrar';
    form.elements.password.autocomplete=value==='login'?'current-password':'new-password';
    document.getElementById('account-switch').hidden=value==='setup';
    document.getElementById('switch-mode').textContent=value==='login'?'Criar conta de aluno':'Já tenho uma conta';
    document.getElementById('setup-note').hidden=value!=='setup';error.textContent='';
  }
  function destination(user) {
    const raw=new URLSearchParams(location.search).get('next');
    if(user.role==='teacher'&&raw&&/^\/aluno\.html\?aluno=[a-f\d-]{36}(?:#[^\s]*)?$/i.test(raw))return raw;
    return '191026.html#/dashboard';
  }
  document.getElementById('switch-mode').addEventListener('click',()=>setMode(mode==='login'?'register':'login'));
  document.getElementById('switch-account')?.addEventListener('click',async event=>{
    event.target.disabled=true;
    try{await send('/api/auth/logout',{});location.reload();}
    catch(err){document.getElementById('session-error').textContent=err.message;event.target.disabled=false;}
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();error.textContent='';const button=document.getElementById('account-submit');button.disabled=true;
    try{const data={name:form.elements.name.value,email:form.elements.email.value,password:form.elements.password.value};const result=await window.SKSAccount[mode](data);location.assign(destination(result.user));}
    catch(err){error.textContent=err.message;button.disabled=false;}
  });
  ready.then(result=>{
    if(result.unavailable){error.textContent=result.error.message;document.getElementById('account-submit').disabled=true;return;}
    if(result.user){
      if(requestedRole&&requestedRole!==result.user.role&&document.getElementById('session-panel')){
        form.hidden=true;document.getElementById('account-switch').hidden=true;
        document.getElementById('session-panel').hidden=false;
        document.getElementById('account-title').textContent='Já existe uma conta conectada';
        document.getElementById('active-session').textContent=result.user.name+' · '+(result.user.role==='teacher'?'Professor':'Aluno')+'. Para manter os dois acessos simultâneos, abra o login do aluno em uma janela anônima ou outro perfil do navegador. Uma nova aba usa a mesma conta.';
        const link=document.getElementById('continue-session');link.href='191026.html#/dashboard';link.textContent='Continuar como '+(result.user.role==='teacher'?'professor':'aluno');
        document.getElementById('switch-account').textContent='Sair e entrar como '+(requestedRole==='teacher'?'professor':'aluno');
        return;
      }
      location.replace(destination(result.user));return;
    }
    setMode(result.setupRequired?'setup':params.get('mode')==='register'?'register':'login');
  });
})();
