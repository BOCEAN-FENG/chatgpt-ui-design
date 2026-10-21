/* Local, labelled UI reference. No model, network request, or file upload. */
(async function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // Inline symbols so a copied reference also has stable inherited icon colours.
  const svgResponse = await fetch('icons.svg');
  if (!svgResponse.ok) throw new Error('Unable to load local icon symbols');
  const symbols = new DOMParser().parseFromString(await svgResponse.text(), 'image/svg+xml');
  function icon(name) {
    const symbol = symbols.getElementById(name);
    if (!symbol) return '';
    return `<svg class="cg-icon" viewBox="0 0 24 24" aria-hidden="true">${symbol.innerHTML}</svg>`;
  }
  document.querySelectorAll('[data-icon]').forEach(e => { e.outerHTML = icon(e.dataset.icon); });
  for (const [id, name] of Object.entries({ 'sidebar-close': 'sidebar', 'sidebar-open': 'sidebar', attach: 'plus', send: 'send', 'jump-latest': 'arrow-down' })) $(id).innerHTML = icon(name);
  document.querySelectorAll('[data-close]:empty').forEach(e => { e.innerHTML = icon('close'); });
  const load = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const media = matchMedia('(prefers-color-scheme: dark)');
  const narrow = matchMedia('(max-width: 1023px)');
  let theme = load('cg-reference-theme', 'system');
  if (!['system', 'light', 'dark'].includes(theme)) theme = 'system';
  function applyTheme(value) {
    theme = value;
    if (value === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = value;
    const dark = value === 'dark' || (value === 'system' && media.matches);
    $('theme-toggle').innerHTML = icon(dark ? 'sun' : 'moon');
    const label = dark ? '切换到浅色' : '切换到深色';
    $('theme-toggle').setAttribute('aria-label', label); $('theme-toggle').title = label;
    $('theme-select').value = value; save('cg-reference-theme', value);
  }
  applyTheme(theme); media.addEventListener('change', () => { if (theme === 'system') applyTheme('system'); });
  $('theme-select').onchange = e => applyTheme(e.target.value);
  $('theme-toggle').onclick = () => applyTheme((theme === 'dark' || (theme === 'system' && media.matches)) ? 'light' : 'dark');
  $('app').dataset.platform = new URLSearchParams(location.search).get('platform') === 'desktop' ? 'desktop' : 'web';
  let sendMode = load('cg-reference-send', 'enter'); $('send-select').value = sendMode;
  $('send-select').onchange = e => { sendMode = e.target.value; save('cg-reference-send', sendMode); };
  const initialAnswer = '建议把下一阶段分成三个能单独验收的小任务。\n\n1. 明确核心流程：从用户输入到结果展示，先保证一条完整路径可用。\n2. 补齐失败处理：保留草稿、明确状态，让中断后的工作可以继续。\n3. 验证使用体验：在电脑与窄窗口中走一遍真实流程，记录需要调整的地方。\n\n可以先从第一个任务开始，完成后再安排下一项。';
  const threads = [
    { id: 1, title: '梳理下一阶段的开发任务', messages: [{ role: 'user', text: '帮我梳理下一阶段的开发任务。' }, { role: 'assistant', text: initialAnswer }] },
    { id: 2, title: '整理项目笔记', messages: [{ role: 'user', text: '帮我整理项目笔记的结构。' }, { role: 'assistant', text: '可以按目标、当前进展、待解决问题与下一步行动四部分整理。让每个行动都有一个清楚的完成条件。' }] }
  ];
  const tasks = [{ title: '梳理核心用户流程', state: 'ready' }, { title: '完善失败与重试体验', state: 'ready' }, { title: '检查电脑与窄屏布局', state: 'done' }];
  let currentId = 1, nextId = 3, files = [], running = null, composing = false, follow = true;
  const current = () => threads.find(t => t.id === currentId);
  let toastTimer;
  function toast(s) { $('toast').textContent = s; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2200); }
  function closeDrawer() {
    if (!$('shell').classList.contains('drawer-open')) return;
    $('shell').classList.remove('drawer-open'); $('sidebar').removeAttribute('role'); $('sidebar').removeAttribute('aria-modal'); $('main').inert = false;
    $('sidebar-open').setAttribute('aria-expanded', 'false'); $('sidebar-open').focus();
  }
  function openDrawer() {
    $('shell').classList.add('drawer-open'); $('sidebar').setAttribute('role', 'dialog'); $('sidebar').setAttribute('aria-modal', 'true'); $('main').inert = true;
    $('sidebar-open').setAttribute('aria-expanded', 'true'); $('sidebar-close').focus();
  }
  $('sidebar-open').setAttribute('aria-controls', 'sidebar'); $('sidebar-open').setAttribute('aria-expanded', 'false');
  $('sidebar-open').onclick = () => { if (narrow.matches) openDrawer(); else $('shell').classList.remove('sidebar-collapsed'); };
  $('sidebar-close').onclick = () => { if (narrow.matches) closeDrawer(); else { $('shell').classList.add('sidebar-collapsed'); $('sidebar-open').focus(); } };
  $('scrim').onclick = closeDrawer;
  narrow.addEventListener('change', () => { closeDrawer(); $('shell').classList.remove('sidebar-collapsed'); });
  document.addEventListener('keydown', e => {
    if (!$('shell').classList.contains('drawer-open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); }
    if (e.key === 'Tab') {
      const items = [...$('sidebar').querySelectorAll('button')].filter(el => el.offsetParent !== null);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  function openDialog(id) { closeDrawer(); $(id).showModal(); }
  $('settings-open').onclick = () => openDialog('settings-dialog');
  document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => b.closest('dialog').close(); });
  document.querySelectorAll('dialog').forEach(d => {
    d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } });
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && !e.isComposing) { e.preventDefault(); d.close(); } });
  });
  const paragraph = text => escapeHtml(text).split('\n\n').map(p => {
    const lines = p.split('\n');
    return lines.every(line => /^\d+\. /.test(line))
      ? `<ol>${lines.map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`).join('')}</ol>`
      : `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
  let historyMarkup = '';
  function renderHistory() {
    const markup = threads.map(t => `<button class="cg-nav-item" data-thread="${t.id}" title="${escapeHtml(t.title)}" ${t.id === currentId && $('main').dataset.view !== 'tasks' ? 'aria-current="page"' : ''}><span class="cg-nav-label">${escapeHtml(t.title)}</span></button>`).join('');
    if (markup !== historyMarkup) { $('history-list').innerHTML = markup; historyMarkup = markup; }
    $('tasks-open').toggleAttribute('aria-current', $('main').dataset.view === 'tasks');
    if ($('main').dataset.view === 'tasks') $('tasks-open').setAttribute('aria-current', 'page');
  }
  function scrollLatest() { $('transcript').scrollTop = $('transcript').scrollHeight; follow = true; $('jump-latest').hidden = true; }
  function renderMessages(forceBottom = false) {
    const t = current();
    $('main').dataset.view = t && t.messages.length ? 'chat' : 'home';
    $('page-title').textContent = 'Studio';
    if (!t || !t.messages.length) $('content').innerHTML = '<div class="welcome"><h1>你想从哪里开始？</h1></div>';
    else if (running && $('content').querySelector('[data-streaming] .cg-prose')) {
      $('content').querySelector('[data-streaming] .cg-prose').innerHTML = paragraph(running.message.text);
    } else $('content').innerHTML = t.messages.map((m, i) => m.role === 'user'
      ? `<section class="message message--user" aria-label="你的消息"><div class="bubble">${m.files?.length ? `<div class="message-files">${escapeHtml(m.files.join(' · '))}</div>` : ''}${escapeHtml(m.text)}</div></section>`
      : `<section class="message" aria-label="演示助手回复" ${running?.message === m ? 'data-streaming' : ''}><div class="cg-prose">${paragraph(m.text)}</div>${running?.message === m ? '' : `<div class="assistant-actions"><button class="cg-btn cg-btn--icon" data-copy="${i}" aria-label="复制回复" title="复制回复">${icon('copy')}</button><button class="cg-btn cg-btn--icon" data-retry="${i}" aria-label="重新演示回复" title="重新演示回复">${icon('retry')}</button></div>`}</section>`).join('');
    renderHistory(); if (forceBottom || follow) scrollLatest();
  }
  function syncSend() {
    $('send').disabled = !running && !$('prompt').value.trim() && !files.length;
    $('send').innerHTML = icon(running ? 'stop' : 'send');
    const label = running ? '停止演示回复' : '发送消息'; $('send').setAttribute('aria-label', label); $('send').title = label;
    $('prompt').style.height = 'auto'; $('prompt').style.height = Math.min($('prompt').scrollHeight, 208) + 'px';
  }
  function finishRun(stopped = false) {
    if (!running) return;
    clearInterval(running.timer); running = null; syncSend(); renderMessages();
    $('run-status').textContent = stopped ? '演示回复已停止' : '演示回复完成';
  }
  function startReply(message) {
    const full = '这是一条本地演示回复，用于检查文字、滚动和输入区域的呈现。\n\n可以继续输入、添加附件，或打开“任务”查看列表布局。实际产品中请将这里连接到自己的业务流程。';
    running = { message, offset: 0, timer: null };
    $('run-status').textContent = '正在生成演示回复';
    running.timer = setInterval(() => {
      if (!running) return;
      running.offset += 6; message.text = full.slice(0, running.offset); renderMessages();
      if (running.offset >= full.length) finishRun();
    }, 45);
    syncSend();
  }
  function switchThread(id) { finishRun(true); currentId = id; files = []; renderFiles(); closeDrawer(); $('toast').hidden = true; follow = true; renderMessages(true); syncSend(); }
  $('history-list').onclick = e => { const b = e.target.closest('[data-thread]'); if (b) switchThread(Number(b.dataset.thread)); };
  $('new-chat').onclick = () => { finishRun(true); const t = { id: nextId++, title: '新对话', messages: [] }; threads.unshift(t); $('prompt').value = ''; switchThread(t.id); if (!narrow.matches) $('prompt').focus(); };
  $('composer').onsubmit = e => {
    e.preventDefault(); if (running) return finishRun(true);
    const text = $('prompt').value.trim(); if (!text && !files.length) return;
    const t = current(); if (!t.messages.length) t.title = text.slice(0, 32) || files[0].name;
    t.messages.push({ role: 'user', text, files: files.map(f => f.name) });
    const reply = { role: 'assistant', text: '' }; t.messages.push(reply);
    $('prompt').value = ''; files = []; renderFiles(); follow = true; startReply(reply); renderMessages(true);
  };
  $('prompt').oninput = syncSend;
  $('prompt').addEventListener('compositionstart', () => { composing = true; });
  $('prompt').addEventListener('compositionend', () => { composing = false; });
  $('prompt').onkeydown = e => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing || composing || e.keyCode === 229) return;
    const trigger = sendMode === 'enter' ? !e.ctrlKey && !e.metaKey : e.ctrlKey || e.metaKey;
    if (trigger && !running) { e.preventDefault(); $('composer').requestSubmit(); }
  };
  function renderFiles() {
    $('attachments').innerHTML = files.map((f, i) => `<div class="attachment">${icon('file')}<span class="attachment-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</span><button type="button" class="cg-btn cg-btn--icon" data-remove="${i}" aria-label="移除附件 ${escapeHtml(f.name)}" title="移除附件">${icon('close')}</button></div>`).join(''); syncSend();
  }
  $('attach').onclick = () => $('file-input').click();
  $('file-input').onchange = e => { files.push(...e.target.files); e.target.value = ''; renderFiles(); };
  $('attachments').onclick = e => { const b = e.target.closest('[data-remove]'); if (b) { files.splice(Number(b.dataset.remove), 1); renderFiles(); $('attach').focus(); } };
  $('content').onclick = async e => {
    const copy = e.target.closest('[data-copy]'), retry = e.target.closest('[data-retry]'), task = e.target.closest('[data-task]');
    if (copy) { try { await navigator.clipboard.writeText(current().messages[Number(copy.dataset.copy)].text); toast('已复制'); } catch { toast('复制失败，请选择文字后复制'); } }
    if (retry && !running) { const m = current().messages[Number(retry.dataset.retry)]; m.text = ''; follow = true; startReply(m); renderMessages(); }
    if (task) { const item = tasks[Number(task.dataset.task)]; item.state = item.state === 'done' ? 'ready' : 'done'; renderTasks(); }
    if (e.target.closest('[data-create-task]')) openDialog('task-dialog');
  };
  $('transcript').onscroll = () => { if ($('main').dataset.view !== 'chat') return; follow = $('transcript').scrollHeight - $('transcript').scrollTop - $('transcript').clientHeight < 80; $('jump-latest').hidden = follow; };
  $('jump-latest').onclick = scrollLatest;
  function search() { const q = $('search-input').value.trim().toLowerCase(); const results = threads.filter(t => (t.title + t.messages.map(m => m.text).join('')).toLowerCase().includes(q)); $('search-results').innerHTML = results.length ? results.map(t => `<button class="cg-nav-item" data-result="${t.id}">${icon('new-chat')}<span class="cg-nav-label">${escapeHtml(t.title)}</span></button>`).join('') : '<p class="cg-muted">没有找到相关对话，试试其他关键词。</p>'; }
  $('search-open').onclick = () => { openDialog('search-dialog'); $('search-input').value = ''; search(); $('search-input').focus(); };
  $('search-input').oninput = search;
  $('search-results').onclick = e => { const b = e.target.closest('[data-result]'); if (b) { $('search-dialog').close(); switchThread(Number(b.dataset.result)); } };
  function renderTasks() {
    $('main').dataset.view = 'tasks'; $('page-title').textContent = '任务'; $('jump-latest').hidden = true;
    $('content').innerHTML = `<div class="task-header"><div><h1>任务</h1><p>把下一步工作安排清楚。</p></div><button class="cg-btn cg-btn--primary" data-create-task>${icon('plus')}新建任务</button></div>${tasks.map((t, i) => `<div class="task-row">${icon(t.state === 'done' ? 'check' : 'file')}<div class="task-copy"><div class="task-title">${escapeHtml(t.title)}</div><p>我的工作区</p></div><span class="cg-badge ${t.state === 'done' ? 'cg-badge--success' : ''}">${t.state === 'done' ? '已完成' : '待处理'}</span><button class="cg-btn cg-btn--secondary" data-task="${i}">${t.state === 'done' ? '重新打开' : '标记完成'}</button></div>`).join('')}`;
    renderHistory();
  }
  $('tasks-open').onclick = () => { finishRun(true); closeDrawer(); renderTasks(); };
  $('task-form').onsubmit = e => { e.preventDefault(); const title = $('task-name').value.trim(); if (!title) { $('task-name').setCustomValidity('请输入任务名称'); $('task-name').reportValidity(); return; } tasks.unshift({ title, state: 'ready' }); $('task-name').value = ''; $('task-dialog').close(); renderTasks(); toast('任务已创建'); };
  $('task-name').oninput = e => e.target.setCustomValidity('');
  renderMessages(); syncSend();
})();
