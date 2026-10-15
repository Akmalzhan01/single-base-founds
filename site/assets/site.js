/* Караван Ихлас — визитка сайт.
   Маалымат сервер тарабынан <script id="site-data"> ичине салынат (кошумча суроо жок).
   Админ киргизген текст ар дайым textContent аркылуу чыгат — HTML катары аткарылбайт.
   Анимациялар — GSAP + ScrollTrigger (assets/vendor). Китепкана жүктөлбөсө же колдонуучу
   «азыраак кыймыл» тандаса, бардык мазмун анимациясыз эле толук көрүнөт. */
(() => {
  'use strict';

  const { site, page } = JSON.parse(document.getElementById('site-data').textContent);
  const S = site || {};
  const sections = S.sections || {};
  const isHome = page.type === 'home';

  // ── Тил ──────────────────────────────────────────────────────
  // Кыргызча — /, орусча — /ru/..., англисче — /en/... (сервер page.lang жана page.base берет)
  const LANG = page.lang || 'ky';
  const BASE = page.base || '';
  const LANG_PREFIX = /^\/(ru|en)(?=\/|$)/;
  const to = (path) => (path === '/' ? BASE || '/' : `${BASE}${path}`);

  const DICT = {
    ky: {
      home: 'башкы бет', mainMenu: 'Негизги меню', menuOpen: 'Менюну ачуу', menuClose: 'Менюну жабуу', langLabel: 'Тил',
      about: 'Биз жөнүндө', directions: 'Эмне кылабыз', news: 'Жаңылыктар', contacts: 'Байланыш', stats: 'Сандар менен', donate: 'Жардам берүү',
      since: '-жылдан бери иштейбиз',
      copy: 'Көчүрүү', copied: 'Көчүрүлдү', copyFailed: 'Көчүрүлгөн жок', copiedLive: (x) => `${x} көчүрүлдү`,
      donateEmpty: ['Жардам берүү жолдорун билүү үчүн ', 'биз менен байланышыңыз', '.'],
      allNews: 'Бардык жаңылыктар', noNews: 'Азырынча жаңылыктар жок. Кийинчерээк кайра кириңиз.',
      pages: 'Барактар', prev: 'Мурунку', next: 'Кийинки', share: 'Бөлүшүү', linkCopied: 'Шилтеме көчүрүлдү',
      address: 'Дарек', phone: 'Телефон', email: 'Электрондук почта', openMap: 'Картадан ачуу', mapTitle: 'Картада биздин дарек',
      footerSections: 'Бөлүмдөр', footerLinks: 'Шилтемелер',
      nfTitle: 'Бул барак табылган жок',
      nfText: 'Шилтеме эскирген же туура эмес терилген болушу мүмкүн. Башкы бетке кайтып, керектүү бөлүмдү тандаңыз.',
      nfBack: 'Башкы бетке кайтуу',
      types: { elon: 'Жарыя', yangilik: 'Жаңылык', musobaqa: 'Конкурс' },
    },
    ru: {
      home: 'главная', mainMenu: 'Главное меню', menuOpen: 'Открыть меню', menuClose: 'Закрыть меню', langLabel: 'Язык',
      about: 'О нас', directions: 'Чем мы занимаемся', news: 'Новости', contacts: 'Контакты', stats: 'В цифрах', donate: 'Помочь',
      since: 'год основания',
      copy: 'Копировать', copied: 'Скопировано', copyFailed: 'Не удалось скопировать', copiedLive: (x) => `${x} скопировано`,
      donateEmpty: ['Чтобы узнать, как помочь, ', 'свяжитесь с нами', '.'],
      allNews: 'Все новости', noNews: 'Новостей пока нет. Загляните позже.',
      pages: 'Страницы', prev: 'Назад', next: 'Далее', share: 'Поделиться', linkCopied: 'Ссылка скопирована',
      address: 'Адрес', phone: 'Телефон', email: 'Эл. почта', openMap: 'Открыть на карте', mapTitle: 'Наш адрес на карте',
      footerSections: 'Разделы', footerLinks: 'Ссылки',
      nfTitle: 'Страница не найдена',
      nfText: 'Возможно, ссылка устарела или набрана с ошибкой. Вернитесь на главную и выберите нужный раздел.',
      nfBack: 'На главную',
      types: { elon: 'Объявление', yangilik: 'Новость', musobaqa: 'Конкурс' },
    },
    en: {
      home: 'home', mainMenu: 'Main menu', menuOpen: 'Open menu', menuClose: 'Close menu', langLabel: 'Language',
      about: 'About us', directions: 'What we do', news: 'News', contacts: 'Contact', stats: 'In numbers', donate: 'Donate',
      since: 'year founded',
      copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed', copiedLive: (x) => `${x} copied`,
      donateEmpty: ['To find out how to help, ', 'contact us', '.'],
      allNews: 'All news', noNews: 'No news yet. Please check back later.',
      pages: 'Pages', prev: 'Previous', next: 'Next', share: 'Share', linkCopied: 'Link copied',
      address: 'Address', phone: 'Phone', email: 'Email', openMap: 'Open in maps', mapTitle: 'Our address on the map',
      footerSections: 'Sections', footerLinks: 'Links',
      nfTitle: 'Page not found',
      nfText: 'The link may be outdated or mistyped. Go back to the home page and choose a section.',
      nfBack: 'Back to home',
      types: { elon: 'Announcement', yangilik: 'News', musobaqa: 'Contest' },
    },
  };
  const t = DICT[LANG] || DICT.ky;

  const LANGS = [['ky', 'Кыр', 'Кыргызча'], ['ru', 'Рус', 'Русский'], ['en', 'Eng', 'English']];
  // Ушул эле барактын башка тилдеги дареги
  function langHref(lang) {
    const rest = location.pathname.replace(LANG_PREFIX, '') || '/';
    const prefix = lang === 'ky' ? '' : `/${lang}`;
    return (rest === '/' ? prefix || '/' : `${prefix}${rest}`) + location.search;
  }

  // ── Жардамчылар ──────────────────────────────────────────────
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  // Статикалык (коддогу) SVG белгилерден гана түйүн жасайт — колдонуучунун маалыматы бул жакка келбейт
  function svg(markup) {
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild;
  }

  const has = (v) => typeof v === 'string' ? v.trim() !== '' : !!v;

  // Аталыштар сөзмө-сөз чыгат: ар бир сөз өз «терезесинде» ылдыйдан көтөрүлөт.
  // Сөз inline-block болгондуктан «үй-бүлө» дефистен бөлүнбөйт.
  const words = (text) => String(text || '')
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) => (/^\s+$/.test(part) ? ' ' : h('span', { class: 'w' }, h('span', { class: 'w__i' }, part))));

  function safeHref(raw) {
    const u = String(raw || '').trim();
    if (!u) return null;
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (u.startsWith('#')) return isHome ? u : `${BASE}/${u}`;
    if (u.startsWith('/') && !u.startsWith('//')) return LANG_PREFIX.test(u) ? u : to(u);
    if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return `https://${u}`;
    return null;
  }

  const isExternal = (href) => /^https?:/i.test(href) && !href.includes(location.host);
  const linkProps = (href) => (isExternal(href) ? { href, target: '_blank', rel: 'noopener' } : { href });

  // Браузерлерде кыргызча дата форматы жок (орусча чыгат) — өзүбүз түзөбүз: «15-октябрь, 2026».
  // Орусча «15 октября 2026», англисче «15 October 2026».
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  function fmtDate(d) {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    if (LANG === 'ky') return `${date.getDate()}-${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
    return date.toLocaleDateString(LANG === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      .replace(/\s*г\.$/, '');
  }

  const POST_TYPES = t.types;

  // ── Белгилер (24×24, сызык) ──────────────────────────────────
  const ICON_PATHS = {
    food: 'M3 11h18a9 9 0 0 1-18 0Z M8 7.5c0-1.5 1-2 1-3.5 M12 7.5c0-1.5 1-2 1-3.5 M16 7.5c0-1.5 1-2 1-3.5',
    medicine: 'M10.5 20.5l-7-7a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z M7 10l7 7',
    family: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M16.5 11a2.5 2.5 0 1 0 0-5 M17 14c2.4.4 4 2.6 4 5.5',
    book: 'M4 19.5V5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5Z M4 19.5A2.5 2.5 0 0 0 6.5 22H20 M8 7.5h8',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
    home: 'M4 11l8-7 8 7 M6 9.5V20h12V9.5 M10 20v-5h4v5',
    water: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
    clothes: 'M8 3L4 5.5 5.5 10 7 9.5V21h10V9.5l1.5.5L20 5.5 16 3a4 4 0 0 1-8 0Z',
    education: 'M2 9l10-5 10 5-10 5Z M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5 M22 9v6',
    mosque: 'M12 3c0 2.2-5 3.6-5 8h10c0-4.4-5-5.8-5-8Z M7 11v10h10V11 M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21 M4 21V9 M20 21V9 M3 21h18',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0Z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M8 21h8 M9.5 17h5v4h-5Z',
    hands: 'M3 12l4 7h7l6-4.5a1.6 1.6 0 0 0-2-2.5L15 14 M11 14h2a2 2 0 0 0 0-4H9.5L5 13 M14.5 4.5a2 2 0 0 1 3 2c0 1.5-2.5 3.2-2.5 3.2s-2.5-1.7-2.5-3.2a2 2 0 0 1 2-2',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
    mail: 'M3 5h18v14H3Z M3 7l9 6 9-6',
    pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
    telegram: 'M21 4L3 11l6 2 2 6 3-4 5 4Z M9 13l9-6',
    instagram: 'M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M17 7h.01',
    facebook: 'M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z',
    youtube: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z M10 9l5 3-5 3Z',
    whatsapp: 'M4 20l1.3-4A8 8 0 1 1 8 18.7Z M9 8.5c0 3.3 3.2 6.5 6.5 6.5l1-1.6-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2Z',
    tiktok: 'M14 3v11.5A3.5 3.5 0 1 1 10.5 11 M14 3c.5 2.5 2.5 4 5 4',
    menu: 'M4 7h16 M4 12h16 M4 17h16',
    close: 'M6 6l12 12 M18 6L6 18',
    copy: 'M9 9h11v11H9Z M5 15H4V4h11v1',
    check: 'M5 12.5l4.5 4.5L19 7',
    share: 'M12 15V3 M7 8l5-5 5 5 M5 13v7h14v-7',
    back: 'M15 5l-7 7 7 7',
  };

  // pathLength=1 — белгини «чийип» чыгаруу анимациясы үчүн
  const icon = (name) => svg(
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="${ICON_PATHS[name] || ICON_PATHS.heart}"/></svg>`
  );

  // ── Оймо-чиймелер ────────────────────────────────────────────
  // Кочкор мүйүз — кайталануучу плитка
  let ornamentId = 0;
  function ornament({ tile = 44, bg = '#1B2B52', line = '#009746', accent = '#E9AB3C', className = '' } = {}) {
    const id = `km-${++ornamentId}`;
    const horn = 'M20 20 C20 12 28 10 30.5 15 C32.5 19 27.5 21.5 25.5 18';
    return svg(`
      <svg class="${className}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="${id}" width="${tile}" height="${tile}" patternUnits="userSpaceOnUse" viewBox="0 0 40 40">
            <rect width="40" height="40" fill="${bg}"/>
            <g fill="none" stroke="${line}" stroke-width="2.2" stroke-linecap="round">
              <path d="${horn}"/>
              <path d="${horn}" transform="matrix(-1 0 0 1 40 0)"/>
              <path d="${horn}" transform="matrix(1 0 0 -1 0 40)"/>
              <path d="${horn}" transform="matrix(-1 0 0 -1 40 40)"/>
            </g>
            <path d="M20 16.5l3.5 3.5-3.5 3.5-3.5-3.5Z" fill="${accent}"/>
            <path d="M0 0h3v3H0Z M37 0h3v3h-3Z M0 37h3v3H0Z M37 37h3v3h-3Z" fill="${accent}" opacity=".55"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#${id})"/>
      </svg>`);
  }

  // Сегиз учтуу жылдыз (хатам) — эки квадраттын кесилиши
  function starPoints(R, rot = 0) {
    const r = R * 0.7654;
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = ((i * 22.5 + rot - 90) * Math.PI) / 180;
      const d = i % 2 ? r : R;
      pts.push(`${(Math.cos(a) * d).toFixed(2)},${(Math.sin(a) * d).toFixed(2)}`);
    }
    return pts.join(' ');
  }

  // Розетка — баш бөлүмдөгү арканын артында, сандар жана «биз жөнүндө» бөлүмүндө
  function rosette(className = '') {
    const dots = Array.from({ length: 8 }, (_, i) => {
      const a = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
      return `<circle cx="${(Math.cos(a) * 76).toFixed(2)}" cy="${(Math.sin(a) * 76).toFixed(2)}" r="2.4"/>`;
    }).join('');
    return svg(`
      <svg class="rosette ${className}" viewBox="-100 -100 200 200" aria-hidden="true">
        <g fill="none" stroke-linejoin="round">
          <circle r="97" stroke="currentColor" stroke-opacity=".28" stroke-width=".6"/>
          <polygon points="${starPoints(94)}" stroke="#E9AB3C" stroke-width="1"/>
          <polygon points="${starPoints(94, 22.5)}" stroke="#009746" stroke-width="1"/>
          <circle r="58" stroke="currentColor" stroke-opacity=".35" stroke-width=".6"/>
          <polygon points="${starPoints(54)}" stroke="#E9AB3C" stroke-width=".8"/>
          <polygon points="${starPoints(30, 22.5)}" fill="#E9AB3C" fill-opacity=".2" stroke="#E9AB3C" stroke-width=".8"/>
        </g>
        <g fill="#E9AB3C">${dots}</g>
      </svg>`);
  }

  // Төрт учтуу жылтылдак
  const sparkle = (x, y, size, tone) => {
    const el = svg(`<svg class="spark spark--${tone}" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0 -10C1 -2 2 -1 10 0C2 1 1 2 0 10C-1 2-2 1-10 0C-2-1-1-2 0-10Z"/></svg>`);
    el.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px`;
    return el;
  };

  // Арканын формасы (100×125), түбүнөн ортосуна карата s эсе чоңойтулган
  function archPath(s) {
    const X = (x) => +(50 + (x - 50) * s).toFixed(2);
    const Y = (y) => +(125 - (125 - y) * s).toFixed(2);
    return `M${X(0)} ${Y(125)} V${Y(52.5)} C${X(0)} ${Y(26.25)} ${X(33)} ${Y(13.75)} ${X(50)} ${Y(0)} `
      + `C${X(67)} ${Y(13.75)} ${X(100)} ${Y(26.25)} ${X(100)} ${Y(52.5)} V${Y(125)}`;
  }

  const brandMark = () => svg(`
    <svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1B2B52"/>
      <path d="M14 52 V31 C14 21 26 16 32 10 C38 16 50 21 50 31 V52 Z" fill="none" stroke="#E9AB3C" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 26l7 7-7 7-7-7Z" fill="#009746"/>
    </svg>`);

  function brand(extraClass = '') {
    const b = S.brand || {};
    return h('a', { class: `brand ${extraClass}`, href: to('/'), 'aria-label': `${b.name || ''} — ${t.home}` },
      has(b.logo) ? h('img', { class: 'brand__logo', src: b.logo, alt: '' }) : brandMark(),
      h('span', { class: 'brand__text' },
        h('span', { class: 'brand__name' }, b.name || ''),
        has(b.tagline) ? h('span', { class: 'brand__tagline' }, b.tagline) : null,
      ),
    );
  }

  // ── Бөлүмдөрдүн көрүнүшү ─────────────────────────────────────
  const C = S.contacts || {};
  const show = {
    about: sections.about && (has(S.about?.text) || has(S.about?.title)),
    directions: sections.directions && (S.directions?.items || []).some((d) => has(d.title)),
    stats: sections.stats && (S.stats?.items || []).length > 0,
    donate: sections.donate,
    blog: sections.blog && (S.blog?.posts || []).length > 0,
    contacts: !!sections.contacts && (
      [C.address, C.email, C.mapUrl, C.whatsapp, C.telegram, C.instagram, C.facebook, C.youtube, C.tiktok].some(has)
      || (C.phones || []).some(has)
    ),
  };

  function navItems() {
    const items = [];
    if (show.about) items.push(['#about', S.about.title || t.about]);
    if (show.directions) items.push(['#directions', S.directions.title || t.directions]);
    if (sections.blog) items.push(['/blog', S.blog?.title || t.news]);
    if (show.contacts) items.push(['#contacts', C.title || t.contacts]);
    return items;
  }

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function header() {
    const nav = h('nav', { class: 'nav', id: 'site-nav', 'aria-label': t.mainMenu },
      navItems().map(([href, label]) => h('a', { href: safeHref(href) }, label)),
      h('div', { class: 'lang', role: 'group', 'aria-label': t.langLabel },
        LANGS.map(([code, short, full]) => h('a', {
          class: 'lang__item', href: langHref(code), hreflang: code, lang: code, title: full,
          'aria-current': code === LANG ? 'true' : null,
        }, short)),
      ),
    );
    const cta = S.hero?.primaryCta;
    if (has(cta?.label) && safeHref(cta.href)) {
      nav.append(h('a', { class: 'btn btn--primary btn--small', ...linkProps(safeHref(cta.href)) }, cta.label));
    }
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });

    const toggle = h('button', {
      class: 'menu-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-nav', 'aria-label': t.menuOpen,
      onclick: () => toggleMenu(),
    }, icon('menu'));

    const el = h('header', { class: 'header' },
      h('div', { class: 'wrap header__inner' }, brand(), toggle, nav),
      h('div', { class: 'progress', 'aria-hidden': 'true' }),
    );

    function toggleMenu(force) {
      const open = force ?? !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      el.classList.toggle('is-menu', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? t.menuClose : t.menuOpen);
      toggle.replaceChildren(icon(open ? 'close' : 'menu'));
      if (open && window.gsap && !reducedMotion()) {
        window.gsap.from(nav.children, { y: -10, autoAlpha: 0, duration: 0.45, stagger: 0.05, ease: 'power3.out' });
      }
    }

    // Караңгы баш бөлүмдүн үстүндө тунук; ылдый жылганда жашынат, өйдө жылганда кайра чыгат
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      el.classList.toggle('is-solid', y > 24);
      const goingDown = y > lastY;
      if (Math.abs(y - lastY) > 4) {
        el.classList.toggle('is-hidden', goingDown && y > 320 && !nav.classList.contains('is-open'));
        lastY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return el;
  }

  // Баш бөлүм — «айван»: найза сымал арка, анын айланасында чийилип чыгуучу контурлар
  function hero() {
    const H = S.hero || {};
    const actions = [H.primaryCta, H.secondaryCta]
      .filter((c) => has(c?.label) && safeHref(c.href))
      .map((c, i) => h('a', { class: `btn ${i === 0 ? 'btn--primary btn--large' : 'btn--ghost btn--large'}`, ...linkProps(safeHref(c.href)) }, c.label));

    const media = has(H.image)
      ? h('img', { class: 'arch__media', src: H.image, alt: '', fetchpriority: 'high' })
      : ornament({ tile: 58, bg: '#009746', line: '#1B2B52', accent: '#E9AB3C', className: 'arch__media' });

    const outline = svg(`
      <svg class="arch__outline" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
        <path class="o1" pathLength="1" d="${archPath(1.07)}"/>
        <path class="o2" pathLength="1" d="${archPath(1.15)}"/>
        <path class="o3" pathLength="1" d="${archPath(1.23)}"/>
      </svg>`);

    const sparks = [
      [6, 20, 14, 'gold'], [44, 9, 10, 'white'], [94, 14, 16, 'gold'], [56, 86, 12, 'white'],
      [3, 82, 10, 'white'], [90, 76, 12, 'gold'], [36, 62, 8, 'gold'],
    ].map((s) => sparkle(...s));

    return h('section', { class: 'hero', 'data-intro': true },
      h('div', { class: 'hero__bg', 'aria-hidden': 'true' }, ornament({ tile: 76, bg: 'none', line: '#2B4382', accent: '#E9AB3C' })),
      h('div', { class: 'hero__sparks', 'aria-hidden': 'true' }, sparks),
      h('div', { class: 'wrap hero__grid' },
        h('div', { class: 'hero__copy' },
          h('h1', { class: 'split' }, words(H.title || S.brand?.name || '')),
          has(H.text) ? h('p', { 'data-intro-fade': true }, H.text) : null,
          actions.length ? h('div', { class: 'hero__actions', 'data-intro-fade': true }, actions) : null,
        ),
        h('div', { class: 'arch' },
          h('div', { class: 'hero__rosette' }, rosette()),
          outline,
          h('div', { class: 'arch__reveal' }, h('div', { class: 'arch__frame' }, media)),
        ),
      ),
    );
  }

  // Жылып турган оймо-чийме тилкеси (плитка 36px — анимация бир плиткага жылып, кайталанат)
  const band = () => h('div', { class: 'ornament-band', 'aria-hidden': 'true' }, ornament({ tile: 36, className: 'ornament-band__track' }));

  const paragraphs = (text) => String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => h('p', {}, p));

  // Ички барактардын (блог, макала, 404) караңгы башы.
  // narrow — макала барагы: аталыш астындагы текст тилкеси менен бир түз сызыкта турат.
  function pageHero(children, { narrow = false } = {}) {
    return h('section', { class: 'page-hero', 'data-intro': true },
      h('div', { class: 'page-hero__bg', 'aria-hidden': 'true' }, ornament({ tile: 64, bg: 'none', line: '#2B4382', accent: '#E9AB3C' })),
      h('div', { class: `wrap page-hero__inner ${narrow ? 'article' : ''}` }, children),
    );
  }

  function about() {
    const A = S.about;
    const visual = h('div', { class: 'about__visual', 'data-reveal': true },
      has(A.image)
        ? h('div', { class: 'about__arch' }, h('img', { src: A.image, alt: '', loading: 'lazy' }))
        : h('div', { class: 'about__rosette' }, rosette()),
      has(A.foundedYear) ? h('p', { class: 'about__badge' },
        h('strong', {}, A.foundedYear),
        h('span', {}, t.since),
      ) : null,
    );
    return h('section', { class: 'section', id: 'about' },
      h('div', { class: 'wrap about__grid' },
        h('div', { class: 'about__copy' },
          h('h2', { class: 'split' }, words(A.title || t.about)),
          h('div', { class: 'about__text', 'data-reveal-group': true }, paragraphs(A.text)),
        ),
        visual,
      ),
    );
  }

  const starTile = () => svg(`<svg class="direction__star" viewBox="-50 -50 100 100" aria-hidden="true"><polygon points="${starPoints(48)}"/></svg>`);

  function directions() {
    const D = S.directions;
    return h('section', { class: 'section section--mist', id: 'directions' },
      h('div', { class: 'wrap' },
        h('div', { class: 'section__head' }, h('h2', { class: 'split' }, words(D.title || t.directions))),
        h('div', { class: 'directions', 'data-reveal-group': true },
          D.items.filter((d) => has(d.title)).map((d) =>
            h('article', { class: 'direction' },
              h('div', { class: 'direction__icon' }, starTile(), icon(d.icon)),
              h('h3', {}, d.title),
              has(d.text) ? h('p', {}, d.text) : null,
            )),
        ),
      ),
    );
  }

  function stats() {
    const T = S.stats;
    return h('section', { class: 'stats', 'aria-labelledby': 'stats-title' },
      h('div', { class: 'stats__rosette', 'aria-hidden': 'true' }, rosette()),
      h('div', { class: 'wrap' },
        h('h2', { id: 'stats-title', class: 'split' }, words(T.title || t.stats)),
        h('ul', { class: 'stats__list', 'data-reveal-group': true },
          T.items.map((s) => h('li', {},
            // Сан өсүп чыгат; экран окугучка акыркы маани гана окулат
            h('div', { class: 'stats__value' }, h('span', { class: 'stats__num', 'aria-hidden': 'true' }, s.value), h('span', { class: 'sr-only' }, s.value)),
            h('p', { class: 'stats__label' }, s.label),
          )),
        ),
      ),
    );
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = h('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  const pop = (el) => {
    if (window.gsap && !reducedMotion()) window.gsap.fromTo(el, { scale: 0.3, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)' });
  };

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  function copyButton(text, label = t.copy) {
    const btn = h('button', { class: 'btn btn--ghost btn--small', type: 'button' }, icon('copy'), label);
    btn.addEventListener('click', async () => {
      const ok = await copyText(text);
      const mark = icon(ok ? 'check' : 'copy');
      btn.replaceChildren(mark, ok ? t.copied : t.copyFailed);
      btn.classList.toggle('is-done', ok);
      if (ok) pop(mark);
      live.textContent = ok ? t.copiedLive(text) : '';
      setTimeout(() => { btn.replaceChildren(icon('copy'), label); btn.classList.remove('is-done'); }, 2200);
    });
    return btn;
  }

  function donate() {
    const D = S.donate || {};
    const methods = (D.methods || []).filter((m) => has(m.details) || has(m.name));
    return h('section', { class: 'section donate', id: 'donate' },
      h('div', { class: 'wrap donate__grid' },
        h('div', { class: 'donate__copy' },
          h('h2', { class: 'split' }, words(D.title || t.donate)),
          has(D.text) ? h('p', { 'data-reveal': true }, D.text) : null,
          svg(`
            <svg class="donate__arches" viewBox="-16 -32 132 160" aria-hidden="true">
              <path class="o3" pathLength="1" d="${archPath(1.24)}"/>
              <path class="o2" pathLength="1" d="${archPath(1.12)}"/>
              <path class="o1" pathLength="1" d="${archPath(1)}"/>
              <g transform="translate(50 78)"><polygon class="star" points="${starPoints(13)}"/></g>
            </svg>`),
        ),
        methods.length
          ? h('ul', { class: 'methods', 'data-reveal-group': true }, methods.map((m) => h('li', { class: 'method' },
            has(m.name) ? h('span', { class: 'method__name' }, m.name) : null,
            has(m.details) ? h('span', { class: 'method__details' }, m.details) : null,
            has(m.note) ? h('span', { class: 'method__note' }, m.note) : null,
            has(m.details) ? copyButton(m.details) : null,
          )))
          : h('p', { class: 'donate__empty', 'data-reveal': true },
            t.donateEmpty[0],
            show.contacts ? h('a', { href: '#contacts' }, t.donateEmpty[1]) : t.donateEmpty[1],
            t.donateEmpty[2]),
      ),
    );
  }

  function postMeta(p, extra = '') {
    return h('div', { class: `post-meta ${extra}` },
      POST_TYPES[p.type] ? h('span', { class: `post-meta__type post-meta__type--${p.type}` }, POST_TYPES[p.type]) : null,
      h('time', { datetime: p.createdAt }, fmtDate(p.createdAt)),
    );
  }

  // Сүрөтү жок посттордо түрүнө жараша ар түстүү оймо-чийме
  const COVER = {
    yangilik: { bg: '#1B2B52', line: '#009746', accent: '#E9AB3C' },
    musobaqa: { bg: '#009746', line: '#1B2B52', accent: '#E9AB3C' },
    elon: { bg: '#E9AB3C', line: '#1B2B52', accent: '#FBFCFB' },
  };

  function postCard(p) {
    return h('a', { class: 'post-card', href: to(`/blog/${p._id}`) },
      h('div', { class: 'post-card__media' },
        has(p.image) ? h('img', { src: p.image, alt: '', loading: 'lazy' }) : ornament({ tile: 40, ...(COVER[p.type] || COVER.yangilik) })),
      postMeta(p),
      h('h3', { class: 'post-card__title' }, h('span', {}, p.title)),
      has(p.excerpt) ? h('p', { class: 'post-card__excerpt' }, p.excerpt) : null,
    );
  }

  function blogTeaser() {
    return h('section', { class: 'section section--mist', id: 'blog' },
      h('div', { class: 'wrap' },
        h('div', { class: 'section-row' },
          h('h2', { class: 'split' }, words(S.blog.title || t.news)),
          h('a', { class: 'btn btn--ghost btn--small', href: to('/blog'), 'data-reveal': true }, t.allNews),
        ),
        h('div', { class: 'posts', 'data-reveal-group': true }, S.blog.posts.map(postCard)),
      ),
    );
  }

  // Колдонуучу @username же номер жазса да туура шилтеме болот
  function socialLinks() {
    const norm = {
      whatsapp: (v) => `https://wa.me/${v.replace(/\D/g, '')}`,
      telegram: (v) => (v.startsWith('@') ? `https://t.me/${v.slice(1)}` : v),
      instagram: (v) => (v.startsWith('@') ? `https://instagram.com/${v.slice(1)}` : v),
      tiktok: (v) => (v.startsWith('@') ? `https://www.tiktok.com/${v}` : v),
      facebook: (v) => v,
      youtube: (v) => v,
    };
    const names = { whatsapp: 'WhatsApp', telegram: 'Telegram', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube', tiktok: 'TikTok' };
    return Object.keys(norm)
      .filter((k) => has(C[k]))
      .map((k) => {
        const v = C[k].trim();
        const href = safeHref(norm[k](v));
        return href ? { key: k, name: names[k], href } : null;
      })
      .filter(Boolean);
  }

  // Google/Яндекс/OSM картанын embed шилтемеси же толук <iframe> коду
  function mapSrc(raw) {
    let u = String(raw || '').trim();
    const m = u.match(/src="([^"]+)"/i);
    if (m) u = m[1];
    const ok = [
      /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed\?/i,
      /^https:\/\/maps\.google\.[a-z.]+\/maps\?.*output=embed/i,
      /^https:\/\/yandex\.[a-z]+\/map-widget\//i,
      /^https:\/\/(www\.)?openstreetmap\.org\/export\/embed\.html/i,
    ].some((re) => re.test(u));
    return { embed: ok ? u : null, link: !ok && /^https?:/i.test(u) ? u : null };
  }

  function contacts() {
    const rows = [];
    if (has(C.address)) rows.push(['pin', t.address, C.address]);
    const phones = (C.phones || []).filter(has);
    if (phones.length) rows.push(['phone', t.phone, phones.map((p, i) => [i ? ', ' : '', h('a', { href: `tel:${p.replace(/[^\d+]/g, '')}` }, p)])]);
    if (has(C.email)) rows.push(['mail', t.email, h('a', { href: `mailto:${C.email.trim()}` }, C.email)]);

    const socials = socialLinks();
    const map = mapSrc(C.mapUrl);

    const info = h('div', {},
      h('h2', { class: 'split' }, words(C.title || t.contacts)),
      rows.length ? h('dl', { class: 'contact-list', 'data-reveal-group': true }, rows.map(([ic, dt, dd]) => h('div', { class: 'contact-row' },
        h('span', { class: 'contact-row__icon' }, icon(ic)),
        h('div', {}, h('dt', {}, dt), h('dd', {}, dd)),
      ))) : null,
      socials.length ? h('div', { class: 'socials', 'data-reveal-group': true }, socials.map((s) => h('a', { class: 'social', href: s.href, target: '_blank', rel: 'noopener' }, icon(s.key), s.name))) : null,
      map.link ? h('p', { style: 'margin-top:24px' }, h('a', { href: map.link, target: '_blank', rel: 'noopener' }, t.openMap)) : null,
    );

    return h('section', { class: 'section', id: 'contacts' },
      h('div', { class: `wrap contacts__grid ${map.embed ? '' : 'contacts__grid--single'}` },
        info,
        map.embed ? h('div', { class: 'map', 'data-reveal': true }, h('iframe', {
          src: map.embed, title: t.mapTitle, loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true,
        })) : null,
      ),
    );
  }

  function footer() {
    const links = (S.links || []).filter((l) => has(l.label) && safeHref(l.href));
    const socials = socialLinks();
    return h('footer', { class: 'footer' },
      band(),
      h('div', { class: 'wrap footer__inner' },
        h('div', {}, brand(), has(S.hero?.text) ? h('p', { class: 'footer__about' }, S.hero.text) : null),
        navItems().length ? h('div', {},
          h('h3', {}, t.footerSections),
          h('ul', {}, navItems().map(([href, label]) => h('li', {}, h('a', { href: safeHref(href) }, label)))),
        ) : h('div'),
        (links.length || socials.length) ? h('div', {},
          h('h3', {}, t.footerLinks),
          h('ul', {},
            links.map((l) => h('li', {}, h('a', linkProps(safeHref(l.href)), l.label))),
            socials.map((s) => h('li', {}, h('a', { href: s.href, target: '_blank', rel: 'noopener' }, s.name))),
          ),
        ) : h('div'),
      ),
      h('div', { class: 'wrap footer__bottom' }, `© ${new Date().getFullYear()} ${S.brand?.name || ''}`),
    );
  }

  // ── Markdown (FundsDB блогу колдонгон жөнөкөй формат) ────────
  function renderMarkdown(text) {
    const root = document.createDocumentFragment();
    const inline = (str) => {
      // **калың**, *курсив*, ~~сызылган~~, [текст](шилтеме) — текст түйүндөрү аркылуу, HTML жок
      const out = [];
      const re = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|\[([^\]]+)\]\(([^)\s]+)\)/g;
      let last = 0;
      let m;
      while ((m = re.exec(str))) {
        if (m.index > last) out.push(str.slice(last, m.index));
        if (m[1]) out.push(h('strong', {}, h('em', {}, m[1])));
        else if (m[2]) out.push(h('strong', {}, m[2]));
        else if (m[3]) out.push(h('em', {}, m[3]));
        else if (m[4]) out.push(h('s', {}, m[4]));
        else {
          const href = safeHref(m[6]);
          out.push(href ? h('a', linkProps(href), m[5]) : m[5]);
        }
        last = re.lastIndex;
      }
      if (last < str.length) out.push(str.slice(last));
      return out;
    };

    let list = null;
    let para = null;
    const flush = () => { list = null; para = null; };
    for (const raw of String(text || '').split('\n')) {
      const line = raw.trimEnd();
      if (!line.trim()) { flush(); continue; }
      if (/^#{1,3}\s/.test(line)) {
        flush();
        const level = line.match(/^#+/)[0].length;
        // Макаланын аталышы h1 — ичиндеги # жана ## h2 болот
        root.append(h(level <= 2 ? 'h2' : 'h3', {}, inline(line.replace(/^#+\s+/, ''))));
      } else if (/^[-*]\s/.test(line)) {
        para = null;
        if (!list) { list = h('ul'); root.append(list); }
        list.append(h('li', {}, inline(line.slice(2))));
      } else {
        list = null;
        if (para) para.append(h('br'), ...inline(line));
        else { para = h('p', {}, inline(line)); root.append(para); }
      }
    }
    return root;
  }

  // ── Барактар ─────────────────────────────────────────────────
  function homePage() {
    return [
      hero(),
      band(),
      show.about ? about() : null,
      show.directions ? directions() : null,
      show.stats ? stats() : null,
      show.donate ? donate() : null,
      show.blog ? blogTeaser() : null,
      show.contacts ? contacts() : null,
    ];
  }

  function blogPage() {
    const posts = page.data || [];
    const pager = page.pages > 1 ? h('nav', { class: 'pager', 'aria-label': t.pages },
      page.page > 1 ? h('a', { class: 'btn btn--ghost btn--small', href: page.page - 1 > 1 ? to(`/blog?page=${page.page - 1}`) : to('/blog') }, t.prev) : h('span'),
      h('span', {}, `${page.page} / ${page.pages}`),
      page.page < page.pages ? h('a', { class: 'btn btn--ghost btn--small', href: to(`/blog?page=${page.page + 1}`) }, t.next) : h('span'),
    ) : null;

    return [
      pageHero([h('h1', { class: 'split' }, words(S.blog?.title || t.news))]),
      h('section', { class: 'section section--tight' },
        h('div', { class: 'wrap' },
          posts.length
            ? h('div', { class: 'posts', 'data-reveal-group': true }, posts.map(postCard))
            : h('p', { class: 'donate__empty' }, t.noNews),
          pager,
        ),
      ),
    ];
  }

  function postPage() {
    const p = page.post;
    const share = h('button', { class: 'btn btn--ghost btn--small', type: 'button' }, icon('share'), t.share);
    share.addEventListener('click', async () => {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: p.title, url }); } catch { /* жокко чыгарылды */ } return; }
      const ok = await copyText(url);
      const mark = icon(ok ? 'check' : 'share');
      share.replaceChildren(mark, ok ? t.linkCopied : t.share);
      if (ok) pop(mark);
    });

    return [
      pageHero([
        h('a', { class: 'page-hero__back', href: to('/blog'), 'data-intro-fade': true }, icon('back'), S.blog?.title || t.news),
        h('div', { 'data-intro-fade': true }, postMeta(p, 'post-meta--light')),
        h('h1', { class: 'split article__title' }, words(p.title)),
      ], { narrow: true }),
      h('section', { class: 'section section--tight' },
        h('article', { class: 'wrap article' },
          has(p.image) ? h('img', { class: 'article__image', src: p.image, alt: '', 'data-reveal': true }) : null,
          h('div', { class: 'article__body', 'data-reveal': true }, renderMarkdown(p.body)),
          h('div', { class: 'article__share' }, share),
        ),
      ),
    ];
  }

  function notFoundPage() {
    return pageHero([
      h('h1', { class: 'split' }, words(t.nfTitle)),
      h('p', { class: 'page-hero__text', 'data-intro-fade': true }, t.nfText),
      h('p', { 'data-intro-fade': true, style: 'margin-top:28px' }, h('a', { class: 'btn btn--primary', href: to('/') }, t.nfBack)),
    ]);
  }

  const content = {
    home: homePage, blog: blogPage, post: postPage, notfound: notFoundPage,
  }[page.type] || notFoundPage;

  document.getElementById('app').replaceChildren(
    header(),
    h('main', { id: 'main' }, content()),
    footer(),
    live,
  );

  // Шилтемеде #бөлүм болсо — бет чизилгенден кийин ошол жерге жылдыруу
  if (location.hash) {
    try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* туура эмес hash */ }
  }

  // ── Кыймыл ───────────────────────────────────────────────────
  function motion() {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      // Көрүнгөндө бир жолу ойнойт. Бет ылдыйда ачылса (#contacts), жогору калган бөлүмдөр дароо көрсөтүлөт.
      const pending = [];
      const onView = (el, play, start = 'top 88%') => {
        let done = false;
        const run = () => { if (!done) { done = true; play(); } };
        ScrollTrigger.create({ trigger: el, start, once: true, onEnter: run });
        pending.push([el, run]);
      };

      // Окуу прогресси
      gsap.fromTo('.progress', { scaleX: 0 }, {
        scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      });

      // 1) Баштапкы көрүнүш
      const intro = document.querySelector('[data-intro]');
      if (intro) {
        const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        tl.from('.header', { yPercent: -100, duration: 0.9, clearProps: 'transform' }, 0)
          .from($$('h1 .w__i', intro), { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.15)
          .from($$('[data-intro-fade]', intro), { y: 28, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0.55);

        const arch = intro.querySelector('.arch');
        if (arch) {
          const ros = arch.querySelector('.hero__rosette');
          tl.fromTo(arch.querySelector('.arch__reveal'),
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.1)
            .from(arch.querySelector('.arch__media'), { scale: 1.4, duration: 2, ease: 'expo.out' }, 0.5)
            .fromTo($$('.arch__outline path', arch),
              { strokeDasharray: 1, strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.8, stagger: 0.2, ease: 'power2.inOut' }, 0.8)
            .from(ros, { scale: 0.4, autoAlpha: 0, rotation: -120, duration: 2.4, ease: 'expo.out' }, 0.7);

          // Розетка жай айланып турат
          gsap.to(ros.querySelector('svg'), { rotation: 360, duration: 150, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });

          // Параллакс: жылдырганда арка жана оймо-чийме ар башка ылдамдыкта кетет
          const scrub = { trigger: intro, start: 'top top', end: 'bottom top', scrub: true };
          gsap.to(arch.querySelector('.arch__media'), { yPercent: 10, ease: 'none', scrollTrigger: scrub });
          gsap.to(arch, { y: -60, ease: 'none', scrollTrigger: { ...scrub } });
        }

        const bg = intro.querySelector('.hero__bg, .page-hero__bg');
        if (bg) {
          tl.from(bg, { autoAlpha: 0, duration: 2, ease: 'power1.out' }, 0);
          gsap.to(bg, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: intro, start: 'top top', end: 'bottom top', scrub: true } });
        }

        $$('.spark', intro).forEach((s) => {
          gsap.fromTo(s, { scale: 0, rotation: -45, autoAlpha: 0 }, {
            scale: 1, rotation: 45, autoAlpha: 1, duration: gsap.utils.random(1.4, 2.6),
            delay: gsap.utils.random(0.8, 3), repeat: -1, yoyo: true, repeatDelay: gsap.utils.random(0.2, 1.5), ease: 'sine.inOut',
          });
        });
      }

      // 2) Бөлүм аталыштары сөзмө-сөз
      $$('.split').forEach((el) => {
        if (intro && intro.contains(el)) return;
        const parts = $$('.w__i', el);
        gsap.set(parts, { yPercent: 115 });
        onView(el, () => gsap.to(parts, { yPercent: 0, duration: 1, stagger: 0.06, ease: 'power4.out' }));
      });

      // 3) Жалгыз элементтер жана топтор (ичиндегилер кезек менен)
      $$('[data-reveal]').forEach((el) => {
        gsap.set(el, { autoAlpha: 0, y: 40 });
        onView(el, () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' }));
      });
      $$('[data-reveal-group]').forEach((group) => {
        const items = Array.from(group.children);
        gsap.set(items, { autoAlpha: 0, y: 48 });
        onView(group, () => gsap.to(items, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.1, ease: 'power3.out' }));
      });

      // 4) Багыттардын белгилери чийилип чыгат, жылдызы айланат
      $$('.direction').forEach((card, i) => {
        const paths = $$('.direction__icon > svg:last-child path', card);
        const star = card.querySelector('.direction__star');
        gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(star, { scale: 0, rotation: -90, transformOrigin: '50% 50%' });
        onView(card, () => {
          const d = 0.25 + i * 0.1;
          gsap.to(star, { scale: 1, rotation: 0, duration: 1.1, delay: d, ease: 'back.out(1.6)', clearProps: 'transform' });
          gsap.to(paths, { strokeDashoffset: 0, duration: 1.4, delay: d + 0.2, ease: 'power2.inOut' });
        });
      });

      // 5) Сандар нөлдөн өсүп чыгат (бош орун менен бөлүнгөн бүтүн сандар гана)
      $$('.stats__num').forEach((el) => {
        const raw = el.textContent;
        const m = raw.match(/^(\D*?)(\d(?:[\d\s]*\d)?)(\D*)$/);
        if (!m) return;
        const target = parseInt(m[2].replace(/\D/g, ''), 10);
        if (!target) return;
        const n = { v: 0 };
        const draw = () => { el.textContent = `${m[1]}${Math.round(n.v).toLocaleString('ru-RU')}${m[3]}`; };
        draw();
        onView(el, () => gsap.to(n, {
          v: target, duration: 2.2, delay: 0.2, ease: 'power3.out', onUpdate: draw, onComplete: () => { el.textContent = raw; },
        }), 'top 92%');
      });
      const statsRos = document.querySelector('.stats__rosette svg');
      if (statsRos) {
        gsap.to(statsRos, { rotation: 360, duration: 180, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
        gsap.fromTo('.stats__rosette', { yPercent: -15 }, {
          yPercent: 15, ease: 'none', scrollTrigger: { trigger: '.stats', start: 'top bottom', end: 'bottom top', scrub: true },
        });
      }

      // 6) «Биз жөнүндө»: арка ичиндеги сүрөт ачылат, белги чыгат
      const about = document.querySelector('.about__visual');
      if (about) {
        const img = about.querySelector('.about__arch img');
        const ros = about.querySelector('.about__rosette svg');
        const badge = about.querySelector('.about__badge');
        if (img) {
          gsap.set(img, { scale: 1.3 });
          onView(about, () => gsap.to(img, { scale: 1, duration: 1.8, ease: 'expo.out' }));
        }
        if (ros) gsap.to(ros, { rotation: -360, duration: 200, repeat: -1, ease: 'none', transformOrigin: '50% 50%' });
        if (badge) {
          gsap.set(badge, { scale: 0, rotation: -40 });
          onView(about, () => gsap.to(badge, { scale: 1, rotation: -8, duration: 1, delay: 0.5, ease: 'back.out(2)' }));
        }
      }

      // «Жардам берүү»: кичинекей айван чийилип чыгат, ортосунда жылдыз ачылат
      const arches = document.querySelector('.donate__arches');
      if (arches) {
        const paths = $$('path', arches);
        const star = arches.querySelector('.star');
        gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(star, { scale: 0, rotation: -90, transformOrigin: '50% 50%' });
        onView(arches, () => {
          gsap.to(paths, { strokeDashoffset: 0, duration: 1.8, stagger: 0.22, ease: 'power2.inOut' });
          gsap.to(star, { scale: 1, rotation: 0, duration: 1.4, delay: 1, ease: 'back.out(1.8)' });
        });
      }

      // 7) Оймо-чийме тилкелери акырын жылып турат
      $$('.ornament-band__track').forEach((track, i) => {
        gsap.to(track, { x: i % 2 ? 36 : -36, duration: 2.6, repeat: -1, ease: 'none' });
      });

      requestAnimationFrame(() => pending.forEach(([el, run]) => {
        if (el.getBoundingClientRect().top < window.innerHeight) run();
      }));

      // Шрифттар жана сүрөттөр жүктөлгөндө бийиктиктер өзгөрөт — эсептерди жаңылоо
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    });
  }

  motion();
})();
