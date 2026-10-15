const fs = require('fs');
const path = require('path');
const express = require('express');
const catchAsync = require('../utils/catchAsync');
const site = require('../services/siteService');
const { LANGS, DEFAULT_LANG } = require('../utils/siteI18n');

// Визитка сайт (репонун site/ папкасы) ушул домендерде ачылат.
// Жергиликтүү текшерүү: http://site.localhost:5000
const SITE_DIR = path.join(__dirname, '../../../site');
const HOSTS = (process.env.SITE_HOSTS || 'karavan-ihlas.com,www.karavan-ihlas.com,site.localhost')
  .split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

// Ар бир деплойдо CSS/JS кэши жаңылансын
const VERSION = Date.now().toString(36);

let template = null;
const getTemplate = () => {
  if (!template || process.env.NODE_ENV !== 'production') {
    template = fs.readFileSync(path.join(SITE_DIR, 'index.html'), 'utf8');
  }
  return template;
};

const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// <script> ичине коопсуз JSON
// U+2028/U+2029 JSON'до уруксат, бирок <script> ичинде JS'ти бузат
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);
const scriptJson = (obj) =>
  JSON.stringify(obj)
    .split('<').join('\\u003c')
    .split(LINE_SEP).join('\\u2028')
    .split(PARA_SEP).join('\\u2029');

const baseUrl = (req) =>
  process.env.SITE_URL || (req.hostname.endsWith('localhost') ? `http://${req.get('host')}` : `https://${req.hostname}`);

const fill = (html, values) =>
  html.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in values ? values[key] : m));

// Тилдер: кыргызча — /, орусча — /ru/..., англисче — /en/...
const LANG_RE = new RegExp(`^/(${LANGS.filter((l) => l !== DEFAULT_LANG).join('|')})(?=/|$)`);
const UI = {
  ky: { locale: 'ky_KG', news: 'Жаңылыктар', skip: 'Негизги мазмунга өтүү', noscript: "Сайтты көрүү үчүн браузерде JavaScript'ти күйгүзүңүз." },
  ru: { locale: 'ru_RU', news: 'Новости', skip: 'Перейти к содержанию', noscript: 'Чтобы открыть сайт, включите JavaScript в браузере.' },
  en: { locale: 'en_US', news: 'News', skip: 'Skip to content', noscript: 'Please enable JavaScript in your browser to view this site.' },
};

// Тилдин префикси + барактын жолу: ('ru', '/blog') → '/ru/blog'; ('ky', '/') → '/'
const pathFor = (lang, rest) => {
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`;
  return rest === '/' ? (prefix || '/') : `${prefix}${rest}`;
};

const parsePath = (p) => {
  const m = p.match(LANG_RE);
  const lang = m ? m[1] : DEFAULT_LANG;
  let rest = (m ? p.slice(m[0].length) : p) || '/';
  if (rest.length > 1) rest = rest.replace(/\/+$/, '') || '/';
  return { lang, rest };
};

const render = catchAsync(async (req, res) => {
  const { lang, rest } = parsePath(req.path);
  const ui = UI[lang];
  const data = await site.getPublicSite(lang);
  let status = 200;
  let page = { type: 'home' };

  const brand = data.brand?.name || 'Караван Ихлас';
  let title = data.seo?.title || [brand, data.brand?.tagline].filter(Boolean).join(' — ');
  let description = data.seo?.description || data.hero?.text || '';
  let image = data.seo?.image || data.hero?.image || data.brand?.logo || '';

  const postMatch = rest.match(/^\/blog\/([^/]+)$/);
  if (rest === '/blog') {
    page = { type: 'blog', ...(await site.listPosts({ page: req.query.page, limit: 9 })) };
    title = `${data.blog?.title || ui.news} — ${brand}`;
  } else if (postMatch) {
    const post = await site.getPost(postMatch[1]);
    if (post) {
      page = { type: 'post', post };
      title = `${post.title} — ${brand}`;
      description = post.excerpt || description;
      image = post.image || image;
    } else {
      status = 404;
      page = { type: 'notfound' };
    }
  } else if (rest !== '/') {
    status = 404;
    page = { type: 'notfound' };
  }

  const origin = baseUrl(req);
  const query = rest === '/blog' && Number(req.query.page) > 1 ? `?page=${Number(req.query.page)}` : '';
  // Издөө системалары үчүн: ушул барактын башка тилдердеги дареги
  const alternates = status === 200
    ? [...LANGS.map((l) => [l, pathFor(l, rest)]), ['x-default', pathFor(DEFAULT_LANG, rest)]]
      .map(([l, p]) => `<link rel="alternate" hreflang="${l}" href="${escapeHtml(origin + p + query)}">`)
      .join('\n  ')
    : '';

  res.status(status).type('html').send(fill(getTemplate(), {
    LANG: lang,
    LOCALE: ui.locale,
    TITLE: escapeHtml(title),
    DESCRIPTION: escapeHtml(description.slice(0, 300)),
    IMAGE: escapeHtml(image),
    URL: escapeHtml(origin + pathFor(lang, rest) + query),
    ALTERNATES: alternates,
    SITE_NAME: escapeHtml(brand),
    SKIP: escapeHtml(ui.skip),
    NOSCRIPT: escapeHtml(ui.noscript),
    V: VERSION,
    DATA: scriptJson({ site: data, page: { ...page, lang, base: lang === DEFAULT_LANG ? '' : `/${lang}` } }),
  }));
});

const siteRouter = express.Router();
siteRouter.use('/assets', express.static(path.join(SITE_DIR, 'assets'), { maxAge: '30d', immutable: true }));

siteRouter.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl(req)}/sitemap.xml\n`);
});

siteRouter.get('/sitemap.xml', catchAsync(async (req, res) => {
  const base = baseUrl(req);
  const { data: posts } = await site.listPosts({ limit: 30 });
  const paths = ['/', '/blog', ...posts.map((p) => `/blog/${p._id}`)];
  const urls = LANGS.flatMap((l) => paths.map((p) => `${base}${pathFor(l, p)}`));
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
      urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join('\n')
    }\n</urlset>\n`
  );
}));

// Бардык GET суроолор (/, /blog, /blog/:id жана алардын /ru, /en түрлөрү) render'ге барат
siteRouter.use((req, res, next) => (req.method === 'GET' || req.method === 'HEAD' ? render(req, res, next) : res.sendStatus(404)));

// Сайттын доменинен келген (API эмес) суроолорду гана кармайт, калганы FundsDB'ге өтөт
module.exports = (req, res, next) => {
  const host = (req.hostname || '').toLowerCase();
  if (!HOSTS.includes(host) || req.path.startsWith('/api/')) return next();
  return siteRouter(req, res, next);
};
