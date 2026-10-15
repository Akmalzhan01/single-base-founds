const SiteSettings = require('../models/SiteSettings');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const audit = require('../utils/audit');
const site = require('../services/siteService');

// Админ өзгөртө ала турган бөлүмдөр (key, isSample, timestamps — жок)
const EDITABLE = ['foundation', 'brand', 'hero', 'about', 'directions', 'stats', 'donate', 'blog', 'contacts', 'links', 'sections', 'seo'];

const siteUrl = () => {
  const first = (process.env.SITE_HOSTS || 'karavan-ihlas.com').split(',')[0].trim();
  return process.env.SITE_URL || (first.endsWith('localhost') ? `http://${first}:${process.env.PORT || 5000}` : `https://${first}`);
};

// ── Админ (суперадмин) ─────────────────────────────────────────────

// GET /api/site
exports.getAdmin = catchAsync(async (req, res) => {
  const doc = await SiteSettings.getMain();
  res.status(200).json({ success: true, data: doc, siteUrl: siteUrl() });
});

// PUT /api/site
exports.update = catchAsync(async (req, res) => {
  const doc = await SiteSettings.getMain();
  for (const key of EDITABLE) {
    if (req.body[key] !== undefined) doc.set(key, req.body[key] === '' && key === 'foundation' ? null : req.body[key]);
  }
  doc.isSample = false;
  await doc.save();
  site.invalidate();

  audit(req, { action: 'update', entity: 'SiteSettings', entityId: doc._id, description: 'Сайттын мазмуну жаңыланды' });
  res.status(200).json({ success: true, data: doc });
});

// POST /api/site/upload  (multipart: image)
exports.upload = catchAsync(async (req, res, next) => {
  if (!req.file?.path) return next(new AppError('Сүрөт жүктөлгөн жок', 400));
  res.status(201).json({ success: true, url: req.file.path });
});

// ── Ачык (визитка сайт үчүн) ───────────────────────────────────────

// GET /api/public/site
exports.publicSite = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: await site.getPublicSite() });
});

// GET /api/public/posts?page=&limit=
exports.publicPosts = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, ...(await site.listPosts(req.query)) });
});

// GET /api/public/posts/:id
exports.publicPost = catchAsync(async (req, res, next) => {
  const post = await site.getPost(req.params.id);
  if (!post) return next(new AppError('Пост табылган жок', 404));
  res.status(200).json({ success: true, data: post });
});
