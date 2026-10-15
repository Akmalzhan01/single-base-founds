const mongoose = require('mongoose');
const SiteSettings = require('../models/SiteSettings');
const Beneficiary = require('../models/Beneficiary');
const AidRecord = require('../models/AidRecord');
const Foundation = require('../models/Foundation');
const Post = require('../models/Post');
const { localize, normLang } = require('../utils/siteI18n');

// Визитка сайт ар бир ачылганда базага барбашы үчүн жөнөкөй кэш.
// Суперадмин сактаганда invalidate() чакырылат.
let settingsCache = null;
let statsCache = null; // { key, at, values }
const STATS_TTL = 60 * 1000;

const invalidate = () => { settingsCache = null; statsCache = null; };

const getSettings = async () => {
  if (!settingsCache) settingsCache = (await SiteSettings.getMain()).toObject();
  return settingsCache;
};

const computeStats = async (foundation) => {
  const key = String(foundation || 'all');
  if (statsCache && statsCache.key === key && Date.now() - statsCache.at < STATS_TTL) return statsCache.values;

  const fid = foundation ? new mongoose.Types.ObjectId(String(foundation)) : null;
  const [beneficiaries, aidCount, amountRows, foundations] = await Promise.all([
    Beneficiary.countDocuments(fid ? { registeredBy: fid } : {}),
    AidRecord.countDocuments(fid ? { foundation: fid } : {}),
    AidRecord.aggregate([
      ...(fid ? [{ $match: { foundation: fid } }] : []),
      { $group: { _id: null, total: { $sum: { $ifNull: ['$amount', 0] } } } },
    ]),
    Foundation.countDocuments({ isActive: true }),
  ]);

  const values = { beneficiaries, aidCount, aidAmount: amountRows[0]?.total || 0, foundations };
  statsCache = { key, at: Date.now(), values };
  return values;
};

// Markdown белгилерисиз кыска текст (карточка жана meta description үчүн)
const excerpt = (body = '', len = 180) => {
  const plain = String(body)
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/[*~_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > len ? `${plain.slice(0, len).replace(/\s+\S*$/, '')}…` : plain;
};

const toPublicPost = (p, full = false) => ({
  _id: p._id,
  title: p.title,
  type: p.type,
  image: p.image || '',
  createdAt: p.createdAt,
  views: p.views || 0,
  foundation: p.foundation?.name || '',
  excerpt: excerpt(p.body),
  ...(full ? { body: p.body } : {}),
});

const postFilter = (settings) => (settings.foundation ? { foundation: settings.foundation } : {});

const listPosts = async ({ page = 1, limit = 9 } = {}) => {
  const settings = await getSettings();
  const filter = postFilter(settings);
  const safeLimit = Math.min(30, Math.max(1, Number(limit) || 9));
  const safePage = Math.max(1, Number(page) || 1);

  const [total, posts] = await Promise.all([
    Post.countDocuments(filter),
    Post.find(filter)
      .select('title body type image createdAt views foundation')
      .populate('foundation', 'name')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    data: posts.map((p) => toPublicPost(p)),
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / safeLimit)),
  };
};

// Бир пост (көрүүлөр саны көбөйөт). Табылбаса же сайттын фондуна тиешелүү болбосо — null
const getPost = async (id, { countView = true } = {}) => {
  if (!mongoose.isValidObjectId(id)) return null;
  const settings = await getSettings();
  const filter = { _id: id, ...postFilter(settings) };
  const post = countView
    ? await Post.findOneAndUpdate(filter, { $inc: { views: 1 } }, { returnDocument: 'after' })
      .populate('foundation', 'name').lean()
    : await Post.findOne(filter).populate('foundation', 'name').lean();
  return post ? toPublicPost(post, true) : null;
};

// Сайтка керектүү бардык маалымат: мазмун (тандалган тилде) + эсептелген сандар + акыркы посттор
const getPublicSite = async (lang) => {
  const raw = await getSettings();
  const values = await computeStats(raw.foundation);
  const s = localize({
    brand: raw.brand, hero: raw.hero, about: raw.about, directions: raw.directions, stats: raw.stats,
    donate: raw.donate, blog: raw.blog, contacts: raw.contacts, links: raw.links, seo: raw.seo,
  }, normLang(lang));

  // ru-RU сандарды бөлүүчү катары NBSP (U+00A0 / U+202F) колдонот — кадимки боштукка алмаштырабыз
  const fmt = (n) => Number(n).toLocaleString('ru-RU').replace(/\s/g, ' ');
  const stats = (s.stats?.items || [])
    .map((item) => ({
      label: item.label,
      value: item.source && item.source !== 'manual' ? fmt(values[item.source] || 0) : item.value,
    }))
    .filter((item) => item.label && item.value !== undefined && item.value !== '');

  const posts = raw.sections?.blog ? (await listPosts({ limit: raw.blog?.limit || 3 })).data : [];

  return {
    brand: s.brand,
    hero: s.hero,
    about: s.about,
    directions: s.directions,
    stats: { title: s.stats?.title, items: stats },
    donate: s.donate,
    blog: { title: s.blog?.title, posts },
    contacts: s.contacts,
    links: s.links,
    sections: raw.sections,
    seo: s.seo,
  };
};

module.exports = { getSettings, getPublicSite, listPosts, getPost, invalidate, excerpt };
