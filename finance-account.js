/* Account-scoped financial records. No personal defaults or shared-browser reads for students. */
(() => {
  'use strict';
  let user=null,loaded=false,error='',data={transactions:[],accounts:[],goals:[]},revision=0,inflight=null,queue=Promise.resolve();
  const copy=v=>JSON.parse(JSON.stringify(v));
  const changed=()=>window.dispatchEvent(new Event('sks-finance-update'));
  async function request(method,body){
    const r=await fetch('/api/finance?userId='+encodeURIComponent(user.id),{method,credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
    const result=await r.json();
    if(!r.ok)throw new Error(result.error||'Não foi possível acessar seu financeiro.');
    if(result.userId!==user.id)throw new Error('A conta do financeiro não corresponde à sessão atual.');
    return result;
  }
  function accept(result){data=result.data;revision=result.revision;loaded=true;error='';}
  async function load(){
    loaded=false;error='';
    try{
      let result=await request('GET');
      if(user.role==='teacher'&&result.canImportLegacy){
        const legacy={},originals=[];
        try{
          for(const [field,key]of [['transactions','sks-finance-transactions-v2'],['accounts','sks-finance-debts-v2'],['goals','sks-finance-goals-v1']]){
            const raw=localStorage.getItem(key);
            if(raw!==null){const values=JSON.parse(raw);if(!Array.isArray(values))throw new Error('Contas anteriores inválidas.');legacy[field]=values;originals.push([key,raw]);}
          }
        }catch{throw new Error('Não foi possível ler suas contas anteriores. Os dados originais foram preservados neste navegador.');}
        if(Object.keys(legacy).length){
          result=await request('PUT',{userId:user.id,revision:result.revision,importLegacy:true,data:legacy});
          // Remove the shared browser cache only after the owner has a durable server copy and backup.
          for(const [key,raw]of originals)if(localStorage.getItem(key)===raw)localStorage.removeItem(key);
        }
      }
      accept(result);
    }catch(e){loaded=false;data={transactions:[],accounts:[],goals:[]};error=e.message||'Financeiro indisponível. Tente novamente.';}
    changed();
  }
  function connect(next){
    if(user&&user.id!==next.id){loaded=false;data={transactions:[],accounts:[],goals:[]};error='Sua conta mudou. Entre novamente.';changed();return Promise.resolve();}
    user=next;
    if(loaded)return Promise.resolve();
    if(!inflight)inflight=load().finally(()=>{inflight=null;});
    return inflight;
  }
  function save(field,values){
    if(!['transactions','accounts','goals'].includes(field))return Promise.reject(new Error('Campo financeiro inválido.'));
    const snapshot=copy(values);
    const task=queue.then(async()=>{
      if(!loaded||!user)throw new Error(error||'Aguarde o carregamento do financeiro.');
      const next={...copy(data),[field]:snapshot};
      try{const result=await request('PUT',{userId:user.id,revision,data:next});accept(result);changed();return result;}
      catch(e){await load();throw e;}
    });
    queue=task.catch(()=>{});return task;
  }
  window.SKSFinance={connect,save,retry:()=>user?connect(user):Promise.resolve(),read:field=>loaded?copy(data[field]||[]):[],get loaded(){return loaded;},get error(){return error;}};
})();
