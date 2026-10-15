const fs = require('fs');
const path = require('path');
const express = require('express');
const catchAsync = require('../utils/catchAsync');
const site = require('../services/siteService');

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

const render = catchAsync(async (req, res) => {
  const data = await site.getPublicSite();
  let status = 200;
  let page = { type: 'home' };

  const brand = data.brand?.name || 'Караван Ихлас';
  let title = data.seo?.title || [brand, data.brand?.tagline].filter(Boolean).join(' — ');
  let description = data.seo?.description || data.hero?.text || '';
  let image = data.seo?.image || data.hero?.image || data.brand?.logo || '';

  if (req.path === '/blog') {
    page = { type: 'blog', ...(await site.listPosts({ page: req.query.page, limit: 9 })) };
    title = `${data.blog?.title || 'Жаңылыктар'} — ${brand}`;
  } else if (req.params.id) {
    const post = await site.getPost(req.params.id);
    if (post) {
      page = { type: 'post', post };
      title = `${post.title} — ${brand}`;
      description = post.excerpt || description;
      image = post.image || image;
    } else {
      status = 404;
      page = { type: 'notfound' };
    }
  } else if (req.path !== '/') {
    status = 404;
    page = { type: 'notfound' };
  }

  const url = `${baseUrl(req)}${req.path}`;
  res.status(status).type('html').send(fill(getTemplate(), {
    LANG: 'ky',
    TITLE: escapeHtml(title),
    DESCRIPTION: escapeHtml(description.slice(0, 300)),
    IMAGE: escapeHtml(image),
    URL: escapeHtml(url),
    SITE_NAME: escapeHtml(brand),
    V: VERSION,
    DATA: scriptJson({ site: data, page }),
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
  const urls = [`${base}/`, `${base}/blog`, ...posts.map((p) => `${base}/blog/${p._id}`)];
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
      urls.map((u) => `  <url><loc>${escapeHtml(u)}</loc></url>`).join('\n')
    }\n</urlset>\n`
  );
}));

siteRouter.get(['/', '/blog', '/blog/:id'], render);
siteRouter.use((req, res, next) => (req.method === 'GET' ? render(req, res, next) : res.sendStatus(404)));

// Сайттын доменинен келген (API эмес) суроолорду гана кармайт, калганы FundsDB'ге өтөт
module.exports = (req, res, next) => {
  const host = (req.hostname || '').toLowerCase();
  if (!HOSTS.includes(host) || req.path.startsWith('/api/')) return next();
  return siteRouter(req, res, next);
};
