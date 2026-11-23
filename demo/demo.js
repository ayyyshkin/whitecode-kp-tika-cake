'use strict';
/*
 * Tika Cake demo: storefront + team workspace in one hash-routed page.
 * All state lives in localStorage, so an order placed in the shop shows up in the team workspace.
 * When embedded in the proposal page it talks to the parent via postMessage.
 */
(() => {
  /* ================= helpers ================= */
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NF = new Intl.NumberFormat('ru-RU');
  const money = (n) => NF.format(Math.round(n)) + ' ₸';
  const PR = new Intl.PluralRules('ru');
  const plural = (n, one, few, many) => { const k = PR.select(n); return k === 'one' ? one : k === 'few' ? few : many; };
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const pad = (n) => String(n).padStart(2, '0');
  const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtQty = (n) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const DAY = 864e5;
  const dateShort = (offset) => new Date(Date.now() + offset * DAY).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const dayLabel = (i) => {
    const d = new Date(Date.now() + i * DAY);
    const dm = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '');
    if (i === 0) return `Сегодня, ${dm}`;
    if (i === 1) return `Завтра, ${dm}`;
    return `${d.toLocaleDateString('ru-RU', { weekday: 'short' })}, ${dm}`;
  };

  const embedded = window.parent !== window;
  const post = (msg) => { if (embedded) window.parent.postMessage({ source: 'tika-demo', ...msg }, '*'); };

  /* ================= icons ================= */
  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bag: '<path d="M5 8h14l-1.2 12H6.2L5 8z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    truck: '<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    store: '<path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M10 20v-5h4v5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    chef: '<path d="M7 14a4 4 0 0 1-.6-7.9 5.5 5.5 0 0 1 11.2 0A4 4 0 0 1 17 14"/><path d="M7 14h10v6H7z"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    repeat: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13"/><path d="M12 8c-2 0-4-1-4-3s3-2 4 3zm0 0c2 0 4-1 4-3s-3-2-4 3z"/>',
  };
  const ic = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

  /* ================= illustrations (no photos in the demo) ================= */
  const PAL = {
    strawberry: { bg: '#fbe2e7', sponge: '#f3d2ae', cream: '#fff6f1', top: '#fff1f3', drip: '#f4b9c6', acc: '#e0435c', acc2: '#7fb069' },
    chocolate: { bg: '#efe0d6', sponge: '#5b3222', cream: '#8a5236', top: '#3b1f15', drip: '#3b1f15', acc: '#d9a566', acc2: '#f3e3cf' },
    honey: { bg: '#f8ecd3', sponge: '#e3ad5c', cream: '#fff4de', top: '#f3d9a6', drip: '#e9c27c', acc: '#b97a22', acc2: '#fff4de' },
    pistachio: { bg: '#eaf1dc', sponge: '#c6d99c', cream: '#f5f7e8', top: '#e2edc6', drip: '#e38aa0', acc: '#d63e64', acc2: '#8fb05a' },
    cheesecake: { bg: '#f5e5ec', sponge: '#c79a63', cream: '#fff7ea', top: '#fff3e3', drip: '#9c2f55', acc: '#7a1f45', acc2: '#3d5fa8' },
    cherry: { bg: '#f2dcdd', sponge: '#46221d', cream: '#f6dedb', top: '#5a1d26', drip: '#8f1730', acc: '#b3132f', acc2: '#f6dedb' },
    berrycurd: { bg: '#efe4f3', sponge: '#e6c79c', cream: '#fffaf2', top: '#ffffff', drip: '#d9c3e8', acc: '#6a3f8f', acc2: '#d6436a' },
    apple: { bg: '#f6ead8', crust: '#d79a52', rim: '#c48440', fill: '#f2cf7a' },
    forest: { bg: '#ece3f0', crust: '#d49a5b', rim: '#bf8545', fill: '#6b2d63' },
    croissant: { bg: '#f7ebdb', base: '#d9963f', light: '#f3c98a' },
    almond: { bg: '#f4eadf', base: '#d49345', light: '#f2d3a2', flakes: '#fff8ec' },
    eclair: { bg: '#f6efe2', base: '#e0b06b', top: '#fff3d6', top2: '#6b3a24', sprinkle: '#d8a24a' },
    cookie: { bg: '#f3e7da', base: '#cf9a5c', light: '#e8bf86', chip: '#4a2a1a' },
    macaron: { bg: '#f8e8ee', ribbon: '#c24468', c: ['#f4c6d3', '#c9a27e', '#f6e2b3', '#b8d8b0', '#f4c6d3', '#c9a27e'] },
    macaronBerry: { bg: '#f6e3ea', ribbon: '#4a2137', c: ['#e5708c', '#b33a5a', '#6b3f86', '#f0a3b5', '#e5708c', '#b33a5a'] },
  };
  let uid = 0;
  const svg = (inner) => `<svg viewBox="0 0 200 152" aria-hidden="true" focusable="false">${inner}</svg>`;
  const shadow = '<ellipse cx="100" cy="141" rx="80" ry="9" fill="#000" opacity=".07"/>';

  function artCake(p) {
    const drips = [52, 67, 83, 99, 115, 131, 147].map((x, i) => {
      const y = 70 + 12 * Math.sqrt(Math.max(0, 1 - ((x - 100) / 60) ** 2));
      const len = [9, 15, 7, 13, 10, 16, 8][i];
      return `<rect x="${x - 3.5}" y="${(y - 5).toFixed(1)}" width="7" height="${len + 5}" rx="3.5" fill="${p.drip}"/>`;
    }).join('');
    const berries = [[72, 64], [89, 60], [107, 59], [125, 63], [97, 70], [116, 70], [80, 71]].map(([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 7 : 6}" fill="${i % 4 === 3 ? p.acc2 : p.acc}"/><circle cx="${x - 2}" cy="${y - 2.5}" r="1.6" fill="#fff" opacity=".5"/>`).join('');
    return svg(`${shadow}
      <ellipse cx="100" cy="132" rx="78" ry="13" fill="#fff"/><ellipse cx="100" cy="130" rx="69" ry="9.5" fill="#f1e9e3"/>
      <path d="M40 70V120A60 12 0 0 0 160 120V70Z" fill="${p.sponge}"/>
      <path d="M40 92A60 12 0 0 0 160 92V100A60 12 0 0 1 40 100Z" fill="${p.cream}"/>
      <path d="M40 108A60 12 0 0 0 160 108V113A60 12 0 0 1 40 113Z" fill="${p.cream}" opacity=".75"/>
      ${drips}
      <ellipse cx="100" cy="70" rx="60" ry="12" fill="${p.top}"/>
      ${berries}`);
  }
  function artPie(p) {
    const id = `pc${++uid}`;
    const lines = [-40, -20, 0, 20, 40];
    return svg(`${shadow}
      <path d="M26 90 L40 120 A60 12 0 0 0 160 120 L174 90Z" fill="${p.crust}"/>
      <ellipse cx="100" cy="90" rx="74" ry="22" fill="${p.rim}"/>
      <ellipse cx="100" cy="89" rx="63" ry="17" fill="${p.fill}"/>
      <clipPath id="${id}"><ellipse cx="100" cy="89" rx="63" ry="17"/></clipPath>
      <g clip-path="url(#${id})" stroke="${p.crust}" stroke-width="7" stroke-linecap="round">
        ${lines.map((o) => `<line x1="${100 + o - 18}" y1="68" x2="${100 + o + 18}" y2="110"/>`).join('')}
        ${lines.map((o) => `<line x1="${100 + o + 18}" y1="68" x2="${100 + o - 18}" y2="110"/>`).join('')}
      </g>`);
  }
  function artCroissant(p) {
    const segs = [[58, 100, 17, 12, -38], [142, 100, 17, 12, 38], [75, 86, 22, 16, -20], [125, 86, 22, 16, 20], [100, 80, 28, 21, 0]];
    const flakes = p.flakes ? [[88, 70], [100, 66], [112, 71], [94, 76], [108, 78], [78, 80], [122, 80]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="${p.flakes}" transform="rotate(${i * 37} ${x} ${y})"/>`).join('') : '';
    return svg(`${shadow}${segs.map(([cx, cy, rx, ry, r]) => `<g transform="rotate(${r} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.base}"/><ellipse cx="${cx}" cy="${cy - ry * 0.35}" rx="${rx * 0.68}" ry="${ry * 0.38}" fill="${p.light}" opacity=".85"/></g>`).join('')}${flakes}`);
  }
  function artEclair(p) {
    const one = (y, top) => `<rect x="30" y="${y}" width="140" height="32" rx="16" fill="${p.base}"/><rect x="34" y="${y - 3}" width="132" height="16" rx="8" fill="${top}"/>`;
    const dots = [52, 70, 88, 106, 124, 142].map((x, i) => `<rect x="${x}" y="${91 + (i % 2) * 4}" width="7" height="2.4" rx="1.2" fill="${p.sprinkle}" transform="rotate(${i % 2 ? 30 : -25} ${x} 92)"/>`).join('');
    return svg(`${shadow}${one(62, p.top2)}${one(94, p.top)}${dots}`);
  }
  function artCookie(p) {
    const chips = [[-16, -10], [10, -20], [16, 8], [-6, 14], [-24, 12], [24, -6], [0, -2]];
    const c = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.base}"/><circle cx="${cx - 4}" cy="${cy - 5}" r="${r - 10}" fill="${p.light}" opacity=".45"/>` +
      chips.map(([dx, dy], i) => `<rect x="${cx + dx * r / 40}" y="${cy + dy * r / 40}" width="8" height="7" rx="2" fill="${p.chip}" transform="rotate(${i * 25} ${cx + dx * r / 40} ${cy + dy * r / 40})"/>`).join('');
    return svg(`${shadow}${c(128, 80, 36)}${c(82, 98, 42)}`);
  }
  function artMacaron(p) {
    let s = `${shadow}<rect x="28" y="56" width="144" height="78" rx="12" fill="#fff" stroke="#ead9cf"/><rect x="28" y="56" width="144" height="11" rx="5.5" fill="#f3e6de"/>`;
    [[56, 82], [100, 82], [144, 82], [56, 113], [100, 113], [144, 113]].forEach(([x, y], i) => {
      const c = p.c[i % p.c.length];
      s += `<ellipse cx="${x}" cy="${y + 5}" rx="18" ry="8" fill="${c}"/><rect x="${x - 16}" y="${y - 1}" width="32" height="5" rx="2.5" fill="#fff6ea"/><ellipse cx="${x}" cy="${y - 4}" rx="18" ry="8" fill="${c}"/><ellipse cx="${x - 5}" cy="${y - 7}" rx="6" ry="2" fill="#fff" opacity=".45"/>`;
    });
    s += `<path d="M100 50c-8-12-28-10-22 0 5 7 22 2 22 2s17 5 22-2c6-10-14-12-22 0z" fill="${p.ribbon}"/><circle cx="100" cy="51" r="4" fill="${p.ribbon}"/>`;
    return svg(s);
  }
  function art(p) {
    const pal = PAL[p.pal];
    switch (p.art) {
      case 'pie': return artPie(pal);
      case 'croissant': return artCroissant(pal);
      case 'eclair': return artEclair(pal);
      case 'cookie': return artCookie(pal);
      case 'macaron': return artMacaron(pal);
      default: return artCake(pal);
    }
  }

  /* ================= catalog data ================= */
  const S = (b) => [
    { d: 16, w: '0,8 кг', serv: '6–8 порций', price: b },
    { d: 18, w: '1,2 кг', serv: '10–12 порций', price: b + 2000 },
    { d: 22, w: '1,8 кг', serv: '16–18 порций', price: b + 5000 },
  ];
  const ALL = { center: 'today', park: 'today', kitchen: 'today' };
  const PRODUCTS = [
    { id: 'strawberry-cloud', cat: 'cakes', name: 'Клубничное облако', art: 'cake', pal: 'strawberry', hit: true, for: ['birthday', 'company'],
      desc: 'Воздушный бисквит, нежный сливочный крем и сочная клубника. Для маленьких и больших поводов.', sizes: S(6900),
      comp: 'Бисквит, сливки 33%, сливочный сыр, свежая клубника, сахар, ваниль.', allergens: 'яйца, молоко, глютен', kbju: [286, 4.1, 16.2, 31], avail: ALL, rating: 4.9, reviews: 128 },
    { id: 'chocolate-evening', cat: 'cakes', name: 'Шоколадный вечер', art: 'cake', pal: 'chocolate', for: ['birthday', 'company'],
      desc: 'Насыщенный шоколадный бисквит и мягкий ганаш. Тот самый десерт к долгому разговору.', sizes: S(7400),
      comp: 'Шоколадный бисквит, ганаш на тёмном шоколаде 70%, сливки 33%, какао.', allergens: 'яйца, молоко, глютен, соя', kbju: [372, 5.2, 22.4, 37.5], avail: ALL, rating: 4.8, reviews: 96 },
    { id: 'honey-cake', cat: 'cakes', name: 'Медовик со сметаной', art: 'cake', pal: 'honey', for: ['tea', 'company'],
      desc: 'Тонкие медовые коржи со сметанным кремом. Знакомый вкус в нежном исполнении.', sizes: S(5900),
      comp: 'Медовые коржи, сметана 20%, сливки, мёд, сахар.', allergens: 'яйца, молоко, глютен, мёд', kbju: [318, 4.6, 15.1, 41.2], avail: { center: 'today', park: 'tomorrow', kitchen: 'today' }, rating: 4.9, reviews: 211 },
    { id: 'pistachio-raspberry', cat: 'cakes', name: 'Фисташка и малина', art: 'cake', pal: 'pistachio', isNew: true, for: ['birthday', 'thanks'],
      desc: 'Ореховый бисквит, фисташковый крем и малиновая прослойка с лёгкой кислинкой.', sizes: S(8500),
      comp: 'Фисташковый бисквит, крем на фисташковой пасте, малиновое конфи, сливки 33%.', allergens: 'орехи, яйца, молоко, глютен', kbju: [344, 6.8, 21.7, 30.1], avail: { center: 'today', park: 'tomorrow', kitchen: 'tomorrow' }, rating: 5.0, reviews: 34 },
    { id: 'berry-cheesecake', cat: 'cakes', name: 'Ягодный чизкейк', art: 'cake', pal: 'cheesecake', for: ['tea', 'thanks'],
      desc: 'Сливочный чизкейк на хрустящей основе, украшенный ягодами. Для неспешного чаепития.', sizes: S(7900),
      comp: 'Сливочный сыр, сливки, песочная основа, ягоды, сахар.', allergens: 'молоко, глютен, яйца', kbju: [329, 6.1, 22.8, 24.9], avail: ALL, rating: 4.8, reviews: 77 },
    { id: 'cherry-truffle', cat: 'cakes', name: 'Вишнёвый трюфель', art: 'cake', pal: 'cherry', isNew: true, for: ['birthday', 'company'],
      desc: 'Шоколадные коржи, вишнёвая начинка и густой крем. Яркий баланс сладкого и кислого.', sizes: S(7200),
      comp: 'Шоколадные коржи, вишня, крем на сливках, тёмный шоколад.', allergens: 'яйца, молоко, глютен', kbju: [356, 5.0, 20.3, 38.2], avail: ALL, rating: 4.9, reviews: 21 },
    { id: 'berry-weekend', cat: 'cakes', name: 'Ягодный выходной', art: 'cake', pal: 'berrycurd', isNew: true, for: ['tea', 'thanks'],
      desc: 'Творожный крем и ягодное ассорти на рассыпчатом корже. Создан для чашки чая без спешки.', sizes: S(6700),
      comp: 'Песочный корж, творожный крем, черника, малина, клубника.', allergens: 'молоко, глютен, яйца', kbju: [262, 7.4, 12.8, 29.6], avail: { center: 'today', park: 'today', kitchen: 'tomorrow' }, rating: 4.7, reviews: 12 },
    { id: 'apple-pie', cat: 'pies', name: 'Яблочный пирог', art: 'pie', pal: 'apple', price: 2800, weight: '600 г', for: ['tea', 'company'],
      desc: 'Рассыпчатое тесто, яблоки и щепотка корицы. Хорош и тёплым, и к утреннему чаю.',
      comp: 'Песочное тесто, яблоки, сахар, корица, сливочное масло.', allergens: 'глютен, молоко, яйца', kbju: [254, 3.1, 10.2, 37.4], avail: ALL, rating: 4.8, reviews: 64 },
    { id: 'forest-pie', cat: 'pies', name: 'Пирог с лесными ягодами', art: 'pie', pal: 'forest', isNew: true, price: 3600, weight: '650 г', for: ['tea', 'company'],
      desc: 'Много ягод, тонкое тесто и приятная кислинка. Поделитесь с теми, кто заглянул на чай.',
      comp: 'Песочное тесто, черника, брусника, малина, сахар.', allergens: 'глютен, молоко, яйца', kbju: [241, 3.0, 9.4, 36.1], avail: ALL, rating: 4.9, reviews: 18 },
    { id: 'eclair', cat: 'pastry', name: 'Эклер ванильный', art: 'eclair', pal: 'eclair', price: 1100, weight: '90 г', for: ['tea', 'thanks'],
      desc: 'Лёгкое заварное тесто и нежный ванильный крем. Маленький повод порадовать себя.',
      comp: 'Заварное тесто, крем патисьер на ванили, помадка.', allergens: 'яйца, молоко, глютен', kbju: [298, 5.6, 15.9, 32.8], avail: ALL, rating: 4.8, reviews: 143 },
    { id: 'almond-croissant', cat: 'bakery', name: 'Миндальный круассан', art: 'croissant', pal: 'almond', price: 1250, weight: '120 г', for: ['tea'],
      desc: 'Хрустящие слои, миндальный крем и лепестки ореха. Тёплое начало дня.',
      comp: 'Слоёное тесто на сливочном масле, миндальный крем, миндальные лепестки.', allergens: 'орехи, глютен, молоко, яйца', kbju: [452, 9.1, 27.3, 41.7], avail: { center: 'today', park: 'today', kitchen: 'tomorrow' }, rating: 4.9, reviews: 88 },
    { id: 'butter-croissant', cat: 'bakery', name: 'Круассан на сливочном масле', art: 'croissant', pal: 'croissant', price: 850, weight: '80 г', for: ['tea'],
      desc: 'Золотистая корочка и лёгкие слои внутри. Возьмите к кофе или соберите свой завтрак.',
      comp: 'Мука, сливочное масло 82%, молоко, дрожжи, сахар.', allergens: 'глютен, молоко', kbju: [406, 7.8, 21.4, 45.2], avail: ALL, rating: 4.8, reviews: 102 },
    { id: 'choc-cookie', cat: 'cookies', name: 'Печенье с шоколадом', art: 'cookie', pal: 'cookie', price: 1800, weight: '200 г', for: ['tea', 'thanks'],
      desc: 'Мягкая серединка, хрустящий край и кусочки шоколада. Для стола, за которым рады гостям.',
      comp: 'Мука, сливочное масло, тёмный шоколад, коричневый сахар, яйца.', allergens: 'глютен, молоко, яйца, соя', kbju: [468, 5.4, 23.1, 59.8], avail: ALL, rating: 4.7, reviews: 56 },
    { id: 'macaron-classic', cat: 'gifts', name: 'Макарон «Классика»', art: 'macaron', pal: 'macaron', price: 4900, old: 5600, weight: '12 шт', for: ['thanks', 'birthday'],
      desc: 'Двенадцать миндальных макарон с ванильным, шоколадным и карамельным кремом. Подарок, которым приятно делиться.',
      comp: 'Миндальная мука, белок, сахар, ганаши на шоколаде и карамели.', allergens: 'орехи, яйца, молоко', kbju: [412, 7.2, 18.6, 54.0], avail: ALL, rating: 4.9, reviews: 49 },
    { id: 'macaron-berry', cat: 'gifts', name: 'Макарон «Ягодное ассорти»', art: 'macaron', pal: 'macaronBerry', price: 6500, old: 7200, weight: '12 шт', for: ['thanks', 'birthday'],
      desc: 'Двенадцать макарон с клубникой, малиной и чёрной смородиной в сливочном креме. Яркое спасибо в одной коробке.',
      comp: 'Миндальная мука, белок, сахар, ягодные конфи, сливочный крем.', allergens: 'орехи, яйца, молоко', kbju: [398, 6.9, 17.2, 55.1], avail: { center: 'today', park: 'tomorrow', kitchen: 'today' }, rating: 5.0, reviews: 27 },
  ];
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

  const CATS = [
    { id: 'cakes', ru: 'Торты', kz: 'Торттар', sample: 'strawberry-cloud' },
    { id: 'pies', ru: 'Пироги', kz: 'Бәліштер', sample: 'apple-pie' },
    { id: 'pastry', ru: 'Пирожные', kz: 'Тәттілер', sample: 'eclair' },
    { id: 'bakery', ru: 'Выпечка', kz: 'Нан-тоқаш', sample: 'butter-croissant' },
    { id: 'cookies', ru: 'Печенье', kz: 'Печенье', sample: 'choc-cookie' },
    { id: 'gifts', ru: 'Подарки', kz: 'Сыйлықтар', sample: 'macaron-classic' },
  ];
  const OCCASIONS = [
    { id: 'birthday', t: 'День рождения', s: 'Торт для заветного желания', bg: '#fbe2e7', sample: 'strawberry-cloud' },
    { id: 'tea', t: 'Просто к чаю', s: 'Маленькая пауза для себя', bg: '#f8ecd3', sample: 'apple-pie' },
    { id: 'thanks', t: 'Сказать спасибо', s: 'Тёплые слова в сладкой форме', bg: '#f8e8ee', sample: 'macaron-classic' },
    { id: 'company', t: 'Для компании', s: 'Хватит на всех за столом', bg: '#efe0d6', sample: 'chocolate-evening' },
  ];
  const EXTRAS = [
    { id: 'candles', name: 'Свечи, 10 шт', short: 'свечи', price: 300 },
    { id: 'card', name: 'Открытка с вашим текстом', short: 'открытка', price: 500 },
    { id: 'text', name: 'Надпись на торте', short: 'надпись', price: 1000 },
    { id: 'topper', name: 'Топпер «С днём рождения»', short: 'топпер', price: 900 },
  ];
  const extra = (id) => EXTRAS.find((e) => e.id === id);
  const BRANCHES = [
    { id: 'center', name: 'Tika • Центр', short: 'Центр', hours: 'ежедневно 08:00–22:00', pickup: true },
    { id: 'park', name: 'Tika • Парк', short: 'Парк', hours: 'ежедневно 09:00–21:00', pickup: true },
    { id: 'kitchen', name: 'Кухня доставки', short: 'Кухня', hours: 'только доставка', pickup: false },
  ];
  const branch = (id) => BRANCHES.find((b) => b.id === id) || BRANCHES[0];
  const ZONES = [
    { id: 1, name: 'Зона 1', area: 'до 3 км от кухни', fee: 1000 },
    { id: 2, name: 'Зона 2', area: '3–7 км', fee: 1500 },
    { id: 3, name: 'Зона 3', area: '7–12 км', fee: 2000 },
    { id: 4, name: 'Зона 4', area: 'пригород', fee: 2500 },
  ];
  const FREE_FROM = 15000;
  const SLOTS = ['10:00–12:00', '12:00–14:00', '14:00–16:00', '16:00–18:00', '18:00–20:00'];
  const BUSY = { 0: { '10:00–12:00': 'уже прошло', '12:00–14:00': 'нет мест' }, 1: { '18:00–20:00': 'нет мест' }, 2: {} };
  const ADDRESSES = ['Дом: ул. Цветочная, 12, кв. 45', 'Офис: БЦ «Север», 3 этаж'];
  const REVIEWS = [
    { who: 'Динара', stars: 5, text: 'Заказывала на день рождения мамы. Привезли в выбранный интервал, торт целый, надпись ровная.' },
    { who: 'Арман', stars: 5, text: 'Удобно, что видно наличие в точке. Забрал по пути с работы и ничего не ждал.' },
    { who: 'Светлана', stars: 4, text: 'Вкусно и не приторно. Для маленькой компании взяли 16 см, хватило на шестерых.' },
  ];
  const STOCK = [
    { id: 'cream', name: 'Сливки 33%', unit: 'л', qty: 4.2, min: 8, buy: 12 },
    { id: 'strawberry', name: 'Клубника', unit: 'кг', qty: 1.6, min: 3, buy: 5 },
    { id: 'pistachio', name: 'Фисташковая паста', unit: 'кг', qty: 0.35, min: 0.5, buy: 1 },
    { id: 'cheese', name: 'Сливочный сыр', unit: 'кг', qty: 2.2, min: 3, buy: 6 },
    { id: 'flour', name: 'Мука высшего сорта', unit: 'кг', qty: 42, min: 20, buy: 50 },
    { id: 'sugar', name: 'Сахар', unit: 'кг', qty: 26, min: 15, buy: 25 },
    { id: 'butter', name: 'Масло сливочное 82%', unit: 'кг', qty: 7.5, min: 5, buy: 10 },
    { id: 'choc', name: 'Шоколад 70%', unit: 'кг', qty: 3.1, min: 2, buy: 5 },
    { id: 'eggs', name: 'Яйца', unit: 'шт', qty: 240, min: 150, buy: 360 },
    { id: 'sourcream', name: 'Сметана 20%', unit: 'кг', qty: 5.5, min: 4, buy: 8 },
  ];
  const ROLES = {
    owner: { name: 'Руководитель', sections: ['overview', 'orders', 'production', 'stock'] },
    kitchen: { name: 'Производство', sections: ['production', 'stock', 'orders'], info: 'Роль «Производство»: план партий, склад и заказы без сумм.' },
    point: { name: 'Сотрудник точки', sections: ['orders', 'production'], info: 'Роль «Сотрудник точки»: заказы на выдачу и готовность партий, без денег и склада.' },
  };

  /* ================= i18n (UI chrome only; kz strings need a native check) ================= */
  const I18N = {
    ru: { catalog: 'Каталог', bonuses: 'Бонусы', searchPh: 'Найти торт или десерт', toCart: 'В корзину', chooseSize: 'Выбрать размер', recommended: 'Рекомендуем', newItems: 'Новинки', sets: 'Наборы в подарок', occasions: 'Для каждого повода', all: 'Смотреть все', home: 'Главная', cart: 'Корзина', account: 'Кабинет', hit: 'Хит недели', team: 'Управление бизнесом' },
    kz: { catalog: 'Каталог', bonuses: 'Бонустар', searchPh: 'Торт не десерт іздеу', toCart: 'Себетке', chooseSize: 'Өлшемін таңдау', recommended: 'Ұсынамыз', newItems: 'Жаңа дәмдер', sets: 'Сыйлық жиынтықтары', occasions: 'Әр мерекеге', all: 'Барлығы', home: 'Басты бет', cart: 'Себет', account: 'Кабинет', hit: 'Апта хиті', team: 'Бизнесті басқару' },
  };
  const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.ru[k] || k;
  const catName = (id) => { const c = CATS.find((x) => x.id === id); return c ? (state.lang === 'kz' ? c.kz : c.ru) : 'Каталог'; };
  const priceFrom = (n) => (state.lang === 'kz' ? `${money(n)} бастап` : `от ${money(n)}`);

  /* ================= pricing ================= */
  function unitPrice(it) {
    const p = byId[it.id];
    const base = p.sizes ? p.sizes[it.size].price : p.price;
    return base + sum(it.extras || [], (e) => extra(e).price);
  }
  function calc(items, o) {
    const subtotal = sum(items, (i) => unitPrice(i) * i.qty);
    const discount = o.promo === 'WELCOME10' && subtotal >= 3000 ? Math.round(subtotal * 0.1) : 0;
    const after = subtotal - discount;
    const zone = ZONES.find((z) => z.id === o.zone) || ZONES[0];
    const delivery = o.mode === 'delivery' ? (after >= FREE_FROM ? 0 : zone.fee) : 0;
    const bonusUsed = o.useBonus ? Math.min(o.bonus || 0, Math.floor(after * 0.3)) : 0;
    const total = after - bonusUsed + delivery;
    const earn = Math.floor((after - bonusUsed) * 0.05);
    return { subtotal, discount, delivery, bonusUsed, total, earn, count: sum(items, (i) => i.qty) };
  }

  /* ================= seed data: a working day is loaded from the first open ================= */
  function mkOrder(time, customer, items, recv, status, pay, repeat) {
    const it = items.map(([id, size, qty, extras]) => ({ id, size: size ?? null, qty: qty || 1, extras: extras || [] }));
    return { id: '', time, customer, items: it, recv, status, pay, repeat: !!repeat, totals: calc(it, { mode: recv.mode, zone: recv.zone, promo: '', useBonus: false }) };
  }
  const P = (b, slot) => ({ mode: 'pickup', branch: b, slot, day: 0 });
  const Dl = (zone, slot) => ({ mode: 'delivery', branch: 'kitchen', zone, slot, day: 0 });
  function seedOrders() {
    const list = [
      mkOrder('08:15', 'Ольга В.', [['almond-croissant', null, 4], ['eclair', null, 2]], P('center', '10:00–12:00'), 'done', 'Kaspi'),
      mkOrder('08:42', 'Дана С.', [['strawberry-cloud', 1, 1, ['candles']]], P('center', '12:00–14:00'), 'done', 'Kaspi'),
      mkOrder('08:55', 'Асель Н.', [['forest-pie']], Dl(1, '10:00–12:00'), 'done', 'Kaspi', true),
      mkOrder('09:05', 'Ерлан М.', [['honey-cake', 0], ['eclair', null, 4]], Dl(2, '12:00–14:00'), 'done', 'Forte'),
      mkOrder('09:31', 'Мария К.', [['chocolate-evening', 2, 1, ['text']]], P('park', '14:00–16:00'), 'ready', 'Kaspi', true),
      mkOrder('09:58', 'Айжан Т.', [['macaron-classic', null, 2]], Dl(1, '14:00–16:00'), 'delivering', 'Kaspi'),
      mkOrder('10:05', 'Жанна Р.', [['macaron-berry'], ['strawberry-cloud', 0]], P('park', '12:00–14:00'), 'done', 'Forte', true),
      mkOrder('10:20', 'Тимур А.', [['pistachio-raspberry', 1, 1, ['topper']]], P('center', '16:00–18:00'), 'cooking', 'Kaspi'),
      mkOrder('10:47', 'Алия Б.', [['berry-cheesecake', 0], ['butter-croissant', null, 6]], Dl(3, '16:00–18:00'), 'cooking', 'Forte', true),
      mkOrder('11:15', 'Сергей П.', [['strawberry-cloud', 2, 1, ['candles', 'card']]], Dl(2, '18:00–20:00'), 'new', 'Kaspi'),
      mkOrder('11:40', 'Камила Ж.', [['apple-pie', null, 2], ['choc-cookie']], P('park', '16:00–18:00'), 'new', 'Kaspi', true),
      mkOrder('12:02', 'Нурлан Е.', [['cherry-truffle', 1]], P('center', '18:00–20:00'), 'new', 'Forte'),
    ];
    list.forEach((o, i) => { o.id = `T-${1031 + i}`; });
    return list.reverse();
  }
  function seedHistory() {
    const a = mkOrder('', 'Айгерим', [['honey-cake', 1], ['eclair', null, 2]], P('center', '16:00–18:00'), 'done', 'Kaspi');
    const b = mkOrder('', 'Айгерим', [['strawberry-cloud', 0, 1, ['candles']]], Dl(2, '18:00–20:00'), 'done', 'Kaspi');
    return [{ ...a, id: 'T-0987', date: dateShort(-11) }, { ...b, id: 'T-0921', date: dateShort(-26) }];
  }

  /* ================= state ================= */
  const KEY = 'tika-demo-v1';
  const VERSION = 4;
  function fresh() {
    return {
      v: VERSION, lang: 'ru', branch: 'center', favs: [],
      cart: [], promo: '', useBonus: false,
      recv: { mode: 'pickup', pickup: 'center', zone: 2, address: '', day: 0, slot: '14:00–16:00' },
      pay: 'kaspi', comment: '',
      profile: { name: 'Айгерим', phone: '+7 700 123 45 67', verified: false, codeSent: false },
      bonus: 1240, nextId: 1043,
      orders: seedOrders(), history: seedHistory(), stock: clone(STOCK),
      role: 'owner', admBranch: 'all', ordFilter: 'all', onlyToday: false, sort: 'pop',
    };
  }
  let state = null;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch { state = null; }
  if (!state || state.v !== VERSION) state = fresh();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: demo still works for the session */ } };

  const cartCount = () => sum(state.cart, (i) => i.qty);
  const cartCalc = () => calc(state.cart, { mode: state.recv.mode, zone: state.recv.zone, promo: state.promo, useBonus: state.useBonus, bonus: state.bonus });
  const availOf = (p, b = state.branch) => p.avail[b] || 'today';
  const availText = (a, b = state.branch) => (a === 'today' ? `Есть сегодня · ${branch(b).short}` : `К завтра · ${branch(b).short}`);
  const itemName = (it) => { const p = byId[it.id]; return `${p.name}${p.sizes ? `, ${p.sizes[it.size].d} см` : ''}`; };
  const itemExtras = (it) => (it.extras || []).map((e) => (e === 'text' && it.text ? `надпись «${it.text}»` : extra(e).short)).join(', ');
  const itemShort = (it) => `${esc(itemName(it))}${it.qty > 1 ? ` × ${it.qty}` : ''}${it.extras && it.extras.length ? ` <span class="sub">+ ${esc(itemExtras(it))}</span>` : ''}`;
  const recvShort = (r) => (r.mode === 'delivery' ? `Доставка, зона ${r.zone}` : `Самовывоз, ${branch(r.branch).short}`);
  function statusLabel(o) {
    const del = o.recv.mode === 'delivery';
    return { new: 'Новый', cooking: 'Готовится', ready: del ? 'Ждёт курьера' : 'Готов к выдаче', delivering: 'В пути', done: del ? 'Доставлен' : 'Выдан' }[o.status];
  }
  function nextStatus(o) {
    const del = o.recv.mode === 'delivery';
    if (o.status === 'new') return { to: 'cooking', btn: 'В работу' };
    if (o.status === 'cooking') return { to: 'ready', btn: 'Готов' };
    if (o.status === 'ready') return del ? { to: 'delivering', btn: 'Курьеру' } : { to: 'done', btn: 'Выдать' };
    if (o.status === 'delivering') return { to: 'done', btn: 'Доставлен' };
    return null;
  }
  function setStatus(o, to) {
    o.status = to;
    if (to === 'done' && o.mine && !o.earned) { o.earned = true; state.bonus += o.totals.earn; }
  }

  function addToCart(it) {
    const same = state.cart.find((c) => c.id === it.id && c.size === it.size && (c.text || '') === (it.text || '') && JSON.stringify([...c.extras].sort()) === JSON.stringify([...it.extras].sort()));
    if (same) same.qty += it.qty; else state.cart.push(it);
  }
  function seedCart() {
    if (!state.cart.length) {
      state.cart.push({ id: 'strawberry-cloud', size: 1, qty: 1, extras: ['candles', 'card'] });
      state.cart.push({ id: 'eclair', size: null, qty: 2, extras: [] });
    }
    state.recv.mode = 'delivery';
    state.recv.day = 0;
    state.recv.slot = '16:00–18:00';
    save();
  }
  function availIssues() {
    const R = state.recv;
    if (R.day !== 0) return [];
    const b = R.mode === 'pickup' ? R.pickup : 'kitchen';
    return state.cart.filter((it) => availOf(byId[it.id], b) === 'tomorrow').map((it) => ({ it, b }));
  }

  /* ================= toast ================= */
  let toastTimer;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2800);
  }

  /* ================= shop layout ================= */
  function header(r) {
    const n = cartCount();
    const a = r.parts[0] || '';
    return `
    <div class="ribbon"><div class="wrap">
      <span class="live">Демо · оплата, SMS и обмен с iiko тестовые</span>
      <a href="#/admin">${t('team')} ${ic('arrow')}</a>
    </div></div>
    <header class="hdr"><div class="wrap">
      <a class="logo" href="#/" aria-label="Tika Cake, главная"><b>tika</b><small>cake</small></a>
      <nav class="hnav" aria-label="Магазин">
        <a href="#/catalog" ${a === 'catalog' && !r.q.get('cat') ? 'aria-current="page"' : ''}>${t('catalog')}</a>
        <a href="#/catalog?cat=cakes" ${r.q.get('cat') === 'cakes' ? 'aria-current="page"' : ''}>${catName('cakes')}</a>
        <a href="#/account" ${a === 'account' ? 'aria-current="page"' : ''}>${t('bonuses')}</a>
      </nav>
      <form class="search" data-form="search" role="search">${ic('search')}<input name="q" type="search" placeholder="${esc(t('searchPh'))}" value="${esc(r.q.get('q') || '')}" aria-label="Поиск"></form>
      <label class="branch">${ic('pin')}<span class="sr">Точка</span><select data-change="branch">${BRANCHES.map((b) => `<option value="${b.id}" ${b.id === state.branch ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}</select></label>
      <div class="lang" role="group" aria-label="Язык"><button type="button" data-act="lang" data-v="ru" aria-pressed="${state.lang === 'ru'}">RU</button><button type="button" data-act="lang" data-v="kz" aria-pressed="${state.lang === 'kz'}">KZ</button></div>
      <div class="hdr-icons">
        <a class="icon-btn acc" href="#/account" aria-label="Личный кабинет">${ic('user')}</a>
        <a class="icon-btn" href="#/cart" aria-label="Корзина, ${n} шт.">${ic('bag')}${n ? `<span class="badge">${n}</span>` : ''}</a>
      </div>
    </div></header>`;
  }
  function footer() {
    return `<footer class="ftr"><div class="wrap">
      <div><a class="logo" href="#/"><b>tika</b><small>cake</small></a><p>Торты, десерты и тёплые встречи. Самовывоз из двух точек и доставка по четырём зонам.</p></div>
      <div><h4>Покупателям</h4><ul><li><a href="#/catalog">Каталог</a></li><li><a href="#/account">Бонусы и кабинет</a></li><li><a href="#/cart">Корзина</a></li></ul></div>
      <div><h4>Точки</h4><ul>${BRANCHES.map((b) => `<li>${esc(b.name)}<br><small>${esc(b.hours)}</small></li>`).join('')}</ul></div>
      <div><h4>Доставка</h4><ul><li>10:00–20:00, интервал 2 часа</li><li>Бесплатно от ${money(FREE_FROM)}</li><li>Kaspi и Forte</li></ul></div>
      <p class="made">Демо-версия для коммерческого предложения WhiteCode. Заказы, оплата и сообщения тестовые.</p>
    </div></footer>`;
  }
  function tabbar(r) {
    const a = r.parts[0] || '';
    const n = cartCount();
    const items = [['', 'home', t('home')], ['catalog', 'grid', t('catalog')], ['cart', 'bag', t('cart')], ['account', 'user', t('account')]];
    return `<nav class="tabbar" aria-label="Разделы">${items.map(([p, i, l]) => `<a href="#/${p}" ${a === p ? 'aria-current="page"' : ''}>${ic(i)}${l}${p === 'cart' && n ? `<span class="badge">${n}</span>` : ''}</a>`).join('')}</nav>`;
  }
  const secHead = (title, href) => `<div class="sec-h"><h2>${esc(title)}</h2>${href ? `<a href="${href}">${t('all')} →</a>` : ''}</div>`;

  function card(p) {
    const a = availOf(p);
    const fav = state.favs.includes(p.id);
    const tag = p.isNew ? '<span class="tag new">Новинка</span>' : p.old ? `<span class="tag sale">Выгода ${money(p.old - p.price)}</span>` : p.hit ? '<span class="tag">Хит</span>' : '';
    return `<article class="card">
      <a class="card-art" href="#/product/${p.id}" style="--abg:${PAL[p.pal].bg}" aria-label="${esc(p.name)}">${art(p)}${tag}</a>
      <button type="button" class="fav" data-act="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="В избранное">${ic('heart')}</button>
      <div class="card-body">
        <div class="card-meta"><span>${p.sizes ? `${p.sizes[0].w} · 3 размера` : esc(p.weight)}</span></div>
        <h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
        <p>${esc(p.desc)}</p>
        <span class="avail ${a}">${availText(a)}</span>
        <div class="card-foot">
          <span class="price">${p.sizes ? priceFrom(p.sizes[0].price) : money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ''}</span>
          ${p.sizes ? `<a class="btn btn-sm btn-ghost" href="#/product/${p.id}">${t('chooseSize')}</a>` : `<button type="button" class="btn btn-sm" data-act="quickAdd" data-id="${p.id}">${t('toCart')}</button>`}
        </div>
      </div>
    </article>`;
  }

  /* ================= shop views ================= */
  function homeView() {
    const hero = byId['strawberry-cloud'];
    return `<div class="wrap">
      <section class="hero">
        <div class="hero-txt">
          <span class="kicker">${ic('star', 'ic-fill')} ${t('hit')}</span>
          <h1>Клубничное облако</h1>
          <p>Воздушный бисквит, нежный крем и щедрый слой ягод. Осталось позвать любимых.</p>
          <div class="hero-cta"><a class="btn btn-berry" href="#/product/${hero.id}">${t('chooseSize')}</a><span class="hero-price">${priceFrom(hero.sizes[0].price)}</span></div>
        </div>
        <div class="hero-art">${art(hero)}</div>
        <div class="hero-dots" aria-hidden="true"><i></i><i></i><i></i></div>
      </section>
      <nav class="cats" aria-label="Категории">${CATS.map((c) => `<a class="cat" href="#/catalog?cat=${c.id}"><span class="cat-art" style="--abg:${PAL[byId[c.sample].pal].bg}">${art(byId[c.sample])}</span>${esc(catName(c.id))}</a>`).join('')}</nav>
      ${secHead(t('recommended'), '#/catalog?cat=cakes')}
      <div class="grid">${['strawberry-cloud', 'chocolate-evening', 'honey-cake', 'berry-cheesecake'].map((id) => card(byId[id])).join('')}</div>
      <div class="perks">
        <div class="perk"><span class="pi">${ic('truck')}</span><b>Доставка к вашему времени</b><span>Бесплатно от ${money(FREE_FROM)}</span></div>
        <div class="perk"><span class="pi">${ic('store')}</span><b>Забрать по пути</b><span>Наличие по выбранной точке</span></div>
        <div class="perk"><span class="pi">5%</span><b>Вернётся бонусами</b><span>После получения заказа</span></div>
        <div class="perk"><span class="pi">−10%</span><b>WELCOME10</b><span>На первый заказ от 3 000 ₸</span></div>
      </div>
      ${secHead(t('occasions'))}
      <div class="occ">${OCCASIONS.map((o) => `<a href="#/catalog?for=${o.id}" style="--obg:${o.bg}"><span class="oa">${art(byId[o.sample])}</span><b>${esc(o.t)}</b><span>${esc(o.s)}</span></a>`).join('')}</div>
      ${secHead(t('newItems'), '#/catalog?sort=new')}
      <div class="grid">${PRODUCTS.filter((p) => p.isNew).slice(0, 4).map(card).join('')}</div>
      <div class="promo-band"><span class="big">−10%</span><div><b>Начнём со сладкого</b><span>Промокод <code>WELCOME10</code> на заказ от 3 000 ₸</span></div><a class="btn btn-berry" href="#/catalog?cat=cakes">Выбрать торт</a></div>
      ${secHead(t('sets'), '#/catalog?cat=gifts')}
      <div class="grid">${['macaron-classic', 'macaron-berry', 'choc-cookie', 'eclair'].map((id) => card(byId[id])).join('')}</div>
    </div>`;
  }

  function catalogView(r) {
    const cat = r.q.get('cat') || 'all';
    const q = (r.q.get('q') || '').trim().toLowerCase();
    const occ = r.q.get('for');
    const sort = r.q.get('sort') === 'new' ? 'new' : state.sort;
    let list = PRODUCTS.filter((p) => (cat === 'all' || p.cat === cat) && (!q || `${p.name} ${p.desc}`.toLowerCase().includes(q)) && (!occ || (p.for || []).includes(occ)));
    if (state.onlyToday) list = list.filter((p) => availOf(p) === 'today');
    const fromPrice = (p) => (p.sizes ? p.sizes[0].price : p.price);
    if (sort === 'cheap') list = [...list].sort((a, b) => fromPrice(a) - fromPrice(b));
    if (sort === 'exp') list = [...list].sort((a, b) => fromPrice(b) - fromPrice(a));
    if (sort === 'new') list = [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    const occObj = OCCASIONS.find((o) => o.id === occ);
    const title = q ? `Поиск: «${esc(r.q.get('q'))}»` : occObj ? esc(occObj.t) : cat === 'all' ? t('catalog') : esc(catName(cat));
    return `<div class="wrap">
      <nav class="crumbs"><a href="#/">${t('home')}</a> / ${t('catalog')}</nav>
      <div class="cat-head"><h1 class="page-h">${title}</h1><span class="muted">${list.length} ${plural(list.length, 'позиция', 'позиции', 'позиций')}</span></div>
      <div class="filters">
        <a class="fchip" href="#/catalog" aria-current="${cat === 'all' && !occ && !q}">Все</a>
        ${CATS.map((c) => `<a class="fchip" href="#/catalog?cat=${c.id}" aria-current="${cat === c.id}">${esc(catName(c.id))}</a>`).join('')}
        <span class="spacer"></span>
        <label class="check"><input type="checkbox" data-change="onlyToday" ${state.onlyToday ? 'checked' : ''}> Есть сегодня · ${esc(branch(state.branch).short)}</label>
        <select class="sel" data-change="sort" aria-label="Сортировка">
          ${[['pop', 'Популярные'], ['cheap', 'Сначала дешевле'], ['exp', 'Сначала дороже'], ['new', 'Сначала новинки']].map(([k, l]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty"><h2>Ничего не нашли</h2><p>Попробуйте другое слово или снимите фильтр по наличию.</p><div class="row"><a class="btn" href="#/catalog">Весь каталог</a></div></div>`}
    </div>`;
  }

  let pdp = { id: null };
  function productView(p) {
    if (pdp.id !== p.id) pdp = { id: p.id, size: p.sizes ? 1 : null, extras: [], qty: 1, text: '', tab: 'comp' };
    const unit = unitPrice({ id: p.id, size: pdp.size, extras: pdp.extras });
    const others = ['eclair', 'macaron-classic', 'almond-croissant', 'choc-cookie', 'forest-pie'].filter((id) => id !== p.id).slice(0, 4).map((id) => byId[id]);
    const tabBody = pdp.tab === 'comp' ? esc(p.comp)
      : pdp.tab === 'allergens' ? `Содержит: ${esc(p.allergens)}.`
        : `<div class="kbju">${[['ккал', p.kbju[0]], ['белки, г', p.kbju[1]], ['жиры, г', p.kbju[2]], ['углеводы, г', p.kbju[3]]].map(([l, v]) => `<div><b>${String(v).replace('.', ',')}</b><span>${l}</span></div>`).join('')}</div><p class="muted" style="margin-top:8px;font-size:13px">На 100 г продукта</p>`;
    return `<div class="wrap">
      <nav class="crumbs"><a href="#/">${t('home')}</a> / <a href="#/catalog?cat=${p.cat}">${esc(catName(p.cat))}</a> / ${esc(p.name)}</nav>
      <div class="pdp">
        <div class="pdp-art" style="--abg:${PAL[p.pal].bg}">${art(p)}</div>
        <div>
          ${p.isNew ? '<span class="kicker">Новинка</span>' : p.hit ? `<span class="kicker">${ic('star', 'ic-fill')} ${t('hit')}</span>` : ''}
          <h1>${esc(p.name)}</h1>
          <span class="rating">${ic('star', 'ic-fill')}<b>${p.rating.toLocaleString('ru-RU', { minimumFractionDigits: 1 })}</b> · ${p.reviews} ${plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')}</span>
          <p class="desc">${esc(p.desc)}</p>
          ${p.sizes ? `<p class="lbl">Размер</p><div class="sizes">${p.sizes.map((s, i) => `<button type="button" class="size" data-act="pdpSize" data-i="${i}" aria-pressed="${pdp.size === i}">${i === 1 ? '<span class="pop">чаще берут</span>' : ''}<b>${s.d} см</b><span>${s.w} · ${s.serv}</span><strong>${money(s.price)}</strong></button>`).join('')}</div>` : `<p class="lbl">Вес</p><p>${esc(p.weight)}</p>`}
          ${p.cat === 'cakes' ? `<p class="lbl">Добавить к торту</p><div class="opts">${EXTRAS.map((e) => `
            <label class="opt"><input type="checkbox" data-change="pdpExtra" value="${e.id}" ${pdp.extras.includes(e.id) ? 'checked' : ''}><span>${esc(e.name)}</span><span class="p">+${money(e.price)}</span></label>
            ${e.id === 'text' && pdp.extras.includes('text') ? `<div class="field opt-text"><input data-input="pdpText" maxlength="30" placeholder="Например: С днём рождения, мама!" value="${esc(pdp.text)}" aria-label="Текст надписи"></div>` : ''}`).join('')}</div>` : ''}
          <p class="lbl">Наличие</p>
          <div class="stock"><ul>${BRANCHES.map((b) => `<li class="${b.id === state.branch ? 'sel-branch' : ''}"><span>${esc(b.name)}${b.pickup ? '' : ' · для доставки'}</span><span class="avail ${p.avail[b.id]}">${p.avail[b.id] === 'today' ? 'сегодня' : 'к завтра, с 10:00'}</span></li>`).join('')}</ul></div>
          <div class="buy">
            <div class="stepper"><button type="button" data-act="pdpQty" data-d="-1" aria-label="Меньше" ${pdp.qty <= 1 ? 'disabled' : ''}>${ic('minus')}</button><span>${pdp.qty}</span><button type="button" data-act="pdpQty" data-d="1" aria-label="Больше">${ic('plus')}</button></div>
            <button type="button" class="btn btn-berry" data-act="pdpAdd">${t('toCart')} · ${money(unit * pdp.qty)}</button>
          </div>
          <div class="tabs" role="tablist">${[['comp', 'Состав'], ['allergens', 'Аллергены'], ['kbju', 'КБЖУ']].map(([k, l]) => `<button type="button" role="tab" data-act="pdpTab" data-k="${k}" aria-selected="${pdp.tab === k}">${l}</button>`).join('')}</div>
          <div class="tab-body" role="tabpanel">${tabBody}</div>
        </div>
      </div>
      ${secHead('С этим часто берут')}
      <div class="grid">${others.map(card).join('')}</div>
      ${secHead('Отзывы')}
      <div class="reviews">${REVIEWS.map((v) => `<article class="review"><div class="who">${esc(v.who)}<span aria-label="${v.stars} из 5">${'★'.repeat(v.stars)}${'☆'.repeat(5 - v.stars)}</span></div><p>${esc(v.text)}</p></article>`).join('')}</div>
    </div>`;
  }

  function emptyCart() {
    return `<div class="wrap"><nav class="crumbs"><a href="#/">${t('home')}</a> / ${t('cart')}</nav>
      <div class="empty" style="margin-top:20px"><h2>В корзине пока пусто</h2><p>Выберите торт или соберите тестовый заказ одним нажатием.</p>
      <div class="row"><a class="btn" href="#/catalog?cat=cakes">Выбрать торт</a><button type="button" class="btn btn-ghost" data-act="seedCart">Собрать демо-заказ</button></div></div></div>`;
  }

  function summary(T, ctx) {
    const issues = ctx === 'cart' ? availIssues() : [];
    const recvLine = state.recv.mode === 'delivery' ? `<div><span>Доставка</span><span>${T.delivery ? money(T.delivery) : 'бесплатно'}</span></div>` : '<div><span>Самовывоз</span><span>бесплатно</span></div>';
    return `<aside class="summary box">
      <h2>Итого</h2>
      ${ctx === 'cart' ? `
      <form class="promo" data-form="promo"><input name="code" placeholder="Промокод" value="${esc(state.promo)}" aria-label="Промокод" autocomplete="off" ${state.promo ? 'readonly' : ''}><button class="btn btn-sm btn-ghost">${state.promo ? 'Убрать' : 'Применить'}</button></form>
      ${state.promo ? (T.discount ? '<p class="okbox" style="margin:0 0 12px">WELCOME10: −10% на заказ</p>' : '<p class="warnbox" style="margin:0 0 12px">Промокод действует на заказ от 3 000 ₸</p>') : '<p class="muted" style="font-size:12.5px;margin:-2px 0 12px">Попробуйте WELCOME10</p>'}
      <label class="toggle"><span>Списать бонусы: <b>${NF.format(state.bonus)}</b><br><small class="muted">до 30% суммы заказа</small></span><input type="checkbox" data-change="useBonus" ${state.useBonus ? 'checked' : ''}></label>` : ''}
      <div class="sum-rows">
        <div><span>Товары, ${T.count} шт.</span><span>${money(T.subtotal)}</span></div>
        ${T.discount ? `<div class="minus"><span>Скидка по промокоду</span><span>−${money(T.discount)}</span></div>` : ''}
        ${T.bonusUsed ? `<div class="minus"><span>Бонусами</span><span>−${money(T.bonusUsed)}</span></div>` : ''}
        ${recvLine}
      </div>
      <div class="sum-total"><span>К оплате</span><b>${money(T.total)}</b></div>
      <div class="earn">${ic('gift')}+${NF.format(T.earn)} ${plural(T.earn, 'бонус', 'бонуса', 'бонусов')} после получения</div>
      ${ctx === 'cart'
        ? (issues.length ? '<button type="button" class="btn btn-berry btn-block" data-act="blocked">Перейти к оформлению</button>' : '<a class="btn btn-berry btn-block" href="#/checkout">Перейти к оформлению</a>')
        : `<button type="button" class="btn btn-berry btn-block" data-act="pay">Оплатить ${money(T.total)}</button><p class="hint">Тестовая оплата, деньги не списываются</p>`}
    </aside>`;
  }

  function cartView() {
    if (!state.cart.length) return emptyCart();
    const T = cartCalc();
    const R = state.recv;
    const issues = availIssues();
    const upsell = ['eclair', 'macaron-classic', 'choc-cookie', 'almond-croissant'].filter((id) => !state.cart.some((c) => c.id === id)).slice(0, 4);
    return `<div class="wrap">
      <nav class="crumbs"><a href="#/">${t('home')}</a> / ${t('cart')}</nav>
      <h1 class="page-h">${t('cart')}</h1>
      <div class="cart">
        <div class="stack">
          <section class="box">
            <div class="box-h"><h2>${T.count} ${plural(T.count, 'товар', 'товара', 'товаров')}</h2><button type="button" class="x" data-act="clearCart">Очистить</button></div>
            <ul class="items">${state.cart.map((it, i) => {
              const p = byId[it.id];
              return `<li class="item">
                <a class="thumb" href="#/product/${p.id}" style="--abg:${PAL[p.pal].bg}">${art(p)}</a>
                <div><h3>${esc(itemName(it))}</h3>${it.extras.length ? `<p class="sub">+ ${esc(itemExtras(it))}</p>` : ''}<p class="sub">${money(unitPrice(it))} за шт.</p></div>
                <div class="right"><b>${money(unitPrice(it) * it.qty)}</b>
                  <div class="stepper sm"><button type="button" data-act="qty" data-i="${i}" data-d="-1" aria-label="Меньше">${ic('minus')}</button><span>${it.qty}</span><button type="button" data-act="qty" data-i="${i}" data-d="1" aria-label="Больше">${ic('plus')}</button></div>
                </div>
              </li>`;
            }).join('')}</ul>
          </section>
          <section class="box">
            <h2>Как получить</h2>
            <div class="seg" role="group" aria-label="Способ получения"><button type="button" data-act="mode" data-v="pickup" aria-pressed="${R.mode === 'pickup'}">${ic('store')}Самовывоз</button><button type="button" data-act="mode" data-v="delivery" aria-pressed="${R.mode === 'delivery'}">${ic('truck')}Доставка</button></div>
            ${R.mode === 'pickup'
              ? `<div class="choices">${BRANCHES.filter((b) => b.pickup).map((b) => `<button type="button" class="choice" data-act="pickup" data-v="${b.id}" aria-pressed="${R.pickup === b.id}"><b>${esc(b.name)}</b><span>${esc(b.hours)}</span></button>`).join('')}</div>`
              : `<div class="choices">${ZONES.map((z) => `<button type="button" class="choice" data-act="zone" data-v="${z.id}" aria-pressed="${R.zone === z.id}"><b>${z.name} · ${T.subtotal - T.discount >= FREE_FROM ? 'бесплатно' : money(z.fee)}</b><span>${esc(z.area)}</span></button>`).join('')}</div>
                 <label class="field" style="margin-top:14px"><span>Адрес</span><input data-input="address" value="${esc(R.address)}" placeholder="Улица, дом, квартира" autocomplete="street-address"></label>
                 <div class="days" style="margin-top:10px">${ADDRESSES.map((a) => `<button type="button" class="slot" data-act="addr" data-v="${esc(a)}">${esc(a.split(':')[0])}</button>`).join('')}</div>
                 <p class="muted" style="font-size:13px">Бесплатно от ${money(FREE_FROM)} в любой зоне.</p>`}
            <p class="lbl">Когда</p>
            <div class="days">${[0, 1, 2].map((i) => `<button type="button" class="slot" data-act="day" data-v="${i}" aria-pressed="${R.day === i}">${dayLabel(i)}</button>`).join('')}</div>
            <div class="slots">${SLOTS.map((s) => { const why = (BUSY[R.day] || {})[s]; return `<button type="button" class="slot" data-act="slot" data-v="${s}" aria-pressed="${R.slot === s && !why}" ${why ? 'disabled' : ''}>${s}${why ? `<small>${why}</small>` : ''}</button>`; }).join('')}</div>
            ${issues.length ? `<p class="warnbox">${issues.map(({ it, b }) => `«${esc(itemName(it))}» в ${esc(branch(b).name)} будет готов к завтра.`).join(' ')} Выберите завтрашний день${R.mode === 'pickup' ? ' или другую точку' : ''}.</p>` : ''}
          </section>
        </div>
        ${summary(T, 'cart')}
      </div>
      ${upsell.length ? `${secHead('Добавить к заказу')}<div class="grid">${upsell.map((id) => card(byId[id])).join('')}</div>` : ''}
    </div>`;
  }

  function checkoutView() {
    if (!state.cart.length) return emptyCart();
    const T = cartCalc();
    const R = state.recv;
    const Pf = state.profile;
    const recvText = R.mode === 'delivery' ? `Доставка, ${ZONES.find((z) => z.id === R.zone).name}${R.address ? `: ${esc(R.address)}` : ' · <b style="color:var(--bad)">укажите адрес</b>'}` : `Самовывоз, ${esc(branch(R.pickup).name)}`;
    return `<div class="wrap">
      <nav class="crumbs"><a href="#/cart">${t('cart')}</a> / Оформление</nav>
      <h1 class="page-h">Оформление заказа</h1>
      <div class="cart">
        <div class="stack">
          <section class="box"><h2>1. Телефон</h2>
            <form class="row-form" data-form="code">
              <input name="phone" value="${esc(Pf.phone)}" inputmode="tel" aria-label="Телефон" ${Pf.verified ? 'readonly' : ''}>
              ${Pf.verified ? `<span class="verified">${ic('check')} подтверждён</span>` : Pf.codeSent ? '<input name="code" placeholder="Код" maxlength="4" inputmode="numeric" autocomplete="one-time-code" aria-label="Код из сообщения"><button class="btn btn-sm">Подтвердить</button>' : '<button class="btn btn-sm">Получить код</button>'}
            </form>
            ${Pf.codeSent && !Pf.verified ? '<p class="muted" style="font-size:13px;margin-top:8px">Код отправлен в WhatsApp. В демо подойдёт <b>1234</b>.</p>' : ''}
            <label class="field" style="margin-top:14px"><span>Имя</span><input data-input="name" value="${esc(Pf.name)}" autocomplete="given-name"></label>
          </section>
          <section class="box"><div class="box-h"><h2>2. Получение</h2><a class="link" href="#/cart">Изменить</a></div>
            <dl class="kv"><dt>Как</dt><dd>${recvText}</dd><dt>Когда</dt><dd>${dayLabel(R.day)}, ${R.slot}</dd></dl>
          </section>
          <section class="box"><h2>3. Оплата</h2>
            <div class="pays">
              <button type="button" class="payopt" data-act="payMethod" data-v="kaspi" aria-pressed="${state.pay === 'kaspi'}"><span class="logo-k" style="background:#e5484d">K</span><b>Kaspi.kz</b><span>Подтверждение в приложении</span></button>
              <button type="button" class="payopt" data-act="payMethod" data-v="forte" aria-pressed="${state.pay === 'forte'}"><span class="logo-k" style="background:#3b5bb5">F</span><b>Карта · Forte</b><span>Visa, Mastercard</span></button>
            </div>
            <label class="field" style="margin-top:14px"><span>Комментарий к заказу</span><textarea data-input="comment" placeholder="Например: позвонить за 15 минут">${esc(state.comment)}</textarea></label>
          </section>
        </div>
        ${summary(T, 'checkout')}
      </div>
    </div>`;
  }

  function findOrder(id) { return state.orders.find((x) => x.id === id) || state.history.find((x) => x.id === id); }

  function orderView(id) {
    const o = findOrder(id);
    if (!o) return notFound();
    const del = o.recv.mode === 'delivery';
    const steps = del ? [['new', 'Принят'], ['cooking', 'Готовится'], ['delivering', 'В пути'], ['done', 'Доставлен']] : [['new', 'Принят'], ['cooking', 'Готовится'], ['ready', 'Готов к выдаче'], ['done', 'Выдан']];
    const flow = ['new', 'cooking', 'ready', 'delivering', 'done'];
    const cur = flow.indexOf(o.status);
    const curStep = steps.reduce((acc, [k], i) => (flow.indexOf(k) <= cur ? i : acc), 0);
    return `<div class="wrap">
      <div class="done-h"><span class="okc">${ic('check')}</span><div><h1>Заказ ${o.id} оплачен</h1><p class="muted">Тестовая оплата через ${esc(o.pay)}. Статусы придут в WhatsApp.</p></div></div>
      <div class="cart">
        <div class="stack">
          <section class="box"><div class="box-h"><h2>Статус</h2><span class="st s-${o.status}">${statusLabel(o)}</span></div>
            <ol class="track">${steps.map(([, l], i) => `<li class="${i <= curStep ? 'on' : ''} ${i === curStep && o.status !== 'done' ? 'cur' : ''}">${l}</li>`).join('')}</ol>
          </section>
          ${o.mine && o.status !== 'done' ? `<div class="callout"><div><b>Заказ уже у команды</b><p>В управлении он первый в списке. Нажмите там кнопку статуса, и здесь всё обновится. Бонусы начислятся после получения.</p></div><a class="btn" href="#/admin/orders?hl=${o.id}">Открыть в управлении</a></div>` : ''}
          <section class="box"><h2>Детали</h2>
            <dl class="kv">
              <dt>Получение</dt><dd>${del ? `Доставка, зона ${o.recv.zone}${o.recv.address ? `, ${esc(o.recv.address)}` : ''}` : `Самовывоз, ${esc(branch(o.recv.branch).name)}`}</dd>
              <dt>Когда</dt><dd>${o.date ? esc(o.date) : dayLabel(o.recv.day)}, ${o.recv.slot}</dd>
              <dt>Состав</dt><dd>${o.items.map(itemShort).join('<br>')}</dd>
              <dt>Оплачено</dt><dd><b>${money(o.totals.total)}</b>${o.totals.bonusUsed ? ` <span class="muted">(бонусами ${money(o.totals.bonusUsed)})</span>` : ''}</dd>
              <dt>Бонусы</dt><dd>${o.earned ? `+${o.totals.earn} начислено` : `+${o.totals.earn} после получения`}</dd>
            </dl>
          </section>
        </div>
        <aside class="summary box"><h2>Что дальше</h2><p class="muted" style="margin-bottom:16px">Мы пришлём сообщение, когда заказ будет готов${del ? ' и когда курьер выедет' : ''}.</p>
          <div style="display:grid;gap:8px"><a class="btn btn-block" href="#/">Вернуться в магазин</a><a class="btn btn-ghost btn-block" href="#/account">Мои заказы</a></div></aside>
      </div>
    </div>`;
  }

  function accountView() {
    const Pf = state.profile;
    const mine = state.orders.filter((o) => o.mine).map((o) => ({ ...o, date: 'Сегодня' }));
    const all = [...mine, ...state.history];
    const phoneMasked = Pf.phone.replace(/(\d{3})\s?(\d{2})\s?(\d{2})$/, '*** ** $3');
    return `<div class="wrap">
      <div class="acc-top"><span class="ava">${esc((Pf.name || 'А')[0])}</span><div><h1>${esc(Pf.name)}</h1><p class="muted">${esc(phoneMasked)} · вход по коду из WhatsApp</p></div></div>
      <div class="acc-cards">
        <div class="acc-card hl"><p class="k">Бонусы</p><p class="v">${NF.format(state.bonus)}</p><p>1 бонус = 1 ₸. Оплачивают до 30% заказа, возвращается до 5%.</p></div>
        <div class="acc-card"><p class="k">Скидка в день рождения</p><p class="v">−10%</p><p>За 3 дня до и после дня рождения</p></div>
        <div class="acc-card"><p class="k">Адреса</p><p class="v" style="font-size:22px">${ADDRESSES.length} ${plural(ADDRESSES.length, 'адрес', 'адреса', 'адресов')}</p><p>${ADDRESSES.map(esc).join('<br>')}</p></div>
      </div>
      <section class="box"><div class="box-h"><h2>Мои заказы</h2><span class="muted">${all.length} ${plural(all.length, 'заказ', 'заказа', 'заказов')}</span></div>
        <ul class="hist">${all.map((o) => `<li>
          <div><p class="d">${esc(o.date)} · <a class="link" href="#/order/${o.id}">${o.id}</a></p><p class="what">${o.items.map(itemShort).join(', ')}</p><p class="d">${money(o.totals.total)}</p></div>
          <span class="st s-${o.status}">${statusLabel(o)}</span>
          <button type="button" class="btn btn-sm btn-ghost" data-act="repeat" data-id="${o.id}">${ic('repeat')} Повторить</button>
        </li>`).join('')}</ul>
      </section>
    </div>`;
  }

  function notFound() {
    return `<div class="wrap"><div class="empty" style="margin-top:28px"><h2>Страница не найдена</h2><p>Возможно, ссылка устарела.</p><div class="row"><a class="btn" href="#/">На главную</a></div></div></div>`;
  }

  /* ================= team workspace ================= */
  function hourChart(list) {
    const hours = [];
    for (let h = 8; h <= 20; h += 1) hours.push(h);
    const hourOf = (o) => Math.min(20, Math.max(8, Number(o.time.slice(0, 2))));
    const vals = hours.map((h) => sum(list.filter((o) => hourOf(o) === h), (o) => o.totals.total));
    const max = Math.max(...vals, 1);
    const W = 560; const H = 170; const pb = 22; const top = 10;
    const bw = W / hours.length;
    const nowH = new Date().getHours();
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Выручка по часам">
      ${[0.25, 0.5, 0.75, 1].map((f) => { const y = (H - pb) - (H - pb - top) * f; return `<line class="grid" x1="0" x2="${W}" y1="${y}" y2="${y}"/>`; }).join('')}
      ${hours.map((h, i) => {
        const v = vals[i];
        const bh = (H - pb - top) * (v / max);
        const x = i * bw + bw * 0.18;
        return `<rect class="bar ${h === nowH ? 'hi' : ''}" x="${x.toFixed(1)}" y="${(H - pb - bh).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(bh, v ? 2 : 0).toFixed(1)}" rx="4"><title>${h}:00 · ${money(v)}</title></rect><text class="tick" x="${(x + bw * 0.32).toFixed(1)}" y="${H - 6}" text-anchor="middle">${h}</text>`;
      }).join('')}
    </svg>`;
  }

  function ordersTable(list, full, hl) {
    const showMoney = state.role === 'owner';
    if (!list.length) return '<p class="muted">Заказов с таким статусом нет</p>';
    return `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Заказ</th>${full ? '<th>Клиент</th>' : ''}<th>Состав</th><th>Получение</th>${showMoney ? '<th class="num">Сумма</th>' : ''}<th>Статус</th>${full ? '<th><span class="sr">Действие</span></th>' : ''}</tr></thead>
      <tbody>${list.map((o) => {
        const nx = nextStatus(o);
        return `<tr class="${o.mine ? 'fresh' : ''} ${hl === o.id ? 'hl' : ''}">
          <td class="id">${o.id}${o.mine ? '<span class="newtag">с сайта</span>' : ''}<div class="sub">${o.time}</div></td>
          ${full ? `<td>${esc(o.customer)}<div class="sub">${esc(o.pay)}${o.repeat ? ' · повторный' : ''}</div></td>` : ''}
          <td>${o.items.map(itemShort).join('<br>')}</td>
          <td>${recvShort(o.recv)}<div class="sub">${o.recv.slot}</div></td>
          ${showMoney ? `<td class="num">${money(o.totals.total)}</td>` : ''}
          <td><span class="st s-${o.status}">${statusLabel(o)}</span></td>
          ${full ? `<td>${nx ? `<button type="button" class="adv" data-act="adv" data-id="${o.id}">${nx.btn} →</button>` : ''}</td>` : ''}
        </tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function admOverview(list) {
    const revenue = sum(list, (o) => o.totals.total);
    const active = list.filter((o) => o.status !== 'done');
    const avg = list.length ? revenue / list.length : 0;
    const rep = pct(list.filter((o) => o.repeat).length, list.length);
    const kaspi = sum(list.filter((o) => o.pay === 'Kaspi'), (o) => o.totals.total);
    const forte = revenue - kaspi;
    const bonusPaid = sum(list, (o) => o.totals.bonusUsed);
    const extrasRev = sum(list, (o) => sum(o.items, (i) => sum(i.extras || [], (e) => extra(e).price) * i.qty));
    const low = state.stock.filter((s) => s.qty < s.min);
    const todayLong = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    return `
      <div class="kpis">
        <div class="kpi"><p class="k">Выручка с сайта</p><p class="v">${money(revenue)}</p><p class="s">${list.length} ${plural(list.length, 'заказ', 'заказа', 'заказов')} за сегодня</p></div>
        <div class="kpi"><p class="k">В работе</p><p class="v">${active.length}</p><p class="s">${list.filter((o) => o.status === 'new').length} новых ждут кондитера</p></div>
        <div class="kpi"><p class="k">Средний чек</p><p class="v">${money(avg)}</p><p class="s up">допродажи ${money(extrasRev)}</p></div>
        <div class="kpi"><p class="k">Повторные покупатели</p><p class="v">${rep}%</p><p class="s">уже заказывали раньше</p></div>
      </div>
      <div class="adm-grid">
        <section class="panel"><div class="panel-h"><h2>Выручка по часам</h2><span>${todayLong}</span></div>${hourChart(list)}</section>
        <section class="panel"><div class="panel-h"><h2>Деньги за день</h2></div>
          <div class="money">
            <div class="bar"><i style="width:${pct(kaspi, revenue)}%;background:#e5484d"></i><i style="width:${pct(forte, revenue)}%;background:#3b5bb5"></i></div>
            <div class="legend"><span><i style="background:#e5484d"></i>Kaspi</span><span><i style="background:#3b5bb5"></i>Forte</span></div>
            <div><span>Kaspi</span><b>${money(kaspi)}</b></div>
            <div><span>Forte</span><b>${money(forte)}</b></div>
            <div><span>Оплачено бонусами</span><b>${money(bonusPaid)}</b></div>
            <div><span>Возвраты</span><b>${money(0)}</b></div>
          </div>
        </section>
      </div>
      <div class="adm-grid">
        <section class="panel"><div class="panel-h"><h2>Последние заказы</h2><a href="#/admin/orders">Все заказы →</a></div>${ordersTable(list.slice(0, 5), false)}</section>
        <section class="panel">
          <div class="panel-h"><h2>Сырьё ниже минимума</h2><a href="#/admin/stock">Склад →</a></div>
          ${low.length ? `<ul class="low">${low.map((s) => `<li><span>${esc(s.name)}<br><small class="muted">${fmtQty(s.qty)} из ${fmtQty(s.min)} ${s.unit}</small></span>${s.ordered ? '<span class="st s-done">заказано</span>' : `<button type="button" class="adv" data-act="restock" data-id="${s.id}">Заказать</button>`}<span class="meter"><i style="width:${pct(s.qty, s.min)}%"></i></span></li>`).join('')}</ul>` : '<p class="muted">Всё в норме</p>'}
          <div class="panel-h" style="margin-top:20px"><h2>Точки</h2><span>заказы · выручка</span></div>
          <table class="tbl"><tbody>${BRANCHES.map((b) => { const bl = state.orders.filter((o) => o.recv.branch === b.id); return `<tr><td>${esc(b.name)}</td><td class="num">${bl.length}</td><td class="num">${money(sum(bl, (o) => o.totals.total))}</td></tr>`; }).join('')}</tbody></table>
        </section>
      </div>`;
  }

  function admOrders(list, hl) {
    const f = state.ordFilter;
    const counts = { all: list.length };
    ['new', 'cooking', 'ready', 'delivering', 'done'].forEach((s) => { counts[s] = list.filter((o) => o.status === s).length; });
    const shown = f === 'all' ? list : list.filter((o) => o.status === f);
    return `<section class="panel">
      <div class="fchips">${[['all', 'Все'], ['new', 'Новые'], ['cooking', 'Готовятся'], ['ready', 'Готовы'], ['delivering', 'В пути'], ['done', 'Завершены']].map(([k, l]) => `<button type="button" data-act="ordFilter" data-v="${k}" aria-pressed="${f === k}">${l} <small>${counts[k]}</small></button>`).join('')}</div>
      ${ordersTable(shown, true, hl)}
    </section>`;
  }

  function batches(list) {
    const groups = new Map();
    list.filter((o) => o.status === 'new' || o.status === 'cooking').forEach((o) => o.items.forEach((i) => {
      const key = `${i.id}|${i.size ?? ''}`;
      const g = groups.get(key) || { key, id: i.id, size: i.size, qty: 0, orders: [], slot: '99', status: 'cooking' };
      g.qty += i.qty;
      if (!g.orders.includes(o.id)) g.orders.push(o.id);
      if (o.recv.slot < g.slot) g.slot = o.recv.slot;
      if (o.status === 'new') g.status = 'new';
      groups.set(key, g);
    }));
    return [...groups.values()].sort((a, b) => a.slot.localeCompare(b.slot));
  }

  function admProduction(list) {
    const arr = batches(list);
    if (!arr.length) return '<section class="panel"><p class="muted">Все партии на сегодня готовы. Новые заказы появятся здесь сразу после оплаты.</p></section>';
    return `<p class="muted" style="margin:-6px 0 14px">${arr.length} ${plural(arr.length, 'партия', 'партии', 'партий')} по оплаченным заказам, по времени, к которому заказ нужен.</p>
      <div class="batches">${arr.map((g) => {
        const p = byId[g.id];
        return `<article class="batch">
          <span class="thumb" style="--abg:${PAL[p.pal].bg}">${art(p)}</span>
          <h3>${esc(p.name)}${p.sizes ? `, ${p.sizes[g.size].d} см` : ''} × ${g.qty}</h3>
          <p class="sub">к ${g.slot.split('–')[0]} · ${g.orders.join(', ')}</p>
          <div class="row">${g.status === 'new' ? `<span class="st s-new">ждёт</span><button type="button" class="adv" data-act="batch" data-key="${g.key}" data-to="cooking">Начать</button>` : `<span class="st s-cooking">в работе</span><button type="button" class="adv" data-act="batch" data-key="${g.key}" data-to="ready">Готово</button>`}</div>
        </article>`;
      }).join('')}</div>`;
  }

  function admStock() {
    return `<section class="panel"><div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Сырьё</th><th class="num">Остаток</th><th class="num">Минимум</th><th>Уровень</th><th><span class="sr">Действие</span></th></tr></thead>
      <tbody>${state.stock.map((s) => {
        const low = s.qty < s.min;
        const w = Math.min(100, Math.round((s.qty / (s.min * 2)) * 100));
        return `<tr><td>${esc(s.name)}</td><td class="num">${fmtQty(s.qty)} ${s.unit}</td><td class="num">${fmtQty(s.min)} ${s.unit}</td>
          <td><div class="lvl"><i class="${low ? 'lowc' : ''}" style="width:${w}%"></i></div></td>
          <td>${low ? (s.ordered ? '<span class="st s-done">заказано, привезут завтра</span>' : `<button type="button" class="adv" data-act="restock" data-id="${s.id}">Заказать ${fmtQty(s.buy)} ${s.unit}</button>`) : '<span class="muted" style="font-size:13px">норма</span>'}</td></tr>`;
      }).join('')}</tbody></table></div></section>`;
  }

  function adminView(r) {
    const role = ROLES[state.role] || ROLES.owner;
    let sec = r.parts[1] || 'overview';
    if (!role.sections.includes(sec)) {
      sec = role.sections[0];
      history.replaceState(null, '', `#/admin/${sec}`);
    }
    const hl = r.q.get('hl');
    if (hl) state.ordFilter = 'all';
    const list = state.admBranch === 'all' ? state.orders : state.orders.filter((o) => o.recv.branch === state.admBranch);
    const NAV = { overview: ['Обзор', 'dash'], orders: ['Заказы', 'list'], production: ['Производство', 'chef'], stock: ['Склад', 'box'] };
    const newCount = list.filter((o) => o.status === 'new').length;
    const lowCount = state.stock.filter((s) => s.qty < s.min && !s.ordered).length;
    const content = sec === 'orders' ? admOrders(list, hl) : sec === 'production' ? admProduction(list) : sec === 'stock' ? admStock() : admOverview(list);
    const dateLine = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    return `<div class="adm">
      <aside class="adm-side">
        <a class="adm-logo" href="#/admin"><b>tika</b><small>управление</small></a>
        <nav class="adm-nav" aria-label="Управление">${role.sections.map((k) => `<a href="#/admin/${k}" ${k === sec ? 'aria-current="page"' : ''}>${ic(NAV[k][1])}${NAV[k][0]}${k === 'orders' && newCount ? `<span class="cnt">${newCount}</span>` : ''}${k === 'stock' && lowCount ? `<span class="cnt">${lowCount}</span>` : ''}</a>`).join('')}</nav>
        <p class="adm-soon-h">Ещё в проекте</p>
        <ul class="adm-soon"><li>Закупки</li><li>Филиалы</li><li>Финансы</li><li>Клиенты</li><li>Аналитика</li><li>Промокоды</li><li>Доставка</li><li>Команда и роли</li><li>Интеграции</li></ul>
        <a class="adm-back" href="#/">${ic('chevL')} В магазин</a>
      </aside>
      <section class="adm-main">
        <header class="adm-top">
          <div><h1>${NAV[sec][0]}</h1><p>${dateLine} · демо-данные рабочего дня</p></div>
          <div class="adm-tools">
            <label>Точка <select data-change="admBranch">${[['all', 'Все точки'], ...BRANCHES.map((b) => [b.id, b.name])].map(([v, l]) => `<option value="${v}" ${state.admBranch === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
            <label>Роль <select data-change="role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${state.role === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></label>
          </div>
        </header>
        ${role.info ? `<p class="roleinfo">${esc(role.info)}</p>` : ''}
        ${content}
      </section>
    </div>`;
  }

  /* ================= actions ================= */
  function resetDemo() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    state = fresh();
    pdp = { id: null };
    save();
    if (location.hash === '#/' || location.hash === '') render(); else location.hash = '/';
  }

  function pay() {
    if (!state.cart.length) return;
    if (availIssues().length) { toast('Часть товаров будет готова только завтра. Выберите другой день в корзине.'); return; }
    if (state.recv.mode === 'delivery' && !state.recv.address.trim()) { toast('Укажите адрес доставки. <a href="#/cart">В корзину</a>'); return; }
    if (!state.profile.verified) state.profile.verified = true;
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="card-pay"><span class="spin" aria-hidden="true"></span><b>Ждём подтверждение в ${state.pay === 'kaspi' ? 'Kaspi' : 'Forte'}</b><span class="muted" style="font-size:13px">Тестовый платёж</span></div>`;
    document.body.appendChild(ov);
    setTimeout(() => {
      const T = cartCalc();
      const R = state.recv;
      const id = `T-${state.nextId}`;
      state.nextId += 1;
      state.orders.unshift({
        id, time: nowHM(), customer: state.profile.name || 'Покупатель', items: clone(state.cart),
        recv: { mode: R.mode, branch: R.mode === 'pickup' ? R.pickup : 'kitchen', zone: R.zone, slot: R.slot, day: R.day, address: R.address },
        status: 'new', pay: state.pay === 'kaspi' ? 'Kaspi' : 'Forte', repeat: true, mine: true, totals: T, comment: state.comment,
      });
      state.bonus -= T.bonusUsed;
      state.cart = []; state.promo = ''; state.useBonus = false; state.comment = '';
      save();
      ov.remove();
      post({ type: 'event', name: 'order_paid', data: { total: T.total } });
      location.hash = `/order/${id}`;
    }, 1100);
  }

  const A = {
    lang: (el) => { state.lang = el.dataset.v; },
    fav: (el) => { const id = el.dataset.id; state.favs = state.favs.includes(id) ? state.favs.filter((x) => x !== id) : [...state.favs, id]; },
    quickAdd: (el) => {
      const p = byId[el.dataset.id];
      addToCart({ id: p.id, size: null, qty: 1, extras: [] });
      toast(`Добавили: ${esc(p.name)} <a href="#/cart">В корзину →</a>`);
    },
    pdpSize: (el) => { pdp.size = Number(el.dataset.i); },
    pdpQty: (el) => { pdp.qty = Math.max(1, pdp.qty + Number(el.dataset.d)); },
    pdpTab: (el) => { pdp.tab = el.dataset.k; },
    pdpAdd: () => {
      if (pdp.extras.includes('text') && !pdp.text.trim()) { toast('Напишите текст надписи или снимите галочку'); return false; }
      const it = { id: pdp.id, size: pdp.size, qty: pdp.qty, extras: [...pdp.extras] };
      if (pdp.extras.includes('text')) it.text = pdp.text.trim();
      addToCart(it);
      toast(`Добавили: ${esc(itemName(it))} <a href="#/cart">В корзину →</a>`);
      post({ type: 'event', name: 'add_to_cart', data: { id: it.id } });
    },
    qty: (el) => {
      const i = Number(el.dataset.i);
      state.cart[i].qty += Number(el.dataset.d);
      if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
    },
    clearCart: () => { state.cart = []; },
    seedCart: () => { seedCart(); },
    mode: (el) => { state.recv.mode = el.dataset.v; },
    pickup: (el) => { state.recv.pickup = el.dataset.v; },
    zone: (el) => { state.recv.zone = Number(el.dataset.v); },
    addr: (el) => { state.recv.address = el.dataset.v.split(': ').slice(1).join(': ') || el.dataset.v; },
    day: (el) => {
      state.recv.day = Number(el.dataset.v);
      const busy = BUSY[state.recv.day] || {};
      if (busy[state.recv.slot]) state.recv.slot = SLOTS.find((s) => !busy[s]);
    },
    slot: (el) => { state.recv.slot = el.dataset.v; },
    blocked: () => { toast('Часть товаров будет готова только завтра. Выберите другой день.'); return false; },
    payMethod: (el) => { state.pay = el.dataset.v; },
    pay: () => { pay(); return false; },
    repeat: (el) => {
      const o = findOrder(el.dataset.id);
      if (!o) return false;
      o.items.forEach((it) => addToCart(clone(it)));
      save();
      toast('Цены и наличие проверены, всё добавлено в корзину');
      location.hash = '/cart';
      return false;
    },
    adv: (el) => {
      const o = state.orders.find((x) => x.id === el.dataset.id);
      const nx = o && nextStatus(o);
      if (nx) { setStatus(o, nx.to); toast(`${o.id}: ${statusLabel(o).toLowerCase()}${o.mine ? '. Покупатель видит новый статус' : ''}`); }
    },
    ordFilter: (el) => { state.ordFilter = el.dataset.v; },
    batch: (el) => {
      const [id, size] = el.dataset.key.split('|');
      const to = el.dataset.to;
      state.orders.filter((o) => (o.status === 'new' || o.status === 'cooking') && o.items.some((i) => i.id === id && String(i.size ?? '') === size))
        .forEach((o) => { if (to === 'cooking' && o.status === 'new') setStatus(o, 'cooking'); if (to === 'ready') setStatus(o, 'ready'); });
      toast(to === 'ready' ? 'Партия готова, заказы переведены в «Готов»' : 'Партия в работе');
    },
    restock: (el) => {
      const s = state.stock.find((x) => x.id === el.dataset.id);
      if (s) { s.ordered = true; toast(`Закупка создана: ${esc(s.name)}, ${fmtQty(s.buy)} ${s.unit}. Заявка ушла поставщику (тест)`); }
    },
  };
  const C = {
    branch: (el) => { state.branch = el.value; },
    pdpExtra: (el) => { const v = el.value; pdp.extras = el.checked ? [...pdp.extras, v] : pdp.extras.filter((x) => x !== v); },
    useBonus: (el) => { state.useBonus = el.checked; },
    onlyToday: (el) => { state.onlyToday = el.checked; },
    sort: (el) => {
      state.sort = el.value;
      const r = route();
      if (r.q.has('sort')) {
        r.q.delete('sort');
        const qs = r.q.toString();
        history.replaceState(null, '', `#${r.path}${qs ? `?${qs}` : ''}`);
      }
    },
    role: (el) => { state.role = el.value; },
    admBranch: (el) => { state.admBranch = el.value; },
  };
  const I = {
    pdpText: (el) => { pdp.text = el.value; },
    address: (el) => { state.recv.address = el.value; save(); },
    name: (el) => { state.profile.name = el.value; save(); },
    comment: (el) => { state.comment = el.value; save(); },
  };
  const F = {
    search: (f) => { const q = f.elements.q.value.trim(); location.hash = q ? `/catalog?q=${encodeURIComponent(q)}` : '/catalog'; return false; },
    promo: (f) => {
      if (state.promo) { state.promo = ''; return true; }
      const code = f.elements.code.value.trim().toUpperCase();
      if (code === 'WELCOME10') { state.promo = code; toast('Промокод применён'); return true; }
      toast(code ? 'Такого промокода нет. Попробуйте WELCOME10' : 'Введите промокод');
      return false;
    },
    code: (f) => {
      const Pf = state.profile;
      if (Pf.verified) return false;
      if (!Pf.codeSent) { Pf.phone = f.elements.phone.value.trim() || Pf.phone; Pf.codeSent = true; toast('Код отправлен в WhatsApp (тест). Введите 1234'); return true; }
      const c = f.elements.code ? f.elements.code.value.trim() : '';
      if (c === '1234') { Pf.verified = true; toast('Номер подтверждён'); return true; }
      toast('Неверный код. В демо подойдёт 1234');
      return false;
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !A[el.dataset.act]) return;
    e.preventDefault();
    if (A[el.dataset.act](el, e) !== false) { save(); render(); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el || !C[el.dataset.change]) return;
    C[el.dataset.change](el);
    save();
    render();
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && I[el.dataset.input]) I[el.dataset.input](el);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]');
    if (!f || !F[f.dataset.form]) return;
    e.preventDefault();
    if (F[f.dataset.form](f) !== false) { save(); render(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') post({ type: 'escape' }); });

  /* ================= router ================= */
  function route() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [p, qs = ''] = h.split('?');
    const parts = p.split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
    return { path: `/${parts.join('/')}`, parts, q: new URLSearchParams(qs) };
  }

  let lastHash = null;
  function render() {
    let r = route();
    if (r.parts[0] === 'cart' && r.q.get('seed')) { seedCart(); history.replaceState(null, '', '#/cart'); r = route(); }
    const [a, b] = r.parts;
    let html;
    if (a === 'admin') {
      html = adminView(r);
    } else {
      let body;
      if (!a) body = homeView();
      else if (a === 'catalog') body = catalogView(r);
      else if (a === 'product' && byId[b]) body = productView(byId[b]);
      else if (a === 'cart') body = cartView();
      else if (a === 'checkout') body = checkoutView();
      else if (a === 'order') body = orderView(b);
      else if (a === 'account') body = accountView();
      else body = notFound();
      html = `${header(r)}<main class="main" id="main">${body}</main>${footer()}${tabbar(r)}`;
    }
    const sameView = lastHash === location.hash;
    const y = window.scrollY;
    app.innerHTML = html;
    window.scrollTo(0, sameView ? y : 0);
    if (!sameView) {
      // scrollIntoView would also scroll the parent proposal page, so scroll only this window
      const row = document.querySelector('tr.hl');
      if (row) window.scrollTo(0, Math.max(0, row.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2));
    }
    lastHash = location.hash;
    document.documentElement.lang = state.lang === 'kz' ? 'kk' : 'ru';
    post({ type: 'route', path: location.hash.replace(/^#/, '') || '/', title: viewTitle() });
  }

  // Human name of the current screen, shown by the proposal above the laptop
  function viewTitle() {
    const [a, b] = route().parts;
    if (a === 'admin') return { overview: 'Обзор руководителя', orders: 'Заказы команды', production: 'План производства', stock: 'Склад' }[b || 'overview'] || 'Управление';
    if (a === 'product' && byId[b]) return byId[b].name;
    if (a === 'order') return `Статус заказа ${b || ''}`.trim();
    return { catalog: 'Каталог', cart: 'Корзина и получение', checkout: 'Оформление и оплата', account: 'Кабинет покупателя' }[a] || 'Главная магазина';
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const m = e.data;
    if (!m || m.source !== 'kp') return;
    if (m.type === 'navigate') {
      if (location.hash === `#${m.route}`) { lastHash = null; render(); } else location.hash = m.route;
    }
    if (m.type === 'history') history.go(m.dir);
    if (m.type === 'reset') resetDemo();
  });
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try { const next = JSON.parse(e.newValue); if (next && next.v === VERSION) { state = next; render(); } } catch { /* ignore */ }
  });

  render();
  post({ type: 'ready' });
})();
