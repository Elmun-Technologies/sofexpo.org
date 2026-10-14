(() => {
  'use strict';

  /* ======================================================================
     SOF EXPO · Admin (CRM)
     Views: dashboard · pipeline (kanban) · leads · sales analytics ·
     exhibitor company pages (moderation) · portal accounts · site analytics ·
     blog · integrations · activity · team. Plain DOM, no framework.
     ====================================================================== */

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const state = {
    user: null,
    csrf: '',
    view: 'dashboard',
    days: 30,
    leadsPage: 1,
    filters: { q: '', status: '', form: '', assignee: '', overdue: false, sort: 'created' },
    pipelineFilters: { q: '', assignee: '', event: '' },
    currentLead: null,
    currentPortalAccountId: '',
    currentShowcaseId: '',
    showcaseStatus: 'pending',
    portalPage: 1,
    portalFilters: { q: '', type: '', active: '' },
    auditPage: 1,
    auditFilters: { q: '', actor: '', entity: '', from: '', to: '' },
    blogPage: 1,
    blogStatus: '',
    meta: { team: [], events: [], currencies: ['USD', 'UZS', 'EUR', 'RUB'], shows: [] },
    toastTimer: null,
  };

  const labels = {
    dashboard: 'Umumiy ko‘rinish', pipeline: 'Savdo voronkasi', leads: 'Arizalar', sales: 'Savdo analitikasi',
    showcases: 'Kompaniya sahifalari', portalAccounts: 'Kabinetlar', analytics: 'Sayt analitikasi', blog: 'Blog · Telegram',
    integrations: 'Integratsiyalar', activity: 'Faoliyat tarixi', users: 'Jamoa va ruxsatlar',
  };
  const ADMIN_VIEWS = ['integrations', 'activity', 'users'];
  const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
  const statusLabels = {
    new: 'Yangi', contacted: 'Bog‘lanildi', qualified: 'Malakali', proposal: 'Taklif yuborildi',
    negotiation: 'Muzokara', won: 'Sotildi', lost: 'Yo‘qotildi', spam: 'Spam',
  };
  const stageHints = {
    new: 'Hali hech kim bog‘lanmagan', contacted: 'Birinchi aloqa bo‘ldi', qualified: 'Ehtiyoj va byudjet aniq',
    proposal: 'Narx/stend taklifi yuborildi', negotiation: 'Shartlar kelishilmoqda', won: 'Shartnoma / to‘lov', lost: 'Bitim bo‘lmadi',
  };
  const priorityLabels = { low: 'Past', normal: 'Oddiy', high: 'Yuqori' };
  const formLabels = {
    exhibitor: 'Eksponent', visitor: 'Tashrifchi', organizer: 'Tashkilotchi', sponsor: 'Homiy',
    callback: 'Qo‘ng‘iroq', catalog: 'Katalog', group: 'Guruh tashrifi', quiz: 'Kviz', press: 'OAV', generic: 'Umumiy',
  };
  const noteKinds = {
    note: ['Izoh', '✎'], call: ['Qo‘ng‘iroq', '☎'], meeting: ['Uchrashuv', '◎'],
    email: ['Email', '✉'], message: ['Xabar', '✆'], task: ['Vazifa', '✓'],
  };
  const fieldLabels = {
    status: 'Bosqich', priority: 'Ustuvorlik', assignee: 'Mas’ul', dealAmount: 'Summa', currency: 'Valyuta',
    standArea: 'Stend maydoni', lostReason: 'Yo‘qotish sababi', nextAction: 'Keyingi qadam', nextActionAt: 'Keyingi qadam sanasi', event: 'Tadbir',
  };
  const LOST_REASONS = ['Narx qimmat', 'Byudjet yo‘q', 'Sanalar to‘g‘ri kelmadi', 'Raqobatchini tanladi', 'Javob bermayapti', 'Keyingi ko‘rgazmaga qoldirdi', 'Maqsadli mijoz emas'];
  const auditActionLabels = {
    'lead.update': 'CRM kartasi yangilandi', 'lead.note.add': 'Faoliyat qo‘shildi',
    'portal_account.activate': 'Kabinet faollashtirildi', 'portal_account.deactivate': 'Kabinet bloklandi',
    'portal_profile.update': 'Profil yangilandi', 'user.create': 'Jamoa hisobi yaratildi',
    'user.update': 'Jamoa ruxsati yangilandi', 'outbox.retry': 'Yetkazish qayta navbatga qo‘yildi',
    'blog.publish': 'Maqola e’lon qilindi', 'blog.unpublish': 'Maqola yashirildi', 'blog.delete': 'Maqola o‘chirildi',
    'showcase.save': 'Kompaniya sahifasi saqlandi', 'showcase.submit': 'Sahifa moderatsiyaga yuborildi',
    'showcase.publish': 'Kompaniya sahifasi nashr qilindi', 'showcase.reject': 'Sahifa rad etildi', 'showcase.hide': 'Sahifa saytdan yashirildi',
    'portal_file.upload': 'Material yuklandi', 'portal_file.delete': 'Material o‘chirildi',
  };
  const showcaseStatusLabels = { pending: 'Moderatsiyada', published: 'Nashr qilingan', rejected: 'Rad etilgan', hidden: 'Yashirilgan', draft: 'Qoralama' };
  const fileKindLabels = { logo: 'Logotip', catalog: 'Katalog', brochure: 'Broshyura', flyer: 'Flayer', presentation: 'Taqdimot', pricelist: 'Narxlar', image: 'Rasm', other: 'Boshqa' };
  const socialLabels = { instagram: 'Instagram', telegram: 'Telegram', facebook: 'Facebook', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok' };
  const blogStatusLabels = { draft: 'Qoralama', published: 'E’lon qilingan', unpublished: 'Yashirilgan' };
  const journeyLabels = {
    page_view: 'Sahifani ochdi', cta_click: 'Tugmani bosdi', form_start: 'Formani to‘ldira boshladi', form_submit: 'Formani yubordi',
    quiz_start: 'Kvizni boshladi', quiz_submit: 'Kvizni yubordi', scroll_depth: 'Sahifani o‘qidi', time_on_page: 'Sahifada qoldi',
    outbound_click: 'Tashqi havolani bosdi', phone_click: 'Telefon raqamini bosdi', messenger_click: 'Messenjerni ochdi',
  };

  /* ---------------- formatting ---------------- */
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  const pad = (n) => String(n).padStart(2, '0');
  function formatDate(value, withTime = true) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    /* browsers ship no Uzbek month names (Intl printed "M10 12"): spell them out */
    const day = `${pad(date.getDate())} ${UZ_MONTHS[date.getMonth()]}`;
    return withTime ? `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
  }
  function number(value) {
    return new Intl.NumberFormat('uz-UZ').format(Number(value || 0)).replace(/\u00a0/g, ' ');
  }
  function money(amounts, empty = '—') {
    const entries = Object.entries(amounts || {}).filter(([, value]) => Number(value));
    if (!entries.length) return empty;
    return entries.map(([currency, value]) => `${number(Math.round(value))} ${currency}`).join(' · ');
  }
  function percent(value) {
    return `${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
  }
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map((word) => word[0] || '').join('').toUpperCase() || '?';
  }
  function daysSince(value) {
    if (!value) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000));
  }
  function ageLabel(value) {
    const days = daysSince(value);
    if (!value) return '';
    if (days === 0) {
      const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000));
      return hours ? `${hours} soat` : 'hozir';
    }
    return `${days} kun`;
  }
  function dueChip(value) {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const overdue = date < now;
    const today = !overdue && date.toDateString() === now.toDateString();
    return `<span class="due ${overdue ? 'is-overdue' : today ? 'is-today' : ''}" title="Keyingi qadam muddati">◷ ${escapeHtml(overdue ? `muddati o‘tdi · ${formatDate(value)}` : today ? `bugun ${pad(date.getHours())}:${pad(date.getMinutes())}` : formatDate(value))}</span>`;
  }
  function toLocalInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function fileSize(bytes) {
    const value = Number(bytes || 0);
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  function showName(slug) {
    return state.meta.shows.find((show) => show.slug === slug)?.name || slug;
  }

  /* ---------------- UI primitives ---------------- */
  function showToast(message, kind = 'success') {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.toggle('is-error', kind === 'error');
    toast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('show'), 3400);
  }
  function showError(error) {
    showToast(error?.message || 'Kutilmagan xatolik yuz berdi.', 'error');
  }

  /** small dialog asking for one value; resolves to the text or null when cancelled */
  function askValue({ title, text = '', label = '', value = '', required = false, confirm = 'Saqlash', type = 'text', options = [] }) {
    return new Promise((resolve) => {
      const root = $('#modal-root');
      const listId = options.length ? 'modal-options' : '';
      root.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><form class="modal-card" id="modal-form">
        <h3 id="modal-title">${escapeHtml(title)}</h3>${text ? `<p>${escapeHtml(text)}</p>` : ''}
        <div class="field"><label for="modal-input">${escapeHtml(label)}</label>${type === 'textarea'
          ? `<textarea id="modal-input" ${required ? 'required' : ''} maxlength="1000">${escapeHtml(value)}</textarea>`
          : `<input id="modal-input" type="${type}" value="${escapeHtml(value)}" ${required ? 'required' : ''} ${listId ? `list="${listId}"` : ''} maxlength="300" />`}
          ${listId ? `<datalist id="${listId}">${options.map((option) => `<option value="${escapeHtml(option)}"></option>`).join('')}</datalist>` : ''}</div>
        <div class="form-actions"><button class="button button-quiet" type="button" data-modal-cancel>Bekor qilish</button><button class="button button-primary" type="submit">${escapeHtml(confirm)}</button></div>
      </form></div>`;
      const close = (result) => { root.innerHTML = ''; resolve(result); };
      $('#modal-input', root).focus();
      $('[data-modal-cancel]', root).addEventListener('click', () => close(null));
      $('.modal', root).addEventListener('click', (event) => { if (event.target.classList.contains('modal')) close(null); });
      $('#modal-form', root).addEventListener('submit', (event) => {
        event.preventDefault();
        close($('#modal-input', root).value.trim());
      });
    });
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
    $('#profile-email').title = user.email;
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

  async function loadMeta() {
    try {
      const data = await api('/api/admin/team');
      state.meta = {
        team: data.team || [],
        events: data.events || [],
        currencies: data.currencies || state.meta.currencies,
        shows: data.shows || [],
      };
    } catch { /* the CRM still works with free-text fields */ }
  }

  function pageIntro(title, description, badge = '', actions = '') {
    return `<div class="page-intro"><div><h2>${escapeHtml(title)}</h2>${description ? `<p>${escapeHtml(description)}</p>` : ''}</div>${actions ? `<div class="page-actions">${actions}</div>` : ''}${badge ? `<span class="chip">${escapeHtml(badge)}</span>` : ''}</div>`;
  }

  function metricCard(label, value, note, icon, { accent = '', tone = '' } = {}) {
    return `<article class="metric-card ${tone ? `is-${tone}` : ''}"><div class="metric-head"><span title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="metric-icon" aria-hidden="true">${icon}</span></div><div class="metric-value">${escapeHtml(value)}</div><div class="metric-foot">${accent ? `<strong>${escapeHtml(accent)}</strong> · ` : ''}${escapeHtml(note)}</div></article>`;
  }

  function chartSvg(daily, { key = 'leads', second = '', label = 'Kunlik arizalar grafigi' } = {}) {
    const width = 720;
    const height = 184;
    const inset = { top: 10, right: 12, bottom: 14, left: 12 };
    const values = daily.map((entry) => Math.max(0, Number(entry[key] || 0)));
    const values2 = second ? daily.map((entry) => Math.max(0, Number(entry[second] || 0))) : [];
    const max = Math.max(4, ...values, ...values2);
    const plotWidth = width - inset.left - inset.right;
    const plotHeight = height - inset.top - inset.bottom;
    const toPoints = (list) => list.map((value, index) => [
      inset.left + (list.length <= 1 ? plotWidth / 2 : (index / (list.length - 1)) * plotWidth),
      inset.top + plotHeight - (value / max) * plotHeight,
    ]);
    const points = toPoints(values);
    const line = points.map((point) => point.map((n) => n.toFixed(1)).join(',')).join(' ');
    const area = points.length ? `${inset.left},${height - inset.bottom} ${line} ${width - inset.right},${height - inset.bottom}` : '';
    const line2 = second ? toPoints(values2).map((point) => point.map((n) => n.toFixed(1)).join(',')).join(' ') : '';
    const grid = [0, 1, 2, 3].map((index) => {
      const y = inset.top + (plotHeight * index / 3);
      return `<line class="chart-grid" x1="${inset.left}" y1="${y.toFixed(1)}" x2="${width - inset.right}" y2="${y.toFixed(1)}"/>`;
    }).join('');
    const dots = points.length <= 20 ? points.map(([x, y]) => `<circle class="chart-dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/>`).join('') : '';
    return `<svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(label)}"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#0063e4" stop-opacity=".16"/><stop offset="100%" stop-color="#0063e4" stop-opacity="0"/></linearGradient></defs>${grid}<polygon class="chart-area" points="${area}"/><polyline class="chart-line" points="${line}"/>${line2 ? `<polyline class="chart-line-2" points="${line2}"/>` : ''}${dots}</svg>`;
  }

  function chartLabels(daily) {
    const pick = [daily[0]?.day, daily[Math.floor(daily.length / 2)]?.day, daily.at(-1)?.day];
    return `<div class="chart-labels">${pick.map((day) => `<span>${day ? escapeHtml(formatDate(`${day}T00:00:00Z`, false)) : ''}</span>`).join('')}</div>`;
  }

  function statusBadge(status) {
    return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(statusLabels[status] || showcaseStatusLabels[status] || status)}</span>`;
  }
  function priorityBadge(priority) {
    return `<span class="priority-badge priority-${escapeHtml(priority)}">${escapeHtml(priorityLabels[priority] || priority)}</span>`;
  }
  function assigneeMark(email) {
    return email
      ? `<span class="mini-avatar" title="${escapeHtml(email)}">${escapeHtml(email.charAt(0).toUpperCase())}</span>`
      : '<span class="mini-avatar is-empty" title="Mas’ul belgilanmagan">?</span>';
  }

  function personCell(row) {
    return `<div class="person-cell"><span class="person-mark">${escapeHtml(initials(row.name))}</span><span class="person-info"><button class="lead-open" type="button" data-lead-id="${escapeHtml(row.id)}">${escapeHtml(row.name || 'Ismsiz')}</button><span class="sub">${escapeHtml(row.company || row.phone || '—')}</span></span></div>`;
  }

  function leadsTable(rows, { compact = false } = {}) {
    if (!rows?.length) return '<div class="empty-state"><strong>Hozircha ariza yo‘q</strong>Yangi murojaatlar kelishi bilan shu yerda ko‘rinadi.</div>';
    const head = compact
      ? '<th>MIJOZ</th><th>FORMA / TADBIR</th><th>BOSQICH</th>'
      : '<th>MIJOZ</th><th>FORMA / TADBIR</th><th>BOSQICH</th><th>MAS’UL</th><th>KEYINGI QADAM</th><th class="num">SUMMA</th><th>SANA</th>';
    const body = rows.map((row) => {
      const overdue = row.nextActionAt && new Date(row.nextActionAt) < new Date() && !['won', 'lost', 'spam'].includes(row.status);
      const form = `${escapeHtml(formLabels[row.formType] || row.formType || 'Umumiy')}<span class="sub">${escapeHtml(row.event || '—')}</span>`;
      /* the dashboard card is narrow: stage and date share a cell, so nothing hides behind a scroll */
      if (compact) return `<tr><td>${personCell(row)}</td><td>${form}</td><td class="nowrap">${statusBadge(row.status)}<span class="sub">${escapeHtml(formatDate(row.createdAt))}</span></td></tr>`;
      return `<tr class="${overdue ? 'row-overdue' : ''}"><td>${personCell(row)}</td><td>${form}</td><td>${statusBadge(row.status)}${row.priority === 'high' ? `<span class="sub">${priorityBadge('high')}</span>` : ''}</td>
        <td><span class="truncate" title="${escapeHtml(row.assignee || '')}">${escapeHtml(row.assignee || '—')}</span></td>
        <td>${row.nextAction ? `<span>${escapeHtml(row.nextAction)}</span>` : '<span class="muted">—</span>'}${row.nextActionAt ? `<span class="sub">${dueChip(row.nextActionAt)}</span>` : ''}</td>
        <td class="num">${row.dealAmount ? `<span class="num">${escapeHtml(number(row.dealAmount))} ${escapeHtml(row.currency || '')}</span>` : '<span class="muted">—</span>'}</td>
        <td class="nowrap">${escapeHtml(formatDate(row.createdAt))}<span class="sub">${escapeHtml(ageLabel(row.createdAt))} oldin</span></td></tr>`;
    }).join('');
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderBarList(items, emptyText = 'Ma’lumot hozircha mavjud emas.', tone = '') {
    if (!items?.length) return `<div class="empty-state">${escapeHtml(emptyText)}</div>`;
    const max = Math.max(1, ...items.map((item) => Number(item.count)));
    return `<div class="analytic-bars">${items.map((item) => `<div class="bar-row"><span title="${escapeHtml(item.key)}">${escapeHtml(item.key || 'Noma’lum')}</span><div class="bar-track"><i class="${tone}" style="width:${Math.max(1, Number(item.count) / max * 100)}%"></i></div><strong>${number(item.count)}</strong></div>`).join('')}</div>`;
  }

  function pagination(data, prefix) {
    return `<div class="pagination"><span>${data.total ? `${number((data.page - 1) * data.limit + 1)}–${number(Math.min(data.page * data.limit, data.total))} / ${number(data.total)}` : 'Natija yo‘q'}</span><div class="pagination-actions"><button type="button" id="${prefix}-prev" ${data.page <= 1 ? 'disabled' : ''}>← Oldingi</button><span>${data.page} / ${data.pages}</span><button type="button" id="${prefix}-next" ${data.page >= data.pages ? 'disabled' : ''}>Keyingi →</button></div></div>`;
  }

  function bindLeadButtons(root = document) {
    $$('[data-lead-id]', root).forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation();
      openLead(button.dataset.leadId);
    }));
  }

  function teamOptions(selected = '', { allowEmpty = true, emptyLabel = 'Belgilanmagan' } = {}) {
    const emails = [...new Set([...state.meta.team.map((member) => member.email), selected].filter(Boolean))];
    return `${allowEmpty ? `<option value="">${escapeHtml(emptyLabel)}</option>` : ''}${emails.map((email) => `<option value="${escapeHtml(email)}" ${email === selected ? 'selected' : ''}>${escapeHtml(email)}</option>`).join('')}`;
  }

  /* ======================= DASHBOARD ======================= */
  function taskGroup(title, rows, tone, empty) {
    return `<div class="task-group"><h4>${escapeHtml(title)} <span class="chip ${tone}">${number(rows.length)}</span></h4>${rows.length
      ? `<div class="task-list">${rows.slice(0, 5).map((row) => `<button class="task-item" type="button" data-lead-id="${escapeHtml(row.id)}"><span class="person-mark">${escapeHtml(initials(row.name))}</span><span class="person-info"><strong class="truncate">${escapeHtml(row.name)}</strong><span class="sub truncate">${escapeHtml(row.nextAction || row.company || statusLabels[row.status] || '')}</span></span>${row.nextActionAt ? dueChip(row.nextActionAt) : `<span class="due">${escapeHtml(ageLabel(row.stageChangedAt || row.createdAt))}</span>`}</button>`).join('')}</div>`
      : `<p class="muted">${escapeHtml(empty)}</p>`}</div>`;
  }

  async function renderDashboard() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
    const [data, latest, tasks] = await Promise.all([
      api(`/api/admin/dashboard?days=${state.days}`),
      api('/api/admin/leads?limit=6'),
      api('/api/admin/tasks').catch(() => null),
    ]);
    updateNewCount(data.newLeads);
    if (data.sales) updateShowcaseCount(data.sales.pendingShowcases);
    const sales = data.sales || { open: 0, stages: [], pipelineValue: {}, won: 0, lost: 0, revenue: {}, overdue: 0, uncontactedHour: 0 };
    const daily = data.daily || [];
    const stageTotal = Math.max(1, (sales.stages || []).reduce((sum, item) => sum + Number(item.count), 0));
    const winRate = sales.won + sales.lost ? Math.round((sales.won / (sales.won + sales.lost)) * 100) : 0;
    content.innerHTML = `${pageIntro('Bugungi holat', 'Yangi murojaatlar, ochiq bitimlar va bugun bajarilishi kerak bo‘lgan ishlar.', `${state.days} KUN`)}
      <div class="metrics-grid">
        ${metricCard('Yangi arizalar', number(data.newLeads), 'hali bog‘lanilmagan', '✦', { tone: data.newLeads ? 'accent' : '' })}
        ${metricCard('Ochiq bitimlar', number(sales.open), money(sales.pipelineValue, 'summa kiritilmagan'), '▥')}
        ${metricCard('Sotildi', number(sales.won), money(sales.revenue, `${state.days} kunda`), '✓', { accent: sales.won + sales.lost ? `${winRate}% yutish` : '' })}
        ${metricCard('Muddati o‘tgan', number(sales.overdue), 'keyingi qadam kechikdi', '◷', { tone: sales.overdue ? 'alert' : '' })}
        ${metricCard('Jami arizalar', number(data.totalLeads), 'tanlangan davrda', '▤')}
        ${metricCard('Ariza konversiyasi', `${data.conversionRate}%`, `${number(data.sessions)} sessiyadan`, '↗')}
      </div>
      ${sales.uncontactedHour ? `<div class="notice-box is-danger" style="margin-top:16px">${number(sales.uncontactedHour)} ta ariza 1 soatdan beri javobsiz. Tez javob sotuvni bir necha barobar oshiradi.</div>` : ''}
      <div class="grid-wide">
        <section class="panel"><div class="panel-head"><div><h3>Bugungi vazifalar</h3><p>Keyingi qadam muddati yetgan va e’tiborsiz qolgan mijozlar</p></div><button class="button button-secondary button-small" type="button" data-go-view="pipeline">Voronkani ochish →</button></div>
          ${tasks ? `<div class="task-groups">${taskGroup('Muddati o‘tgan', tasks.overdue || [], 'chip-dark', 'Kechikkan qadam yo‘q.')}${taskGroup('Bugun', tasks.today || [], 'chip-yellow', 'Bugunga rejalashtirilgan qadam yo‘q.')}${taskGroup('Mas’ul belgilanmagan yangi arizalar', tasks.unassigned || [], 'chip-blue', 'Barcha yangi arizalarda mas’ul bor.')}${taskGroup('7 kundan beri harakatsiz', tasks.stale || [], '', 'Harakatsiz bitim yo‘q.')}</div>` : '<p class="muted">Vazifalar yuklanmadi.</p>'}
        </section>
        <section class="panel"><div class="panel-head"><div><h3>Ochiq bitimlar bosqichlari</h3><p>Hozir voronkada turgan barcha mijozlar</p></div><span class="chip">${number(sales.open)} OCHIQ</span></div>
          <div class="stage-strip">${(sales.stages || []).map((item) => `<i style="width:${Number(item.count) / stageTotal * 100}%;background:var(--st-${escapeHtml(item.status)})" title="${escapeHtml(statusLabels[item.status])}: ${number(item.count)}"></i>`).join('')}</div>
          <div class="stage-legend">${(sales.stages || []).map((item) => `<span><i class="status-dot ${escapeHtml(item.status)}"></i>${escapeHtml(statusLabels[item.status])} <strong>${number(item.count)}</strong></span>`).join('') || '<span>Ochiq bitim yo‘q</span>'}</div>
          <div class="flow-divider"></div>
          <div class="status-list">${(data.forms || []).slice(0, 6).map((item) => {
            const max = Math.max(1, ...(data.forms || []).map((row) => Number(row.count)));
            return `<div><div class="rank-row"><span>${escapeHtml(formLabels[item.key] || item.key || 'Umumiy')}</span><strong class="num">${number(item.count)}</strong></div><div class="status-bar"><i style="width:${Math.min(100, Number(item.count) / max * 100)}%"></i></div></div>`;
          }).join('') || '<div class="empty-state">Hozircha ma’lumot yo‘q</div>'}</div>
        </section>
      </div>
      <div class="grid-wide">
        <section class="panel"><div class="panel-head"><div><h3>Arizalar dinamikasi</h3><p>Kunlar kesimida qabul qilingan murojaatlar</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Arizalar</span></div></div><div class="chart-wrap">${chartSvg(daily)}</div>${chartLabels(daily)}</section>
        <section class="panel table-panel"><div class="panel-head"><div><h3>So‘nggi arizalar</h3><p>Yaqinda kelib tushgan murojaatlar</p></div><button class="button button-secondary button-small" type="button" data-go-view="leads">Barchasi →</button></div>${leadsTable(latest.items, { compact: true })}</section>
      </div>`;
    bindLeadButtons(content);
    $$('[data-go-view]', content).forEach((button) => button.addEventListener('click', () => navigate(button.dataset.goView)));
  }

  function updateNewCount(value) {
    const node = $('#new-count');
    node.textContent = number(value);
    node.dataset.zero = Number(value) ? '0' : '1';
  }
  function updateShowcaseCount(value) {
    const node = $('#showcase-count');
    node.textContent = number(value);
    node.dataset.zero = Number(value) ? '0' : '1';
  }

  /* ======================= PIPELINE (kanban) ======================= */
  async function renderPipeline() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(state.pipelineFilters)) if (value) query.set(key, value);
    const data = await api(`/api/admin/pipeline${query.toString() ? `?${query}` : ''}`);
    const openCount = data.columns.filter((column) => !['won', 'lost'].includes(column.status)).reduce((sum, column) => sum + column.count, 0);
    const eventOptions = state.meta.events.map((name) => `<option value="${escapeHtml(name)}" ${state.pipelineFilters.event === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('');
    content.innerHTML = `${pageIntro('Savdo voronkasi', 'Kartani keyingi ustunga suring yoki oching. Yopilgan bitimlar oxirgi 30 kun uchun ko‘rsatiladi.', `${number(openCount)} OCHIQ`)}
      <form class="lead-toolbar" id="pipeline-filters"><div class="filters">
        <input name="q" type="search" value="${escapeHtml(state.pipelineFilters.q)}" placeholder="Ism, kompaniya, telefon…" aria-label="Qidirish" />
        <select name="assignee" aria-label="Mas’ul">${teamOptions(state.pipelineFilters.assignee, { emptyLabel: 'Barcha mas’ullar' })}<option value="__none" ${state.pipelineFilters.assignee === '__none' ? 'selected' : ''}>Mas’ulsiz</option></select>
        <select name="event" aria-label="Tadbir"><option value="">Barcha tadbirlar</option>${eventOptions}</select>
        <button class="button button-secondary" type="submit">Filtrlash</button>
        ${state.user ? `<button class="button button-quiet" type="button" id="pipeline-mine">Faqat meniki</button>` : ''}
      </div></form>
      <div class="kanban" id="kanban">${data.columns.map((column) => `<section class="kanban-col" data-stage="${escapeHtml(column.status)}">
        <header class="kanban-head"><h3><span>${escapeHtml(statusLabels[column.status])}</span><span class="count">${number(column.count)}</span></h3><small>${escapeHtml(money(column.amount, stageHints[column.status] || ''))}</small></header>
        <div class="kanban-list" data-drop="${escapeHtml(column.status)}">${column.items.map((item) => dealCard(item)).join('') || '<div class="kanban-more">Bo‘sh</div>'}${column.count > column.items.length ? `<div class="kanban-more">yana ${number(column.count - column.items.length)} ta — Arizalar ro‘yxatida</div>` : ''}</div>
      </section>`).join('')}</div>`;
    $('#pipeline-filters').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.pipelineFilters = { q: String(form.get('q') || '').trim(), assignee: String(form.get('assignee') || ''), event: String(form.get('event') || '') };
      renderPipeline().catch(showError);
    });
    $('#pipeline-mine')?.addEventListener('click', () => {
      state.pipelineFilters.assignee = state.user.email;
      renderPipeline().catch(showError);
    });
    bindKanban(content);
  }

  function dealCard(item) {
    const overdue = item.nextActionAt && new Date(item.nextActionAt) < new Date() && !['won', 'lost'].includes(item.status);
    return `<article class="deal-card ${overdue ? 'is-overdue' : ''}" draggable="true" data-deal="${escapeHtml(item.id)}" data-status="${escapeHtml(item.status)}" data-amount="${Number(item.dealAmount || 0)}" tabindex="0" role="button" aria-label="${escapeHtml(item.name)} kartasini ochish">
      <div class="deal-title"><strong>${escapeHtml(item.name || 'Ismsiz')}</strong>${assigneeMark(item.assignee)}</div>
      ${item.company ? `<span class="deal-company">${escapeHtml(item.company)}</span>` : ''}
      <div class="deal-meta"><span>${escapeHtml(item.event || formLabels[item.formType] || '')}</span>${item.dealAmount ? `<span class="deal-amount">${escapeHtml(number(item.dealAmount))} ${escapeHtml(item.currency || '')}</span>` : ''}</div>
      <div class="deal-meta">${item.nextActionAt ? dueChip(item.nextActionAt) : `<span class="due" title="Shu bosqichda">◷ ${escapeHtml(ageLabel(item.stageChangedAt || item.createdAt))}</span>`}${item.priority === 'high' ? priorityBadge('high') : ''}</div>
    </article>`;
  }

  async function moveLead(id, status, currentAmount = 0) {
    const patch = { status };
    if (status === 'lost') {
      const reason = await askValue({ title: 'Bitim nega yo‘qotildi?', text: 'Sabab analitikada ko‘rinadi va keyingi savdoni yaxshilashga yordam beradi.', label: 'Sabab', required: true, options: LOST_REASONS, confirm: 'Yo‘qotildi deb belgilash' });
      if (!reason) return false;
      patch.lostReason = reason;
    }
    if (status === 'won' && !Number(currentAmount)) {
      const amount = await askValue({ title: 'Tabriklaymiz! Bitim summasi qancha?', text: 'Daromad hisobotlari uchun. Keyinroq kartada o‘zgartirish mumkin.', label: 'Summa (USD)', type: 'number', confirm: 'Sotildi deb belgilash' });
      if (amount === null) return false;
      if (amount) patch.dealAmount = Number(amount);
    }
    await api(`/api/admin/leads/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
    showToast(`Bosqich: ${statusLabels[status]}`);
    return true;
  }

  function bindKanban(root) {
    let dragged = null;
    $$('.deal-card', root).forEach((card) => {
      card.addEventListener('click', () => openLead(card.dataset.deal));
      card.addEventListener('keydown', (event) => { if (event.key === 'Enter') openLead(card.dataset.deal); });
      card.addEventListener('dragstart', (event) => {
        dragged = card;
        card.classList.add('is-dragging');
        event.dataTransfer?.setData('text/plain', card.dataset.deal);
      });
      card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); dragged = null; });
    });
    $$('.kanban-list', root).forEach((list) => {
      const column = list.closest('.kanban-col');
      list.addEventListener('dragover', (event) => { event.preventDefault(); column.classList.add('is-drop'); });
      list.addEventListener('dragleave', () => column.classList.remove('is-drop'));
      list.addEventListener('drop', async (event) => {
        event.preventDefault();
        column.classList.remove('is-drop');
        if (!dragged || dragged.dataset.status === list.dataset.drop) return;
        try {
          if (await moveLead(dragged.dataset.deal, list.dataset.drop, dragged.dataset.amount)) await renderPipeline();
        } catch (error) { showError(error); }
      });
    });
  }

  /* ======================= LEADS LIST ======================= */
  function leadQuery() {
    const query = new URLSearchParams();
    const filters = state.filters;
    if (filters.q) query.set('q', filters.q);
    if (filters.status) query.set('status', filters.status);
    if (filters.form) query.set('form', filters.form);
    if (filters.assignee) query.set('assignee', filters.assignee);
    if (filters.overdue) query.set('overdue', '1');
    if (filters.sort && filters.sort !== 'created') query.set('sort', filters.sort);
    return query;
  }

  async function renderLeads() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const query = new URLSearchParams({ page: String(state.leadsPage), limit: '25' });
    for (const [key, value] of leadQuery()) query.set(key, value);
    const data = await api(`/api/admin/leads?${query}`);
    const filters = state.filters;
    const formOptions = Object.entries(formLabels).map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.form === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    const statusOptions = Object.entries(statusLabels).map(([value, label]) => `<option value="${escapeHtml(value)}" ${filters.status === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('');
    const sortOptions = [['created', 'Avval yangilari'], ['next', 'Keyingi qadam bo‘yicha'], ['updated', 'Oxirgi o‘zgarish'], ['amount', 'Summa bo‘yicha']]
      .map(([value, label]) => `<option value="${value}" ${filters.sort === value ? 'selected' : ''}>${label}</option>`).join('');
    content.innerHTML = `${pageIntro('Arizalar', 'Barcha murojaatlar: kim mas’ul, qaysi bosqichda va keyingi qadam qachon.', `${number(data.total)} TA ARIZA`)}
      <form class="lead-toolbar" id="lead-filters"><div class="filters">
        <input name="q" type="search" value="${escapeHtml(filters.q)}" placeholder="Ism, telefon, kompaniya…" aria-label="Arizalarni qidirish" />
        <select name="status" aria-label="Bosqich"><option value="">Barcha bosqichlar</option><option value="open" ${filters.status === 'open' ? 'selected' : ''}>Faqat ochiqlar</option>${statusOptions}</select>
        <select name="form" aria-label="Forma"><option value="">Barcha formalar</option>${formOptions}</select>
        <select name="assignee" aria-label="Mas’ul">${teamOptions(filters.assignee, { emptyLabel: 'Barcha mas’ullar' })}<option value="__none" ${filters.assignee === '__none' ? 'selected' : ''}>Mas’ulsiz</option></select>
        <select name="sort" aria-label="Saralash">${sortOptions}</select>
        <label class="check"><input type="checkbox" name="overdue" ${filters.overdue ? 'checked' : ''} /> Muddati o‘tgan</label>
        <button class="button button-secondary" type="submit">Filtrlash</button>
      </div><button class="button button-quiet" id="export-leads" type="button">↓ CSV</button></form>
      <section class="panel table-panel">${leadsTable(data.items)}${pagination(data, 'page')}</section>`;
    $('#lead-filters').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.filters = {
        q: String(form.get('q') || '').trim(), status: String(form.get('status') || ''), form: String(form.get('form') || ''),
        assignee: String(form.get('assignee') || ''), overdue: form.get('overdue') === 'on', sort: String(form.get('sort') || 'created'),
      };
      state.leadsPage = 1;
      renderLeads().catch(showError);
    });
    $('#page-prev').addEventListener('click', () => { state.leadsPage -= 1; renderLeads().catch(showError); });
    $('#page-next').addEventListener('click', () => { state.leadsPage += 1; renderLeads().catch(showError); });
    $('#export-leads').addEventListener('click', () => { window.location.href = `/api/admin/leads/export.csv?${leadQuery()}`; });
    bindLeadButtons(content);
  }

  /* ======================= LEAD CARD (drawer) ======================= */
  function detailItem(label, value, wide = false) {
    return `<div class="detail-item ${wide ? 'span-2' : ''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || '—')}</dd></div>`;
  }

  function describeChange(key, change) {
    const show = (value) => {
      if (value === '' || value === null || value === undefined) return '—';
      if (key === 'status') return statusLabels[value] || value;
      if (key === 'priority') return priorityLabels[value] || value;
      if (key === 'nextActionAt') return formatDate(value);
      return String(value);
    };
    return `<li><b>${escapeHtml(fieldLabels[key] || key)}:</b> ${escapeHtml(show(change.from))} → ${escapeHtml(show(change.to))}</li>`;
  }

  function historyEntry(entry) {
    const details = entry.details || {};
    const changes = Object.entries(details).filter(([, value]) => value && typeof value === 'object' && 'to' in value);
    const extra = entry.action === 'lead.note.add' ? `<ul class="change-list"><li>${escapeHtml(noteKinds[details.kind]?.[0] || 'Izoh')}</li></ul>` : '';
    return `<article class="history-item"><strong>${escapeHtml(auditActionLabels[entry.action] || entry.action)}${details.auto ? ' · avtomatik' : ''}</strong>${changes.length ? `<ul class="change-list">${changes.map(([key, value]) => describeChange(key, value)).join('')}</ul>` : extra}<small>${escapeHtml(entry.actorEmail || 'tizim')} · ${escapeHtml(formatDate(entry.createdAt))}</small></article>`;
  }

  function journeyList(journey) {
    if (!journey?.length) return '<p class="muted">Saytdagi yo‘li topilmadi (forma kabinetdan yoki eski versiyadan yuborilgan, yoki brauzer hisoblagichni bloklagan).</p>';
    const start = new Date(journey[0].at).getTime();
    const items = journey.slice(-60).map((step) => {
      const minutes = Math.max(0, Math.round((new Date(step.at).getTime() - start) / 60_000));
      const label = journeyLabels[step.event] || step.event;
      const detail = [step.cta && `«${step.cta}»`, step.formType && formLabels[step.formType], step.percent ? `${step.percent}%` : '', step.seconds ? `${step.seconds} s` : ''].filter(Boolean).join(' · ');
      return `<li><time>+${minutes} daq</time><span><b>${escapeHtml(label)}</b> ${escapeHtml(step.path || '')}${detail ? ` <span class="muted">${escapeHtml(detail)}</span>` : ''}</span></li>`;
    }).join('');
    const first = journey[0];
    const source = first.utmSource ? `${first.utmSource}${first.utmCampaign ? ` / ${first.utmCampaign}` : ''}` : '';
    return `<p class="muted" style="margin-bottom:10px">Birinchi tashrif: ${escapeHtml(formatDate(first.at))}${source ? ` · manba: ${escapeHtml(source)}` : ''} · ${number(journey.length)} qadam</p><ol class="journey">${items}</ol>`;
  }

  function contactLinks(lead) {
    const digits = String(lead.phone || '').replace(/\D/g, '');
    const links = [];
    if (digits) {
      links.push(`<a class="button button-primary button-small" href="tel:+${escapeHtml(digits)}">☎ Qo‘ng‘iroq</a>`);
      links.push(`<a class="button button-secondary button-small" href="https://wa.me/${escapeHtml(digits)}" target="_blank" rel="noopener">WhatsApp</a>`);
      links.push(`<a class="button button-secondary button-small" href="https://t.me/+${escapeHtml(digits)}" target="_blank" rel="noopener">Telegram</a>`);
    }
    if (lead.email) links.push(`<a class="button button-secondary button-small" href="mailto:${encodeURIComponent(lead.email)}">✉ Email</a>`);
    return links.join('');
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
      renderLeadCard(response.lead);
    } catch (error) {
      content.innerHTML = `<div class="empty-state"><strong>Ariza ochilmadi</strong>${escapeHtml(error.message)}</div>`;
    }
  }

  function refreshCurrentView() {
    if (state.view === 'leads') renderLeads().catch(showError);
    if (state.view === 'dashboard') renderDashboard().catch(showError);
    if (state.view === 'pipeline') renderPipeline().catch(showError);
  }

  function renderLeadCard(lead) {
    const content = $('#drawer-content');
    state.currentLead = lead.id;
    $('#drawer-title').textContent = lead.name || 'Lid tafsilotlari';
    const closed = ['won', 'lost', 'spam'].includes(lead.status);
    const currentIndex = STAGES.indexOf(lead.status);
    const steps = STAGES.map((stage, index) => `<button type="button" class="step ${stage === lead.status ? 'is-current' : ''} ${currentIndex > index ? 'is-done' : ''} ${stage === 'won' ? 'is-won' : ''}" data-stage="${stage}" title="${escapeHtml(stageHints[stage])}">${escapeHtml(statusLabels[stage])}</button>`).join('');
    const payloadSkip = ['name', 'company', 'phone', 'email', 'event', 'comment', 'formType', 'page', 'consent'];
    const extras = Object.entries(lead.payload || {}).filter(([key, value]) => !payloadSkip.includes(key) && String(value).trim());
    const utm = Object.entries(lead.utm || {}).map(([key, value]) => `${key.replace('utm_', '')}: ${value}`).join(' · ');
    const deliveries = (lead.deliveries || []).map((item) => detailItem(`Yetkazish · ${item.provider}`, item.state === 'sent' ? 'Yuborildi' : item.state === 'failed' ? `Xato · ${item.lastError}` : 'Navbatda')).join('');
    const notes = (lead.notes || []).slice().reverse();
    const timeline = notes.length
      ? `<div class="timeline">${notes.map((note) => `<article class="timeline-item" data-kind="${escapeHtml(note.kind || 'note')}"><span class="timeline-icon" aria-hidden="true">${escapeHtml(noteKinds[note.kind]?.[1] || '✎')}</span><div class="timeline-body"><strong>${escapeHtml(noteKinds[note.kind]?.[0] || 'Izoh')}</strong><p>${escapeHtml(note.body)}</p><small>${escapeHtml(note.authorEmail)} · ${escapeHtml(formatDate(note.createdAt))}</small></div></article>`).join('')}</div>`
      : '<p class="muted" style="margin-top:12px">Hali faoliyat yo‘q. Qo‘ng‘iroq yoki uchrashuvni yozib qo‘ying — yangi ariza avtomatik «Bog‘lanildi» bosqichiga o‘tadi.</p>';
    const stageHistory = (lead.stageHistory || []).map((entry) => `<article class="timeline-item" data-kind="stage"><span class="timeline-icon" aria-hidden="true">→</span><div class="timeline-body"><strong>${escapeHtml(entry.fromStatus ? `${statusLabels[entry.fromStatus] || entry.fromStatus} → ${statusLabels[entry.toStatus] || entry.toStatus}` : `${statusLabels[entry.toStatus] || entry.toStatus} · ariza keldi`)}</strong><small>${escapeHtml(entry.actorEmail || 'sayt')} · ${escapeHtml(formatDate(entry.createdAt))}</small></div></article>`).join('');
    const history = (lead.history || []).slice().reverse().map(historyEntry).join('');
    const related = lead.related?.length ? `<section class="drawer-section"><h3>SHU MIJOZNING BOSHQA ARIZALARI <span class="chip">${number(lead.related.length)}</span></h3><div class="task-list">${lead.related.map((row) => `<button class="task-item" type="button" data-related-lead="${escapeHtml(row.id)}"><span class="person-info"><strong class="truncate">${escapeHtml(formLabels[row.formType] || row.formType)} · ${escapeHtml(row.event || '—')}</strong><span class="sub">${escapeHtml(formatDate(row.createdAt))}</span></span>${statusBadge(row.status)}</button>`).join('')}</div></section>` : '';
    const currencies = state.meta.currencies.map((currency) => `<option value="${currency}" ${lead.currency === currency ? 'selected' : ''}>${currency}</option>`).join('');
    const eventList = `<datalist id="event-options">${state.meta.events.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('')}</datalist>`;

    content.innerHTML = `<section class="drawer-summary">
        <div class="drawer-person"><span class="person-mark">${escapeHtml(initials(lead.name))}</span><div><h3>${escapeHtml(lead.name)}</h3><p>${escapeHtml(formLabels[lead.formType] || lead.formType)} · ${escapeHtml(formatDate(lead.createdAt))} · ${escapeHtml(ageLabel(lead.createdAt))} oldin</p></div></div>
        <div class="contact-actions">${contactLinks(lead)}</div>
        <div class="drawer-contact-grid"><div class="contact-chip"><span>TELEFON</span><strong>${escapeHtml(lead.phone)}</strong></div><div class="contact-chip"><span>EMAIL</span><strong>${escapeHtml(lead.email || '—')}</strong></div><div class="contact-chip"><span>KOMPANIYA</span><strong>${escapeHtml(lead.company || '—')}</strong></div><div class="contact-chip"><span>TADBIR</span><strong>${escapeHtml(lead.event || '—')}</strong></div></div>
      </section>
      <section class="drawer-section"><h3>BOSQICH ${statusBadge(lead.status)}</h3>
        <div class="stepper" role="group" aria-label="Savdo bosqichi">${steps}</div>
        <div class="stepper-side"><button class="button button-danger button-small" type="button" data-stage="lost">✕ Yo‘qotildi</button><button class="button button-quiet button-small" type="button" data-stage="spam">Spam</button>
          <span class="muted">${lead.firstContactAt ? `Birinchi aloqa: ${escapeHtml(formatDate(lead.firstContactAt))}` : 'Hali bog‘lanilmagan'}${lead.stageChangedAt ? ` · bu bosqichda ${escapeHtml(ageLabel(lead.stageChangedAt))}` : ''}</span></div>
        ${lead.status === 'lost' && lead.lostReason ? `<div class="notice-box is-danger" style="margin:12px 0 0">Yo‘qotish sababi: ${escapeHtml(lead.lostReason)}</div>` : ''}
      </section>
      <section class="drawer-section"><h3>BITIM VA KEYINGI QADAM</h3>
        <form id="deal-form"><div class="drawer-actions-grid">
          <div class="field"><label for="detail-status">BOSQICH</label><select id="detail-status" name="status">${Object.entries(statusLabels).map(([value, label]) => `<option value="${value}" ${lead.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
          <div class="field"><label for="detail-assignee">MAS’UL XODIM</label><select id="detail-assignee" name="assignee">${teamOptions(lead.assignee)}</select></div>
          <div class="field"><label for="detail-amount">BITIM SUMMASI</label><div class="inline-pair"><input id="detail-amount" name="dealAmount" type="number" min="0" step="any" inputmode="decimal" value="${lead.dealAmount ? escapeHtml(lead.dealAmount) : ''}" placeholder="0" /><select name="currency" aria-label="Valyuta">${currencies}</select></div></div>
          <div class="field"><label for="detail-area">STEND MAYDONI, m²</label><input id="detail-area" name="standArea" type="number" min="0" step="any" value="${lead.standArea ?? ''}" placeholder="${escapeHtml(lead.payload?.area || '')}" /></div>
          <div class="field"><label for="detail-priority">USTUVORLIK</label><select id="detail-priority" name="priority">${Object.entries(priorityLabels).map(([value, label]) => `<option value="${value}" ${lead.priority === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div>
          <div class="field"><label for="detail-event">TADBIR</label><input id="detail-event" name="event" list="event-options" value="${escapeHtml(lead.event || '')}" />${eventList}</div>
          <div class="field span-2"><label for="detail-next">KEYINGI QADAM</label><div class="inline-pair" style="grid-template-columns:minmax(0,1fr) minmax(0,210px)"><input id="detail-next" name="nextAction" maxlength="300" value="${escapeHtml(lead.nextAction || '')}" placeholder="Masalan: shartnoma loyihasini yuborish" /><input name="nextActionAt" type="datetime-local" value="${escapeHtml(toLocalInput(lead.nextActionAt))}" aria-label="Keyingi qadam sanasi" /></div></div>
          <div class="field span-2" id="lost-field" ${lead.status === 'lost' ? '' : 'hidden'}><label for="detail-lost">YO‘QOTISH SABABI</label><input id="detail-lost" name="lostReason" list="lost-options" maxlength="300" value="${escapeHtml(lead.lostReason || '')}" /><datalist id="lost-options">${LOST_REASONS.map((reason) => `<option value="${escapeHtml(reason)}"></option>`).join('')}</datalist></div>
        </div><div class="form-actions"><button class="button button-primary" type="submit" id="save-lead">O‘zgarishlarni saqlash</button></div></form>
      </section>
      <section class="drawer-section"><h3>JAMOA IZOHLARI VA FAOLIYAT</h3>
        <form id="note-form" class="composer"><div class="kind-tabs" role="radiogroup" aria-label="Faoliyat turi">${Object.entries(noteKinds).map(([kind, [label, icon]]) => `<button type="button" class="kind-tab ${kind === 'note' ? 'active' : ''}" data-kind="${kind}" role="radio" aria-checked="${kind === 'note'}">${icon} ${escapeHtml(label)}</button>`).join('')}</div>
          <textarea name="body" maxlength="4000" required placeholder="Nima bo‘ldi? Masalan: qo‘ng‘iroq qildim, 18 m² stend qiziqtiradi, ertaga narx yuboraman."></textarea>
          <div class="form-actions"><button class="button button-secondary" type="submit">Qo‘shish</button></div></form>
        ${timeline}
      </section>
      <section class="drawer-section"><h3>SAYTDAGI YO‘LI</h3>${journeyList(lead.journey)}</section>
      ${related}
      <section class="drawer-section"><h3>MUROJAAT TAFSILOTLARI</h3><dl class="detail-list">${detailItem('Forma', formLabels[lead.formType] || lead.formType)}${detailItem('Til', lead.locale)}${detailItem('Manba', lead.source)}${detailItem('Sahifa', lead.page)}${detailItem('Birinchi sahifa', lead.landing)}${detailItem('Qayerdan kelgan', lead.referrer)}${utm ? detailItem('UTM', utm, true) : ''}${extras.map(([key, value]) => detailItem(key, value)).join('')}${lead.payload?.comment ? detailItem('Mijoz izohi', lead.payload.comment, true) : ''}${deliveries}</dl></section>
      <section class="drawer-section"><h3>JARAYON TARIXI</h3>${stageHistory ? `<div class="timeline">${stageHistory}</div><div class="flow-divider"></div>` : ''}<div class="history-list">${history || '<p class="muted">Hali boshqaruv o‘zgarishi qayd etilmagan.</p>'}</div></section>`;

    const save = async (patch, message = 'Mijoz kartasi yangilandi.') => {
      try {
        const result = await api(`/api/admin/leads/${encodeURIComponent(lead.id)}`, { method: 'PATCH', body: patch });
        showToast(message);
        refreshCurrentView();
        if (result.lead) renderLeadCard(result.lead);
        else await openLead(lead.id);
      } catch (error) { showError(error); }
    };

    $$('[data-stage]', content).forEach((button) => button.addEventListener('click', async () => {
      const stage = button.dataset.stage;
      if (stage === lead.status) return;
      try {
        if (await moveLead(lead.id, stage, lead.dealAmount)) {
          refreshCurrentView();
          await openLead(lead.id);
        }
      } catch (error) { showError(error); }
    }));
    $('#detail-status').addEventListener('change', (event) => { $('#lost-field').hidden = event.target.value !== 'lost'; });
    $('#deal-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const nextAt = String(form.get('nextActionAt') || '');
      const patch = {
        status: String(form.get('status')),
        assignee: String(form.get('assignee') || ''),
        priority: String(form.get('priority')),
        dealAmount: form.get('dealAmount') === '' ? 0 : Number(form.get('dealAmount')),
        currency: String(form.get('currency') || 'USD'),
        standArea: form.get('standArea') === '' ? null : Number(form.get('standArea')),
        event: String(form.get('event') || ''),
        nextAction: String(form.get('nextAction') || ''),
        nextActionAt: nextAt ? new Date(nextAt).toISOString() : null,
      };
      if (patch.status === 'lost') patch.lostReason = String(form.get('lostReason') || '');
      await save(patch);
    });
    let noteKind = 'note';
    $$('.kind-tab', content).forEach((tab) => tab.addEventListener('click', () => {
      noteKind = tab.dataset.kind;
      $$('.kind-tab', content).forEach((item) => {
        item.classList.toggle('active', item === tab);
        item.setAttribute('aria-checked', String(item === tab));
      });
    }));
    $('#note-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        await api(`/api/admin/leads/${encodeURIComponent(lead.id)}/notes`, { method: 'POST', body: { body: form.get('body'), kind: noteKind } });
        showToast(`${noteKinds[noteKind][0]} qo‘shildi.`);
        if (noteKind !== 'note' && noteKind !== 'task' && lead.status === 'new') refreshCurrentView();
        await openLead(lead.id);
      } catch (error) { showError(error); }
    });
    $$('[data-related-lead]', content).forEach((button) => button.addEventListener('click', () => openLead(button.dataset.relatedLead)));
  }

  function closeDrawer() {
    const drawer = $('#lead-drawer');
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    state.currentLead = null;
  }

  /* ======================= SALES ANALYTICS ======================= */
  const channelLabel = (key) => ({ kabinet: 'Shaxsiy kabinet', '—': 'Noma’lum' })[key] || key;

  function breakdownTable(rows, { title, label = 'MANBA', format = (key) => key, empty = 'Ma’lumot yo‘q.' }) {
    if (!rows?.length) return `<section class="panel"><div class="panel-head"><div><h3>${escapeHtml(title)}</h3></div></div><div class="empty-state">${escapeHtml(empty)}</div></section>`;
    return `<section class="panel table-panel"><div class="panel-head"><div><h3>${escapeHtml(title)}</h3></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>${escapeHtml(label)}</th><th class="num">ARIZA</th><th class="num">MALAKALI</th><th class="num">SOTILDI</th><th class="num">YO‘QOTILDI</th><th class="num">KONVERSIYA</th><th class="num">DAROMAD</th></tr></thead><tbody>${rows.map((row) => `<tr><td><span class="truncate" title="${escapeHtml(format(row.key))}">${escapeHtml(format(row.key))}</span></td><td class="num">${number(row.leads)}</td><td class="num">${number(row.qualified)}</td><td class="num">${number(row.won)}</td><td class="num">${number(row.lost)}</td><td class="num"><strong>${percent(row.conversion)}</strong></td><td class="num">${escapeHtml(money(row.revenue))}</td></tr>`).join('')}</tbody></table></div></section>`;
  }

  async function renderSales() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
    const data = await api(`/api/admin/sales-analytics?days=${state.days}`);
    const totals = data.totals || {};
    const steps = [...(totals.sessions ? [{ stage: 'sessions', label: 'Saytga tashrif (sessiya)', count: totals.sessions }] : []),
      ...(data.funnel || []).map((step) => ({ ...step, label: step.stage === 'new' ? 'Ariza qoldirdi' : statusLabels[step.stage] }))];
    const top = Math.max(1, ...steps.map((step) => step.count));
    const funnel = steps.map((step, index) => {
      const previous = index ? steps[index - 1].count : 0;
      const rate = index && previous ? `${percent((step.count / previous) * 100)} o‘tdi` : '';
      const width = Math.max(2, (step.count / top) * 100);
      return `<div class="funnel-step" data-stage="${escapeHtml(step.stage)}"><span title="${escapeHtml(step.label)}">${escapeHtml(step.label)}</span><div class="funnel-bar ${width < 12 ? 'is-light' : ''}"><i style="width:${width}%"></i><b style="${width < 12 ? `left:calc(${width}% + 8px)` : ''}">${number(step.count)}</b></div><em>${escapeHtml(rate)}</em></div>`;
    }).join('');
    const daily = data.daily || [];
    const stageDays = (data.stageDays || []).map((item) => ({ key: statusLabels[item.stage], count: item.days ?? 0 }));
    content.innerHTML = `${pageIntro('Savdo analitikasi', 'Arizadan sotuvgacha: qayerdan kelgan mijozlar sotib oladi, qayerda yo‘qotamiz va jamoa qanchalik tez ishlaydi.', `${state.days} KUN`)}
      <div class="metrics-grid metrics-grid--4">
        ${metricCard('Arizalar', number(totals.leads), `${number(totals.spam)} spam hisobga olinmagan`, '▤')}
        ${metricCard('Sotildi', number(totals.won), money(totals.revenue, 'summa kiritilmagan'), '✓', { tone: 'accent' })}
        ${metricCard('Yutish ulushi', percent(totals.winRate), `${number(totals.won)} sotildi / ${number(totals.lost)} yo‘qotildi`, '◔')}
        ${metricCard('Ariza → sotuv', percent(totals.leadToWon), 'barcha arizalardan', '↗')}
        ${metricCard('Ochiq voronka', number(totals.open), money(totals.pipeline, 'summa kiritilmagan'), '▥')}
        ${metricCard('Birinchi javob (mediana)', totals.medianFirstResponseHours === null || totals.medianFirstResponseHours === undefined ? '—' : `${totals.medianFirstResponseHours} soat`, `${percent(totals.respondedWithinHour)} — 1 soat ichida`, '◷', { tone: totals.medianFirstResponseHours > 4 ? 'alert' : '' })}
        ${metricCard('Sotuvgacha o‘rtacha', totals.avgDaysToClose === null || totals.avgDaysToClose === undefined ? '—' : `${totals.avgDaysToClose} kun`, 'arizadan to‘lovgacha', '⧗')}
        ${metricCard('Tashrif → ariza', percent(totals.visitToLead), `${number(totals.trackedJourneys)} ta arizaning yo‘li ma’lum`, '◉')}
      </div>
      <div class="grid-wide">
        <section class="panel"><div class="panel-head"><div><h3>To‘liq voronka</h3><p>Har bir arizani erishgan eng yuqori bosqichi bo‘yicha (bosqichni sakrab o‘tganlar ham hisoblanadi)</p></div></div><div class="funnel">${funnel}</div></section>
        <section class="panel"><div class="panel-head"><div><h3>Nega yo‘qotyapmiz</h3><p>Yo‘qotilgan bitimlar sabablari</p></div></div>${renderBarList(data.lostReasons, 'Bu davrda yo‘qotilgan bitim yo‘q.', 'is-lost')}</section>
      </div>
      <div class="grid-2">
        <section class="panel"><div class="panel-head"><div><h3>Arizalar va sotuvlar</h3><p>Kunlik kelgan arizalar va yopilgan sotuvlar</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Arizalar</span><span><i class="legend-dot is-won"></i>Sotildi</span></div></div><div class="chart-wrap">${chartSvg(daily, { second: 'won', label: 'Arizalar va sotuvlar' })}</div>${chartLabels(daily)}</section>
        <section class="panel"><div class="panel-head"><div><h3>Ochiq bitimlar yoshi</h3><p>Joriy bosqichda qancha vaqtdan beri turibdi</p></div></div>${renderBarList(data.aging, 'Ochiq bitim yo‘q.', 'is-warn')}<div class="flow-divider"></div><h3 style="font-size:14px;margin-bottom:10px">Bosqichda o‘rtacha (kun)</h3>${renderBarList(stageDays, 'Hali yetarli ma’lumot yo‘q.')}</section>
      </div>
      <div class="grid-2 grid-tables">
        ${breakdownTable(data.channels, { title: 'Kanallar: qayerdan kelgan mijoz sotib oladi', format: channelLabel })}
        ${breakdownTable(data.campaigns, { title: 'Reklama kampaniyalari (UTM)', label: 'KAMPANIYA', format: (key) => key === '—' ? 'Kampaniyasiz' : key })}
        ${breakdownTable(data.events, { title: 'Ko‘rgazmalar', label: 'TADBIR', format: (key) => key === '—' ? 'Tadbir ko‘rsatilmagan' : key })}
        ${breakdownTable(data.forms, { title: 'Formalar', label: 'FORMA', format: (key) => formLabels[key] || key })}
      </div>
      ${breakdownTable(data.managers, { title: 'Jamoa natijalari', label: 'MAS’UL' })}`;
  }

  /* ======================= EXHIBITOR COMPANY PAGES ======================= */
  function logoBox(fileId, name, large = false) {
    return `<span class="showcase-logo ${large ? 'is-large' : ''}">${fileId ? `<img src="/api/admin/files/${encodeURIComponent(fileId)}" alt="" loading="lazy" />` : escapeHtml(initials(name))}</span>`;
  }
  function participationChips(list = []) {
    return list.map((item) => `<span class="tag">${escapeHtml(showName(item.event))} ${escapeHtml(item.year)}${item.stand ? ` · ${escapeHtml(item.stand)}` : ''}</span>`).join('');
  }

  async function renderShowcases() {
    if (state.currentShowcaseId) return openShowcase(state.currentShowcaseId);
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const data = await api(`/api/admin/showcases?limit=50${state.showcaseStatus ? `&status=${state.showcaseStatus}` : ''}`);
    const counts = data.counts || {};
    updateShowcaseCount(counts.pending || 0);
    const total = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);
    const tabs = [['pending', 'Moderatsiyada'], ['published', 'Nashr qilingan'], ['rejected', 'Rad etilgan'], ['hidden', 'Yashirilgan'], ['draft', 'Qoralama'], ['', 'Barchasi']]
      .map(([value, label]) => `<button type="button" class="tab ${state.showcaseStatus === value ? 'active' : ''}" data-showcase-tab="${value}">${label}<span class="tab-count">${number(value ? counts[value] || 0 : total)}</span></button>`).join('');
    const cards = (data.items || []).map((item) => `<button type="button" class="showcase-card" data-showcase="${escapeHtml(item.accountId)}">
        <span class="showcase-top">${logoBox(item.logoFileId, item.name)}<span><strong>${escapeHtml(item.name)}</strong><span class="sub truncate">${escapeHtml(item.email)}</span></span></span>
        <span class="showcase-meta">${statusBadge(item.status)}${item.live && item.status !== 'published' ? '<span class="chip chip-blue">Saytda eski versiya</span>' : ''}<span class="chip">${number(item.materials)} material</span></span>
        <span>${participationChips(item.participation) || '<span class="muted">Ko‘rgazma tanlanmagan</span>'}</span>
        <span class="sub">${item.submittedAt ? `Yuborilgan: ${escapeHtml(formatDate(item.submittedAt))}` : `Yangilangan: ${escapeHtml(formatDate(item.updatedAt))}`}</span>
      </button>`).join('');
    content.innerHTML = `${pageIntro('Kompaniya sahifalari', 'Eksponentlar kabinetda logotip, tavsif, ijtimoiy tarmoqlar va katalog/flayerlarini yuklaydi. Siz tasdiqlaganingizdan so‘ng ular saytdagi «Eksponentlar» bo‘limida chiqadi.', `${number(total)} TA SAHIFA`)}
      <div class="tabs" role="tablist">${tabs}</div>
      ${cards ? `<div class="showcase-grid">${cards}</div>` : `<section class="panel"><div class="empty-state"><strong>${state.showcaseStatus === 'pending' ? 'Moderatsiya kutayotgan sahifa yo‘q' : 'Sahifa topilmadi'}</strong>Eksponent kabinetda «Moderatsiyaga yuborish» tugmasini bosgach, sahifa shu yerda paydo bo‘ladi.</div></section>`}`;
    $$('[data-showcase-tab]', content).forEach((tab) => tab.addEventListener('click', () => { state.showcaseStatus = tab.dataset.showcaseTab; renderShowcases().catch(showError); }));
    $$('[data-showcase]', content).forEach((card) => card.addEventListener('click', () => openShowcase(card.dataset.showcase).catch(showError)));
  }

  function showcasePreview(content, files) {
    const materials = files.filter((file) => file.kind !== 'logo');
    const socials = Object.entries(content.socials || {});
    return `<div class="showcase-preview">
      <div class="showcase-hero">${logoBox(content.logoFileId, content.name, true)}<div><h3>${escapeHtml(content.name || 'Nomsiz kompaniya')}</h3>${content.tagline ? `<p>${escapeHtml(content.tagline)}</p>` : ''}<div class="showcase-meta" style="margin-top:8px">${[content.category, [content.city, content.country].filter(Boolean).join(', ')].filter(Boolean).map((value) => `<span class="chip">${escapeHtml(value)}</span>`).join('')}</div></div></div>
      ${content.about ? `<p class="showcase-about">${escapeHtml(content.about)}</p>` : '<p class="muted">Tavsif yozilmagan.</p>'}
      <dl class="detail-list">${detailItem('Sayt', content.website)}${detailItem('Telefon', content.phone)}${detailItem('Email', content.email)}${detailItem('Ko‘rgazmalar', (content.participation || []).map((item) => `${showName(item.event)} ${item.year}${item.stand ? ` (stend ${item.stand})` : ''}`).join(', '))}</dl>
      ${socials.length ? `<div class="social-links">${socials.map(([network, url]) => `<a class="button button-secondary button-small" href="${escapeHtml(url)}" target="_blank" rel="noopener nofollow">${escapeHtml(socialLabels[network] || network)} ↗</a>`).join('')}</div>` : ''}
      <div><h3 style="font-size:14px;margin-bottom:10px">Materiallar · ${number(materials.length)}</h3>${materials.length ? `<ul class="file-list">${materials.map((file) => `<li class="file-item"><span class="file-icon ${file.mime === 'application/pdf' ? '' : 'is-image'}">${file.mime === 'application/pdf' ? 'PDF' : 'IMG'}</span><div><strong>${escapeHtml(file.title)}</strong><small>${escapeHtml(fileKindLabels[file.kind] || file.kind)} · ${escapeHtml(fileSize(file.size))}${file.published ? ' · saytda' : ' · yangi'}</small></div><a class="button button-secondary button-small" href="/api/admin/files/${encodeURIComponent(file.id)}" target="_blank" rel="noopener">Ochish ↗</a></li>`).join('')}</ul>` : '<p class="muted">Material yuklanmagan.</p>'}</div>
    </div>`;
  }

  async function openShowcase(accountId) {
    state.currentShowcaseId = accountId;
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const { showcase } = await api(`/api/admin/showcases/${encodeURIComponent(accountId)}`);
    const draft = showcase.draft || {};
    const notices = [];
    if (showcase.status === 'pending') notices.push('<div class="notice-box is-info">Eksponent sahifani moderatsiyaga yubordi. Ma’lumotlar va fayllarni tekshirib, nashr qiling yoki sababini yozib rad eting.</div>');
    if (showcase.live && showcase.hasChanges) notices.push('<div class="notice-box">Saytda hozir oldingi nashr ko‘rinmoqda — quyida yangi (tekshirilmagan) versiya.</div>');
    if (showcase.status === 'rejected' && showcase.reviewNote) notices.push(`<div class="notice-box is-danger">Rad etish sababi: ${escapeHtml(showcase.reviewNote)}</div>`);
    content.innerHTML = `<div class="account-detail-toolbar"><button class="button button-quiet" id="back-showcases" type="button">← Kompaniya sahifalari</button><div class="page-actions">
        <button class="button button-success" type="button" data-review="publish">✓ Nashr qilish</button>
        <button class="button button-danger" type="button" data-review="reject">Rad etish</button>
        ${showcase.live ? '<button class="button button-quiet" type="button" data-review="hide">Saytdan yashirish</button>' : ''}
      </div></div>
      ${pageIntro(draft.name || showcase.account.company || showcase.account.email, `${showcase.account.name} · ${showcase.account.email} · ${showcase.account.phone}`, showcaseStatusLabels[showcase.status] || showcase.status)}
      ${notices.join('')}
      <div class="account-detail-grid">
        <section class="panel"><div class="panel-head"><div><h3>Holat</h3><p>Moderatsiya tarixi</p></div></div><dl class="detail-list">
          ${detailItem('Holat', showcaseStatusLabels[showcase.status])}${detailItem('Saytda', showcase.live ? `Ha · /${showcase.slug}` : 'Yo‘q')}${detailItem('Yuborilgan', formatDate(showcase.submittedAt))}${detailItem('Nashr qilingan', formatDate(showcase.publishedAt))}${detailItem('Tekshirgan', showcase.reviewedBy)}${detailItem('Kompaniya (profil)', showcase.account.company)}
        </dl><div class="form-actions" style="justify-content:flex-start"><button class="button button-secondary button-small" type="button" id="open-account">Kabinet hisobini ochish</button></div></section>
        <section class="panel"><div class="panel-head"><div><h3>Saytda shunday ko‘rinadi</h3><p>Tekshirilayotgan versiya</p></div></div>${showcasePreview(draft, showcase.files || [])}</section>
      </div>`;
    $('#back-showcases').addEventListener('click', () => { state.currentShowcaseId = ''; renderShowcases().catch(showError); });
    $('#open-account').addEventListener('click', () => { state.currentShowcaseId = ''; state.currentPortalAccountId = accountId; navigate('portalAccounts'); });
    $$('[data-review]', content).forEach((button) => button.addEventListener('click', async () => {
      const action = button.dataset.review;
      let note = '';
      if (action === 'reject') {
        note = await askValue({ title: 'Rad etish sababi', text: 'Eksponent bu matnni kabinetida ko‘radi va tuzatib qayta yuboradi.', label: 'Sabab', type: 'textarea', required: true, confirm: 'Rad etish' });
        if (!note) return;
      }
      if (action === 'hide') {
        note = await askValue({ title: 'Saytdan yashirish', text: 'Kompaniya eksponentlar ro‘yxatidan olib tashlanadi.', label: 'Izoh (ixtiyoriy)', confirm: 'Yashirish' });
        if (note === null) return;
      }
      try {
        await api(`/api/admin/showcases/${encodeURIComponent(accountId)}/review`, { method: 'POST', body: { action, note } });
        showToast({ publish: 'Sahifa nashr qilindi — saytda bir necha daqiqada ko‘rinadi.', reject: 'Sahifa rad etildi.', hide: 'Sahifa saytdan yashirildi.' }[action]);
        await openShowcase(accountId);
      } catch (error) { showError(error); }
    }));
  }

  /* ======================= PORTAL ACCOUNTS ======================= */
  async function renderPortalAccounts() {
    if (state.currentPortalAccountId) return openPortalAccount(state.currentPortalAccountId);
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const query = new URLSearchParams({ page: String(state.portalPage), limit: '20' });
    if (state.portalFilters.q) query.set('q', state.portalFilters.q);
    if (state.portalFilters.type) query.set('type', state.portalFilters.type);
    if (state.portalFilters.active !== '') query.set('active', state.portalFilters.active);
    const data = await api(`/api/admin/portal-accounts?${query}`);
    const typeOptions = [['', 'Barcha kabinetlar'], ['visitor', 'Mehmon'], ['exhibitor', 'Eksponent']]
      .map(([value, label]) => `<option value="${value}" ${state.portalFilters.type === value ? 'selected' : ''}>${label}</option>`).join('');
    const activeOptions = [['', 'Barcha holatlar'], ['1', 'Faol'], ['0', 'Bloklangan']]
      .map(([value, label]) => `<option value="${value}" ${state.portalFilters.active === value ? 'selected' : ''}>${label}</option>`).join('');
    const rows = data.items.map((account) => `<tr>
      <td><button class="lead-open" type="button" data-portal-account-id="${escapeHtml(account.id)}">${escapeHtml(account.name)}</button><span class="sub">${escapeHtml(account.email)}</span></td>
      <td>${account.accountType === 'visitor' ? 'Mehmon' : 'Eksponent'}</td>
      <td>${escapeHtml(account.company || account.industry || account.country || '—')}</td>
      <td class="num"><strong>${number(account.requestCount)}</strong>${account.newRequests ? `<span class="sub">${number(account.newRequests)} yangi</span>` : ''}</td>
      <td class="nowrap">${escapeHtml(account.latestRequestAt ? formatDate(account.latestRequestAt) : '—')}</td>
      <td class="nowrap">${escapeHtml(account.lastLoginAt ? formatDate(account.lastLoginAt) : 'Kirmagan')}</td>
      <td>${Number(account.active) ? '<span class="status-badge status-on">Faol</span>' : '<span class="status-badge status-off">Bloklangan</span>'}</td>
    </tr>`).join('');
    content.innerHTML = `${pageIntro('Mehmon va eksponent kabinetlari', 'Hisoblar, oxirgi faollik va ularga bog‘langan so‘rovlar. Har bir so‘rov CRM kartasidan boshqariladi.', `${number(data.total)} TA HISOB`)}
      <form class="lead-toolbar" id="portal-account-filters"><div class="filters"><input name="q" type="search" value="${escapeHtml(state.portalFilters.q)}" placeholder="Ism, email, telefon, kompaniya…" aria-label="Kabinet hisoblarini qidirish" /><select name="type" aria-label="Kabinet turi">${typeOptions}</select><select name="active" aria-label="Hisob holati">${activeOptions}</select><button class="button button-secondary" type="submit">Filtrlash</button></div></form>
      <section class="panel table-panel">${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>HISOB / PROFIL</th><th>TUR</th><th>KOMPANIYA / SOHA</th><th class="num">SO‘ROVLAR</th><th>OXIRGI SO‘ROV</th><th>OXIRGI KIRISH</th><th>HOLAT</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-state"><strong>Akkaunt topilmadi</strong>Filtrni o‘zgartiring yoki yangi kabinet ro‘yxatdan o‘tishini kuting.</div>'}${pagination(data, 'portal')}</section>`;
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
      const summary = Object.entries(request.details || {}).filter(([, value]) => String(value || '').trim()).map(([key, value]) => `${key}: ${String(value)}`).join(' · ');
      return `<tr><td>${escapeHtml(request.requestType === 'visitor' ? 'Mehmon so‘rovi' : 'Eksponent so‘rovi')}<span class="sub">${escapeHtml(summary || '—')}</span></td><td>${escapeHtml(request.event || '—')}</td><td class="nowrap">${escapeHtml(formatDate(request.createdAt))}</td><td>${statusBadge(request.status)}</td><td><span class="truncate">${escapeHtml(request.assignee || 'Belgilanmagan')}</span></td><td><button class="button button-secondary button-small" type="button" data-lead-id="${escapeHtml(request.leadId)}">CRM kartasi</button></td></tr>`;
    }).join('');
    const adminAction = state.user?.role === 'admin'
      ? `<button class="button ${active ? 'button-danger' : 'button-primary'}" type="button" id="toggle-portal-account">${active ? 'Kabinetni bloklash' : 'Kabinetni qayta faollashtirish'}</button>`
      : '<p class="muted">Kabinetni bloklash uchun administrator huquqi kerak.</p>';
    content.innerHTML = `<div class="account-detail-toolbar"><button class="button button-quiet" id="back-portal-accounts" type="button">← Kabinetlar ro‘yxati</button><div class="page-actions">${account.accountType === 'exhibitor' ? '<button class="button button-secondary" type="button" id="open-showcase">Kompaniya sahifasi</button>' : ''}${adminAction}</div></div>
      ${pageIntro(account.name, `${account.accountType === 'visitor' ? 'Mehmon' : 'Eksponent'} · ${account.email}`, active ? 'FAOL' : 'BLOKLANGAN')}
      ${!active ? '<div class="notice-box" role="status">Bu akkaunt bloklangan; amaldagi portal sessiyalari bekor qilingan.</div>' : ''}
      <div class="account-detail-grid"><section class="panel"><div class="panel-head"><div><h3>Profil va hisob</h3><p>Ro‘yxatdan o‘tish va oxirgi faollik</p></div></div><dl class="detail-list">
        ${detailItem('Ism', account.name)}${detailItem('Email', account.email)}${detailItem('Telefon', account.phone)}${detailItem('Kompaniya', account.company)}${detailItem('Mamlakat', account.country)}${detailItem('Faoliyat sohasi', account.industry)}${detailItem('Sayt', account.website)}${detailItem('Qiziqishlar', account.interests)}${detailItem('Yaratilgan', formatDate(account.createdAt))}${detailItem('Oxirgi kirish', account.lastLoginAt ? formatDate(account.lastLoginAt) : 'Hali kirmagan')}${detailItem('Profil yangilangan', formatDate(account.profileUpdatedAt))}
      </dl></section><section class="panel table-panel"><div class="panel-head"><div><h3>So‘rovlar oqimi</h3><p>${number(requests.length)} ta murojaat · holat va mas’ul CRM kartasidan boshqariladi</p></div></div>${requests.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>SO‘ROV</th><th>TADBIR</th><th>SANA</th><th>BOSQICH</th><th>MAS’UL</th><th>AMAL</th></tr></thead><tbody>${requestRows}</tbody></table></div>` : '<div class="empty-state"><strong>Hali so‘rov yuborilmagan</strong>Akkaunt ro‘yxatdan o‘tgan, ammo tashrif yoki ishtirok arizasi yo‘q.</div>'}</section></div>`;
    $('#back-portal-accounts').addEventListener('click', () => {
      state.currentPortalAccountId = '';
      renderPortalAccounts().catch(showError);
    });
    $('#open-showcase')?.addEventListener('click', () => {
      state.currentPortalAccountId = '';
      state.currentShowcaseId = id;
      navigate('showcases');
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

  /* ======================= SITE ANALYTICS ======================= */
  async function renderAnalytics() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
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
    const portalTypeLabel = (key) => key === 'visitor' ? 'Mehmon' : key === 'exhibitor' ? 'Eksponent' : key;
    const accountTypes = (portal.accountsByType || []).map((item) => ({ ...item, key: portalTypeLabel(item.key) }));
    const requestTypes = (portal.requestsByType || []).map((item) => ({ ...item, key: portalTypeLabel(item.key) }));
    const requestStatuses = (portal.requestStatuses || []).map((item) => ({ ...item, key: statusLabels[item.key] || item.key }));
    const portalDaily = (portal.daily || []).map((item) => ({ key: formatDate(`${item.day}T00:00:00Z`, false), count: Number(item.accounts) + Number(item.requests) }));
    const panel = (title, text, body) => `<section class="panel"><div class="panel-head"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div></div>${body}</section>`;
    content.innerHTML = `${pageIntro('Sayt analitikasi', 'Birinchi tomon hisoblagichi: trafik, CTA, formalar va kabinetlar. IP va shaxsiy ma’lumot saqlanmaydi. Sotuv natijalari — «Savdo analitikasi»da.', `${state.days} KUN`, '<button class="button button-secondary button-small" type="button" data-go-view="sales">Savdo analitikasi →</button>')}
      <div class="metrics-grid">${metricCard('Sahifa ko‘rishlar', number(views), 'page_view hodisalari', '◉')}${metricCard('Sessiyalar', number(sessions), 'takroriy bo‘lmagan ID', '◎')}${metricCard('Yuborilgan formalar', number(submits), 'muvaffaqiyatli yuborishlar', '↗')}${metricCard('Hodisalar', number(data.eventTotal), 'jami qayd etilgan', '⌁')}${metricCard('Yangi kabinetlar', number(portal.accounts), 'mehmon va eksponent hisoblari', '♙')}${metricCard('Kabinet so‘rovlari', number(portal.requests), 'tashrif va ishtirok arizalari', '⌂')}</div>
      <section class="panel" style="margin-top:16px"><div class="panel-head"><div><h3>Kunlik sayt faolligi</h3><p>Sahifa ko‘rishlar (ko‘k) va sessiyalar (yashil)</p></div></div><div class="chart-wrap">${chartSvg(daily, { key: 'views', second: 'sessions', label: 'Kunlik sayt faolligi' })}</div>${chartLabels(daily)}</section>
      <div class="grid-2">
        ${panel('Konversiya yo‘li', `Sessiyadan muvaffaqiyatli arizagacha · ${number(funnel.successfulSubmissions || 0)} yuborish, ${number(funnel.fallbackSubmissions || 0)} fallback`, renderBarList(funnelRows))}
        ${panel('Eng ko‘p ko‘rilgan sahifalar', 'URL ichidagi query va identifikatorlar olib tashlangan', renderBarList(data.pages, 'Sahifa ko‘rishlar hali yig‘ilmagan.'))}
        ${panel('CTA bosishlar', 'Qaysi chaqiriq foydalanuvchini keyingi bosqichga olib o‘tdi', renderBarList(data.ctas, 'CTA bosish hali qayd etilmadi.'))}
        ${panel('Kampaniyalar', 'UTM kampaniya nomlari', renderBarList(data.campaigns, 'UTM kampaniyasi topilmadi.'))}
        ${panel('Hodisalar', 'O‘lchov nuqtalari bo‘yicha taqsimot', renderBarList(data.events))}
        ${panel('Kanallar', 'So‘rov va kvizlarda qayd etilgan kanal', renderBarList(data.channels, 'Kanal ma’lumoti yo‘q.'))}
        ${panel('Foydalanuvchi tillari', 'Sessiya tiliga ko‘ra auditoriya', renderBarList(data.locales, 'Til kesimi hali yig‘ilmagan.'))}
        ${panel('Kabinetlar va arizalar oqimi', 'Ro‘yxatdan o‘tishdan CRM holatigacha', `${renderBarList(accountTypes, 'Bu davrda yangi kabinet yo‘q.')}<div class="flow-divider"></div>${renderBarList(requestTypes, 'Bu davrda kabinet so‘rovi yo‘q.')}`)}
        ${panel('Kabinet so‘rovlarining CRM holati', 'Har bir so‘rov CRM kartasiga ulangan', renderBarList(requestStatuses, 'Bu davrda portal so‘rovi yo‘q.'))}
        ${panel('Ko‘rgazmalar bo‘yicha kabinet so‘rovlari', 'Mehmon va eksponent arizalari birgalikda', renderBarList(portal.events, 'Bu davrda tadbir so‘rovi yo‘q.'))}
        ${panel('Kabinet faolligining kunlik dinamikasi', 'Yangi hisoblar + so‘rovlar', renderBarList(portalDaily.slice(-14), 'Bu davrda kabinet faolligi yo‘q.'))}
      </div>`;
    $$('[data-go-view]', content).forEach((button) => button.addEventListener('click', () => navigate(button.dataset.goView)));
  }

  /* ======================= INTEGRATIONS ======================= */
  function auditRows(items) {
    return items.map((item) => `<tr><td class="nowrap">${escapeHtml(formatDate(item.createdAt))}</td><td><span class="truncate" title="${escapeHtml(item.actorEmail || '')}">${escapeHtml(item.actorEmail || '—')}</span></td><td>${escapeHtml(auditActionLabels[item.action] || item.action)}</td><td>${escapeHtml(item.entityType)}<span class="sub">${escapeHtml(String(item.entityId || '').slice(0, 12))}</span></td><td><code class="audit-details">${escapeHtml(JSON.stringify(item.details || {}))}</code></td></tr>`).join('');
  }

  async function renderIntegrations() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const [data, auditData] = await Promise.all([api('/api/admin/system'), api('/api/admin/audit?limit=20')]);
    const failed = data.outbox?.failed || 0;
    const pending = data.outbox?.pending || 0;
    const providers = [
      { name: 'Telegram Bot', icon: '➤', on: data.providers.telegram, detail: 'Yangi arizalar menejerlar Telegram chatiga xabarnoma sifatida yuboriladi.' },
      { name: 'CRM webhook', icon: '↗', on: data.providers.crm, detail: 'Lidlar sozlangan CRM webhook manziliga fon rejimida jo‘natiladi.' },
      { name: 'SQLite saqlash', icon: '▣', on: data.storage === 'sqlite', detail: 'Arizalar, fayllar ro‘yxati va analitika serverdagi SQLite bazasida.' },
    ];
    content.innerHTML = `${pageIntro('Integratsiyalar va tizim', 'Ulanish holati va yuborilmagan arizalarni shu yerdan kuzating.', 'SERVER')}
      <div class="integration-grid">${providers.map((provider) => `<article class="integration-card"><div class="integration-icon">${provider.icon}</div><h3>${provider.name}</h3><p>${provider.detail}</p><div class="connection ${provider.on ? 'on' : ''}"><i></i>${provider.on ? 'Ulangan' : 'Sozlanmagan'}</div></article>`).join('')}</div>
      <div class="system-grid"><section class="panel"><div class="panel-head"><div><h3>Yetkazib berish navbati</h3><p>Vaqtinchalik uzilishlar avtomatik qayta uriniladi.</p></div></div><div class="system-stat"><span>Kutilmoqda</span><strong>${number(pending)}</strong></div><div class="system-stat"><span>Qayta urinish tugagan</span><strong>${number(failed)}</strong></div><div class="system-stat"><span>Administratorlar</span><strong>${number(data.adminUsers)}</strong></div><div class="system-stat"><span>Backend runtime</span><strong>${escapeHtml(data.node)}</strong></div>${failed ? '<div class="form-actions"><button class="button button-primary" type="button" id="retry-outbox">Qayta yuborish</button></div>' : ''}</section>
      <section class="panel table-panel"><div class="panel-head"><div><h3>Yetkazilmagan murojaatlar</h3><p>Avval saqlanadi, keyin integratsiyalarga uzatiladi.</p></div></div>${data.recentDeliveries?.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>LID</th><th>KANAL</th><th>HOLAT</th><th class="num">URINISH</th></tr></thead><tbody>${data.recentDeliveries.map((row) => `<tr><td>${escapeHtml(row.name)}<span class="sub">${escapeHtml(row.phone)}</span></td><td>${escapeHtml(row.provider)}</td><td>${escapeHtml(row.state === 'failed' ? 'Xatolik' : 'Navbatda')}${row.lastError ? `<span class="sub">${escapeHtml(row.lastError)}</span>` : ''}</td><td class="num">${number(row.attempts)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty-state"><strong>Hammasi yetkazilgan</strong>Navbatda muammoli jo‘natma yo‘q.</div>'}</section></div>
      <section class="panel table-panel" style="margin-top:16px"><div class="panel-head"><div><h3>So‘nggi boshqaruv amallari</h3><p>CRM, kabinet va jamoa sozlamalaridagi oxirgi o‘zgarishlar</p></div><button class="button button-secondary button-small" id="open-activity-log" type="button">To‘liq tarix</button></div>${auditData.items?.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>SANA</th><th>BAJARUVCHI</th><th>AMAL</th><th>OBYEKT</th><th>O‘ZGARISH</th></tr></thead><tbody>${auditRows(auditData.items)}</tbody></table></div>` : '<div class="empty-state">Hali amal qayd etilmagan.</div>'}</section>`;
    $('#open-activity-log')?.addEventListener('click', () => navigate('activity'));
    $('#retry-outbox')?.addEventListener('click', async () => {
      try {
        const result = await api('/api/admin/outbox/retry', { method: 'POST', body: {} });
        showToast(`${number(result.retried)} ta jo‘natma qayta navbatga qo‘yildi.`);
        await renderIntegrations();
      } catch (error) { showError(error); }
    });
  }

  /* ======================= ACTIVITY ======================= */
  async function renderActivity() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const query = new URLSearchParams({ page: String(state.auditPage), limit: '25' });
    for (const key of ['q', 'actor', 'entity', 'from', 'to']) {
      if (state.auditFilters[key]) query.set(key, state.auditFilters[key]);
    }
    const data = await api(`/api/admin/audit?${query}`);
    const entityOptions = [
      ['', 'Barcha obyektlar'], ['lead', 'CRM arizasi'], ['portal_account', 'Kabinet / kompaniya sahifasi'],
      ['user', 'Jamoa hisobi'], ['delivery_outbox', 'Yetkazish navbati'], ['tg_blog_post', 'Blog'],
    ].map(([value, label]) => `<option value="${value}" ${state.auditFilters.entity === value ? 'selected' : ''}>${label}</option>`).join('');
    const rows = auditRows(data.items || []);
    content.innerHTML = `${pageIntro('Faoliyat tarixi', 'CRM, kabinet, kompaniya sahifalari, jamoa va yetkazish navbatidagi barcha boshqaruv amallari.', `${number(data.total)} TA YOZUV`)}
      <form class="lead-toolbar audit-toolbar" id="audit-filters"><div class="filters"><input name="q" type="search" value="${escapeHtml(state.auditFilters.q)}" placeholder="Amal, obyekt ID yoki tafsilot…" aria-label="Faoliyat tarixidan qidirish" /><input name="actor" type="email" value="${escapeHtml(state.auditFilters.actor)}" placeholder="Xodim emaili" aria-label="Bajaruvchi emaili" /><select name="entity" aria-label="Obyekt turi">${entityOptions}</select><label class="audit-date"><span>Dan</span><input name="from" type="date" value="${escapeHtml(state.auditFilters.from)}" /></label><label class="audit-date"><span>Gacha</span><input name="to" type="date" value="${escapeHtml(state.auditFilters.to)}" /></label><button class="button button-secondary" type="submit">Filtrlash</button></div></form>
      <section class="panel table-panel">${rows ? `<div class="table-wrap"><table class="data-table audit-table"><thead><tr><th>SANA / VAQT</th><th>BAJARUVCHI</th><th>AMAL</th><th>OBYEKT</th><th>O‘ZGARISH TAFSILOTI</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-state"><strong>Yozuv topilmadi</strong>Filtrlarni o‘zgartiring.</div>'}${pagination(data, 'audit')}</section>`;
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

  /* ======================= TEAM ======================= */
  async function renderUsers() {
    const content = $('#content');
    content.innerHTML = '<div class="skeleton"></div>';
    const data = await api('/api/admin/users');
    content.innerHTML = `${pageIntro('Jamoa va ruxsatlar', 'Menejerlarga alohida hisob oching — arizalarni ularga biriktirib, natijalarini «Savdo analitikasi»da ko‘rasiz.', 'FAQAT ADMIN')}
      <section class="panel"><div class="panel-head"><div><h3>Yangi foydalanuvchi</h3><p>Parol kamida 12 belgidan iborat bo‘lishi kerak.</p></div></div><form id="user-create" class="user-create"><div class="field"><label for="user-email">EMAIL</label><input id="user-email" name="email" type="email" required placeholder="manager@sof-expo.com" /></div><div class="field"><label for="user-password">VAQTINCHALIK PAROL</label><input id="user-password" name="password" type="password" minlength="12" required placeholder="Kamida 12 belgi" /></div><div class="field"><label for="user-role">HUQUQ</label><select id="user-role" name="role"><option value="manager">Menejer</option><option value="admin">Administrator</option></select></div><button class="button button-primary" type="submit">Qo‘shish</button></form></section>
      <section class="panel table-panel"><div class="panel-head"><div><h3>Foydalanuvchilar</h3><p>${number(data.users.length)} ta hisob</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>FOYDALANUVCHI</th><th>HUQUQ</th><th>OXIRGI KIRISH</th><th>HOLAT</th><th>AMAL</th></tr></thead><tbody>${data.users.map((user) => `<tr><td><strong>${escapeHtml(user.email)}</strong><span class="sub">Qo‘shilgan: ${escapeHtml(formatDate(user.createdAt, false))}</span></td><td><select data-role-select="${escapeHtml(user.id)}" aria-label="Huquq"><option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Menejer</option><option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option></select></td><td class="nowrap">${escapeHtml(user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Kirmagan')}</td><td>${Number(user.active) ? '<span class="status-badge status-on">Faol</span>' : '<span class="status-badge status-off">O‘chirilgan</span>'}</td><td><button class="button ${Number(user.active) ? 'button-danger' : 'button-secondary'} button-small" type="button" data-user-toggle="${escapeHtml(user.id)}" data-active="${Number(user.active) ? '1' : '0'}">${Number(user.active) ? 'O‘chirish' : 'Faollashtirish'}</button></td></tr>`).join('')}</tbody></table></div></section>`;
    $('#user-create').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        await api('/api/admin/users', { method: 'POST', body: { email: form.get('email'), password: form.get('password'), role: form.get('role') } });
        showToast('Foydalanuvchi yaratildi. Kirish ma’lumotlarini xavfsiz ulashing.');
        await loadMeta();
        await renderUsers();
      } catch (error) { showError(error); }
    });
    $$('[data-user-toggle]').forEach((button) => button.addEventListener('click', async () => {
      const row = button.closest('tr');
      const role = $(`[data-role-select="${CSS.escape(button.dataset.userToggle)}"]`, row).value;
      try {
        await api(`/api/admin/users/${button.dataset.userToggle}`, { method: 'PATCH', body: { role, active: button.dataset.active !== '1' } });
        showToast('Foydalanuvchi sozlamalari saqlandi.');
        await loadMeta();
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

  /* ======================= BLOG ======================= */
  /* Telegram → blog sync. Bot API hech qachon delete hodisasini yubormaydi,
     shuning uchun e’lon/yashirish/o‘chirish shu yerda boshqariladi. */
  async function renderBlog() {
    const content = $('#content');
    content.innerHTML = '<div class="loading-line">Ma’lumot yuklanmoqda…</div>';
    let data;
    try {
      data = await api(`/api/admin/blog-posts?page=${state.blogPage}&status=${encodeURIComponent(state.blogStatus)}`);
    } catch (error) {
      if (error.status === 503) {
        content.innerHTML = `${pageIntro('Blog · Telegram', 'Telegram kanalidagi postlar sayt blogiga avtomatik tushadi.', 'SOZLANMAGAN')}
          <section class="panel"><div class="empty-state"><strong>Sinxronizatsiya yoqilmagan</strong>Backend <code>.env</code> faylida <code>TELEGRAM_BOT_TOKEN</code>, <code>TELEGRAM_WEBHOOK_SECRET</code> va <code>TELEGRAM_CHANNEL_ID</code> to‘ldirilgach bu ro‘yxat ishga tushadi. Qo‘llanma: <code>docs/telegram-blog-sync.md</code>.</div></section>`;
        return;
      }
      throw error;
    }
    const sync = data.sync || {};
    const rows = (data.items || []).map((post) => {
      const actions = [
        post.status !== 'published' ? `<button class="button button-primary button-small" type="button" data-blog-action="publish" data-id="${post.id}">E’lon qilish</button>` : '',
        post.status === 'published' ? `<button class="button button-secondary button-small" type="button" data-blog-action="unpublish" data-id="${post.id}">Yashirish</button>` : '',
        state.user?.role === 'admin' ? `<button class="button button-danger button-small" type="button" data-blog-action="delete" data-id="${post.id}" data-title="${escapeHtml(post.title)}">O‘chirish</button>` : '',
      ].filter(Boolean).join(' ');
      const tg = post.tgLink ? `<a href="${escapeHtml(post.tgLink)}" target="_blank" rel="noopener">Telegram ↗</a>` : '—';
      const site = post.status === 'published' ? `<a href="/${escapeHtml(post.locale)}/${escapeHtml(post.collection)}/${escapeHtml(post.slug)}/" target="_blank" rel="noopener">Sayt ↗</a>` : `<code>/${escapeHtml(post.collection)}/${escapeHtml(post.slug)}/</code>`;
      return `<tr>
        <td><strong>${escapeHtml(post.title)}</strong><span class="sub">${escapeHtml(post.excerpt || '')}</span></td>
        <td class="nowrap">${escapeHtml(formatDate(post.postedAt || post.createdAt))}${post.editedAt ? `<span class="sub">tahrir: ${escapeHtml(formatDate(post.editedAt))}</span>` : ''}</td>
        <td><span class="status-badge status-${escapeHtml(post.status)}">${escapeHtml(blogStatusLabels[post.status] || post.status)}</span></td>
        <td>${(post.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('') || '—'}</td>
        <td>${tg}<br />${site}</td>
        <td><div class="page-actions">${actions}</div></td>
      </tr>`;
    }).join('');
    content.innerHTML = `${pageIntro('Blog · Telegram', `Kanal ${sync.channel || ''} · rejim: ${sync.mode || '—'} · bo‘lim: /${sync.collection || 'news'}/ · til: ${sync.locale || '—'} · git push: ${sync.gitPush ? 'yoqilgan' : 'o‘chiq'}`, `${number(data.total)} TA MAQOLA`)}
      <div class="lead-toolbar"><div class="filters"><select id="blog-status" aria-label="Holat bo‘yicha filtr"><option value="">Barcha holatlar</option>${Object.entries(blogStatusLabels).map(([value, label]) => `<option value="${value}" ${state.blogStatus === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div></div>
      <section class="panel table-panel">${rows ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>MAQOLA</th><th>SANA</th><th>HOLAT</th><th>TEGLAR</th><th>HAVOLA</th><th>AMALLAR</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty-state"><strong>Hozircha maqola yo‘q</strong>Kanalda post chiqqach u avtomatik shu yerda ko‘rinadi.</div>'}${pagination({ ...data, limit: data.limit || 25 }, 'blog')}</section>`;
    $('#blog-status')?.addEventListener('change', (event) => { state.blogStatus = event.target.value; state.blogPage = 1; renderBlog().catch(showError); });
    $('#blog-prev')?.addEventListener('click', () => { state.blogPage -= 1; renderBlog().catch(showError); });
    $('#blog-next')?.addEventListener('click', () => { state.blogPage += 1; renderBlog().catch(showError); });
    $$('[data-blog-action]', content).forEach((button) => button.addEventListener('click', async () => {
      const action = button.dataset.blogAction;
      const id = button.dataset.id;
      try {
        if (action === 'delete') {
          if (!window.confirm(`«${button.dataset.title}» maqolasi o‘chirilsinmi? Fayli va rasmlari repodan ham olib tashlanadi.`)) return;
          await api(`/api/admin/blog-posts/${id}`, { method: 'DELETE' });
          showToast('Maqola o‘chirildi.');
        } else {
          await api(`/api/admin/blog-posts/${id}/${action}`, { method: 'POST' });
          showToast(action === 'publish' ? 'Maqola e’lon qilindi.' : 'Maqola yashirildi.');
        }
        await renderBlog();
      } catch (error) { showError(error); }
    }));
  }

  /* ======================= NAVIGATION ======================= */
  const renderers = {
    dashboard: renderDashboard, pipeline: renderPipeline, leads: renderLeads, sales: renderSales, showcases: renderShowcases,
    portalAccounts: renderPortalAccounts, analytics: renderAnalytics, blog: renderBlog, integrations: renderIntegrations,
    activity: renderActivity, users: renderUsers,
  };

  function closeMobileMenu() {
    $('#sidebar').classList.remove('mobile-open');
    $('#mobile-scrim')?.classList.remove('active');
  }

  function navigate(view) {
    if (!labels[view]) return;
    if (state.user?.role !== 'admin' && ADMIN_VIEWS.includes(view)) return;
    state.view = view;
    $('#page-title').textContent = labels[view];
    document.title = `${labels[view]} · SOF EXPO Admin`;
    $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
    closeMobileMenu();
    closeDrawer();
    if (window.location.hash !== `#${view}`) {
      try { window.history.replaceState(null, '', view === 'dashboard' ? window.location.pathname : `#${view}`); } catch { /* sandboxed */ }
    }
    renderers[view]().catch(showError);
  }

  function initialView() {
    const view = String(window.location.hash || '').replace('#', '');
    return labels[view] ? view : 'dashboard';
  }

  async function startApp(user) {
    setUser(user);
    setAuthVisible(false);
    await loadMeta();
    navigate(initialView());
  }

  async function loadSession() {
    const data = await api('/api/admin/me');
    state.csrf = data.csrfToken;
    await startApp(data.user);
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
    /* event.currentTarget is null once the handler awaits: keep the form itself */
    const formElement = event.currentTarget;
    const button = $('button[type="submit"]', formElement);
    const errorNode = $('#login-error');
    errorNode.hidden = true;
    button.disabled = true;
    try {
      const form = new FormData(formElement);
      const response = await api('/api/admin/login', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } });
      state.csrf = response.csrfToken;
      formElement.reset();
      await startApp(response.user);
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
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.view === 'portalAccounts') state.currentPortalAccountId = '';
    if (button.dataset.view === 'showcases') state.currentShowcaseId = '';
    navigate(button.dataset.view);
  }));
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
      scrim.addEventListener('click', closeMobileMenu);
    }
    scrim.classList.toggle('active');
  });
  $$('[data-close-drawer]').forEach((button) => button.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if ($('#modal-root').innerHTML) return;
    closeDrawer();
  });

  initialize();
})();
