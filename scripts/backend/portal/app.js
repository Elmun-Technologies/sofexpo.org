(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const i18n = window.SOFEXPO_PORTAL_I18N;
  const supportedLocales = Object.keys(i18n.locales);
  const state = {
    csrf: '', user: null, events: [], toastTimer: 0, locale: 'uz', authMode: 'login', tab: 'requests',
    options: { shows: [], fileKinds: ['catalog', 'brochure', 'flyer', 'presentation', 'pricelist', 'image', 'other'], socials: ['instagram', 'telegram', 'facebook', 'linkedin', 'youtube', 'tiktok'], limits: {} },
    showcase: null, files: [], uploads: [], showcaseLoaded: false,
  };
  const apiRoot = '/api/portal';
  const statusKeys = { new: 'statusNew', contacted: 'statusContacted', qualified: 'statusQualified', proposal: 'statusQualified', negotiation: 'statusQualified', won: 'statusWon', lost: 'statusLost', spam: 'statusLost' };
  const showcaseStatusKeys = { draft: 'scStatusDraft', pending: 'scStatusPending', published: 'scStatusPublished', rejected: 'scStatusRejected', hidden: 'scStatusHidden' };
  const showcaseStatusCopyKeys = { draft: 'scStatusDraftCopy', pending: 'scStatusPendingCopy', published: 'scStatusPublishedCopy', rejected: 'scStatusRejectedCopy', hidden: 'scStatusHiddenCopy' };
  const fileKindKeys = { catalog: 'kindCatalog', brochure: 'kindBrochure', flyer: 'kindFlyer', presentation: 'kindPresentation', pricelist: 'kindPricelist', image: 'kindImage', other: 'kindOther', logo: 'kindLogo' };
  const socialLabels = { instagram: 'Instagram', telegram: 'Telegram', facebook: 'Facebook', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok' };
  const LIMITS = { pdfBytes: 20 * 1024 * 1024, imageBytes: 5 * 1024 * 1024, filesPerAccount: 30 };
  const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

  function t(key) {
    return i18n.locales[state.locale]?.[key] ?? i18n.locales.uz[key] ?? key;
  }
  const format = (key, values) => t(key).replace(/\{(\w+)\}/g, (match, name) => (values[name] ?? match));

  /* ======================= LOCALE ======================= */
  function setLocale(locale, updateUrl = true) {
    state.locale = supportedLocales.includes(String(locale).toLowerCase()) ? String(locale).toLowerCase() : 'uz';
    document.documentElement.lang = i18n.htmlLocales[state.locale];
    document.title = t('documentTitle');
    $$('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
    $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    $$('[data-i18n-aria-label]').forEach((node) => { node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel)); });
    $$('.locale-select').forEach((select) => { select.value = state.locale; });
    $$('[data-public-link]').forEach((link) => {
      const page = link.dataset.publicLink === 'privacy' ? 'legal/privacy/' : '';
      link.href = `https://sof-expo.com/${state.locale}/${page}`;
    });
    $('#showcase-live-link').href = `https://sof-expo.com/${state.locale}/exhibitors/catalogue/`;
    setAuthMode(state.authMode);
    if (state.events.length) populateEvents(state.events);
    if (state.user) {
      $('#account-role').textContent = state.user.accountType === 'exhibitor' ? t('exhibitorAccount') : t('visitorAccount');
    }
    setAccountType(state.user?.accountType || selectedRegisterType());
    if (state.showcaseLoaded) renderShowcase({ keepForm: true });
    if (updateUrl && typeof history !== 'undefined' && history.replaceState) {
      const params = new URLSearchParams(location.search);
      params.set('lang', state.locale);
      const query = params.toString();
      history.replaceState(history.state, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
    }
  }

  function localizedServerError(message, status) {
    const keys = {
      'Email yoki parol noto‘g‘ri.': 'invalidCredentials',
      'Email manzili noto‘g‘ri.': 'invalidEmail',
      'Parol kamida 12 ta belgidan iborat bo‘lishi kerak.': 'weakPassword',
      'Shaxsiy ma’lumotlarni qayta ishlashga rozilik kerak.': 'consentRequired',
      'Bu email bilan hisob mavjud. Tizimga kiring.': 'duplicateAccount',
      'Ism va telefon raqamini to‘g‘ri kiriting.': 'profileValidation',
      'Eksponent uchun kompaniya va faoliyat sohasi majburiy.': 'exhibitorFieldsRequired',
      'Kompaniya va faoliyat sohasi majburiy.': 'exhibitorFieldsRequired',
      'Kompaniya sayti http:// yoki https:// bilan boshlansin.': 'badWebsite',
      'Ro‘yxatdan o‘tish urinishlari ko‘p. Keyinroq qayta urinib ko‘ring.': 'rateLimited',
      'So‘rovlar soni ko‘p. Birozdan keyin urinib ko‘ring.': 'rateLimited',
      'Juda ko‘p saqlash. Birozdan keyin urinib ko‘ring.': 'rateLimited',
      'Fayllar soni ko‘p. Birozdan keyin urinib ko‘ring.': 'rateLimited',
      'Urinishlar vaqtincha bloklandi. 10 daqiqadan so‘ng qayta urinib ko‘ring.': 'accountLocked',
      'Ro‘yxatdan tadbirni tanlang.': 'eventRequired',
      'Ushbu murojaatni yuborishga rozilik bering.': 'requestConsentRequired',
      'Maydonni 1–10 000 m² oralig‘ida kiriting.': 'areaInvalid',
      'Ishtirok formatini tanlang.': 'packageRequired',
      'Qiziqish yo‘nalishini kiriting.': 'interestRequired',
      'Ba’zi maydonlar noto‘g‘ri to‘ldirilgan.': 'scFieldsInvalid',
      'Faqat PDF, PNG, JPG yoki WEBP fayl yuklash mumkin.': 'uploadType',
      'Logotip PNG, JPG yoki WEBP rasm bo‘lishi kerak.': 'logoType',
      'Rasm hajmi 5 MB dan oshmasin.': 'imageTooBig',
    };
    if (keys[message]) return t(keys[message]);
    if (/ta fayl yuklash mumkin/.test(String(message || ''))) return t('tooManyFiles');
    if (status === 413) return t('fileTooBig');
    return status >= 500 ? t('serverError') : t('requestFallbackError');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function toast(message, error = false) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.toggle('error', error);
    node.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => node.classList.remove('show'), 3400);
  }

  function fileSize(bytes) {
    const value = Number(bytes) || 0;
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(value >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  /* ======================= AUTH ======================= */
  function showAuth(mode = 'login') {
    state.user = null;
    state.csrf = '';
    state.showcase = null;
    state.files = [];
    state.showcaseLoaded = false;
    $('#auth-view').hidden = false;
    $('#portal-view').hidden = true;
    setAuthMode(mode);
  }

  function setAuthMode(mode) {
    state.authMode = mode === 'register' ? 'register' : 'login';
    const register = state.authMode === 'register';
    $('#login-form').hidden = register;
    $('#register-form').hidden = !register;
    $('#auth-title').textContent = t(register ? 'registerTitle' : 'loginTitle');
    $('#auth-description').textContent = t(register ? 'registerDescription' : 'loginDescription');
    $$('.auth-tab').forEach((tab) => {
      const active = tab.dataset.authTab === state.authMode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  function selectedRegisterType() {
    return $('#register-type-exhibitor').checked ? 'exhibitor' : 'visitor';
  }

  function setRegisterType(type) {
    $('#register-type-exhibitor').checked = type === 'exhibitor';
    $('#register-type-visitor').checked = type !== 'exhibitor';
  }

  function toggleFields(selector, visible) {
    const group = $(selector);
    if (!group) return;
    group.hidden = !visible;
    $$('input,select,textarea', group).forEach((field) => { field.disabled = !visible; });
    if (group.matches('input,select,textarea')) group.disabled = !visible;
  }

  /** what changes between a guest and an exhibitor: required fields, copy, sections */
  function setAccountType(type) {
    const exhibitor = type === 'exhibitor';
    /* registration (only while signed out) */
    toggleFields('[data-role-fields="exhibitor"]', exhibitor);
    $('#register-company').required = exhibitor;
    $('#register-industry').required = exhibitor;
    $$('[data-visitor-only]').forEach((node) => { node.hidden = exhibitor; });
    /* cabinet */
    toggleFields('.exhibitor-profile-fields', exhibitor);
    $('#profile-company').required = exhibitor;
    $('#profile-industry').required = exhibitor;
    toggleFields('.exhibitor-request-fields', exhibitor);
    toggleFields('.visitor-request-fields', !exhibitor);
    $('#request-area').required = exhibitor;
    $('#request-package').required = exhibitor;
    $('#request-interest').required = false;
    const signedInExhibitor = exhibitor && state.user?.accountType === 'exhibitor';
    $('#tab-showcase').hidden = !signedInExhibitor;
    $('#tab-requests-label').textContent = t(exhibitor ? 'tabRequestsExhibitor' : 'tabRequestsVisitor');
    if (exhibitor) {
      const name = state.user?.profile?.company || state.user?.profile?.name || t('partnerFallback');
      $('#welcome-kicker').textContent = t('welcomeExhibitorKicker');
      $('#welcome-title').textContent = t('welcomeExhibitor').replace('{name}', name);
      $('#welcome-copy').textContent = t('welcomeExhibitorCopy');
      $('#request-kicker').textContent = t('exhibitorRequestKicker');
      $('#request-title').textContent = t('exhibitorRequestTitle');
      $('#request-card-lead').textContent = t('exhibitorRequestIntro');
      $('#requests-title').textContent = t('exhibitorRequestsTitle');
    } else {
      const name = state.user?.profile?.name || t('guestFallback');
      $('#welcome-kicker').textContent = t('welcomeVisitorKicker');
      $('#welcome-title').textContent = t('welcomeVisitor').replace('{name}', name);
      $('#welcome-copy').textContent = t('welcomeVisitorCopy');
      $('#request-kicker').textContent = t('visitorRequestKicker');
      $('#request-title').textContent = t('visitorRequestTitle');
      $('#request-card-lead').textContent = t('visitorRequestIntro');
      $('#requests-title').textContent = t('visitorRequestsTitle');
    }
  }

  /* ======================= API ======================= */
  async function api(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...(options.headers || {}) };
    const raw = options.raw !== undefined;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (raw) headers['Content-Type'] = options.contentType || 'application/octet-stream';
    if (method !== 'GET' && method !== 'HEAD' && state.csrf) headers['X-CSRF-Token'] = state.csrf;
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers,
      body: raw ? options.raw : options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) {
      if (response.status === 401 && path !== `${apiRoot}/login` && path !== `${apiRoot}/register`) showAuth('login');
      const error = new Error(localizedServerError(data?.error, response.status));
      error.details = data?.details;
      error.status = response.status;
      throw error;
    }
    return data;
  }

  /* ======================= REQUESTS ======================= */
  function populateEvents(events) {
    state.events = Array.isArray(events) ? events : [];
    const select = $('#request-event');
    const previousValue = select.value;
    const localEvents = i18n.events[state.locale] || i18n.events.uz;
    const options = state.events.map((event) => {
      const localized = localEvents[event.slug];
      const name = localized?.[0] || event.name;
      const dates = localized?.[1] || event.dates;
      return `<option value="${escapeHtml(event.slug)}">${escapeHtml(name)} · ${escapeHtml(dates)}</option>`;
    }).join('');
    select.innerHTML = `<option value="" data-i18n="chooseEvent">${escapeHtml(t('chooseEvent'))}</option>${options}`;
    if (state.events.some((event) => event.slug === previousValue)) select.value = previousValue;
  }

  const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

  function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('dateUnknown');
    /* browsers ship no Uzbek month names (Intl printed "M10"): spell them out for uz */
    if (state.locale === 'uz') return `${date.getDate()} ${UZ_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    return new Intl.DateTimeFormat(i18n.publicLocales[state.locale], { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function localizedEventName(name) {
    for (const [slug, event] of Object.entries(i18n.events.uz)) {
      if (event[0] === name) return (i18n.events[state.locale]?.[slug] || event)[0];
    }
    return name;
  }

  function requestDetail(item) {
    const details = item.details || {};
    const interestKeys = { 'business-visit': 'businessVisit', 'buyer-program': 'buyerProgram', conference: 'conference', 'group-visit': 'groupVisit', other: 'other' };
    if (item.requestType === 'exhibitor') {
      return [details.industry, details.area, details.package, details.message].filter(Boolean).join(' · ');
    }
    const interest = interestKeys[details.interest] ? t(interestKeys[details.interest]) : (details.interest === 'visit' ? '' : details.interest);
    return [interest, details.message].filter(Boolean).join(' · ');
  }

  async function loadRequests() {
    const list = $('#requests-list');
    list.innerHTML = `<div class="loading-state">${escapeHtml(t('loading'))}</div>`;
    let data;
    try {
      data = await api(`${apiRoot}/requests`);
    } catch (error) {
      list.innerHTML = `<div class="empty-state requests-error">${escapeHtml(t('loadError'))}</div>`;
      throw error;
    }
    if (!data.items?.length) {
      list.innerHTML = `<div class="empty-state">${escapeHtml(t('emptyRequests'))}</div>`;
      return;
    }
    list.innerHTML = data.items.map((item) => {
      const detail = requestDetail(item);
      const status = item.status || 'new';
      const requestType = item.requestType === 'exhibitor' ? t('exhibitorRequestType') : t('visitorRequestType');
      return `<article class="request-item"><div class="request-main"><h3>${escapeHtml(localizedEventName(item.event))}</h3><p>${escapeHtml(dateLabel(item.createdAt))} · ${escapeHtml(requestType)}</p>${detail ? `<p class="request-detail">${escapeHtml(detail)}</p>` : ''}</div><span class="request-status status-${escapeHtml(statusKeys[status] ? status : 'new')}">${escapeHtml(t(statusKeys[status] || 'statusNew'))}</span></article>`;
    }).join('');
  }

  /* ======================= PROFILE ======================= */
  function fillProfile(profile) {
    $('#profile-name').value = profile.name || '';
    $('#profile-phone').value = profile.phone || '';
    $('#profile-company').value = profile.company || '';
    $('#profile-industry').value = profile.industry || '';
  }

  /* ======================= CABINET TABS ======================= */
  function availableTabs() {
    return state.user?.accountType === 'exhibitor' ? ['showcase', 'requests', 'profile'] : ['requests', 'profile'];
  }

  function setTab(tab, focus = false) {
    const tabs = availableTabs();
    state.tab = tabs.includes(tab) ? tab : tabs[0];
    $$('.portal-tab').forEach((button) => {
      const active = button.dataset.portalTab === state.tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    $$('.portal-panel').forEach((panel) => { panel.hidden = panel.id !== `panel-${state.tab}`; });
    if (state.tab === 'showcase' && !state.showcaseLoaded) loadShowcase().catch((error) => toast(error.message, true));
  }

  async function openPortal(user, csrf) {
    state.user = user;
    state.csrf = csrf;
    $('#auth-view').hidden = true;
    $('#portal-view').hidden = false;
    $('#account-email').textContent = user.email;
    $('#account-email').title = user.email;
    $('#account-role').textContent = user.accountType === 'exhibitor' ? t('exhibitorAccount') : t('visitorAccount');
    fillProfile(user.profile || {});
    setAccountType(user.accountType);
    $('#request-form').reset();
    $('#profile-feedback').textContent = '';
    setTab(user.accountType === 'exhibitor' ? 'showcase' : 'requests');
    try { await loadRequests(); } catch { toast(t('requestsLoadToast'), true); }
  }

  /* ======================= COMPANY PAGE (exhibitors) ======================= */
  const showcaseFields = ['name', 'tagline', 'about', 'category', 'country', 'city', 'website', 'phone', 'email'];

  function emptyShowcase() {
    return { name: state.user?.profile?.company || '', tagline: '', about: '', category: state.user?.profile?.industry || '', country: state.user?.profile?.country || '', city: '', website: state.user?.profile?.website || '', phone: '', email: '', socials: {}, participation: [], logoFileId: '' };
  }

  async function loadShowcase() {
    const data = await api(`${apiRoot}/showcase`);
    state.showcase = data.showcase;
    state.files = data.showcase.files || [];
    state.showcaseLoaded = true;
    renderShowcase();
  }

  function draft() {
    return { ...emptyShowcase(), ...(state.showcase?.draft || {}) };
  }

  /** read the form into the draft shape the API expects */
  function collectShowcase() {
    const value = { socials: {}, participation: [] };
    for (const field of showcaseFields) value[field] = $(`#sc-${field}`).value.trim();
    $$('[data-social]').forEach((input) => { if (input.value.trim()) value.socials[input.dataset.social] = input.value.trim(); });
    $$('.edition-chip[aria-pressed="true"]').forEach((chip) => {
      const stand = $(`[data-stand="${chip.dataset.edition}"]`);
      value.participation.push({ event: chip.dataset.show, year: Number(chip.dataset.year), stand: stand ? stand.value.trim() : '' });
    });
    return value;
  }

  function renderShowcase({ keepForm = false } = {}) {
    const current = keepForm ? { ...draft(), ...collectShowcase() } : draft();
    if (!keepForm) for (const field of showcaseFields) $(`#sc-${field}`).value = current[field] || '';
    renderSocials(current.socials || {});
    renderParticipation(current.participation || []);
    renderLogo();
    renderMaterials();
    renderStatus();
    updateCounters();
    updateCompleteness();
  }

  function renderSocials(values) {
    $('#socials-grid').innerHTML = state.options.socials.map((network) => `<div class="field social-field" data-field="social.${network}">
      <label for="sc-social-${network}"><span class="social-badge social-${network}" aria-hidden="true">${escapeHtml(socialLabels[network].slice(0, 2))}</span>${escapeHtml(socialLabels[network] || network)}</label>
      <input id="sc-social-${network}" data-social="${network}" maxlength="200" value="${escapeHtml(values[network] || '')}" placeholder="${escapeHtml(t('socialPlaceholder'))}" autocomplete="off" />
      <p class="field-error" hidden></p></div>`).join('');
  }

  function renderParticipation(selected) {
    const picked = new Map(selected.map((item) => [`${item.event}:${item.year}`, item]));
    const shows = state.options.shows || [];
    if (!shows.length) {
      $('#participation-picker').innerHTML = `<p class="muted">${escapeHtml(t('loading'))}</p>`;
      return;
    }
    $('#participation-picker').innerHTML = shows.map((show) => {
      const editions = show.editions.map((edition) => {
        const key = `${show.slug}:${edition.year}`;
        const on = picked.has(key);
        return `<button type="button" class="edition-chip${edition.upcoming ? ' is-upcoming' : ''}" data-show="${escapeHtml(show.slug)}" data-year="${edition.year}" data-edition="${escapeHtml(key)}" aria-pressed="${on}">${edition.year}${edition.upcoming ? ` <small>${escapeHtml(t('upcomingShort'))}</small>` : ''}</button>`;
      }).join('');
      const stands = show.editions.filter((edition) => picked.has(`${show.slug}:${edition.year}`)).map((edition) => {
        const key = `${show.slug}:${edition.year}`;
        return `<label class="stand-field"><span>${edition.year} · ${escapeHtml(t('standLabel'))}</span><input data-stand="${escapeHtml(key)}" maxlength="20" value="${escapeHtml(picked.get(key)?.stand || '')}" placeholder="A-12" /></label>`;
      }).join('');
      return `<div class="show-row"><strong class="show-name">${escapeHtml(show.name)}</strong><div class="edition-chips">${editions}</div>${stands ? `<div class="stand-fields">${stands}</div>` : ''}</div>`;
    }).join('');
  }

  function logoFile() {
    const id = state.showcase?.draft?.logoFileId;
    return state.files.find((file) => file.id === id && file.kind === 'logo') || null;
  }

  function renderLogo() {
    const file = logoFile();
    const image = $('#logo-preview');
    image.hidden = !file;
    $('#logo-placeholder').hidden = Boolean(file);
    $('#logo-remove').hidden = !file;
    $('#logo-frame').classList.toggle('has-logo', Boolean(file));
    if (file && image.getAttribute('src') !== file.url) image.src = file.url;
    if (!file) image.removeAttribute('src');
    $('#logo-upload-label span').textContent = t(file ? 'logoReplace' : 'logoUpload');
  }

  function materialFiles() {
    return state.files.filter((file) => file.kind !== 'logo');
  }

  function renderMaterials() {
    const files = materialFiles();
    $('#materials-count').textContent = `${state.files.length}/${state.options.limits.filesPerAccount || LIMITS.filesPerAccount}`;
    const kinds = state.options.fileKinds.filter((kind) => kind !== 'logo');
    const rows = files.map((file) => {
      const pdf = file.mime === 'application/pdf';
      return `<li class="material" data-file="${escapeHtml(file.id)}">
        <span class="material-thumb ${pdf ? 'is-pdf' : ''}">${pdf ? 'PDF' : `<img src="${escapeHtml(file.url)}" alt="" loading="lazy" />`}</span>
        <div class="material-body">
          <input class="material-title" data-title="${escapeHtml(file.id)}" value="${escapeHtml(file.title)}" maxlength="120" aria-label="${escapeHtml(t('materialTitleAria'))}" />
          <div class="material-meta">
            <select data-kind="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('materialKindAria'))}">${kinds.map((kind) => `<option value="${kind}"${kind === file.kind ? ' selected' : ''}>${escapeHtml(t(fileKindKeys[kind] || 'kindOther'))}</option>`).join('')}</select>
            <span>${escapeHtml(fileSize(file.size))}</span>
            ${file.published ? `<span class="tag tag-live">${escapeHtml(t('materialLive'))}</span>` : `<span class="tag">${escapeHtml(t('materialNew'))}</span>`}
          </div>
        </div>
        <div class="material-actions">
          <a class="icon-link" href="${escapeHtml(file.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(t('materialOpen'))}" title="${escapeHtml(t('materialOpen'))}">↗</a>
          <button type="button" class="icon-link danger" data-delete="${escapeHtml(file.id)}" aria-label="${escapeHtml(t('materialDelete'))}" title="${escapeHtml(t('materialDelete'))}">✕</button>
        </div>
      </li>`;
    });
    const pending = state.uploads.map((upload) => `<li class="material is-uploading"><span class="material-thumb">…</span><div class="material-body"><strong class="truncate">${escapeHtml(upload.name)}</strong><div class="material-meta"><span>${escapeHtml(t('uploading'))} · ${escapeHtml(fileSize(upload.size))}</span></div></div></li>`);
    $('#materials-list').innerHTML = rows.concat(pending).join('') || `<li class="materials-empty">${escapeHtml(t('materialsEmpty'))}</li>`;
  }

  function renderStatus() {
    const showcase = state.showcase || { status: 'draft' };
    const status = showcase.status || 'draft';
    const chip = $('#showcase-status');
    chip.className = `status-chip sc-${status}`;
    chip.textContent = t(showcaseStatusKeys[status] || 'scStatusDraft');
    let copy = t(showcaseStatusCopyKeys[status] || 'scStatusDraftCopy');
    if (showcase.live && showcase.hasChanges) copy = `${copy} ${t('scHasChanges')}`;
    $('#showcase-status-copy').textContent = copy;
    const note = $('#showcase-note');
    note.hidden = !(status === 'rejected' && showcase.reviewNote);
    note.textContent = showcase.reviewNote ? `${t('scReviewNote')}: ${showcase.reviewNote}` : '';
    $('#showcase-live-link').hidden = !showcase.live;
    $('#showcase-submit span').textContent = t(showcase.live ? 'scSubmitChanges' : 'scSubmit');
  }

  function completenessItems(value = collectShowcase()) {
    return [
      ['scCheckLogo', Boolean(logoFile())],
      ['scCheckName', Boolean(value.name)],
      ['scCheckAbout', Boolean(value.about && value.about.length >= 40)],
      ['scCheckContacts', Boolean(value.website || value.phone || value.email)],
      ['scCheckSocials', Object.keys(value.socials).length > 0],
      ['scCheckParticipation', value.participation.length > 0],
      ['scCheckMaterials', materialFiles().length > 0],
    ];
  }

  function updateCompleteness() {
    const items = completenessItems();
    const done = items.filter(([, ok]) => ok).length;
    const percent = Math.round((done / items.length) * 100);
    $('#completeness-value').textContent = `${percent}%`;
    $('#completeness-bar').style.width = `${percent}%`;
    $('#completeness-list').innerHTML = items.map(([key, ok]) => `<li class="${ok ? 'is-done' : ''}"><span aria-hidden="true">${ok ? '✓' : ''}</span>${escapeHtml(t(key))}</li>`).join('');
  }

  function updateCounters() {
    $$('[data-counter-for]').forEach((counter) => {
      const input = $(`#${counter.dataset.counterFor}`);
      counter.textContent = `${input.value.length}/${input.maxLength}`;
    });
  }

  function clearFieldErrors() {
    $$('#showcase-form .field-error').forEach((node) => { node.hidden = true; node.textContent = ''; });
    $$('#showcase-form .has-error').forEach((node) => node.classList.remove('has-error'));
  }

  function showFieldErrors(details = {}) {
    const codes = { url: 'errUrl', email: 'errEmail', phone: 'errPhone', edition: 'errEdition', required: 'errRequired' };
    let first = null;
    for (const [key, code] of Object.entries(details)) {
      const fieldKey = key.startsWith('participation') ? 'participation' : key;
      const field = $(`#showcase-form [data-field="${fieldKey}"]`);
      if (!field) continue;
      field.classList.add('has-error');
      const message = $('.field-error', field);
      if (message) { message.textContent = t(codes[code] || 'errRequired'); message.hidden = false; }
      first ||= field;
    }
    first?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    $('input,textarea', first || document.createElement('div'))?.focus?.({ preventScroll: true });
  }

  async function saveShowcase(submit) {
    const feedback = $('#showcase-feedback');
    const buttons = [$('#showcase-save'), $('#showcase-submit')];
    clearFieldErrors();
    feedback.classList.remove('error');
    feedback.textContent = t('profileSaving');
    buttons.forEach((button) => { button.disabled = true; });
    try {
      const result = await api(`${apiRoot}/showcase`, { method: 'PUT', body: { showcase: collectShowcase(), submit } });
      state.showcase = result.showcase;
      state.files = result.showcase.files || state.files;
      renderShowcase();
      feedback.textContent = t(submit ? 'scSubmitted' : 'scSaved');
      toast(t(submit ? 'scSubmitted' : 'scSaved'));
    } catch (error) {
      feedback.textContent = error.message;
      feedback.classList.add('error');
      if (error.details) showFieldErrors(error.details);
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  /** client-side checks mirror the server's (it re-checks the bytes) */
  function uploadProblem(file, { logo = false } = {}) {
    const image = IMAGE_TYPES.includes(file.type);
    const pdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (logo && !image) return t('logoType');
    if (!image && !pdf) return t('uploadType');
    if (image && file.size > LIMITS.imageBytes) return t('imageTooBig');
    if (file.size > LIMITS.pdfBytes) return t('fileTooBig');
    return '';
  }

  async function uploadFile(file, kind) {
    const params = new URLSearchParams({ kind, name: file.name });
    const result = await api(`${apiRoot}/files?${params}`, { method: 'POST', raw: file, contentType: file.type || 'application/octet-stream' });
    return result.file;
  }

  async function uploadMaterials(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    const limit = state.options.limits.filesPerAccount || LIMITS.filesPerAccount;
    const room = limit - state.files.length;
    if (files.length > room) toast(t('tooManyFiles'), true);
    for (const file of files.slice(0, Math.max(0, room))) {
      const problem = uploadProblem(file);
      if (problem) { toast(`${file.name}: ${problem}`, true); continue; }
      const upload = { name: file.name, size: file.size };
      state.uploads.push(upload);
      renderMaterials();
      try {
        const kind = IMAGE_TYPES.includes(file.type) ? 'image' : 'catalog';
        const stored = await uploadFile(file, kind);
        state.files.push(stored);
      } catch (error) {
        toast(`${file.name}: ${error.message}`, true);
      } finally {
        state.uploads = state.uploads.filter((item) => item !== upload);
        renderMaterials();
        updateCompleteness();
      }
    }
  }

  async function uploadLogo(file) {
    const problem = uploadProblem(file, { logo: true });
    if (problem) { toast(problem, true); return; }
    $('#logo-frame').classList.add('is-busy');
    try {
      const stored = await uploadFile(file, 'logo');
      state.files = state.files.filter((item) => item.kind !== 'logo' || item.published).concat(stored);
      state.showcase = { ...(state.showcase || {}), draft: { ...draft(), ...collectShowcase(), logoFileId: stored.id } };
      renderLogo();
      updateCompleteness();
      toast(t('logoUploaded'));
    } catch (error) {
      toast(error.message, true);
    } finally {
      $('#logo-frame').classList.remove('is-busy');
    }
  }

  async function deleteFile(id) {
    await api(`${apiRoot}/files/${id}`, { method: 'DELETE', body: {} });
    state.files = state.files.filter((file) => file.id !== id);
    if (state.showcase?.draft?.logoFileId === id) state.showcase.draft.logoFileId = '';
  }

  async function patchFile(id, change) {
    const result = await api(`${apiRoot}/files/${id}`, { method: 'PATCH', body: change });
    state.files = state.files.map((file) => (file.id === id ? result.file : file));
  }

  /* ======================= EVENTS ======================= */
  $$('.auth-tab').forEach((tab) => tab.addEventListener('click', () => {
    setAuthMode(tab.dataset.authTab);
    if (tab.dataset.authTab === 'register') setAccountType(selectedRegisterType());
  }));
  $('#auth-tabs').addEventListener('keydown', (event) => {
    const tabs = $$('.auth-tab');
    const current = tabs.indexOf(document.activeElement);
    if (current < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    const tab = tabs[next];
    setAuthMode(tab.dataset.authTab);
    if (tab.dataset.authTab === 'register') setAccountType(selectedRegisterType());
    tab.focus();
  });
  $$('input[name="accountType"]').forEach((input) => input.addEventListener('change', () => setAccountType(selectedRegisterType())));

  $$('.portal-tab').forEach((tab) => tab.addEventListener('click', () => setTab(tab.dataset.portalTab)));
  $('#portal-tabs').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = availableTabs();
    const current = tabs.indexOf(state.tab);
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    setTab(tabs[next], true);
  });

  $('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const error = $('#login-error');
    const button = $('button[type="submit"]', event.currentTarget);
    error.hidden = true;
    button.disabled = true;
    try {
      const form = new FormData(event.currentTarget);
      const result = await api(`${apiRoot}/login`, { method: 'POST', body: { email: form.get('email'), password: form.get('password') } });
      await openPortal(result.user, result.csrfToken);
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
    } finally { button.disabled = false; }
  });

  $('#register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const error = $('#register-error');
    const button = $('button[type="submit"]', formElement);
    error.hidden = true;
    button.disabled = true;
    try {
      const form = Object.fromEntries(new FormData(formElement));
      const result = await api(`${apiRoot}/register`, { method: 'POST', body: form });
      await openPortal(result.user, result.csrfToken);
      const type = selectedRegisterType();
      formElement.reset();
      setRegisterType(type);
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
    } finally { button.disabled = false; }
  });

  $('#profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = $('#profile-feedback');
    feedback.classList.remove('error');
    feedback.textContent = t('profileSaving');
    const form = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await api(`${apiRoot}/profile`, { method: 'PATCH', body: form });
      state.user = result.user;
      fillProfile(result.user.profile);
      setAccountType(result.user.accountType);
      feedback.textContent = t('profileSaved');
      toast(t('profileUpdated'));
    } catch (cause) {
      feedback.textContent = cause.message;
      feedback.classList.add('error');
    }
  });

  $('#request-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const error = $('#request-error');
    const button = $('#request-submit');
    error.hidden = true;
    button.disabled = true;
    try {
      const form = Object.fromEntries(new FormData(formElement));
      form.locale = state.locale;
      await api(`${apiRoot}/requests`, { method: 'POST', body: form });
      formElement.reset();
      toast(t('requestSent'));
      await loadRequests();
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
    } finally { button.disabled = false; }
  });

  /* company page */
  $('#showcase-form').addEventListener('submit', (event) => { event.preventDefault(); saveShowcase(true); });
  $('#showcase-save').addEventListener('click', () => saveShowcase(false));
  $('#showcase-form').addEventListener('input', (event) => {
    if (event.target.matches('[data-title]')) return;
    updateCounters();
    updateCompleteness();
    const field = event.target.closest('.field.has-error');
    if (field) { field.classList.remove('has-error'); const message = $('.field-error', field); if (message) message.hidden = true; }
  });
  $('#participation-picker').addEventListener('click', (event) => {
    const chip = event.target.closest('.edition-chip');
    if (!chip) return;
    chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
    renderParticipation(collectShowcase().participation);
    $(`.edition-chip[data-edition="${chip.dataset.edition}"]`)?.focus();
    $('[data-field="participation"]').classList.remove('has-error');
    $('[data-field="participation"] .field-error').hidden = true;
    updateCompleteness();
  });
  $('#logo-input').addEventListener('change', (event) => {
    const [file] = event.currentTarget.files || [];
    if (file) uploadLogo(file);
    event.currentTarget.value = '';
  });
  $('#logo-remove').addEventListener('click', async () => {
    const file = logoFile();
    if (!file) return;
    try { await deleteFile(file.id); renderLogo(); updateCompleteness(); } catch (error) { toast(error.message, true); }
  });
  $('#materials-input').addEventListener('change', (event) => {
    uploadMaterials(event.currentTarget.files || []);
    event.currentTarget.value = '';
  });
  const drop = $('#materials-drop');
  ['dragenter', 'dragover'].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach((name) => drop.addEventListener(name, (event) => { event.preventDefault(); drop.classList.remove('is-over'); }));
  drop.addEventListener('drop', (event) => uploadMaterials(event.dataTransfer?.files || []));
  $('#materials-list').addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete]');
    if (!button) return;
    const file = state.files.find((item) => item.id === button.dataset.delete);
    if (!file || !window.confirm(format('materialDeleteConfirm', { name: file.title }))) return;
    try { await deleteFile(file.id); renderMaterials(); updateCompleteness(); } catch (error) { toast(error.message, true); }
  });
  $('#materials-list').addEventListener('change', async (event) => {
    const title = event.target.closest('[data-title]');
    const kind = event.target.closest('[data-kind]');
    try {
      if (title) {
        const value = title.value.trim();
        if (!value) { title.value = state.files.find((file) => file.id === title.dataset.title)?.title || ''; return; }
        await patchFile(title.dataset.title, { title: value });
        toast(t('materialSaved'));
      }
      if (kind) { await patchFile(kind.dataset.kind, { kind: kind.value }); toast(t('materialSaved')); }
    } catch (error) { toast(error.message, true); }
  });

  $('#refresh-requests').addEventListener('click', () => loadRequests().catch((error) => toast(error.message, true)));
  $('#logout-button').addEventListener('click', async () => {
    try { await api(`${apiRoot}/logout`, { method: 'POST', body: {} }); } catch { /* expired session */ }
    showAuth('login');
    toast(t('logoutToast'));
  });

  $$('.locale-select').forEach((select) => select.addEventListener('change', () => setLocale(select.value)));

  async function initialize() {
    const params = new URLSearchParams(location.search);
    const requestedLocale = params.get('lang') || String(document.documentElement.lang || 'uz').toLowerCase().split('-')[0];
    const preferredType = params.get('type');
    if (['visitor', 'exhibitor'].includes(preferredType)) setRegisterType(preferredType);
    setLocale(requestedLocale);
    try {
      const options = await api(`${apiRoot}/options`);
      populateEvents(options.events);
      if (Array.isArray(options.shows)) state.options.shows = options.shows;
      if (Array.isArray(options.fileKinds)) state.options.fileKinds = options.fileKinds;
      if (Array.isArray(options.socials)) state.options.socials = options.socials;
      if (options.limits) state.options.limits = options.limits;
    } catch {
      $('#request-event').innerHTML = `<option value="">${escapeHtml(t('eventLoadError'))}</option>`;
    }
    try {
      const session = await api(`${apiRoot}/me`);
      await openPortal(session.user, session.csrfToken);
    } catch {
      showAuth('login');
      if (preferredType) setAuthMode('register');
    }
  }

  initialize();
})();
