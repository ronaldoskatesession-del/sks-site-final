(() => {
  'use strict';
  const target=new URLSearchParams(location.search).get('aluno');
  if(!target)return;
  const base=window.SKSAccount;
  const wrapper={readOnly:true,observedStudent:null,observer:null};
  const denied=()=>{const error=new Error('Visão do professor: somente consulta. Nenhum dado do aluno foi alterado.');error.status=403;return Promise.reject(error);};
  let detail=null;
  const ready=(async()=>{
    if(!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(target))throw new Error('Identificador de aluno inválido. Volte ao painel do professor.');
    if(!base||base.preview)throw new Error('A consulta de alunos exige o login do professor, fora da prévia sem conta.');
    const teacher=await base.ensureTeacher();
    if(!teacher)return {user:null,readOnly:true};
    detail=await base.student(target);
    if(detail.student?.id!==target||detail.student?.role!=='student')throw new Error('O aluno solicitado não foi encontrado.');
    wrapper.observer=teacher;wrapper.observedStudent={...detail.student};
    return {user:wrapper.observedStudent,observer:teacher,readOnly:true};
  })();
  // Keep a failed eager request handled until student.js awaits the same promise.
  ready.catch(()=>{});
  Object.assign(wrapper,{
    ready,
    ensureStudent:async()=>{const result=await ready;return result.user;},
    ensureTeacher:()=>base.ensureTeacher(),session:()=>base.session(),
    loadStudent:async()=>{
      await ready;if(!detail)throw new Error('Entre como professor para consultar o aluno.');
      const {notes,feedback,...visible}=detail.state;
      return {state:visible,userId:target,revision:detail.revision,review:detail.review,readOnly:true};
    },
    loadCourse:()=>base.loadCourse(),
    loadAccount:async()=>{
      await ready;if(!detail)throw new Error('Entre como professor para consultar o perfil do aluno.');
      const result=await base.studentAccount(target);
      if(result.user?.id!==target)throw new Error('O perfil retornado não corresponde ao aluno observado.');
      return {...result,readOnly:true,profile:{preferredName:result.profile?.preferredName||''}};
    },
    saveStudent:denied,saveAccount:denied,saveCourse:denied,
    login:denied,register:denied,setup:denied,createStudent:denied,createTestStudents:denied,saveFeedback:denied,
    logout:async()=>location.assign('professor.html'),loginUrl:'entrar.html?role=teacher&next=%2Fprofessor.html'
  });
  window.SKSAccount=wrapper;
})();
