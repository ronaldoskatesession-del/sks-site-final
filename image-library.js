/* Public Wikimedia Commons search for the first lesson's visual image editor. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let overlay;
  function close(){overlay?.remove();overlay=null;}
  async function upload(item){
    const runtimeResponse=await fetch('/api/runtime',{credentials:'same-origin',cache:'no-store'});
    const runtime=runtimeResponse.ok?await runtimeResponse.json():null;
    if(runtime?.app!=='SKS'||runtime.lessonAssets!=='v1')throw new Error('Reinicie o servidor SKS pela pasta atualizada.');
    const source=await fetch(item.url);
    if(!source.ok)throw new Error('A imagem original não está disponível.');
    const blob=await source.blob();
    const mime=blob.type.split(';')[0];
    if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
    const response=await fetch('/api/lesson-asset',{method:'POST',headers:{'Content-Type':mime},body:blob,credentials:'same-origin'});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||'Falha ao salvar a imagem.');
    return result.src;
  }
  function open(onSelect){
    close();
    overlay=document.createElement('div');overlay.className='sks-image-library-overlay';
    overlay.innerHTML='<section class="sks-image-library" role="dialog" aria-modal="true" aria-label="Biblioteca de imagens"><header><div><h2>Biblioteca de imagens</h2><p>Pesquise fotografias no Wikimedia Commons. Resultados com pelo menos 1920 × 1080 px.</p></div><button type="button" data-library-close aria-label="Fechar">×</button></header><form><input type="search" name="query" value="creative studio" maxlength="80" aria-label="Buscar imagens" required><button type="submit">Buscar</button></form><p class="sks-image-library-status" role="status"></p><div class="sks-image-library-grid"></div><small>Confira a licença e atribuição de cada imagem antes de publicar.</small></section>';
    document.body.append(overlay);
    overlay.querySelector('[data-library-close]').onclick=close;
    overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
    const form=overlay.querySelector('form'),grid=overlay.querySelector('.sks-image-library-grid'),status=overlay.querySelector('[role=status]');
    async function search(){
      const query=form.elements.query.value.trim();if(!query)return;
      status.textContent='Buscando imagens…';grid.replaceChildren();
      try{
        const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:query+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'30',prop:'imageinfo',iiprop:'url|size|mime|extmetadata',iiurlwidth:'450'});
        const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params);
        if(!response.ok)throw new Error('Pesquisa indisponível no momento.');
        const data=await response.json();
        const items=Object.values(data.query?.pages||{}).map(page=>({title:page.title.replace(/^File:/,''),info:page.imageinfo?.[0]})).filter(x=>x.info?.width>=1920&&x.info?.height>=1080&&/^image\/(jpeg|png|webp)$/.test(x.info.mime||'')&&x.info.thumburl&&x.info.url);
        status.textContent=items.length?items.length+' imagens em alta resolução encontradas.':'Nenhuma imagem Full HD encontrada. Tente outra busca.';
        for(const item of items){
          const license=item.info.extmetadata?.LicenseShortName?.value||'Licença não informada';
          const source=item.info.descriptionurl||'https://commons.wikimedia.org';
          const card=document.createElement('article');
          card.innerHTML='<img loading="lazy" src="'+esc(item.info.thumburl)+'" alt="'+esc(item.title)+'"><div><strong>'+esc(item.title)+'</strong><small>'+item.info.width+' × '+item.info.height+' · '+esc(license)+'</small><a href="'+esc(source)+'" target="_blank" rel="noopener noreferrer">Ver autoria e licença ↗</a><button type="button">Usar imagem</button></div>';
          card.querySelector('button').onclick=async()=>{const button=card.querySelector('button');button.disabled=true;status.textContent='Salvando imagem na aula…';try{const src=await upload(item.info);await onSelect({src,title:item.title,credit:item.title+' · '+license+' · '+source});close();}catch(error){status.textContent=error.message||'Não foi possível salvar a imagem.';button.disabled=false;}};
          grid.append(card);
        }
      }catch(error){status.textContent=error.message||'Não foi possível pesquisar imagens.';}
    }
    form.onsubmit=e=>{e.preventDefault();search();};search();
  }
  window.SKSImageLibrary=Object.freeze({open});
})();
