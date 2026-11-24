'use strict';
/*
 * Proposal shell. Renders everything from window.KP (this client) and window.STUDIO (WhiteCode),
 * drives the demo iframe, picks related cases and builds the WhatsApp request.
 */
(() => {
  const D = window.KP;
  const ST = window.STUDIO;
  const S = D.sections;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NF = new Intl.NumberFormat('ru-RU');
  const money = (n) => NF.format(Math.round(n)) + ' ₸';
  const PR = new Intl.PluralRules('ru');
  const plural = (n, one, few, many) => { const k = PR.select(n); return k === 'one' ? one : k === 'few' ? few : many; };
  const dateRu = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }).replace(' ', ' ');
  const dateRuY = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s?г\.$/, '');
  const pad2 = (n) => String(n).padStart(2, '0');
  const MOBILE = window.matchMedia('(max-width: 960px)');
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const smooth = () => (REDUCED.matches ? 'auto' : 'smooth');
  const DEMO_MIN_WIDTH = 1000; // the demo renders at least this wide inside the laptop and is scaled down
  const M = ST.manager;

  const ICONS = {
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    bag: '<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
    truck: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13"/><path d="M12 8c-2 0-4-1-4-3s3-2 4 3zm0 0c2 0 4-1 4-3s-3-2-4 3z"/>',
    chef: '<path d="M7 14a4 4 0 0 1-.6-7.9 5.5 5.5 0 0 1 11.2 0A4 4 0 0 1 17 14"/><path d="M7 14h10v6H7z"/>',
    chart: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    open: '<path d="M7 17 17 7M9 7h8v8"/>',
    down: '<path d="M12 5v14m-6-6 6 6 6-6"/>',
  };
  const icon = (name, cls = 'ico') => (ICONS[name] ? `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>` : '');

  /* ---------- analytics stub: wire dataLayer to GA / amoCRM / Telegram later ---------- */
  window.dataLayer = window.dataLayer || [];
  const once = new Set();
  function track(event, data = {}, onlyOnce = false) {
    if (onlyOnce && once.has(event)) return;
    once.add(event);
    window.dataLayer.push({ event, kp: D.client.slug, ...data });
  }

  /* ---------- client accent ---------- */
  document.documentElement.style.setProperty('--client', D.client.accent);
  document.documentElement.style.setProperty('--client-dark', D.client.accentDark || D.client.accent);

  /* ---------- derived numbers ---------- */
  const stages = S.stages.items;
  const weeksTotal = stages.reduce((s, x) => s + x.weeks, 0);
  const weeksWord = (n) => plural(n, 'неделя', 'недели', 'недель');
  const total = S.pricing.total;
  const payments = stages.filter((s) => s.pay);
  const fill = (t) => t.replace('{weeks}', `${weeksTotal} ${weeksWord(weeksTotal)}`).replace('{price}', money(total));
  const scenarios = S.demo.scenarios;

  /* ---------- hero ---------- */
  $('#brandClient').textContent = D.client.name;
  // words rise one by one; the client name keeps its colour; hyphenated words never break
  let wi = 0;
  $('#heroTitle').innerHTML = D.hero.title.split(D.client.name).map((part, k, arr) => {
    // inline-block keeps "Интернет-магазин" whole; on narrow phones .hy lets it wrap at the hyphen
    const words = part.trim().split(/\s+/).filter(Boolean).map((w) => `<span class="w${w.includes('-') ? ' hy' : ''}"><span style="--i:${wi++}">${esc(w)}</span></span>`).join(' ');
    const name = k < arr.length - 1 ? ` <em class="w"><span style="--i:${wi++}">${esc(D.client.name)}</span></em> ` : '';
    return words + name;
  }).join('').trim();
  $('#heroLead').textContent = D.hero.lead;
  // cta.gallery: the label stays, an arrow travels on hover
  $('[data-demo-start]').innerHTML = `<span>${esc(D.hero.cta || 'Пройти демо')}</span><svg class="arr" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>`;

  const counter = (value, fmt) => `<span class="cnt" data-to="${value}" data-fmt="${fmt}"><span class="sr">${fmtCount(value, fmt)}</span><span class="cnt-final" aria-hidden="true">${fmtCount(value, fmt)}</span><span class="cnt-live" aria-hidden="true">${fmtCount(value, fmt)}</span></span>`;
  function fmtCount(v, fmt) {
    if (fmt === 'money') return money(v);
    if (fmt === 'weeks') return `${v} ${weeksWord(v)}`;
    if (fmt === 'modules') return `${v} ${plural(v, 'модуль', 'модуля', 'модулей')}`;
    return NF.format(v);
  }
  // price and timing read as one sentence, not as a stats row
  $('#heroTerms').innerHTML = `${counter(total, 'money')} за ${weeksTotal} ${weeksWord(weeksTotal)}. Цена до ${dateRu(D.validUntil)}.`;

  // hero object: a real product photo from the client's materials
  $('#heroArt').innerHTML = '<img src="assets/photos/hero-strawberry.webp" alt="Торт «Клубничное облако» Tika Cake" width="1400" height="934" fetchpriority="high" decoding="async">';

  if (Date.now() > new Date(D.validUntil + 'T23:59:59').getTime()) {
    const ex = $('#expired');
    ex.hidden = false;
    ex.textContent = `Срок предложения истёк ${dateRu(D.validUntil)}. Напишите ${M.nameDat || M.name}, обновим цены и сроки.`;
  }

  /* ---------- proposal sections (left column) ---------- */
  const demoLink = (route, label = 'Показать в демо') => `<button type="button" class="demo-link" data-route="${esc(route)}">${esc(label)}</button>`;
  const CHECK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  let rvi = 0; // stagger index inside a section
  const rv = () => `rv" style="--i:${rvi++}`;

  const blocks = {
    demo: (s) => `
      <p class="tour ${rv()}" id="tourText" aria-live="polite"></p>
      <ol class="scn">${s.scenarios.map((x, i) => `
        <li class="${rv()}"><button type="button" data-route="${esc(x.route)}" data-scenario="${i}">
          <span class="scn-n"><span class="n">${i + 1}</span>${CHECK}</span><b>${esc(x.title)}</b>${x.text ? `<small>${esc(x.text)}</small>` : ''}
        </button></li>`).join('')}
      </ol>
      <p class="note ${rv()}">${esc(s.note)}</p>`,

    scope: (s) => `
      <ul class="mods">${s.modules.map((m) => `
        <li class="mod ${rv()}">
          <h3>${esc(m.title)}</h3>
          <p class="mod-text">${esc(m.text)}</p>
          <button type="button" class="demo-link" data-route="${esc(m.route)}" aria-label="Показать в демо: ${esc(m.title)}"><span class="dl-l">Показать в демо</span>${icon('open', 'ico dl-i')}</button>
        </li>`).join('')}
      </ul>
      <p class="ints ${rv()}">Подключим ${s.integrations.map((i) => `<b>${esc(i.name || i)}</b>`).join(', ')}.</p>`,

    stages: (s) => {
      let start = 0;
      const rows = s.items.map((x, i) => {
        const left = (start / weeksTotal) * 100;
        const width = (x.weeks / weeksTotal) * 100;
        const from = start + 1;
        start += x.weeks;
        return `<li class="g-row" style="--d:${i}"><span class="g-name">${esc(x.name)}</span><div class="g-track"><i class="g-bar" style="left:${left}%;width:${width}%;--d:${i}"></i><em class="g-w" style="left:calc(${left + width}% + 8px)"><span class="sr">${from === start ? 'неделя' : 'недели'} </span>${from === start ? from : `${from}-${start}`}</em></div></li>`;
      }).join('');
      return `
      <ol class="gantt ${rv()}">${rows}</ol><p class="g-axis ${rv()}" aria-hidden="true">недели</p>`;
    },

    pricing: (s) => `
      <p class="price-big ${rv()}">${counter(total, 'money')}</p>
      <ol class="pays ${rv()}">${payments.map((p) => `<li><span class="pay-amt">${counter((total * p.pay) / 100, 'money')}</span><span class="pay-when">${p.pay}% ${esc(p.payWhen)}</span></li>`).join('')}</ol>
      <ul class="incl ${rv()}">${s.includes.map((x) => `<li>${CHECK}<span>${esc(x)}</span></li>`).join('')}</ul>
      ${s.extras ? `<p class="fine ${rv()}">Отдельно: ${esc(s.extras)}.</p>` : ''}`,

    open: (s) => `
      <ul class="oq">${s.items.map((i) => `<li class="${rv()}">${esc(i.what || i)}</li>`).join('')}</ul>`,

    faq: (s) => `
      <div class="faq">${s.items.map((i) => `<details class="faq-i ${rv()}"><summary>${esc(i.q)}</summary><p>${esc(i.a)}</p></details>`).join('')}</div>`,
  };

  const order = ['demo', 'scope', 'stages', 'pricing', 'open', 'faq'];
  const secs = order.filter((k) => S[k]).map((k, i) => ({ key: k, id: `s-${k}`, num: pad2(i + 1), ...S[k] }));

  $('#kpContent').innerHTML = secs.map((s) => {
    rvi = 0;
    const head = `<h2 class="sec-h ${rv()}" id="${s.id}-h">${esc(fill(s.title))}</h2>`;
    const lead = s.lead ? `<p class="sec-lead ${rv()}">${esc(s.lead)}</p>` : '';
    return `<section class="sec sec-${s.key}" id="${s.id}" aria-labelledby="${s.id}-h">${head}${lead}${blocks[s.key](s)}</section>`;
  }).join('') + `
    <div class="kp-next rv">
      <div class="kp-next-btns">
        <button type="button" class="btn btn-accent btn-sm" data-nav="request">Оставить заявку</button>
      </div>
    </div>`;

  if (!MOBILE.matches) $$('.faq-i').forEach((d) => { d.open = true; });

  const navItems = [['s-demo', 'Демо'], ['s-scope', 'Состав'], ['s-stages', 'Этапы'], ['s-pricing', 'Стоимость']];
  $('#topnav').innerHTML = navItems.map(([id, l]) => `<a href="#${id}" data-nav="${id}">${l}</a>`).join('');

  /* ---------- our work: one line and a link to the site ----------
     Similar projects are not listed: the manager names them on the call when
     they really match, and a loose match reads as a misunderstood brief. */
  const studioLine = $('#studioLine');
  if (studioLine && ST.facts && ST.facts[0]) studioLine.textContent = `${ST.facts[0].value} ${ST.facts[0].label}`;
  const casesAll = $('#casesAll');
  if (casesAll) {
    casesAll.href = ST.casesUrl || ST.site;
    casesAll.addEventListener('click', () => track('cases_site'));
  }

  /* ---------- final request → WhatsApp ---------- */
  // [words] in the title get the white brand marker
  $('#finalTitle').innerHTML = esc(D.final.title).replace(/\[([^\]]+)\]/, '<em>$1</em>');
  $('#finalText').textContent = D.final.text;
  $('#finalSteps').innerHTML = (D.final.steps || []).map((s, i) => `<li class="rv" style="--i:${i}"><span>${i + 1}</span>${esc(s)}</li>`).join('');
  $('#mgrAva').textContent = M.name.slice(0, 1);
  $('#mgrName').textContent = M.name;
  $('#mgrRole').textContent = M.role;
  $('#mgrPhone').textContent = M.whatsappLabel;
  $('#mgrPhone').href = `tel:+${M.whatsapp}`;
  $('#mgrTg').textContent = 'Telegram';
  $('#mgrTg').href = M.telegram;

  // [key, chip label, form used after "Хотим обсудить:"]
  const TOPICS = [
    ['terms', 'Сроки', 'сроки'],
    ['price', 'Оплата', 'оплату'],
    ['demo', 'Демо на созвоне', 'демо на созвоне'],
  ];
  $('#topicList').innerHTML = TOPICS.map(([k, l], i) => `<label class="topic"><input type="checkbox" name="topic" value="${k}" ${i < 2 ? 'checked' : ''}><span>${esc(l)}</span></label>`).join('');

  const pageUrl = () => location.href.split('#')[0];
  function waMessage() {
    const f = $('#reqForm');
    const name = f.elements.name.value.trim();
    const topics = $$('input[name="topic"]:checked', f).map((i) => TOPICS.find((t) => t[0] === i.value)[2]);
    const seen = scenarios.filter((_, i) => visited.has(i)).map((x) => x.title.toLowerCase());
    const lines = [
      `Здравствуйте, ${M.name}!${name ? ` Меня зовут ${name}.` : ''}`,
      `Смотрели КП ${ST.name} для ${D.client.name}: ${money(total)}, ${weeksTotal} ${weeksWord(weeksTotal)}.`,
      seen.length ? `В демо открыли: ${seen.join(', ')}.` : '',
      topics.length ? `Хотим обсудить: ${topics.join(', ')}.` : 'Хотим обсудить запуск.',
      pageUrl(),
    ];
    return lines.filter(Boolean).join('\n');
  }
  function renderPreview() { $('#waPreview').textContent = waMessage(); }
  const waBox = $('#waBox');
  if (waBox) waBox.open = !MOBILE.matches;
  $('#reqForm').addEventListener('input', renderPreview);
  $('#reqForm').addEventListener('change', renderPreview);
  $('#reqForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = waMessage();
    const url = `https://wa.me/${M.whatsapp}?text=${encodeURIComponent(text)}`;
    track('lead_whatsapp', { topics: $$('input[name="topic"]:checked').map((i) => i.value).join(','), scenarios: visited.size });
    const win = window.open(url, '_blank', 'noopener');
    if (!win) location.href = url;
    const btn = e.submitter || $('#reqForm button[type="submit"]');
    btn.classList.add('sent');
    toast(`Не открылся WhatsApp? Номер ${M.whatsappLabel}`);
  });
  $('#copyPhone').addEventListener('click', () => copy(`+${M.whatsapp}`, 'Номер скопирован'));

  $('#foot').innerHTML = `
    <span><img class="wm" src="assets/brand/wordmark-white.png" alt="WhiteCode" width="102" height="16"></span>
    <span>${esc(ST.address)}</span>
    <span><a href="${esc(ST.site)}" target="_blank" rel="noopener">${esc(ST.siteLabel)}</a></span>
    <span>Предложение от ${dateRuY(D.issued)}</span>`;

  /* ---------- laptop keyboard (decorative) ---------- */
  $('#keys').innerHTML = [
    '<i></i>'.repeat(14),
    '<i class="w15"></i>' + '<i></i>'.repeat(12) + '<i class="w15"></i>',
    '<i class="w2"></i>' + '<i></i>'.repeat(11) + '<i class="w2"></i>',
    '<i class="w2"></i>' + '<i></i>'.repeat(10) + '<i class="w2"></i><i></i>',
    '<i></i><i></i><i></i><i class="w15"></i><i class="w6"></i><i class="w15"></i><i></i><i></i><i></i>',
  ].map((r) => `<div class="r">${r}</div>`).join('');

  /* ---------- demo frame ---------- */
  const stage = $('#stage');
  const laptop = $('#laptop');
  const vp = $('#vp');
  const frame = $('#demo');
  const addr = $('#addr');
  const topbar = $('#topbar');
  const workspace = $('#workspace');
  let demoReady = false;

  frame.src = `${D.demo.src}#/`;

  function setAddr(path) {
    let p = path === '/' ? '' : path;
    try { p = decodeURIComponent(p); } catch { /* keep raw */ }
    addr.innerHTML = `<b>${esc(D.demo.domain)}</b>${esc(p)}`;
  }
  setAddr('/');

  function fitLaptop() {
    if (stage.classList.contains('is-overlay') || MOBILE.matches) { laptop.style.removeProperty('--lw'); return; }
    const extra = $('#stageHint').offsetHeight + $('#nowDemo').offsetHeight + 24;
    const RATIO = 0.72; // laptop height / width: lid (.64) + aluminium base (.03) + shadow room
    const w = Math.floor(Math.min(stage.clientWidth, (stage.clientHeight - extra) / RATIO));
    laptop.style.setProperty('--lw', `${Math.max(w, 320)}px`);
  }
  function fitFrame() {
    const w = vp.clientWidth;
    const h = vp.clientHeight;
    if (!w || !h) return;
    const overlay = stage.classList.contains('is-overlay');
    const logical = overlay ? w : Math.max(w, DEMO_MIN_WIDTH);
    const s = w / logical;
    frame.style.width = `${logical}px`;
    frame.style.height = `${Math.ceil(h / s)}px`;
    frame.style.transform = s === 1 ? '' : `scale(${s})`;
  }
  function fitAll() { fitLaptop(); fitFrame(); }
  new ResizeObserver(fitAll).observe(stage);
  new ResizeObserver(fitFrame).observe(vp);
  window.addEventListener('resize', fitAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);

  const send = (msg) => { if (frame.contentWindow) frame.contentWindow.postMessage({ source: 'kp', ...msg }, '*'); };

  function flash() {
    const f = $('#vpFlash');
    f.classList.remove('on');
    void f.offsetWidth;
    f.classList.add('on');
  }

  function pinWorkspace() {
    const top = workspace.getBoundingClientRect().top - topbar.offsetHeight;
    if (Math.abs(top) > 4) window.scrollTo({ top: window.scrollY + top, behavior: smooth() });
  }

  let lastFocus = null;
  function openOverlay() {
    if (stage.classList.contains('is-overlay')) return;
    lastFocus = document.activeElement;
    stage.classList.add('is-overlay');
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-modal', 'true');
    stage.setAttribute('aria-label', 'Демо');
    document.documentElement.style.overflow = 'hidden';
    fitAll();
    requestAnimationFrame(fitAll);
    $('.bb-close').focus();
    track('demo_fullscreen');
  }
  function closeOverlay() {
    if (!stage.classList.contains('is-overlay')) return;
    stage.classList.remove('is-overlay');
    stage.removeAttribute('role');
    stage.removeAttribute('aria-modal');
    stage.removeAttribute('aria-label');
    document.documentElement.style.overflow = '';
    fitAll();
    requestAnimationFrame(fitAll);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function demoGo(route, from) {
    track('demo_nav', { route, from });
    track('demo_open', {}, true);
    if (MOBILE.matches) openOverlay(); else if (!stage.classList.contains('is-overlay')) pinWorkspace();
    if (demoReady) send({ type: 'navigate', route });
    else frame.src = `${D.demo.src}#${route}`;
    flash();
  }

  /* ---------- guided tour: a scenario is done once its screen was opened ---------- */
  const base = (r) => r.split('?')[0];
  const TOUR_KEY = `kp-tour-${D.client.slug}`;
  let visited = new Set();
  try { visited = new Set(JSON.parse(sessionStorage.getItem(TOUR_KEY) || '[]')); } catch { /* storage blocked */ }
  function renderTour() {
    $$('[data-scenario]').forEach((b) => b.setAttribute('data-done', String(visited.has(Number(b.dataset.scenario)))));
    const n = visited.size;
    const tt = $('#tourText');
    if (tt) tt.textContent = n === scenarios.length ? 'Все сценарии открыты' : `Открыто ${n} из ${scenarios.length}`;
    renderPreview();
  }
  function markScenario(path) {
    const b = base(path);
    $$('[data-scenario]').forEach((btn) => {
      const i = Number(btn.dataset.scenario);
      const hit = base(scenarios[i].route) === b;
      btn.setAttribute('aria-current', String(hit));
      if (hit && !visited.has(i)) {
        visited.add(i);
        track('scenario_done', { i });
        try { sessionStorage.setItem(TOUR_KEY, JSON.stringify([...visited])); } catch { /* ignore */ }
        if (visited.size === scenarios.length) toast('Демо пройдено');
      }
    });
    renderTour();
  }

  const nowName = $('#nowDemoName');
  const nowDemo = $('#nowDemo');
  window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    const m = e.data;
    if (!m || m.source !== 'tika-demo') return;
    if (m.type === 'ready') demoReady = true;
    if (m.type === 'route') {
      demoReady = true;
      setAddr(m.path);
      markScenario(m.path);
      if (m.title && nowName.textContent !== m.title) {
        nowName.textContent = m.title;
        nowDemo.classList.remove('swap');
        void nowDemo.offsetWidth;
        nowDemo.classList.add('swap');
      }
    }
    if (m.type === 'event') track(`demo_${m.name}`, m.data || {});
    if (m.type === 'escape') closeOverlay();
  });
  frame.addEventListener('load', fitFrame);

  /* ---------- toast + copy ---------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'kp-toast';
  toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);
  let toastT;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), 3200);
  }
  async function copy(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); } catch { window.prompt('Скопируйте:', text); }
  }

  /* ---------- clicks ---------- */
  document.addEventListener('click', (e) => {
    const routeBtn = e.target.closest('[data-route]');
    if (routeBtn) { demoGo(routeBtn.dataset.route, routeBtn.hasAttribute('data-scenario') ? 'scenario' : 'module'); return; }

    const d = e.target.closest('[data-demo]');
    if (d) {
      const act = d.dataset.demo;
      if (act === 'back') send({ type: 'history', dir: -1 });
      if (act === 'fwd') send({ type: 'history', dir: 1 });
      if (act === 'reset') {
        send({ type: 'reset' });
        visited.clear();
        try { sessionStorage.removeItem(TOUR_KEY); } catch { /* ignore */ }
        renderTour();
        toast('Демо вернулось в начальное состояние');
      }
      if (act === 'full' || act === 'open') openOverlay();
      if (act === 'close') closeOverlay();
      return;
    }

    if (e.target.closest('[data-demo-start]')) {
      scrollPanelTo('s-demo');
      demoGo(scenarios[0].route, 'hero');
      return;
    }

    const nav = e.target.closest('[data-nav]');
    if (nav) {
      e.preventDefault();
      goTo(nav.dataset.nav);
    }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeOverlay(); });

  function goTo(id) {
    if (id === 'top') { window.scrollTo({ top: 0, behavior: smooth() }); return; }
    if (id.startsWith('s-')) { scrollPanelTo(id); return; }
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - topbar.offsetHeight, behavior: smooth() });
    if (id === 'request') setTimeout(() => $('#reqForm').elements.name.focus({ preventScroll: true }), REDUCED.matches ? 0 : 700);
  }

  /* ---------- proposal column: own scroll, section tracking, arrows, progress ---------- */
  const scroller = $('#kpScroll');
  const secEls = secs.map((s) => document.getElementById(s.id));
  const panelScrolls = () => !MOBILE.matches && scroller.scrollHeight > scroller.clientHeight + 2;

  function scrollPanelTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    if (MOBILE.matches) {
      window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - topbar.offsetHeight - 8, behavior: smooth() });
      return;
    }
    pinWorkspace();
    scroller.scrollTo({ top: el.offsetTop - 4, behavior: smooth() });
  }

  let current = -1;
  function updateCurrent() {
    let idx = 0;
    if (panelScrolls()) {
      const y = scroller.scrollTop + 60;
      secEls.forEach((el, i) => { if (el.offsetTop <= y) idx = i; });
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) idx = secEls.length - 1;
    } else {
      const y = topbar.offsetHeight + 80;
      secEls.forEach((el, i) => { if (el.getBoundingClientRect().top <= y) idx = i; });
    }
    topbar.classList.toggle('scrolled', window.scrollY > 8);

    // top nav: page sections win once the workspace is scrolled past
    const casesTop = $('#cases').getBoundingClientRect().top;
    const activeId = casesTop < window.innerHeight * 0.5 ? 'cases' : secs[idx].id;
    $$('#topnav a').forEach((a) => a.setAttribute('aria-current', String(a.dataset.nav === activeId)));

    if (idx === current) return;
    current = idx;
    const s = secs[idx];
    $('#kpName').textContent = s.nav;
    $('#kpUp').disabled = idx === 0;
    $('#kpDown').disabled = idx === secs.length - 1;
    track(`section_${s.key}`, {}, true);
    if (s.key === 'pricing') track('price_view', {}, true);
  }
  scroller.addEventListener('scroll', updateCurrent, { passive: true });
  window.addEventListener('scroll', updateCurrent, { passive: true });
  $('#kpUp').addEventListener('click', () => { if (current > 0) scrollPanelTo(secs[current - 1].id); });
  $('#kpDown').addEventListener('click', () => { if (current < secs.length - 1) scrollPanelTo(secs[current + 1].id); });
  MOBILE.addEventListener('change', () => { closeOverlay(); fitAll(); updateCurrent(); });

  /* ---------- motion ---------- */
  function countUp(el) {
    const to = Number(el.dataset.to);
    const fmt = el.dataset.fmt;
    const live = $('.cnt-live', el);
    if (REDUCED.matches || !live) return;
    const dur = 1100;
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 4);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const v = to * ease(t);
      live.textContent = fmtCount(fmt === 'money' ? Math.round(v / 1000) * 1000 : Math.round(v), fmt);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const root = document.documentElement;
  if (!REDUCED.matches && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        $$('.cnt', en.target).forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach((el) => io.observe(el));

    // laptop lid opens the first time the stage is in view
    const lidIo = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { laptop.classList.add('open'); lidIo.disconnect(); }
    }, { threshold: 0.15 });
    lidIo.observe(laptop);

    // hero is the one authored moment: words rise, the marker draws, the plate lands with its price counting
    // a timer, not rAF: background tabs skip rAF and the hero would stay hidden
    setTimeout(() => {
      root.classList.add('hero-in');
      setTimeout(() => $$('#heroTerms .cnt').forEach(countUp), 520);
    }, 60);
  } else {
    laptop.classList.add('open');
  }

  /* ---------- text reveals ----------
     headings rise word by word out of a mask, short lines come into focus,
     list rows slide in, case titles wipe in, module tiles settle, numbers count.
     Reduced motion keeps only an opacity cross-fade. */
  function splitWords(el) {
    let n = 0;
    const walk = (node) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 1) { walk(c); return; }
      if (c.nodeType !== 3 || !c.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      c.textContent.split(/([ \n\t]+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) { frag.append(part); return; }
        const w = document.createElement('span');
        w.className = 'sw';
        const inner = document.createElement('span');
        inner.style.setProperty('--w', n++);
        inner.textContent = part;
        w.append(inner);
        frag.append(w);
      });
      node.replaceChild(frag, c);
    });
    walk(el);
  }
  const FX = [
    ['fx-words', '.sec-h, .cases-h, #finalTitle'],
    ['fx-focus', '.ints, .note, .fine, .incl li, .tour, .cases-why, .studio-line, .final-text, .case-shared, .g-axis, .works-txt, .works-btn'],
    ['fx-slide', '.scn li, .oq li, .faq-i, .pays li, .cm'],
    ['fx-wipe', '.case h3'],
    ['fx-pop', '.mod'],
    ['fx-gantt', '.gantt'],
  ];
  if ('IntersectionObserver' in window) {
    root.classList.add(REDUCED.matches ? 'tx-lite' : 'tx');
    FX.forEach(([cls, sel]) => $$(sel).forEach((el) => {
      el.classList.add('fx', cls);
      // stagger inside a list by position, not by page order
      const idx = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty('--fi', Math.min(idx, 5));
      if (cls === 'fx-words') splitWords(el);
    }));
    const owners = new Map(); // observed box: the elements it reveals
    const tio = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      (owners.get(en.target) || []).forEach((el) => el.classList.add('tx-in'));
      tio.unobserve(en.target);
    }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    $$('.fx').forEach((el) => {
      // a fully clipped element never intersects, so a wipe watches its parent;
      // carousel cards arrive together when the strip comes into view
      const box = el.classList.contains('fx-wipe') || el.classList.contains('cm') ? el.parentElement : el;
      if (!owners.has(box)) { owners.set(box, []); tio.observe(box); }
      owners.get(box).push(el);
    });
  }

  window.addEventListener('beforeprint', () => {
    $$('.fx').forEach((el) => el.classList.add('tx-in'));
    $$('.rv').forEach((el) => el.classList.add('in'));
    $$('.faq details').forEach((d) => { d.dataset.wasOpen = d.open; d.open = true; });
  });
  window.addEventListener('afterprint', () => $$('.faq details').forEach((d) => { d.open = d.dataset.wasOpen === 'true'; }));

  // phone action bar: hidden in the first screen (the hero has the same buttons) and on the request block itself
  const mbar = $('#mbar');
  if (mbar && 'IntersectionObserver' in window) {
    const heroCta = $('.hero-cta');
    const request = $('#request');
    const visible = new Map([[heroCta, true], [request, false]]);
    const barIo = new IntersectionObserver((entries) => {
      entries.forEach((en) => visible.set(en.target, en.isIntersecting));
      mbar.classList.toggle('hide', visible.get(heroCta) || visible.get(request));
    }, { threshold: 0.1 });
    barIo.observe(heroCta);
    barIo.observe(request);
    mbar.classList.add('hide');
  }

  /* ---------- version 3: ideas from the reference galleries ---------- */
  // navbar.gallery: one indicator glides between the section links
  const nav = $('#topnav');
  const ind = document.createElement('span');
  ind.className = 'nav-ind';
  ind.setAttribute('aria-hidden', 'true');
  nav.appendChild(ind);
  function moveInd() {
    const a = $('#topnav a[aria-current="true"]');
    if (!a) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.transform = `translateX(${a.offsetLeft}px) scaleX(${a.offsetWidth / 100})`;
  }
  new MutationObserver(moveInd).observe(nav, { attributes: true, subtree: true, attributeFilter: ['aria-current'] });
  window.addEventListener('resize', moveInd);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInd);
  topbar.classList.add('pill-nav');

  // motionsites: the hero photo tilts toward the pointer (fine pointers only, no reduced motion)
  const art = $('#heroArt');
  if (art && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !REDUCED.matches) {
    let raf = 0;
    art.addEventListener('pointermove', (e) => {
      const r = art.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        art.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
        art.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
        art.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(0)}%`);
        art.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(0)}%`);
      });
    });
    art.addEventListener('pointerleave', () => { art.style.setProperty('--rx', '0deg'); art.style.setProperty('--ry', '0deg'); });
  }

  // 60fps.design: the copy link answers in place
  const cpBtn = $('#copyPhone');
  cpBtn.addEventListener('click', () => {
    cpBtn.classList.add('done');
    cpBtn.textContent = 'скопировано';
    setTimeout(() => { cpBtn.classList.remove('done'); cpBtn.textContent = 'скопировать'; }, 1600);
  });


  // footer.design: one calm row of contacts
  $('#foot').innerHTML = `
    <div class="foot-row">
      <a href="https://wa.me/${M.whatsapp}" target="_blank" rel="noopener">WhatsApp ${esc(M.whatsappLabel)}</a>
      <a href="${esc(M.telegram)}" target="_blank" rel="noopener">Telegram</a>
      <a href="${esc(ST.site)}" target="_blank" rel="noopener">${esc(ST.siteLabel)}</a>
      <span>${esc(ST.address)}</span>
      <span>Предложение от ${dateRuY(D.issued)}</span>
    </div>`;

  renderTour();
  updateCurrent();
  fitAll();
  moveInd();
  track('kp_open');
})();
