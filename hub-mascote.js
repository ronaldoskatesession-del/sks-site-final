(() => {
  const sheet = new Image();
  const source = new URL('assets/hub-mascote.png', document.currentScript.src).href;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const rows = {
    idle: [0, [280,110,110,140,140,320]],
    right: [1, [120,120,120,120,120,120,120,220]],
    left: [2, [120,120,120,120,120,120,120,220]],
    wave: [3, [140,140,140,280]],
    jump: [4, [140,140,140,140,280]],
    failed: [5, [140,140,140,140,140,140,140,240]],
    waiting: [6, [150,150,150,150,150,260]],
    working: [7, [120,120,120,120,120,220]],
    review: [8, [150,150,150,150,150,280]]
  };
  let state = 'idle', frame = 0, timer, follow = null, next = [];
  let pending = 0, ready = false;

  function mount() {
    if (!ready) return;
    for (const [selector, kind] of [['#sidebar .sks-agent-robot-wrap','launcher'],['.hub-chat__avatar','chat'],['.sks-disciplines .sks-agent-robot-wrap','disciplines']]) {
      const host = document.querySelector(selector);
      if (!host || host.querySelector('.hub-mascote')) continue;
      const node = document.createElement(kind === 'chat' ? 'span' : 'button');
      node.className = 'hub-mascote';
      if (kind === 'launcher') {
        node.type = 'button';
        node.setAttribute('aria-label','Abrir o Assistente IA SKS');
        node.addEventListener('click', () => document.dispatchEvent(new Event('sks:open-agent-chat')));
      } else if (kind === 'disciplines') {
        node.type = 'button';
        node.setAttribute('aria-label','Perguntar ao Agente IA SKS');
        node.addEventListener('click', () => {
          document.getElementById('disciplinesAgentPrompt')?.focus();
          play('wave', ['waiting']);
        });
      } else node.setAttribute('aria-hidden','true');
      node.style.backgroundImage = 'url("' + source + '")';
      host.append(node);
    }
    paint();
  }

  function paint() {
    const still = motion.matches;
    const looking = !still && state === 'idle' && follow !== null;
    const row = still ? 0 : looking ? 9 + Math.floor(follow / 8) : rows[state][0];
    const col = still ? 0 : looking ? follow % 8 : frame;
    for (const node of document.querySelectorAll('.hub-mascote')) {
      node.style.backgroundPosition = (col * 100 / 7) + '% ' + (row * 10) + '%';
      node.dataset.pose = still ? 'idle' : looking ? 'look' : state;
    }
  }

  function play(name, queue = []) {
    clearTimeout(timer);
    state = name;
    frame = 0;
    next = queue;
    paint();
    if (!motion.matches && !document.hidden) timer = setTimeout(advance, rows[state][1][0]);
  }

  function advance() {
    const durations = rows[state][1];
    if (++frame === durations.length) {
      if (next.length) return play(next[0], next.slice(1));
      if (state !== 'idle' && state !== 'waiting' && state !== 'working') return play(pending ? 'working' : 'idle');
      frame = 0;
    }
    paint();
    timer = setTimeout(advance, durations[frame]);
  }

  sheet.onload = () => {
    if (sheet.naturalWidth !== 1536 || sheet.naturalHeight !== 2288) return;
    ready = true;
    mount();
    const observer = new MutationObserver(mount);
    const root = document.body.classList.contains('school') ? document.getElementById('main') : document.querySelector('#sidebar');
    if (root) observer.observe(root, {childList:true,subtree:true});
    play('idle');
  };
  sheet.src = source;

  document.addEventListener('sks:agent-mascot', ({detail}) => {
    if (detail === 'opened' && !pending) play('wave', ['waiting']);
    if (detail === 'closed' && !pending) play('idle');
    if (detail === 'working') { pending++; play('working'); }
    if (detail === 'success' || detail === 'failed') {
      pending = Math.max(0, pending - 1);
      if (!pending) detail === 'success' ? play('review', ['jump']) : play('failed');
    }
    if (detail === 'local' && !pending) play('review');
  });
  document.addEventListener('input', event => {
    if (!pending && (event.target.id === 'agentPromptInput' || event.target.id === 'hubChatInput' || event.target.id === 'disciplinesAgentPrompt') && state !== 'waiting') {
      play('waiting');
    }
  });
  document.addEventListener('focusout', event => {
    if (!pending && state === 'waiting' && (event.target.id === 'agentPromptInput' || event.target.id === 'disciplinesAgentPrompt') && !document.querySelector('#hubChat.is-open')) play('idle');
  });

  const route = hash => hash.split('?')[0];
  window.addEventListener('hashchange', event => {
    const from = route(new URL(event.oldURL).hash);
    const to = route(new URL(event.newURL).hash);
    if (pending || from === to) return;
    const links = [...document.querySelectorAll('#sidebar a[href^="#/"]')].map(a => route(a.getAttribute('href')));
    const oldIndex = links.indexOf(from), newIndex = links.indexOf(to);
    if (oldIndex !== newIndex && newIndex >= 0) play(newIndex > oldIndex ? 'right' : 'left');
  });

  document.addEventListener('pointermove', event => {
    if (!ready || event.pointerType !== 'mouse' || motion.matches || state !== 'idle') return;
    const node = document.querySelector('#hubChat.is-open .hub-mascote') || document.querySelector('#sidebar .hub-mascote, .sks-disciplines .hub-mascote');
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(x,y);
    const pose = distance < 16 || distance > 240 ? null : (Math.round(Math.atan2(x,-y) * 8 / Math.PI) + 16) % 16;
    if (pose !== follow) { follow = pose; paint(); }
  }, {passive:true});
  document.documentElement.addEventListener('pointerleave', () => { follow = null; paint(); });
  document.addEventListener('visibilitychange', () => play(pending ? 'working' : 'idle'));
  motion.addEventListener('change', () => play(pending ? 'working' : 'idle'));
})();
