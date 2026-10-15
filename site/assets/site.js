/* Караван Ихлас — визитка сайт.
   Маалымат сервер тарабынан <script id="site-data"> ичине салынат (кошумча суроо жок).
   Админ киргизген текст ар дайым textContent аркылуу чыгат — HTML катары аткарылбайт. */
(() => {
  'use strict';

  const { site, page } = JSON.parse(document.getElementById('site-data').textContent);
  const S = site || {};
  const sections = S.sections || {};
  const isHome = page.type === 'home';

  // ── Жардамчылар ──────────────────────────────────────────────
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
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

  // Ири аталыштарда «үй-бүлө» сыяктуу сөздөр дефистен бөлүнүп кетпесин
  const keepWords = (text) => String(text || '')
    .split(/(\S*-\S*)/)
    .filter(Boolean)
    .map((part) => (part.includes('-') && !/\s/.test(part) ? h('span', { class: 'nowrap' }, part) : part));

  function safeHref(raw) {
    const u = String(raw || '').trim();
    if (!u) return null;
    if (/^(https?:|mailto:|tel:)/i.test(u)) return u;
    if (u.startsWith('#')) return isHome ? u : `/${u}`;
    if (u.startsWith('/') && !u.startsWith('//')) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(u)) return `https://${u}`;
    return null;
  }

  const isExternal = (href) => /^https?:/i.test(href) && !href.includes(location.host);
  const linkProps = (href) => (isExternal(href) ? { href, target: '_blank', rel: 'noopener' } : { href });

  // Браузерлерде кыргызча дата форматы жок (орусча чыгат) — өзүбүз түзөбүз: «15-октябрь, 2026»
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  function fmtDate(d) {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getDate()}-${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
  }

  const POST_TYPES = { elon: 'Жарыя', yangilik: 'Жаңылык', musobaqa: 'Конкурс' };

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
    share: 'M12 15V3 M7 8l5-5 5 5 M5 13v7h14v-7',
  };

  const icon = (name) => svg(
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[name] || ICON_PATHS.heart}"/></svg>`
  );

  // ── Кочкор мүйүз оймо-чиймеси ────────────────────────────────
  let ornamentId = 0;
  function ornament({ tile = 44, bg = '#1B2B52', line = '#14868C', accent = '#E9AB3C', className = '' } = {}) {
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

  const brandMark = () => svg(`
    <svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#1B2B52"/>
      <path d="M14 52 V31 C14 21 26 16 32 10 C38 16 50 21 50 31 V52 Z" fill="none" stroke="#E9AB3C" stroke-width="4" stroke-linejoin="round"/>
      <path d="M32 26l7 7-7 7-7-7Z" fill="#14868C"/>
    </svg>`);

  function brand(extraClass = '') {
    const b = S.brand || {};
    return h('a', { class: `brand ${extraClass}`, href: '/', 'aria-label': `${b.name || ''} — башкы бет` },
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
    if (show.about) items.push(['#about', S.about.title || 'Биз жөнүндө']);
    if (show.directions) items.push(['#directions', S.directions.title || 'Эмне кылабыз']);
    if (sections.blog) items.push(['/blog', S.blog?.title || 'Жаңылыктар']);
    if (show.contacts) items.push(['#contacts', C.title || 'Байланыш']);
    return items;
  }

  function header() {
    const nav = h('nav', { class: 'nav', id: 'site-nav', 'aria-label': 'Негизги меню' },
      navItems().map(([href, label]) => h('a', { href: safeHref(href) }, label)),
    );
    const cta = S.hero?.primaryCta;
    if (has(cta?.label) && safeHref(cta.href)) {
      nav.append(h('a', { class: 'btn btn--primary btn--small', ...linkProps(safeHref(cta.href)) }, cta.label));
    }
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });

    const toggle = h('button', {
      class: 'menu-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'site-nav', 'aria-label': 'Менюну ачуу',
      onclick: () => toggleMenu(),
    }, icon('menu'));

    function toggleMenu(force) {
      const open = force ?? !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Менюну жабуу' : 'Менюну ачуу');
      toggle.replaceChildren(icon(open ? 'close' : 'menu'));
    }

    const el = h('header', { class: 'header' }, h('div', { class: 'wrap header__inner' }, brand(), toggle, nav));
    const onScroll = () => el.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return el;
  }

  function hero() {
    const H = S.hero || {};
    const actions = [H.primaryCta, H.secondaryCta]
      .filter((c) => has(c?.label) && safeHref(c.href))
      .map((c, i) => h('a', { class: `btn ${i === 0 ? 'btn--primary' : 'btn--ghost'}`, ...linkProps(safeHref(c.href)) }, c.label));

    const frame = h('div', { class: 'arch__frame' },
      has(H.image) ? h('img', { src: H.image, alt: '', fetchpriority: 'high' }) : ornament({ tile: 64, className: 'arch__pattern' }),
    );
    const outline = svg(`
      <svg class="arch__outline" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M1 124 V53 C1 27 41 14 50 1 C59 14 99 27 99 53 V124"/>
      </svg>`);

    return h('section', { class: 'hero' },
      h('div', { class: 'wrap hero__grid' },
        h('div', { class: 'hero__copy' },
          h('h1', {}, keepWords(H.title || S.brand?.name || '')),
          has(H.text) ? h('p', {}, H.text) : null,
          actions.length ? h('div', { class: 'hero__actions' }, actions) : null,
        ),
        h('div', { class: 'arch' }, outline, frame),
      ),
    );
  }

  const band = () => h('div', { class: 'ornament-band', 'aria-hidden': 'true' }, ornament({ tile: 36 }));

  const paragraphs = (text) => String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => h('p', {}, p));

  function about() {
    const A = S.about;
    const copy = h('div', {},
      h('h2', {}, keepWords(A.title || 'Биз жөнүндө')),
      h('div', { class: 'about__text' }, paragraphs(A.text)),
      has(A.foundedYear) ? h('p', { class: 'about__since' }, `${A.foundedYear}-жылдан бери иштейбиз`) : null,
    );
    return h('section', { class: 'section', id: 'about' },
      h('div', { class: `wrap about__grid ${has(A.image) ? '' : 'about__grid--single'}` },
        copy,
        has(A.image) ? h('img', { class: 'about__image', src: A.image, alt: '', loading: 'lazy' }) : null,
      ),
    );
  }

  function directions() {
    const D = S.directions;
    return h('section', { class: 'section section--mist', id: 'directions' },
      h('div', { class: 'wrap' },
        h('div', { class: 'section__head' }, h('h2', {}, keepWords(D.title || 'Эмне кылабыз'))),
        h('div', { class: 'directions' },
          D.items.filter((d) => has(d.title)).map((d) =>
            h('article', { class: 'direction' },
              h('div', { class: 'direction__icon' }, icon(d.icon)),
              h('div', {}, h('h3', {}, d.title), has(d.text) ? h('p', {}, d.text) : null),
            )),
        ),
      ),
    );
  }

  function stats() {
    const T = S.stats;
    return h('section', { class: 'stats', 'aria-labelledby': 'stats-title' },
      h('div', { class: 'wrap' },
        h('h2', { id: 'stats-title' }, T.title || 'Сандар менен'),
        h('ul', { class: 'stats__list' },
          T.items.map((s) => h('li', {}, h('div', { class: 'stats__value' }, s.value), h('p', { class: 'stats__label' }, s.label))),
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

  const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  function copyButton(text, label = 'Көчүрүү') {
    const btn = h('button', { class: 'btn btn--ghost btn--small', type: 'button' }, icon('copy'), label);
    btn.addEventListener('click', async () => {
      const ok = await copyText(text);
      btn.replaceChildren(icon('copy'), ok ? 'Көчүрүлдү' : 'Көчүрүлгөн жок');
      live.textContent = ok ? `${text} көчүрүлдү` : '';
      setTimeout(() => btn.replaceChildren(icon('copy'), label), 2200);
    });
    return btn;
  }

  function donate() {
    const D = S.donate || {};
    const methods = (D.methods || []).filter((m) => has(m.details) || has(m.name));
    return h('section', { class: 'section', id: 'donate' },
      h('div', { class: 'wrap donate__grid' },
        h('div', {}, h('h2', {}, keepWords(D.title || 'Жардам берүү')), has(D.text) ? h('p', {}, D.text) : null),
        methods.length
          ? h('ul', { class: 'methods' }, methods.map((m) => h('li', { class: 'method' },
            has(m.name) ? h('span', { class: 'method__name' }, m.name) : null,
            has(m.details) ? h('span', { class: 'method__details' }, m.details) : null,
            has(m.note) ? h('span', { class: 'method__note' }, m.note) : null,
            has(m.details) ? copyButton(m.details) : null,
          )))
          : h('p', { class: 'donate__empty' },
            'Жардам берүү жолдорун билүү үчүн ',
            show.contacts ? h('a', { href: '#contacts' }, 'биз менен байланышыңыз') : 'биз менен байланышыңыз',
            '.'),
      ),
    );
  }

  function postCard(p) {
    return h('a', { class: 'post-card', href: `/blog/${p._id}` },
      h('div', { class: 'post-card__media' },
        has(p.image) ? h('img', { src: p.image, alt: '', loading: 'lazy' }) : ornament({ tile: 40 })),
      h('div', { class: 'post-meta' },
        POST_TYPES[p.type] ? h('span', { class: 'post-meta__type' }, POST_TYPES[p.type]) : null,
        h('time', { datetime: p.createdAt }, fmtDate(p.createdAt)),
      ),
      h('h3', { class: 'post-card__title' }, p.title),
      has(p.excerpt) ? h('p', { class: 'post-card__excerpt' }, p.excerpt) : null,
    );
  }

  function blogTeaser() {
    return h('section', { class: 'section section--mist', id: 'blog' },
      h('div', { class: 'wrap' },
        h('div', { class: 'section-row' },
          h('h2', {}, S.blog.title || 'Жаңылыктар'),
          h('a', { class: 'btn btn--ghost btn--small', href: '/blog' }, 'Бардык жаңылыктар'),
        ),
        h('div', { class: 'posts' }, S.blog.posts.map(postCard)),
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
    if (has(C.address)) rows.push(['Дарек', C.address]);
    const phones = (C.phones || []).filter(has);
    if (phones.length) rows.push(['Телефон', phones.map((p, i) => [i ? ', ' : '', h('a', { href: `tel:${p.replace(/[^\d+]/g, '')}` }, p)])]);
    if (has(C.email)) rows.push(['Электрондук почта', h('a', { href: `mailto:${C.email.trim()}` }, C.email)]);

    const socials = socialLinks();
    const map = mapSrc(C.mapUrl);

    const info = h('div', {},
      h('h2', {}, C.title || 'Байланыш'),
      rows.length ? h('dl', { class: 'contact-list' }, rows.map(([dt, dd]) => [h('dt', {}, dt), h('dd', {}, dd)])) : null,
      socials.length ? h('div', { class: 'socials' }, socials.map((s) => h('a', { class: 'social', href: s.href, target: '_blank', rel: 'noopener' }, icon(s.key), s.name))) : null,
      map.link ? h('p', { style: 'margin-top:24px' }, h('a', { href: map.link, target: '_blank', rel: 'noopener' }, 'Картадан ачуу')) : null,
    );

    return h('section', { class: 'section', id: 'contacts' },
      h('div', { class: `wrap contacts__grid ${map.embed ? '' : 'contacts__grid--single'}` },
        info,
        map.embed ? h('div', { class: 'map' }, h('iframe', {
          src: map.embed, title: 'Картада биздин дарек', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: true,
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
        h('div', {}, brand()),
        navItems().length ? h('div', {},
          h('h3', {}, 'Бөлүмдөр'),
          h('ul', {}, navItems().map(([href, label]) => h('li', {}, h('a', { href: safeHref(href) }, label)))),
        ) : h('div'),
        (links.length || socials.length) ? h('div', {},
          h('h3', {}, 'Шилтемелер'),
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
    const pager = page.pages > 1 ? h('nav', { class: 'pager', 'aria-label': 'Барактар' },
      page.page > 1 ? h('a', { class: 'btn btn--ghost btn--small', href: page.page - 1 > 1 ? `/blog?page=${page.page - 1}` : '/blog' }, 'Мурунку') : h('span'),
      h('span', {}, `${page.page} / ${page.pages}`),
      page.page < page.pages ? h('a', { class: 'btn btn--ghost btn--small', href: `/blog?page=${page.page + 1}` }, 'Кийинки') : h('span'),
    ) : null;

    return h('section', { class: 'section' },
      h('div', { class: 'wrap' },
        h('div', { class: 'section__head' }, h('h1', {}, S.blog?.title || 'Жаңылыктар')),
        posts.length
          ? h('div', { class: 'posts' }, posts.map(postCard))
          : h('p', { class: 'donate__empty' }, 'Азырынча жаңылыктар жок. Кийинчерээк кайра кириңиз.'),
        pager,
      ),
    );
  }

  function postPage() {
    const p = page.post;
    const share = h('button', { class: 'btn btn--ghost btn--small', type: 'button' }, icon('share'), 'Бөлүшүү');
    share.addEventListener('click', async () => {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title: p.title, url }); } catch { /* жокко чыгарылды */ } return; }
      const ok = await copyText(url);
      share.replaceChildren(icon('share'), ok ? 'Шилтеме көчүрүлдү' : 'Бөлүшүү');
    });

    return h('section', { class: 'section' },
      h('article', { class: 'wrap article' },
        h('a', { class: 'article__back', href: '/blog' }, `‹ ${S.blog?.title || 'Жаңылыктар'}`),
        h('div', { class: 'post-meta' },
          POST_TYPES[p.type] ? h('span', { class: 'post-meta__type' }, POST_TYPES[p.type]) : null,
          h('time', { datetime: p.createdAt }, fmtDate(p.createdAt)),
        ),
        h('h1', {}, keepWords(p.title)),
        has(p.image) ? h('img', { class: 'article__image', src: p.image, alt: '' }) : null,
        h('div', { class: 'article__body' }, renderMarkdown(p.body)),
        h('div', { class: 'article__share' }, share),
      ),
    );
  }

  function notFoundPage() {
    return h('section', { class: 'section' },
      h('div', { class: 'wrap notfound' },
        h('h1', {}, 'Бул барак табылган жок'),
        h('p', {}, 'Шилтеме эскирген же туура эмес терилген болушу мүмкүн. Башкы бетке кайтып, керектүү бөлүмдү тандаңыз.'),
        h('p', {}, h('a', { class: 'btn btn--primary', href: '/' }, 'Башкы бетке кайтуу')),
      ),
    );
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
})();
