(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const i18n = window.SOFEXPO_PORTAL_I18N;
  const supportedLocales = Object.keys(i18n.locales);
  const state = { csrf: '', user: null, events: [], toastTimer: 0, locale: 'uz', authMode: 'login' };
  const apiRoot = '/api/portal';
  const statusKeys = { new: 'statusNew', contacted: 'statusContacted', qualified: 'statusQualified', won: 'statusWon', lost: 'statusLost', spam: 'statusLost' };

  function t(key) {
    return i18n.locales[state.locale]?.[key] ?? i18n.locales.uz[key] ?? key;
  }

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
      link.href = `https://sofexpo.org/${state.locale}/${page}`;
    });
    setAuthMode(state.authMode);
    if (state.events.length) populateEvents(state.events);
    if (state.user) {
      $('#account-role').textContent = state.user.accountType === 'exhibitor' ? t('exhibitorAccount') : t('visitorAccount');
    }
    setAccountType(state.user?.accountType || $('#register-type').value || 'visitor');
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
      'Urinishlar vaqtincha bloklandi. 10 daqiqadan so‘ng qayta urinib ko‘ring.': 'accountLocked',
      'Ro‘yxatdan tadbirni tanlang.': 'eventRequired',
      'Ushbu murojaatni yuborishga rozilik bering.': 'requestConsentRequired',
      'Maydonni 1–10 000 m² oralig‘ida kiriting.': 'areaInvalid',
      'Ishtirok formatini tanlang.': 'packageRequired',
      'Qiziqish yo‘nalishini kiriting.': 'interestRequired',
    };
    return keys[message] ? t(keys[message]) : (status >= 500 ? t('serverError') : t('requestFallbackError'));
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

  function showAuth(mode = 'login') {
    state.user = null;
    state.csrf = '';
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
      const active = tab.dataset.authTab === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
  }

  function toggleFields(selector, visible) {
    const group = $(selector);
    if (!group) return;
    group.hidden = !visible;
    $$('input,select,textarea', group).forEach((field) => { field.disabled = !visible; });
  }

  function setAccountType(type) {
    const exhibitor = type === 'exhibitor';
    toggleFields('[data-role-fields="exhibitor"]', exhibitor);
    toggleFields('[data-role-fields="visitor"]', !exhibitor);
    $('#register-company').required = exhibitor;
    $('#register-industry').required = exhibitor;
    toggleFields('.exhibitor-profile-fields', exhibitor);
    toggleFields('.visitor-profile-fields', !exhibitor);
    toggleFields('.exhibitor-request-fields', exhibitor);
    toggleFields('.visitor-request-fields', !exhibitor);
    $('#request-area').required = exhibitor;
    $('#request-package').required = exhibitor;
    $('#request-interest').required = !exhibitor;
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
    const data = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) {
      if (response.status === 401 && path !== `${apiRoot}/login` && path !== `${apiRoot}/register`) showAuth('login');
      throw new Error(localizedServerError(data?.error, response.status));
    }
    return data;
  }

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

  function dateLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('dateUnknown');
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
    const interest = interestKeys[details.interest] ? t(interestKeys[details.interest]) : details.interest;
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
      return `<article class="request-item"><div><h3>${escapeHtml(localizedEventName(item.event))}</h3><p>${escapeHtml(dateLabel(item.createdAt))} · ${escapeHtml(requestType)}</p>${detail ? `<p class="request-detail">${escapeHtml(detail)}</p>` : ''}</div><span class="request-status status-${escapeHtml(status)}">${escapeHtml(t(statusKeys[status]) || status)}</span></article>`;
    }).join('');
  }

  function fillProfile(profile) {
    $('#profile-name').value = profile.name || '';
    $('#profile-phone').value = profile.phone || '';
    $('#profile-country').value = profile.country || '';
    $('#profile-company').value = profile.company || '';
    $('#profile-industry').value = profile.industry || '';
    $('#profile-website').value = profile.website || '';
    $('#profile-interests').value = profile.interests || '';
  }

  async function openPortal(user, csrf) {
    state.user = user;
    state.csrf = csrf;
    $('#auth-view').hidden = true;
    $('#portal-view').hidden = false;
    $('#account-email').textContent = user.email;
    $('#account-role').textContent = user.accountType === 'exhibitor' ? t('exhibitorAccount') : t('visitorAccount');
    fillProfile(user.profile || {});
    setAccountType(user.accountType);
    $('#request-form').reset();
    $('#profile-feedback').textContent = '';
    try { await loadRequests(); } catch { toast(t('requestsLoadToast'), true); }
  }

  function eventLocale() {
    return state.locale;
  }

  $$('.auth-tab').forEach((tab) => tab.addEventListener('click', () => {
    setAuthMode(tab.dataset.authTab);
    if (tab.dataset.authTab === 'register') setAccountType($('#register-type').value);
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
    if (tab.dataset.authTab === 'register') setAccountType($('#register-type').value);
    tab.focus();
  });
  $('#register-type').addEventListener('change', (event) => setAccountType(event.currentTarget.value));

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
      formElement.reset();
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
      form.locale = eventLocale();
      const result = await api(`${apiRoot}/requests`, { method: 'POST', body: form });
      formElement.reset();
      toast(t('requestSent'));
      await loadRequests();
    } catch (cause) {
      error.textContent = cause.message;
      error.hidden = false;
    } finally { button.disabled = false; }
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
    setLocale(requestedLocale);
    const preferredType = params.get('type');
    if (['visitor', 'exhibitor'].includes(preferredType)) $('#register-type').value = preferredType;
    setAccountType($('#register-type').value);
    try {
      const options = await api(`${apiRoot}/options`);
      populateEvents(options.events);
    } catch (error) {
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
