(() => {
  'use strict';
  // Explicit browser-only preview. Never reads or writes the account database.
  const KEY='sks-preview-workspace-v1';
  const LEGACY='sks-student-preview-v1';
  const USER=Object.freeze({id:'local-preview',name:'Prévia do aluno',email:'',role:'preview'});
  const copy=value=>JSON.parse(JSON.stringify(value));
  window.SKSPreview={
    create() {
      const loginUrl=(location.protocol==='file:'?'http://127.0.0.1:4173':location.origin)+'/entrar.html?role=student&next=%2Faluno.html';
      let storageUnavailable=false;
      function read() {
        let raw,previousRaw;
        try {
          raw=window.localStorage.getItem(KEY);previousRaw=window.localStorage.getItem(LEGACY);storageUnavailable=false;
        } catch {storageUnavailable=true;return {state:{},revision:0};}
        let value,previous;
        try{value=JSON.parse(raw||'null');}catch{}
        if(value&&typeof value==='object'&&value.state&&Number.isInteger(value.revision))return value;
        try{previous=JSON.parse(previousRaw||'null');}catch{}
        return {state:previous&&typeof previous==='object'?previous:{},revision:0};
      }
      const session=()=>Promise.resolve({user:USER,preview:true,localOnly:true,setupRequired:false});
      return {
        preview:true,
        ready:session(),session,
        ensureStudent:()=>Promise.resolve(USER),
        ensureTeacher:()=>Promise.reject(new Error('O editor de contas é opcional e só funciona no servidor. A prévia do aluno pode ser aberta sem login.')),
        loadStudent:()=>{const record=read();return Promise.resolve({...copy(record),userId:USER.id,review:null,preview:true,persistenceUnavailable:storageUnavailable});},
        saveStudent:async(state,revision)=>{
          const current=read();
          if(storageUnavailable)throw new Error('O navegador bloqueou o armazenamento local. Use Exportar progresso para guardar sua prévia.');
          if(current.revision!==revision){const error=new Error('Esta prévia foi alterada em outra aba. Exporte seu progresso antes de recarregar.');error.status=409;throw error;}
          const record={state:copy(state),revision:revision+1};
          try{window.localStorage.setItem(KEY,JSON.stringify(record));}
          catch{throw new Error('Não foi possível salvar neste navegador. Exporte seu progresso antes de sair.');}
          return {...copy(record),userId:USER.id,preview:true};
        },
        loadCourse:()=>Promise.resolve({data:{content:{},bonus:{}},preview:true}),
        logout:async()=>window.location.assign(loginUrl),
        loginUrl
      };
    }
  };
})();
