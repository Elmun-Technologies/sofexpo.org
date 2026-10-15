(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const state = {
    user: null,
    csrf: '',
    view: 'dashboard',
    days: 30,
    leadsPage: 1,
    filters: { q: '', status: '', form: '' },
    currentLead: null,
    currentPortalAccountId: '',
    portalPage: 1,
    portalFilters: { q: '', type: '', active: '' },
    auditPage: 1,
    auditFilters: { q: '', actor: '', entity: '', from: '', to: '' },
    toastTimer: null,
  };
  const labels = {
    dashboard: 'Umumiy ko‘rinish', leads: 'Arizalar', portalAccounts: 'Kabinet akkauntlari', analytics: 'Analitika',
    integrations: 'Integratsiyalar', activity: 'Faoliyat tarixi', users: 'Jamoa va ruxsatlar',
  };
  const auditActionLabels = {
    'lead.update': 'CRM kartasi yangilandi', 'lead.note.add': 'Ichki izoh qo‘shildi',
    'portal_account.activate': 'Kabinet faollashtirildi', 'portal_account.deactivate': 'Kabinet bloklandi',
    'portal_profile.update': 'Profil yangilandi', 'user.create': 'Jamoa hisobi yaratildi',
    'user.update': 'Jamoa ruxsati yangilandi', 'outbox.retry': 'Yetkazish qayta navbatga qo‘yildi',
  };
  const statusLabels = {
    new: 'Yangi', contacted: 'Bog‘lanildi', qualified: 'Malakali', won: 'Yakunlandi', lost: 'Bekor qilindi', spam: 'Spam',
  };
  const priorityLabels = { low: 'Past', normal: 'Oddiy', high: 'Yuqori' };
  const formLabels = {
    exhibitor: 'Eksponent', visitor: 'Tashrifchi', organizer: 'Tashkilotchi', sponsor: 'Homiy',
    callback: 'Qo‘ng‘iroq', catalog: 'Katalog', group: 'Guruh tashrifi', quiz: 'Kviz', press: 'OAV', generic: 'Umumiy',
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];

  function formatDate(value, withTime = true) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return escapeHtml(value);
    /* browsers ship no Uzbek month names (Intl printed "M10 12"): spell them out */
    const pad = (n) => String(n).padStart(2, '0');
    const day = `${pad(date.getDate())} ${UZ_MONTHS[date.getMonth()]}`;
    return withTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
  }

  function number(value) {
    return new Intl.NumberFormat('uz-UZ').format(Number(value || 0));
  }

  function showToast(message, kind = 'success') {
    const toast = $('#toast');
    toast.textContent = message;
    toast.style.background = kind === 'error' ? '#9c3930' : '#183b29';
    toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  function setAuthVisible(visible) {
    $('#auth').hidden = !visible;
    $('#app').hidden = visible;
    if (visible) {
      state.user = null;
      state.csrf = '';
    }
  }

  function setUser(user) {
    state.user = user;
    $('#profile-email').textContent = user.email;
    $('#profile-role').textContent = user.role === 'admin' ? 'Administrator' : 'Menejer';
    $('#profile-avatar').textContent = (user.email || 'S').charAt(0).toUpperCase();
    $$('.admin-only').forEach((item) => { item.hidden = user.role !== 'admin'; });
  }

  async function api(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (method !== 'GET' && method !== 'HEAD' && state.csrf) headers['X-CSRF-Token'] = state.csrf;
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : null;
    if (!response.ok) {
      if (response.status === 401 && path !== '/api/admin/login') setAuthVisible(true);
      const error = new Error(data?.error || `Server xatosi (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return data || {};
  }

  function pageIntro(title, description, badge = '') {
    return `<div class="page-intro"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${badge ? `<span class="eyebrow-chip">${escapeHtml(badge)}</span>` : ''}</div>`;
  }

  function metricCard(label, value, note, icon, accent = '') {
    return `<article class="metric-card"><div class="metric-head"><span>${escapeHtml(label)}</span><span class="metric-icon">${icon}</span></div><div class="metric-value">${escapeHtml(value)}</div><div class="metric-foot">${accent ? `<strong>${escapeHtml(accent)}</strong> · ` : ''}${escapeHtml(note)}</div></article>`;
  }

  function chartSvg(daily) {
    const width = 720;
    const height = 184;
    const inset = { top: 10, right: 12, bottom: 14, left: 12 };
    const values = daily.map((entry) => Math.max(0, Number(entry.leads || 0)));
    const max = Math.max(4, ...values);
    const plotWidth = width - inset.left - inset.right;
    const plotHeight = height - inset.top - inset.bottom;
    const points = values.map((value, index) => {
      const x = inset.left + (daily.length <= 1 ? plotWidth / 2 : (index / (daily.length - 1)) * plotWidth);
      const y = inset.top + plotHeight - (value / max) * plotHeight;
      return [x, y];
    });
    const line = points.map((point) => point.map((n) => n.toFixed(1)).join(',')).join(' ');
    const area = points.length ? `${inset.left},${height - inset.bottom} ${line} ${width - inset.right},${height - inset.bottom}` : '';
    const grid = [0, 1, 2, 3].map((index) => {
      const y = inset.top + (plotHeight * index / 3);
      return `<line class="chart-grid" x1="${inset.left}" y1="${y.toFixed(1)}" x2="${width - inset.right}" y2="${y.toFixed(1)}"/>`;
    }).join('');
    const dots = points.length <= 20 ? points.map(([x, y]) => `<circle class="chart-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`).join('') : '';
    return `<svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Kunlik arizalar grafigi"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#157389" stop-opacity=".16"/><stop offset="100%" stop-color="#157389" stop-opacity="0"/></linearGradient></defs>${grid}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/>${dots}</svg>`;
  }

  function statusBadge(status) {
    return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span>`;
  }

  function priorityBadge(priority) {
    return `<span class="priority-badge priority-${escapeHtml(priority)}">${escapeHtml(priorityLabels[priority] || priority)}</span>`;
  }

  function personCell(row) {
    const initials = String(row.name || '?').trim().split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase();
    return `<div class="person-cell"><span class="person-mark">${escapeHtml(initials || '?')}</span><span class="person-info"><button class="lead-open" type="button" data-lead-id="${escapeHtml(row.id)}"><strong>${escapeHtml(row.name || 'Ismsiz')}</strong></button><small>${escapeHtml(row.company || row.phone || '—')}</small></span></div>`;
  }

  function leadsTable(rows, compact = false) {
    if (!rows?.length) return `<div class="empty-state"><strong>Hozircha ariza yo‘q</strong>Yangi murojaatlar kelishi bilan shu yerda ko‘rinadi.</div>`;
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>MIJOZ</th><th>FORMA / TADBIR</th><th>SANA</th><th>STATUS</th>${compact ? '' : '<th>USTUVORLIK</th>'}</tr></thead><tbody>${rows.map((row) => `<tr><td>${personCell(row)}</td><td>${escapeHtml(formLabels[row.formType] || row.formType || 'Umumiy')}<small style="display:block;color:#98a198;margin-top:4px">${escapeHtml(row.event || '—')}</small></td><td>${escapeHtml(formatDate(row.createdAt))}</td><td>${statusBadge(row.status)}</td>${compact ? '' : `<td>${priorityBadge(row.priority)}</td>`}</tr>`).join('')}</tbody></table></div>`;
  }

  async function renderDashboard() {
    const content = $('#content');
    content.innerHTML = `<div class="skeleton"></div><div style="height:14px"></div><div class="skeleton"></div>`;
    const [data, latest] = await Promise.all([
      api(`/api/admin/dashboard?days=${state.days}`),
      api('/api/admin/leads?limit=6'),
    ]);
    $('#new-count').textContent = number(data.newLeads);
    const daily = data.daily || [];
    const first = daily[0]?.day;
    const last = daily.at(-1)?.day;
    const chartLabels = [first, daily[Math.floor(daily.length / 2)]?.day, last].filter(Boolean).map((day) => formatDate(`${day}T00:00:00Z`, false));
    const maxStatus = Math.max(1, ...(data.statuses || []).map((item) => Number(item.count)));
    const maxForm = Math.max(1, ...(data.forms || []).map((item) => Number(item.count)));
    content.innerHTML = `${pageIntro('Xush kelibsiz', 'SOF EXPO murojaatlari va faoliyatining qisqa hisoboti.', `${state.days} KUN`)}
      <div class="metrics-grid">
        ${metricCard('Jami arizalar', number(data.totalLeads), 'tanlangan davrda', '▤')}
        ${metricCard('Yangi arizalar', number(data.newLeads), 'ko‘rib chiqish kutilmoqda', '✦', data.newLeads ? 'E’tibor' : '')}
        ${metricCard('Sayt sessiyalari', number(data.sessions), 'birinchi tomon hisoblagichi', '◉')}
        ${metricCard('Ariza konversiyasi', `${data.conversionRate}%`, 'sessiyalarga nisbatan', '↗')}
        ${metricCard('Yangi kabinetlar', number(data.portalAccounts), 'tanlangan davrda ro‘yxatdan o‘tdi', '♙')}
        ${metricCard('Kabinet so‘rovlari', number(data.portalRequests), `${number(data.portalNewRequests)} tasi yangi`, '⌂', data.portalNewRequests ? 'Kuzatish' : '')}
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-head"><div><h3>Arizalar dinamikasi</h3><p>Kunlar kesimida qabul qilingan murojaatlar</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Arizalar</span></div></div><div class="chart-wrap">${chartSvg(daily)}</div><div class="chart-labels"><span>${escapeHtml(chartLabels[0] || '')}</span><span>${escapeHtml(chartLabels[1] || '')}</span><span>${escapeHtml(chartLabels[2] || '')}</span></div></section>
        <section class="panel"><div class="panel-head"><div><h3>Arizalar holati</h3><p>Tanlangan davrdagi taqsimot</p></div><span class="eyebrow-chip">${number(data.totalLeads)} JAMI</span></div><div class="status-list">${(data.statuses || []).length ? data.statuses.map((item) => `<div><div class="status-row"><span class="status-left"><i class="status-dot ${escapeHtml(item.key)}"></i>${escapeHtml(statusLabels[item.key] || item.key)}</span><strong>${number(item.count)}</strong></div><div class="status-bar"><i style="width:${Math.min(100, Number(item.count) / maxStatus * 100)}%"></i></div></div>`).join('') : '<div class="empty-state">Hozircha ma’lumot yo‘q</div>'}</div></section>
      </div>
      <div class="dashboard-grid">
        <section class="panel recent-panel"><div class="panel-head"><div><h3>So‘nggi arizalar</h3><p>Yaqinda kelib tushgan murojaatlar</p></div><button class="button button-secondary" type="button" data-go-view="leads">Barchasini ko‘rish →</button></div>${leadsTable(latest.items, true)}</section>
        <section class="panel"><div class="panel-head"><div><h3>Manbalar va formalar</h3><p>Qaysi yo‘ldan ko‘proq murojaat kelmoqda</p></div></div><div class="rank-list">${(data.forms || []).map((item) => `<div><div class="rank-row"><span>${escapeHtml(formLabels[item.key] || item.key || 'Umumiy')}</span><strong>${number(item.count)}</strong></div><div class="status-bar"><i style="width:${Math.min(100, Number(item.count) / maxForm * 100)}%"></i></div></div>`).join('') || '<div class="empty-state">Hozircha ma’lumot yo‘q</div>'}${(data.sources || []).slice(0, 4).map((item) => `<div class="rank-row"><span>Manba · ${escapeHtml(item.key)}</span><strong>${number(item.count)}</strong></div>`).join('')}</div></section>
      </div>`;
    bindLeadButtons(content);
    $$('[data-go-view]', content).forEach((button) => button.addEventListener('click', () => navigate(button.dataset.goView)));
  }

  async function renderLeads() {
    const content = $('#content');
    content.innerHTML = `<div class="skeleton"></div>`;
    const query = new URLSearchParams({ page: String(state.leadsPage), limit: '25' });
    if (state.filters.q) query.set('q', state.filters.q);
    if (state.filters.status) query.set('status', state.filters.status);
    if (state.filters.form) query.set('form', state.filters.form);
    const data = await api(`/api/admin/leads?${query}`);
    const formOptions = Object.entries(formLabels).map(([value, label]) => `<option value="${escapeHtml(value)}" ${state.filters.form === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    const statusOptions = Object.entries(statusLabels).map(([value, label]) => `<option value="${escapeHtml(value)}" ${state.filters.status === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    content.innerHTML = `${pageIntro('Arizalar markazi', 'Barcha murojaatlarni kuzating, mas’ul belgilang va keyingi qadamni yozib boring.', `${number(data.total)} TA ARIZA`)}
      <form class="lead-toolbar" id="lead-filters"><div class="filters"><input class="filter-input" name="q" type="search" value="${escapeHtml(state.filters.q)}" placeholder="Ism, telefon, kompaniya…" aria-label="Arizalarni qidirish"/><select class="filter-select" name="status" aria-label="Status bo‘yicha filtr"><option value="">Barcha statuslar</option>${statusOptions}</select><select class="filter-select" name="form" aria-label="Forma bo‘yicha filtr"><option value="">Barcha formalar</option>${formOptions}</select><button class="button button-secondary" type="submit">Filtrlash</button></div><button class="button button-quiet" id="export-leads" type="button">↓ CSV yuklab olish</button></form>
      <section class="panel table-panel">${leadsTable(data.items)}<div class="pagination"><span>${data.total ? `${number((data.page - 1) * data.limit + 1)}–${number(Math.min(data.page * data.limit, data.total))} / ${number(data.total)}` : 'Natija yo‘q'}</span><div class="pagination-actions"><button type="button" id="page-prev" ${data.page <= 1 ? 'disabled' : ''}>← Oldingi</button><span style="padding:7px 5px">${data.page} / ${data.pages}</span><button type="button" id="page-next" ${data.page >= data.pages ? 'disabled' : ''}>Keyingi →</button></div></div></section>`;
    $('#lead-filters').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.filters = { q: String(form.get('q') || '').trim(), status: String(form.get('status') || ''), form: String(form.get('form') || '') };
      state.leadsPage = 1;
      renderLeads().catch(showError);
    });
    $('#page-prev').addEventListener('click', () => { state.leadsPage -= 1; renderLeads().catch(showError); });
    $('#page-next').addEventListener('click', () => { state.leadsPage += 1; renderLeads().catch(showError); });
    $('#export-leads').addEventListener('click', () => {
      const exportQuery = new URLSearchParams();
      if (state.filters.q) exportQuery.set('q', state.filters.q);
      if (state.filters.status) exportQuery.set('status', state.filters.status);
      if (state.filters.form) exportQuery.set('form', state.filters.form);
      window.location.href = `/api/admin/leads/export.csv?${exportQuery}`;
    });
    bindLeadButtons(content);
  }

  async function renderPortalAccounts() {
    if (state.currentPortalAccountId) return openPortalAccount(state.currentPortalAccountId);
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const query = new URLSearchParams({ page: String(state.portalPage), limit: '20' });
    if (state.portalFilters.q) query.set('q', state.portalFilters.q);
    if (state.portalFilters.type) query.set('type', state.portalFilters.type);
    if (state.portalFilters.active !== '') query.set('active', state.portalFilters.active);
    const data = await api(`/api/admin/portal-accounts?${query}`);
    const typeOptions = [
      ['', 'Barcha kabinetlar'], ['visitor', 'Mehmon'], ['exhibitor', 'Eksponent'],
    ].map(([value, label]) => `<option value="${value}" ${state.portalFilters.type === value ? 'selected' : ''}>${label}</option>`).join('');
    const activeOptions = [
      ['', 'Barcha holatlar'], ['1', 'Faol'], ['0', 'Bloklangan'],
    ].map(([value, label]) => `<option value="${value}" ${state.portalFilters.active === value ? 'selected' : ''}>${label}</option>`).join('');
    const rows = data.items.map((account) => `<tr>
      <td><button class="lead-open" type="button" data-portal-account-id="${escapeHtml(account.id)}"><strong>${escapeHtml(account.name)}</strong></button><small style="display:block;color:#98a198;margin-top:4px">${escapeHtml(account.email)}</small></td>
      <td>${account.accountType === 'visitor' ? 'Mehmon' : 'Eksponent'}</td>
      <td>${escapeHtml(account.company || account.industry || account.country || '—')}</td>
      <td><strong>${number(account.requestCount)}</strong>${account.newRequests ? `<small style="display:block;color:#9a7731;margin-top:4px">${number(account.newRequests)} yangi</small>` : ''}</td>
      <td>${escapeHtml(account.latestRequestAt ? formatDate(account.latestRequestAt) : '—')}</td>
      <td>${escapeHtml(account.lastLoginAt ? formatDate(account.lastLoginAt) : 'Kirmagan')}</td>
      <td>${Number(account.active) ? '<span class="status-badge status-won">Faol</span>' : '<span class="status-badge status-lost">Bloklangan</span>'}</td>
    </tr>`).join('');
    content.innerHTML = `${pageIntro('Mehmon va eksponent kabinetlari', 'Hisoblarni, oxirgi faollikni va ularga bog‘langan so‘rovlarni ko‘ring. Har bir so‘rovni CRM kartasidan boshqaring.', `${number(data.total)} TA HISOB`)}
      <form class="lead-toolbar" id="portal-account-filters"><div class="filters"><input class="filter-input" name="q" type="search" value="${escapeHtml(state.portalFilters.q)}" placeholder="Ism, email, telefon, kompaniya…" aria-label="Kabinet hisoblarini qidirish"/><select class="filter-select" name="type" aria-label="Kabinet turi">${typeOptions}</select><select class="filter-select" name="active" aria-label="Hisob holati">${activeOptions}</select><button class="button button-secondary" type="submit">Filtrlash</button></div></form>
      <section class="panel table-panel"><div class="table-wrap">${rows.length ? `<table class="data-table"><thead><tr><th>HISOB / PROFIL</th><th>TUR</th><th>KOMPANIYA / SOHA</th><th>SO‘ROVLAR</th><th>OXIRGI SO‘ROV</th><th>OXIRGI KIRISH</th><th>HOLAT</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty-state"><strong>Akkaunt topilmadi</strong>Filtrni o‘zgartiring yoki yangi kabinet ro‘yxatdan o‘tishini kuting.</div>'}</div><div class="pagination"><span>${data.total ? `${number((data.page - 1) * data.limit + 1)}–${number(Math.min(data.page * data.limit, data.total))} / ${number(data.total)}` : 'Natija yo‘q'}</span><div class="pagination-actions"><button type="button" id="portal-prev" ${data.page <= 1 ? 'disabled' : ''}>← Oldingi</button><span style="padding:7px 5px">${data.page} / ${data.pages}</span><button type="button" id="portal-next" ${data.page >= data.pages ? 'disabled' : ''}>Keyingi →</button></div></div></section>`;
    $('#portal-account-filters').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.portalFilters = { q: String(form.get('q') || '').trim(), type: String(form.get('type') || ''), active: String(form.get('active') || '') };
      state.portalPage = 1;
      renderPortalAccounts().catch(showError);
    });
    $('#portal-prev').addEventListener('click', () => { state.portalPage -= 1; renderPortalAccounts().catch(showError); });
    $('#portal-next').addEventListener('click', () => { state.portalPage += 1; renderPortalAccounts().catch(showError); });
    $$('[data-portal-account-id]', content).forEach((button) => button.addEventListener('click', () => openPortalAccount(button.dataset.portalAccountId).catch(showError)));
  }

  async function openPortalAccount(id) {
    state.currentPortalAccountId = id;
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const response = await api(`/api/admin/portal-accounts/${encodeURIComponent(id)}`);
    const account = response.account;
    const active = Number(account.active) === 1;
    const requests = account.requests || [];
    const requestRows = requests.map((request) => {
      const summary = Object.entries(request.details || {}).map(([key, value]) => `${key}: ${String(value)}`).join(' · ');
      return `<tr><td>${escapeHtml(request.requestType === 'visitor' ? 'Mehmon so‘rovi' : 'Eksponent so‘rovi')}<small style="display:block;color:#98a198;margin-top:4px">${escapeHtml(summary || '—')}</small></td><td>${escapeHtml(request.event || '—')}</td><td>${escapeHtml(formatDate(request.createdAt))}</td><td>${statusBadge(request.status)}</td><td>${escapeHtml(request.assignee || 'Belgilanmagan')}</td><td><button class="button button-secondary" type="button" data-lead-id="${escapeHtml(request.leadId)}">CRM kartasi</button></td></tr>`;
    }).join('');
    const adminAction = state.user?.role === 'admin'
      ? `<button class="button ${active ? 'button-danger' : 'button-primary'}" type="button" id="toggle-portal-account">${active ? 'Kabinetni bloklash' : 'Kabinetni qayta faollashtirish'}</button>`
      : '<p class="muted">Kabinetni bloklash yoki faollashtirish uchun administrator huquqi kerak.</p>';
    content.innerHTML = `<div class="account-detail-toolbar"><button class="button button-quiet" id="back-portal-accounts" type="button">← Kabinetlar ro‘yxati</button>${adminAction}</div>
      ${pageIntro(account.name, `${account.accountType === 'visitor' ? 'Mehmon' : 'Eksponent'} · ${account.email}`, active ? 'FAOL' : 'BLOKLANGAN')}
      ${!active ? '<div class="notice-box" role="status">Bu akkaunt bloklangan; amaldagi portal sessiyalari bekor qilingan.</div>' : ''}
      <div class="account-detail-grid"><section class="panel"><div class="panel-head"><div><h3>Profil va hisob</h3><p>Ro‘yxatdan o‘tish va oxirgi faollik</p></div></div><dl class="detail-list">
        ${detailItem('Ism', account.name)}${detailItem('Email', account.email)}${detailItem('Telefon', account.phone)}${detailItem('Kompaniya', account.company)}${detailItem('Mamlakat', account.country)}${detailItem('Faoliyat sohasi', account.industry)}${detailItem('Sayt', account.website)}${detailItem('Qiziqishlar', account.interests)}${detailItem('Yaratilgan', formatDate(account.createdAt))}${detailItem('Oxirgi kirish', account.lastLoginAt ? formatDate(account.lastLoginAt) : 'Hali kirmagan')}${detailItem('Profil yangilangan', formatDate(account.profileUpdatedAt))}
      </dl></section><section class="panel"><div class="panel-head"><div><h3>So‘rovlar oqimi</h3><p>${number(requests.length)} ta murojaat · holat va mas’ul CRM kartasidan boshqariladi</p></div></div>${requests.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>SO‘ROV</th><th>TADBIR</th><th>SANA</th><th>STATUS</th><th>MAS’UL</th><th>AMAL</th></tr></thead><tbody>${requestRows}</tbody></table></div>` : '<div class="empty-state"><strong>Hali so‘rov yuborilmagan</strong>Akkaunt ro‘yxatdan o‘tgan, ammo tashrif yoki ishtirok arizasi yo‘q.</div>'}</section></div>`;
    $('#back-portal-accounts').addEventListener('click', () => {
      state.currentPortalAccountId = '';
      renderPortalAccounts().catch(showError);
    });
    $('#toggle-portal-account')?.addEventListener('click', async () => {
      const verb = active ? 'bloklash' : 'qayta faollashtirish';
      if (!window.confirm(`${account.email} kabinetini ${verb}ni tasdiqlaysizmi?`)) return;
      try {
        const result = await api(`/api/admin/portal-accounts/${encodeURIComponent(id)}`, { method: 'PATCH', body: { active: !active } });
        showToast(active ? `Kabinet bloklandi; ${number(result.revokedSessions)} sessiya bekor qilindi.` : 'Kabinet qayta faollashtirildi.');
        await openPortalAccount(id);
      } catch (error) { showError(error); }
    });
    bindLeadButtons(content);
  }

  function bindLeadButtons(root = document) {
    $$('[data-lead-id]', root).forEach((button) => button.addEventListener('click', () => openLead(button.dataset.leadId)));
  }

  function renderBarList(items, emptyText = 'Ma’lumot hozircha mavjud emas.') {
    if (!items?.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    const max = Math.max(1, ...items.map((item) => Number(item.count)));
    return `<div class="analytic-bars">${items.map((item) => `<div class="bar-row"><span title="${escapeHtml(item.key)}">${escapeHtml(item.key || 'Noma’lum')}</span><div class="bar-track"><i style="width:${Math.max(1, Number(item.count) / max * 100)}%"></i></div><strong>${number(item.count)}</strong></div>`).join('')}</div>`;
  }

  async function renderAnalytics() {
    const content = $('#content');
    content.innerHTML = `<div class="skeleton"></div>`;
    const data = await api(`/api/admin/analytics?days=${state.days}`);
    const daily = data.daily || [];
    const portal = data.portal || {};
    const funnel = data.funnel || {};
    const funnelRows = [
      { key: 'Saytga kirgan sessiyalar', count: funnel.visits || 0 },
      { key: 'CTA bosgan sessiyalar', count: funnel.ctaSessions || 0 },
      { key: 'Forma/kvizni boshlaganlar', count: funnel.formStartSessions || 0 },
      { key: 'Muvaffaqiyatli yuborganlar', count: funnel.successSessions || 0 },
    ];
    const views = daily.reduce((sum, item) => sum + Number(item.views || 0), 0);
    const sessions = daily.reduce((sum, item) => sum + Number(item.sessions || 0), 0);
    const submits = daily.reduce((sum, item) => sum + Number(item.formSubmits || 0), 0);
    const max = Math.max(1, ...daily.map((item) => Number(item.views || 0)));
    const portalTypeLabel = (key) => key === 'visitor' ? 'Mehmon' : key === 'exhibitor' ? 'Eksponent' : key;
    const accountTypes = (portal.accountsByType || []).map((item) => ({ ...item, key: portalTypeLabel(item.key) }));
    const requestTypes = (portal.requestsByType || []).map((item) => ({ ...item, key: portalTypeLabel(item.key) }));
    const requestStatuses = (portal.requestStatuses || []).map((item) => ({ ...item, key: statusLabels[item.key] || item.key }));
    const portalDaily = portal.daily || [];
    const maxPortalActivity = Math.max(1, ...portalDaily.map((item) => Number(item.accounts) + Number(item.requests)));
    content.innerHTML = `${pageIntro('Birinchi tomon analitikasi', 'Sayt trafigi, formalar, kabinet ro‘yxatdan o‘tishi va mehmon/eksponent so‘rovlari — tanlangan davr bo‘yicha.', `${state.days} KUN`)}
      <div class="metrics-grid">${metricCard('Sahifa ko‘rishlar', number(views), 'page_view hodisalari', '◉')}${metricCard('Sessiyalar', number(sessions), 'takroriy bo‘lmagan ID', '◎')}${metricCard('Yuborilgan formalar', number(submits), 'muvaffaqiyatli yuborishlar', '↗')}${metricCard('Hodisalar', number(data.eventTotal), 'jami qayd etilgan', '⌁')}${metricCard('Yangi kabinetlar', number(portal.accounts), 'mehmon va eksponent hisoblari', '♙')}${metricCard('Kabinet so‘rovlari', number(portal.requests), 'tashrif va ishtirok arizalari', '⌂')}</div>
      <div class="analytics-grid"><section class="panel"><div class="panel-head"><div><h3>Kunlik sayt faolligi</h3><p>Sahifa ko‘rishlar va sessiyalar</p></div></div><div class="status-list">${daily.map((item) => `<div><div class="status-row"><span class="status-left">${escapeHtml(formatDate(`${item.day}T00:00:00Z`, false))}<small style="color:#98a198"> · ${number(item.sessions)} sessiya</small></span><strong>${number(item.views)}</strong></div><div class="status-bar"><i style="width:${Math.min(100, Number(item.views) / max * 100)}%"></i></div></div>`).join('')}</div></section>
        <section class="panel"><div class="panel-head"><div><h3>Eng ko‘p ko‘rilgan sahifalar</h3><p>URL ichidagi query va identifikatorlar olib tashlangan</p></div></div>${renderBarList(data.pages, 'Sahifa ko‘rishlar hali yig‘ilmagan.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Hodisalar</h3><p>O‘lchov nuqtalari bo‘yicha taqsimot</p></div></div>${renderBarList(data.events)}</section>
        <section class="panel"><div class="panel-head"><div><h3>Kampaniyalar</h3><p>UTM kampaniya nomlari</p></div></div>${renderBarList(data.campaigns, 'UTM kampaniyasi topilmadi.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Konversiya yo‘li</h3><p>Sessiyadan muvaffaqiyatli arizagacha · ${number(funnel.successfulSubmissions || 0)} yuborish, ${number(funnel.fallbackSubmissions || 0)} fallback</p></div></div>${renderBarList(funnelRows)}</section>
        <section class="panel"><div class="panel-head"><div><h3>CTA bosishlar</h3><p>Qaysi chaqiriq foydalanuvchini keyingi bosqichga olib o‘tdi</p></div></div>${renderBarList(data.ctas, 'CTA bosish hali qayd etilmadi.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Kanallar</h3><p>So‘rov va kvizlarda qayd etilgan kanal</p></div></div>${renderBarList(data.channels, 'Kanal ma’lumoti yo‘q.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Foydalanuvchi tillari</h3><p>Sessiya tiliga ko‘ra auditoriya</p></div></div>${renderBarList(data.locales, 'Til kesimi hali yig‘ilmagan.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Kabinetlar va arizalar oqimi</h3><p>Ro‘yxatdan o‘tishdan CRM holatigacha</p></div></div>${renderBarList(accountTypes, 'Bu davrda yangi kabinet yo‘q.')}<div class="flow-divider"></div>${renderBarList(requestTypes, 'Bu davrda kabinet so‘rovi yo‘q.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Kabinet so‘rovlarining CRM holati</h3><p>Har bir so‘rov mavjud CRM kartasiga ulangan</p></div></div>${renderBarList(requestStatuses, 'Bu davrda portal so‘rovi yo‘q.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Ko‘rgazmalar bo‘yicha kabinet so‘rovlari</h3><p>Mehmon va eksponent arizalari birgalikda</p></div></div>${renderBarList(portal.events, 'Bu davrda tadbir so‘rovi yo‘q.')}</section>
        <section class="panel"><div class="panel-head"><div><h3>Kabinet faolligining kunlik dinamikasi</h3><p>Yangi ro‘yxatdan o‘tishlar va tashrif/ishtirok so‘rovlari</p></div></div>${portalDaily.length ? `<div class="status-list">${portalDaily.map((item) => `<div><div class="status-row"><span class="status-left">${escapeHtml(formatDate(`${item.day}T00:00:00Z`, false))}<small style="color:#98a198"> · ${number(item.accounts)} hisob</small></span><strong>${number(item.requests)} so‘rov</strong></div><div class="status-bar"><i style="width:${Math.min(100, (Number(item.accounts) + Number(item.requests)) / maxPortalActivity * 100)}%"></i></div></div>`).join('')}</div>` : '<div class="empty-state">Kabinet faolligi hali yig‘ilmagan.</div>'}</section></div>`;
  }

  async function renderIntegrations() {
    const content = $('#content');
    content.innerHTML = `<div class="skeleton"></div>`;
    const [data, auditData] = await Promise.all([api('/api/admin/system'), api('/api/admin/audit?limit=20')]);
    const failed = data.outbox?.failed || 0;
    const pending = data.outbox?.pending || 0;
    const providers = [
      { name: 'Telegram Bot', icon: '➤', on: data.providers.telegram, detail: 'Yangi arizalar menejerlar Telegram chatiga xabarnoma sifatida yuboriladi.' },
      { name: 'CRM webhook', icon: '↗', on: data.providers.crm, detail: 'Lidlar sozlangan CRM webhook manziliga fon rejimida jo‘natiladi.' },
      { name: 'SQLite saqlash', icon: '▣', on: data.storage === 'sqlite', detail: 'Arizalar va analitika serverdagi SQLite bazasiga ishonchli yoziladi.' },
    ];
    content.innerHTML = `${pageIntro('Integratsiyalar va tizim', 'Ulanish holati va yuborilmagan arizalarni shu yerdan kuzating.', 'SERVER SIDE')}
      <div class="integration-grid">${providers.map((provider) => `<article class="integration-card"><div class="integration-icon">${provider.icon}</div><h3>${provider.name}</h3><p>${provider.detail}</p><div class="connection ${provider.on ? 'on' : ''}"><i></i>${provider.on ? 'Ulangan' : 'Sozlanmagan'}</div></article>`).join('')}</div>
      <div class="system-grid"><section class="panel"><div class="panel-head"><div><h3>Yetkazib berish navbati</h3><p>Vaqtinchalik uzilishlar avtomatik qayta uriniladi.</p></div></div><div class="system-stat"><span>Kutilmoqda</span><strong>${number(pending)}</strong></div><div class="system-stat"><span>Qayta urinish tugagan</span><strong>${number(failed)}</strong></div><div class="system-stat"><span>Administratorlar</span><strong>${number(data.adminUsers)}</strong></div><div class="system-stat"><span>Backend runtime</span><strong>${escapeHtml(data.node)}</strong></div>${failed ? '<button class="button button-secondary" id="retry-outbox" type="button" style="margin-top:15px">Yakunlangan jo‘natishlarni qayta urinish</button>' : ''}</section>
      <section class="panel"><div class="panel-head"><div><h3>Yetkazilmagan murojaatlar</h3><p>Avval saqlanadi, keyin integratsiyalarga uzatiladi.</p></div></div>${data.recentDeliveries?.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>LID</th><th>KANAL</th><th>HOLAT</th><th>URINISH</th></tr></thead><tbody>${data.recentDeliveries.map((row) => `<tr><td>${escapeHtml(row.name)}<small style="display:block;color:#98a198;margin-top:4px">${escapeHtml(row.phone)}</small></td><td>${escapeHtml(row.provider)}</td><td>${escapeHtml(row.state === 'failed' ? 'Xatolik' : 'Navbatda')}</td><td>${number(row.attempts)}${row.lastError ? `<small style="display:block;color:#a35446;margin-top:4px">${escapeHtml(row.lastError)}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><strong>Navbat toza</strong>Hozircha qayta ishlanishi kerak bo‘lgan jo‘natma yo‘q.</div>'}</section></div>
      <section class="panel" style="margin-top:14px"><div class="panel-head"><div><h3>So‘nggi boshqaruv amallari</h3><p>CRM, kabinet va jamoa sozlamalaridagi eng oxirgi o‘zgarishlar</p></div><button class="button button-secondary" id="open-activity-log" type="button">To‘liq tarix</button></div>${auditData.items?.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>SANA</th><th>BAJARUVCHI</th><th>AMAL</th><th>OBYEKT</th><th>O‘ZGARISH</th></tr></thead><tbody>${auditData.items.map((item) => `<tr><td>${escapeHtml(formatDate(item.createdAt))}</td><td>${escapeHtml(item.actorEmail)}</td><td>${escapeHtml(auditActionLabels[item.action] || item.action)}</td><td>${escapeHtml(item.entityType)} · ${escapeHtml(String(item.entityId).slice(0, 8))}</td><td>${escapeHtml(JSON.stringify(item.details || {}))}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state">Hozircha qayd etilgan boshqaruv amali yo‘q.</div>'}</section>`;
    $('#open-activity-log')?.addEventListener('click', () => navigate('activity'));
    $('#retry-outbox')?.addEventListener('click', async () => {
      try {
        const result = await api('/api/admin/outbox/retry', { method: 'POST', body: {} });
        showToast(`${number(result.retried)} ta jo‘natma qayta navbatga qo‘yildi.`);
        await renderIntegrations();
      } catch (error) { showError(error); }
    });
  }

  async function renderActivity() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const query = new URLSearchParams({ page: String(state.auditPage), limit: '25' });
    for (const key of ['q', 'actor', 'entity', 'from', 'to']) {
      if (state.auditFilters[key]) query.set(key, state.auditFilters[key]);
    }
    const data = await api(`/api/admin/audit?${query}`);
    const entityOptions = [
      ['', 'Barcha obyektlar'], ['lead', 'CRM arizasi'], ['portal_account', 'Kabinet akkaunti'],
      ['user', 'Jamoa hisobi'], ['delivery_outbox', 'Yetkazish navbati'],
    ].map(([value, label]) => `<option value="${value}" ${state.auditFilters.entity === value ? 'selected' : ''}>${label}</option>`).join('');
    const rows = (data.items || []).map((item) => `<tr>
      <td>${escapeHtml(formatDate(item.createdAt))}</td>
      <td>${escapeHtml(item.actorEmail || '—')}</td>
      <td>${escapeHtml(auditActionLabels[item.action] || item.action)}</td>
      <td>${escapeHtml(item.entityType)}<small style="display:block;color:#98a198;margin-top:4px">${escapeHtml(String(item.entityId || '').slice(0, 12))}</small></td>
      <td><code class="audit-details">${escapeHtml(JSON.stringify(item.details || {}))}</code></td>
    </tr>`).join('');
    content.innerHTML = `${pageIntro('Faoliyat tarixi', 'CRM, profil, kabinet, jamoa va yetkazish navbatidagi boshqaruv amallari. Lead kartasida uning o‘zgarishlar tarixi ham saqlanadi.', `${number(data.total)} TA YOZUV`)}
      <form class="lead-toolbar audit-toolbar" id="audit-filters"><div class="filters"><input class="filter-input" name="q" type="search" value="${escapeHtml(state.auditFilters.q)}" placeholder="Amal, obyekt ID yoki tafsilot…" aria-label="Faoliyat tarixidan qidirish"/><input class="filter-input" name="actor" type="email" value="${escapeHtml(state.auditFilters.actor)}" placeholder="Xodim emaili" aria-label="Bajaruvchi emaili"/><select class="filter-select" name="entity" aria-label="Obyekt turi">${entityOptions}</select><label class="audit-date"><span>Dan</span><input class="filter-input" name="from" type="date" value="${escapeHtml(state.auditFilters.from)}" aria-label="Boshlanish sanasi"/></label><label class="audit-date"><span>Gacha</span><input class="filter-input" name="to" type="date" value="${escapeHtml(state.auditFilters.to)}" aria-label="Tugash sanasi"/></label><button class="button button-secondary" type="submit">Filtrlash</button></div></form>
      <section class="panel table-panel"><div class="table-wrap">${rows.length ? `<table class="data-table audit-table"><thead><tr><th>SANA / VAQT</th><th>BAJARUVCHI</th><th>AMAL</th><th>OBYEKT</th><th>O‘ZGARISH TAFSILOTI</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty-state"><strong>Yozuv topilmadi</strong>Filtrlarni o‘zgartiring. Yangi boshqaruv amallari shu yerda qayd etiladi.</div>'}</div><div class="pagination"><span>${data.total ? `${number((data.page - 1) * data.limit + 1)}–${number(Math.min(data.page * data.limit, data.total))} / ${number(data.total)}` : 'Natija yo‘q'}</span><div class="pagination-actions"><button type="button" id="audit-prev" ${data.page <= 1 ? 'disabled' : ''}>← Oldingi</button><span style="padding:7px 5px">${data.page} / ${data.pages}</span><button type="button" id="audit-next" ${data.page >= data.pages ? 'disabled' : ''}>Keyingi →</button></div></div></section>`;
    $('#audit-filters').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.auditFilters = {
        q: String(form.get('q') || '').trim(), actor: String(form.get('actor') || '').trim(),
        entity: String(form.get('entity') || ''), from: String(form.get('from') || ''), to: String(form.get('to') || ''),
      };
      state.auditPage = 1;
      renderActivity().catch(showError);
    });
    $('#audit-prev').addEventListener('click', () => { state.auditPage -= 1; renderActivity().catch(showError); });
    $('#audit-next').addEventListener('click', () => { state.auditPage += 1; renderActivity().catch(showError); });
  }

  async function renderUsers() {
    const content = $('#content');
    content.innerHTML = `<div class="skeleton"></div>`;
    const data = await api('/api/admin/users');
    content.innerHTML = `${pageIntro('Jamoa va ruxsatlar', 'Menejerlarga alohida hisob oching. Hisoblar parol bilan himoyalangan.', 'ADMIN ONLY')}
      <section class="panel" style="margin-bottom:15px"><div class="panel-head"><div><h3>Yangi foydalanuvchi</h3><p>Parol kamida 12 belgidan iborat bo‘lishi kerak.</p></div></div><form id="user-create" class="user-create"><div class="field"><label for="user-email">EMAIL</label><input id="user-email" name="email" type="email" required placeholder="manager@sofexpo.org" /></div><div class="field"><label for="user-password">VAQTINCHALIK PAROL</label><input id="user-password" name="password" type="password" minlength="12" required placeholder="Kamida 12 belgi" /></div><div class="field"><label for="user-role">HUQUQ</label><select id="user-role" name="role"><option value="manager">Menejer</option><option value="admin">Administrator</option></select></div><button class="button button-primary" type="submit">Hisob yaratish</button></form></section>
      <section class="panel table-panel"><div class="panel-head" style="padding:17px 18px 0"><div><h3>Foydalanuvchilar</h3><p>${number(data.users.length)} ta hisob</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>FOYDALANUVCHI</th><th>HUQUQ</th><th>OXIRGI KIRISH</th><th>HOLAT</th><th>AMAL</th></tr></thead><tbody>${data.users.map((user) => `<tr><td><div class="person-info"><strong>${escapeHtml(user.email)}</strong><small>Qo‘shilgan: ${escapeHtml(formatDate(user.createdAt, false))}</small></div></td><td><select class="filter-select" data-role-select="${escapeHtml(user.id)}"><option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Menejer</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option></select></td><td>${escapeHtml(user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Hali kirmagan')}</td><td>${Number(user.active) ? '<span class="status-badge status-won">Faol</span>' : '<span class="status-badge status-lost">O‘chirilgan</span>'}</td><td><button type="button" class="button ${Number(user.active) ? 'button-danger' : 'button-secondary'}" data-user-toggle="${escapeHtml(user.id)}" data-active="${Number(user.active) ? '1' : '0'}">${Number(user.active) ? 'O‘chirish' : 'Faollashtirish'}</button></td></tr>`).join('')}</tbody></table></div></section>`;
    $('#user-create').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const payload = { email: form.get('email'), password: form.get('password'), role: form.get('role') };
      try {
        await api('/api/admin/users', { method: 'POST', body: payload });
        showToast('Foydalanuvchi yaratildi. Kirish ma’lumotlarini xavfsiz ulashing.');
        await renderUsers();
      } catch (error) { showError(error); }
    });
    $$('[data-user-toggle]').forEach((button) => button.addEventListener('click', async () => {
      const row = button.closest('tr');
      const role = $(`[data-role-select="${CSS.escape(button.dataset.userToggle)}"]`, row).value;
      try {
        await api(`/api/admin/users/${button.dataset.userToggle}`, { method: 'PATCH', body: { role, active: button.dataset.active !== '1' } });
        showToast('Foydalanuvchi sozlamalari saqlandi.');
        await renderUsers();
      } catch (error) { showError(error); }
    }));
    $$('[data-role-select]').forEach((select) => select.addEventListener('change', async () => {
      const row = select.closest('tr');
      const activeButton = $('[data-user-toggle]', row);
      try {
        await api(`/api/admin/users/${select.dataset.roleSelect}`, { method: 'PATCH', body: { role: select.value, active: activeButton.dataset.active === '1' } });
        showToast('Huquq yangilandi.');
      } catch (error) { showError(error); renderUsers().catch(showError); }
    }));
  }

  function detailItem(label, value) {
    return `<div class="detail-item"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || '—')}</dd></div>`;
  }

  async function openLead(id) {
    const drawer = $('#lead-drawer');
    const content = $('#drawer-content');
    state.currentLead = id;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    content.innerHTML = '<div class="loading-line">Ma’lumot yuklanmoqda…</div>';
    try {
      const response = await api(`/api/admin/leads/${encodeURIComponent(id)}`);
      const lead = response.lead;
      state.currentLead = lead.id;
      const initials = String(lead.name || '?').trim().split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase();
      const extras = Object.entries(lead.payload || {}).filter(([key, value]) => !['name', 'company', 'phone', 'email', 'event', 'comment', 'formType', 'page'].includes(key) && String(value).trim());
      const notes = lead.notes?.length ? lead.notes.map((note) => `<article class="note-item"><p>${escapeHtml(note.body)}</p><small>${escapeHtml(note.authorEmail)} · ${escapeHtml(formatDate(note.createdAt))}</small></article>`).join('') : '<p class="muted">Hali ichki izoh yo‘q.</p>';
      const history = lead.history?.length ? lead.history.map((entry) => `<article class="history-item"><div><strong>${escapeHtml(auditActionLabels[entry.action] || entry.action)}</strong><small>${escapeHtml(entry.actorEmail)} · ${escapeHtml(formatDate(entry.createdAt))}</small></div><code>${escapeHtml(JSON.stringify(entry.details || {}))}</code></article>`).join('') : '<p class="muted">Hali boshqaruv o‘zgarishi qayd etilmagan.</p>';
      const utm = Object.entries(lead.utm || {}).map(([key, value]) => `${key}: ${value}`).join(' · ');
      const deliveries = (lead.deliveries || []).map((item) => `<div class="detail-item"><dt>${escapeHtml(item.provider)}</dt><dd>${escapeHtml(item.state === 'sent' ? 'Yuborildi' : item.state === 'failed' ? `Xato · ${item.lastError}` : 'Navbatda')}</dd></div>`).join('');
      content.innerHTML = `<section class="drawer-summary"><div class="drawer-person"><span class="person-mark">${escapeHtml(initials)}</span><div><h3>${escapeHtml(lead.name)}</h3><p>${escapeHtml(formLabels[lead.formType] || lead.formType)} · ${escapeHtml(formatDate(lead.createdAt))}</p></div></div><div class="drawer-contact-grid"><div class="contact-chip"><span>TELEFON</span><a href="tel:${escapeHtml(lead.phone.replace(/[^+\d]/g, ''))}">${escapeHtml(lead.phone)}</a></div><div class="contact-chip"><span>EMAIL</span>${lead.email ? `<a href="mailto:${encodeURIComponent(lead.email)}">${escapeHtml(lead.email)}</a>` : '<strong>—</strong>'}</div><div class="contact-chip"><span>KOMPANIYA</span><strong>${escapeHtml(lead.company || '—')}</strong></div><div class="contact-chip"><span>TADBIR</span><strong>${escapeHtml(lead.event || '—')}</strong></div></div></section>
        <section class="drawer-section"><h3>ISH JARAYONI</h3><div class="drawer-actions-grid"><div class="field"><label for="detail-status">STATUS</label><select id="detail-status">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${lead.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label for="detail-priority">USTUVORLIK</label><select id="detail-priority">${Object.entries(priorityLabels).map(([value, label]) => `<option value="${value}" ${lead.priority === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="field"><label for="detail-assignee">MAS’UL XODIM</label><input id="detail-assignee" value="${escapeHtml(lead.assignee)}" placeholder="Ism yoki email" /></div><button class="button button-primary" type="button" id="save-lead">O‘zgarishlarni saqlash</button></div></section>
        <section class="drawer-section"><h3>MUROJAAT TAFSILOTLARI</h3><dl class="detail-list">${detailItem('Forma', formLabels[lead.formType] || lead.formType)}${detailItem('Til', lead.locale)}${detailItem('Manba', lead.source)}${detailItem('Sahifa', lead.page)}${detailItem('Birinchi tashrif', lead.landing)}${detailItem('Referer', lead.referrer)}${utm ? detailItem('UTM', utm) : ''}${extras.map(([key, value]) => detailItem(key, value)).join('')}${lead.payload?.comment ? detailItem('Izoh', lead.payload.comment) : ''}${deliveries}</dl></section>
        <section class="drawer-section"><h3>JARAYON TARIXI</h3><div class="history-list">${history}</div></section>
        <section class="drawer-section"><h3>JAMOA IZOHLARI</h3><div class="note-list">${notes}</div><form id="note-form" class="drawer-note-form"><textarea name="body" maxlength="4000" required placeholder="Keyingi qo‘ng‘iroq, kelishuv yoki eslatmani yozing…"></textarea><button class="button button-secondary" type="submit">Izoh qo‘shish</button></form></section>`;
      $('#save-lead').addEventListener('click', async () => {
        const patch = { status: $('#detail-status').value, priority: $('#detail-priority').value, assignee: $('#detail-assignee').value };
        try {
          await api(`/api/admin/leads/${encodeURIComponent(lead.id)}`, { method: 'PATCH', body: patch });
          showToast('Ariza yangilandi.');
          if (state.view === 'leads') renderLeads().catch(showError);
          if (state.view === 'dashboard') renderDashboard().catch(showError);
          await openLead(lead.id);
        } catch (error) { showError(error); }
      });
      $('#note-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        try {
          await api(`/api/admin/leads/${encodeURIComponent(lead.id)}/notes`, { method: 'POST', body: { body: form.get('body') } });
          showToast('Ichki izoh qo‘shildi.');
          await openLead(lead.id);
        } catch (error) { showError(error); }
      });
    } catch (error) {
      content.innerHTML = `<div class="empty-state"><strong>Ariza ochilmadi</strong>${escapeHtml(error.message)}</div>`;
    }
  }

  function closeDrawer() {
    const drawer = $('#lead-drawer');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    state.currentLead = null;
  }

  function showError(error) {
    showToast(error?.message || 'Kutilmagan xatolik yuz berdi.', 'error');
  }

  function navigate(view) {
    if (!labels[view]) return;
    if (state.user?.role !== 'admin' && ['integrations', 'activity', 'users'].includes(view)) return;
    state.view = view;
    $('#page-title').textContent = labels[view];
    $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
    $('#sidebar').classList.remove('mobile-open');
    $('#mobile-scrim')?.classList.remove('active');
    const renderers = { dashboard: renderDashboard, leads: renderLeads, portalAccounts: renderPortalAccounts, analytics: renderAnalytics, integrations: renderIntegrations, activity: renderActivity, users: renderUsers };
    renderers[view]().catch(showError);
  }

  async function loadSession() {
    const data = await api('/api/admin/me');
    state.csrf = data.csrfToken;
    setUser(data.user);
    setAuthVisible(false);
    navigate('dashboard');
  }

  async function initialize() {
    try {
      const status = await api('/api/admin/status');
      $('#setup-needed').hidden = !status.setupRequired;
      $('#login-form').hidden = status.setupRequired;
      if (!status.setupRequired) await loadSession();
      else setAuthVisible(true);
    } catch (error) {
      /* no session yet is the normal first visit: show the form, not "session expired" */
      if (error.status !== 401) {
        $('#login-error').hidden = false;
        $('#login-error').textContent = error.message;
      }
      setAuthVisible(true);
    }
  }

  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    /* event.currentTarget is null once the handler awaits: keep the form itself. Calling
       .reset() on null threw after a successful login, so the dashboard never rendered */
    const formElement = event.currentTarget;
    const button = $('button[type="submit"]', formElement);
    const errorNode = $('#login-error');
    errorNode.hidden = true;
    button.disabled = true;
    try {
      const form = new FormData(formElement);
      const response = await api('/api/admin/login', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } });
      state.csrf = response.csrfToken;
      setUser(response.user);
      setAuthVisible(false);
      formElement.reset();
      navigate('dashboard');
    } catch (error) {
      errorNode.textContent = error.message;
      errorNode.hidden = false;
    } finally {
      button.disabled = false;
    }
  });

  $('#logout-button').addEventListener('click', async () => {
    try { await api('/api/admin/logout', { method: 'POST', body: {} }); } catch { /* session may already have expired */ }
    setAuthVisible(true);
    $('#setup-needed').hidden = true;
  });
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
  $('#range-select').addEventListener('change', (event) => {
    state.days = Number(event.currentTarget.value) || 30;
    navigate(state.view);
  });
  $('#refresh-button').addEventListener('click', () => navigate(state.view));
  $('#mobile-menu').addEventListener('click', () => {
    $('#sidebar').classList.toggle('mobile-open');
    let scrim = $('#mobile-scrim');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.id = 'mobile-scrim';
      scrim.className = 'mobile-scrim';
      document.body.append(scrim);
      scrim.addEventListener('click', () => { $('#sidebar').classList.remove('mobile-open'); scrim.classList.remove('active'); });
    }
    scrim.classList.toggle('active');
  });
  $$('[data-close-drawer]').forEach((button) => button.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

  initialize();
})();
