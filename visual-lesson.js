/* Visual page experiment, restricted to the first lesson of Agência Escola. */
(() => {
  'use strict';
  const validSrc = src => /^(?:assets\/welcome-lesson\/card-[1-6]\.png|\/api\/lesson-asset\/[a-f\d-]{36})$/.test(src || '') ? src : '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)||0));
  const types = {text:'Texto',box:'Caixa',image:'Imagem',video:'Vídeo',document:'Documento'};
  const fresh = type => ({id:crypto.randomUUID(),type,title:type==='text'?'Novo texto':'',text:'',src:'',x:8,y:12,w:type==='text'||type==='box'?48:38,h:type==='text'||type==='box'?35:48});
  function fromBlocks(blocks){
    const pages=[];
    for(const block of blocks){
      const content={...fresh(block.type),title:block.title||'',text:block.text||'',src:validSrc(block.src)};
      const elements=[];
      if(content.src&&['text','box'].includes(content.type)){
        content.w=50;content.h=76;content.x=5;content.y=14;
        const art={...fresh('image'),title:content.title,src:content.src,x:59,y:17,w:36,h:60};
        content.src='';elements.push(content,art);
      }else{content.x=8;content.y=12;content.w=84;content.h=76;elements.push(content);}
      pages.push({id:crypto.randomUUID(),elements});
    }
    return pages.length?pages:[{id:crypto.randomUUID(),elements:[]}];
  }
  function card(element,interactive=false){
    const type=types[element.type]?element.type:'text';
    const title=esc(element.title),src=validSrc(element.src);
    let content='';
    if(type==='image')content=src?'<img src="'+src+'" alt="'+title+'" draggable="false">':'<span>Escolha uma imagem</span>';
    else if(type==='video')content=src?'<video src="'+src+'" controls preload="metadata"></video>':'<span>Escolha um vídeo</span>';
    else if(type==='document')content=src?'<a href="'+src+'?download=1" download>↓ '+(title||'Baixar documento')+'</a>':'<span>Escolha um documento</span>';
    else content='<strong>'+title+'</strong><p>'+esc(element.text).replace(/\n/g,'<br>')+'</p>';
    const style='left:'+clamp(element.x,0,95)+'%;top:'+clamp(element.y,0,95)+'%;width:'+clamp(element.w,5,100)+'%;height:'+clamp(element.h,5,100)+'%';
    return '<div class="visual-element visual-element--'+type+'" style="'+style+'"'+(interactive?' data-visual-id="'+esc(element.id)+'" tabindex="0" aria-label="'+esc(types[type]+': '+(element.title||'sem título'))+'"':'')+'>'+content+(interactive?'<span class="visual-resize" data-visual-resize title="Redimensionar" aria-hidden="true"></span>':'')+'</div>';
  }
  function stage(page,interactive=false){return '<div class="visual-stage'+(interactive?' visual-stage--editor':'')+'">'+page.elements.map(element=>card(element,interactive)).join('')+'</div>';}
  function renderPages(pages){
    const safe=Array.isArray(pages)?pages.filter(page=>Array.isArray(page.elements)):[];
    if(!safe.length)return '';
    return '<div class="visual-reader" data-visual-reader><div class="visual-reader-viewport">'+safe.map((page,index)=>'<section class="visual-reader-page" data-reader-page="'+index+'"'+(index?' hidden':'')+' aria-label="Página '+(index+1)+' de '+safe.length+'">'+stage(page)+'</section>').join('')+'</div><nav class="visual-reader-nav" aria-label="Navegar páginas"><button type="button" data-reader-prev disabled>← Anterior</button><span data-reader-count>1 / '+safe.length+'</span><button type="button" data-reader-next'+(safe.length===1?' disabled':'')+'>Próxima →</button></nav></div>';
  }
  document.addEventListener('click',event=>{
    const nav=event.target.closest('[data-reader-prev],[data-reader-next]');if(!nav)return;
    const root=nav.closest('[data-visual-reader]'),pages=[...root.querySelectorAll('[data-reader-page]')];
    const current=pages.findIndex(page=>!page.hidden),next=clamp(current+(nav.hasAttribute('data-reader-next')?1:-1),0,pages.length-1);
    pages.forEach((page,index)=>page.hidden=index!==next);
    root.querySelector('[data-reader-count]').textContent=(next+1)+' / '+pages.length;
    root.querySelector('[data-reader-prev]').disabled=next===0;
    root.querySelector('[data-reader-next]').disabled=next===pages.length-1;
  });
  function mount(host,initial,onChange){
    let pages=structuredClone(initial),pageIndex=0,selected='',drag=null;
    const page=()=>pages[pageIndex],item=()=>page().elements.find(e=>e.id===selected);
    const notify=()=>onChange?.();
    const controls=()=>'<div class="visual-toolbar"><button type="button" data-visual-add-page>+ Página</button><button type="button" data-visual-delete-page'+(pages.length===1?' disabled':'')+'>Excluir página</button><span>Página '+(pageIndex+1)+' / '+pages.length+'</span><button type="button" data-visual-prev'+(pageIndex===0?' disabled':'')+'>←</button><button type="button" data-visual-next'+(pageIndex===pages.length-1?' disabled':'')+'>→</button></div><div class="visual-toolbar">'+Object.entries(types).map(([key,label])=>'<button type="button" data-visual-add="'+key+'">+ '+label+'</button>').join('')+'</div>';
    function inspector(){
      const e=item();if(!e)return '<p class="visual-hint">Selecione um elemento no quadro para editar texto, arquivo, posição e tamanho. Arraste para mover; use o canto inferior direito para redimensionar.</p>';
      return '<div class="visual-inspector-fields"><strong>'+types[e.type]+'</strong><button type="button" data-visual-delete>Remover elemento</button><label>Título<input data-visual-field="title" maxlength="120" value="'+esc(e.title)+'"></label>'+(['text','box'].includes(e.type)?'<label>Conteúdo<textarea data-visual-field="text" rows="5">'+esc(e.text)+'</textarea></label>':'')+(['image','video','document'].includes(e.type)?'<label>Enviar '+types[e.type]+'<input type="file" data-visual-upload accept="'+(e.type==='image'?'image/png,image/jpeg,image/webp':e.type==='video'?'video/mp4,video/webm':'application/pdf,.docx')+'"></label><small>'+(e.src?'Arquivo selecionado':'Nenhum arquivo selecionado')+'</small>':'')+(e.type==='image'?'<button type="button" data-image-library>Pesquisar imagens Full HD ↗</button>'+(e.credit?'<small>Crédito: '+esc(e.credit)+'</small>':''):'')+'<div class="visual-coordinates">'+['x','y','w','h'].map(key=>'<label>'+({x:'Esquerda',y:'Topo',w:'Largura',h:'Altura'}[key])+' %<input type="number" min="0" max="100" data-visual-field="'+key+'" value="'+esc(e[key])+'"></label>').join('')+'</div></div>';
    }
    function draw(){
      host.innerHTML='<div class="visual-editor"><p>Monte cada página com texto, imagens e vídeo. O conteúdo anterior foi organizado em páginas para você ajustar.</p>'+controls()+'<div class="visual-canvas-wrap">'+stage(page(),true)+'</div><div class="visual-inspector">'+inspector()+'</div></div>';
      select();
    }
    function select(){
      host.querySelectorAll('[data-visual-id]').forEach(el=>el.classList.toggle('is-selected',el.dataset.visualId===selected));
    }
    host.addEventListener('click',event=>{
      const target=event.target.closest('button,[data-visual-id]');if(!target)return;
      if(target.dataset.visualAddPage!==undefined){pages.push({id:crypto.randomUUID(),elements:[]});pageIndex=pages.length-1;selected='';draw();notify();}
      else if(target.dataset.visualDeletePage!==undefined&&pages.length>1){pages.splice(pageIndex,1);pageIndex=Math.min(pageIndex,pages.length-1);selected='';draw();notify();}
      else if(target.dataset.visualPrev!==undefined||target.dataset.visualNext!==undefined){pageIndex=clamp(pageIndex+(target.dataset.visualNext!==undefined?1:-1),0,pages.length-1);selected='';draw();}
      else if(target.dataset.visualAdd){const e=fresh(target.dataset.visualAdd);page().elements.push(e);selected=e.id;draw();notify();}
      else if(target.dataset.visualDelete!==undefined){page().elements=page().elements.filter(e=>e.id!==selected);selected='';draw();notify();}
      else if(target.dataset.imageLibrary!==undefined&&item()?.type==='image'){const id=selected;window.SKSImageLibrary.open(async image=>{const e=pages.flatMap(p=>p.elements).find(value=>value.id===id);if(!e)return;e.src=image.src;e.credit=image.credit;e.title=e.title||image.title;draw();notify();});}
      else if(target.dataset.visualId){selected=target.dataset.visualId;host.querySelector('.visual-inspector').innerHTML=inspector();select();}
    });
    host.addEventListener('input',event=>{
      const field=event.target.dataset.visualField,e=item();if(!field||!e)return;
      e[field]=['x','y','w','h'].includes(field)?clamp(event.target.value,field==='w'||field==='h'?5:0,100):event.target.value;
      if(['x','y','w','h'].includes(field)){e.x=clamp(e.x,0,100-e.w);e.y=clamp(e.y,0,100-e.h);}
      const node=[...host.querySelectorAll('[data-visual-id]')].find(el=>el.dataset.visualId===selected);
      if(node){if(['x','y','w','h'].includes(field))node.style.cssText='left:'+e.x+'%;top:'+e.y+'%;width:'+e.w+'%;height:'+e.h+'%';else if(e.type==='text'||e.type==='box')node.innerHTML='<strong>'+esc(e.title)+'</strong><p>'+esc(e.text).replace(/\n/g,'<br>')+'</p><span class="visual-resize" data-visual-resize></span>';}
      notify();
    });
    host.addEventListener('change',async event=>{
      if(!event.target.matches('[data-visual-upload]'))return;
      const input=event.target,file=input.files?.[0],e=item();if(!file||!e)return;
      const mime=file.type||(file.name.toLowerCase().endsWith('.docx')?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'');
      const allowed=e.type==='image'?['image/png','image/jpeg','image/webp']:e.type==='video'?['video/mp4','video/webm']:['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if(!allowed.includes(mime)){alert('Formato de arquivo não permitido.');return;}
      try{
        const runtime=await fetch('/api/runtime',{credentials:'same-origin'}).then(r=>r.json());
        if(runtime.app!=='SKS'||runtime.lessonAssets!=='v1')throw new Error('Reinicie o servidor SKS pela pasta atualizada.');
        const response=await fetch('/api/lesson-asset',{method:'POST',headers:{'Content-Type':mime},body:file,credentials:'same-origin'});
        const result=await response.json();if(!response.ok)throw new Error(result.error||'Falha no envio.');
        e.src=result.src;draw();notify();
      }catch(error){alert(error.message||'Falha no envio do arquivo.');}finally{input.value='';}
    });
    host.addEventListener('pointerdown',event=>{
      const node=event.target.closest('[data-visual-id]'),stageNode=host.querySelector('.visual-stage');if(!node||!stageNode||event.target.closest('input,textarea,button,video,a'))return;
      const e=page().elements.find(value=>value.id===node.dataset.visualId);if(!e)return;
      selected=e.id;host.querySelector('.visual-inspector').innerHTML=inspector();select();
      drag={id:e.id,resize:!!event.target.closest('[data-visual-resize]'),startX:event.clientX,startY:event.clientY,x:e.x,y:e.y,w:e.w,h:e.h,width:stageNode.clientWidth,height:stageNode.clientHeight};
      node.setPointerCapture(event.pointerId);event.preventDefault();
    });
    host.addEventListener('pointermove',event=>{
      if(!drag)return;const e=page().elements.find(value=>value.id===drag.id);if(!e)return;
      const dx=(event.clientX-drag.startX)/drag.width*100,dy=(event.clientY-drag.startY)/drag.height*100;
      if(drag.resize){e.w=clamp(Math.round(drag.w+dx),5,100-e.x);e.h=clamp(Math.round(drag.h+dy),5,100-e.y);}
      else{e.x=clamp(Math.round(drag.x+dx),0,100-e.w);e.y=clamp(Math.round(drag.y+dy),0,100-e.h);}
      const node=[...host.querySelectorAll('[data-visual-id]')].find(el=>el.dataset.visualId===drag.id);
      if(node)node.style.cssText='left:'+e.x+'%;top:'+e.y+'%;width:'+e.w+'%;height:'+e.h+'%';
      host.querySelectorAll('[data-visual-field]').forEach(input=>{if(['x','y','w','h'].includes(input.dataset.visualField))input.value=e[input.dataset.visualField];});
    });
    host.addEventListener('pointerup',()=>{if(drag){drag=null;notify();}});
    host.addEventListener('pointercancel',()=>{drag=null;});
    draw();
    return {getPages:()=>structuredClone(pages)};
  }
  window.SKSVisualLesson=Object.freeze({fromBlocks,renderPages,mount});
})();
