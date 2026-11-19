(() => {
  'use strict';
  function render(body,renderText,escape) {
    const titles=['Entenda o conceito','Contexto do módulo','Exemplo aplicado','Pratique no seu projeto','Critérios de autoavaliação','Registro do aprendizado'];
    const sections = value => String(value || '').replace(/\r/g,'').split(/(?=^#{1,6}\s+)/m).filter(x=>x.trim());
    const cards = sections(body).map((section,index) => {
      const title=section.match(/^#{1,6}\s+([^\n]+)/)?.[1] || 'Conteúdo da aula';
      const originalIndex=titles.findIndex(value=>value===title);
      const image=originalIndex>=0 ? `<a class="welcome-lesson-art" href="assets/welcome-lesson/card-${originalIndex+1}.png" target="_blank" rel="noopener noreferrer" aria-label="Ampliar card: ${escape(title)}"><img src="assets/welcome-lesson/card-${originalIndex+1}.png" width="1536" height="1024" alt="${escape(title)} — resumo visual. O conteúdo completo está disponível logo abaixo." ${index?'loading="lazy"':''}><span>Ampliar ilustração ↗</span></a>` : '';
      return `<section class="welcome-lesson-card" aria-labelledby="welcome-section-${index}"><div class="welcome-lesson-heading"><span>${String(index+1).padStart(2,'0')}</span><h2 id="welcome-section-${index}">${escape(title)}</h2></div>${image}<div class="welcome-lesson-current">${renderText(section.replace(/^#{1,6}[^\n]*\n?/,''))}</div></section>`;
    }).join('');
    return `<div class="welcome-lesson"><style>
      .welcome-lesson{display:grid;gap:0;margin:20px 0;min-width:0}
      .welcome-lesson .welcome-lesson-card{display:grid;grid-template-columns:180px minmax(0,1fr);gap:12px 24px;padding:26px 0;border-bottom:1px solid #8793a333;min-width:0}
      .welcome-lesson .welcome-lesson-card:last-child{border-bottom:0}
      .welcome-lesson .welcome-lesson-heading{display:flex;align-items:baseline;gap:9px;grid-column:1/-1}
      .welcome-lesson .welcome-lesson-heading>span{font-size:11px;opacity:.65;font-weight:600}
      .welcome-lesson .welcome-lesson-heading h2{margin:0!important;font-size:19px;line-height:1.4;color:inherit}
      .welcome-lesson .welcome-lesson-art{display:block;text-decoration:none;align-self:start;min-width:0;color:inherit}
      .welcome-lesson .welcome-lesson-art img{display:block;width:100%;height:auto;max-width:180px;border-radius:9px;object-fit:contain}
      .welcome-lesson .welcome-lesson-art>span{display:block;margin-top:7px;font-size:11px;text-decoration:underline;opacity:.8}
      .welcome-lesson .welcome-lesson-current{min-width:0;align-self:center}
      .welcome-lesson .welcome-lesson-current:only-child{grid-column:1/-1}
      .welcome-lesson .welcome-lesson-heading+.welcome-lesson-current{grid-column:1/-1}
      .welcome-lesson .welcome-lesson-current p,.welcome-lesson .welcome-lesson-current li{font-size:15px;line-height:1.7;color:inherit;margin-top:0}
      .welcome-lesson .welcome-lesson-current ul{margin-top:0;padding-left:20px}
      .welcome-lesson a:focus-visible{outline:2px solid #448be6;outline-offset:4px;border-radius:9px}
      @media(max-width:600px){.welcome-lesson .welcome-lesson-card{grid-template-columns:104px minmax(0,1fr);gap:12px 14px;padding:22px 0}.welcome-lesson .welcome-lesson-heading h2{font-size:18px}.welcome-lesson .welcome-lesson-current p,.welcome-lesson .welcome-lesson-current li{font-size:14px}}
      @media(max-width:420px){.welcome-lesson .welcome-lesson-card{grid-template-columns:minmax(0,1fr)}.welcome-lesson .welcome-lesson-art{max-width:140px}.welcome-lesson .welcome-lesson-current{grid-column:1/-1}}
    </style>${cards}</div>`;
  }
  const builtInTitles=['Entenda o conceito','Contexto do módulo','Exemplo aplicado','Pratique no seu projeto','Critérios de autoavaliação','Registro do aprendizado'];
  function fromBody(body){
    return String(body||'').replace(/\r/g,'').split(/(?=^#{1,6}\s+)/m).filter(section=>section.trim()).map((section,index)=>{
      const title=section.match(/^#{1,6}\s+([^\n]+)/)?.[1]||'Conteúdo da aula';
      const art=builtInTitles.indexOf(title);
      return {id:'section-'+index,type:'text',title,text:section.replace(/^#{1,6}[^\n]*\n?/,'' ).trim(),src:art<0?'':'assets/welcome-lesson/card-'+(art+1)+'.png'};
    });
  }
  function renderBlocks(blocks,renderText,escape){
    const safeSrc=src=>/^(?:assets\/welcome-lesson\/card-[1-6]\.png|\/api\/lesson-asset\/[a-f\d-]{36})$/.test(src||'')?src:'';
    const cards=(Array.isArray(blocks)?blocks:[]).map((block,index)=>{
      const id='welcome-section-'+index,src=safeSrc(block.src),title=escape(block.title||'Conteúdo da aula');
      if(block.type==='video')return `<section class="welcome-lesson-card" aria-labelledby="${id}"><div class="welcome-lesson-heading"><span>${String(index+1).padStart(2,'0')}</span><h2 id="${id}">${title}</h2></div>${src?`<video class="welcome-lesson-media" controls preload="metadata" src="${src}"></video>`:''}</section>`;
      if(block.type==='document')return `<section class="welcome-lesson-card" aria-labelledby="${id}"><div class="welcome-lesson-heading"><span>${String(index+1).padStart(2,'0')}</span><h2 id="${id}">${title}</h2></div>${src?`<a class="welcome-lesson-download" href="${src}?download=1" download>Baixar documento ↓</a>`:''}</section>`;
      const image=src?`<a class="welcome-lesson-art" href="${src}" target="_blank" rel="noopener noreferrer" aria-label="Ampliar imagem: ${title}"><img src="${src}" alt="${title}" loading="lazy"><span>Ampliar ilustração ↗</span></a>`:'';
      if(block.type==='image')return `<section class="welcome-lesson-card" aria-labelledby="${id}"><div class="welcome-lesson-heading"><span>${String(index+1).padStart(2,'0')}</span><h2 id="${id}">${title}</h2></div>${image}</section>`;
      return `<section class="welcome-lesson-card${block.type==='box'?' welcome-lesson-box':''}" aria-labelledby="${id}"><div class="welcome-lesson-heading"><span>${String(index+1).padStart(2,'0')}</span><h2 id="${id}">${title}</h2></div>${image}<div class="welcome-lesson-current">${renderText(block.text||'')}</div></section>`;
    }).join('');
    return `<div class="welcome-lesson welcome-lesson-blocks"><style>
      .welcome-lesson-blocks{display:grid;margin:20px 0}.welcome-lesson-blocks .welcome-lesson-card{display:grid;grid-template-columns:180px minmax(0,1fr);gap:12px 24px;padding:26px 0;border-bottom:1px solid #8793a333;min-width:0}
      .welcome-lesson-blocks .welcome-lesson-heading{display:flex;align-items:baseline;gap:9px;grid-column:1/-1}.welcome-lesson-blocks .welcome-lesson-heading span{font-size:11px;opacity:.65}.welcome-lesson-blocks h2{font-size:19px!important;margin:0!important}.welcome-lesson-blocks .welcome-lesson-art{display:block;align-self:start;color:inherit}.welcome-lesson-blocks .welcome-lesson-art img{width:100%;max-width:180px;border-radius:9px}.welcome-lesson-blocks .welcome-lesson-art span{display:block;font-size:11px;text-decoration:underline;margin-top:7px}.welcome-lesson-blocks .welcome-lesson-current{min-width:0;align-self:center}.welcome-lesson-blocks .welcome-lesson-current:only-child,.welcome-lesson-blocks .welcome-lesson-heading+.welcome-lesson-current{grid-column:1/-1}.welcome-lesson-blocks .welcome-lesson-current p,.welcome-lesson-blocks .welcome-lesson-current li{font-size:15px;line-height:1.7}.welcome-lesson-blocks .welcome-lesson-media{grid-column:1/-1;max-width:100%;width:720px;border-radius:9px}.welcome-lesson-blocks .welcome-lesson-download{grid-column:1/-1;color:#58a8ff}.welcome-lesson-blocks .welcome-lesson-box{background:#e9ad4220;border:1px solid #e9ad4260;border-radius:12px;padding:20px;margin:12px 0}
      @media(max-width:600px){.welcome-lesson-blocks .welcome-lesson-card{grid-template-columns:104px minmax(0,1fr);gap:12px 14px}.welcome-lesson-blocks h2{font-size:18px!important}}@media(max-width:420px){.welcome-lesson-blocks .welcome-lesson-card{grid-template-columns:1fr}.welcome-lesson-blocks .welcome-lesson-art{max-width:140px}.welcome-lesson-blocks .welcome-lesson-current{grid-column:1/-1}}
    </style>${cards}</div>`;
  }
  window.SKSWelcomLesson=Object.freeze({render,fromBody,renderBlocks});
})();
