const mongoose = require('mongoose');

// Визитка сайттын (karavan-ihlas.com) мазмуну — бир гана документ (key: 'main').
// Суперадмин FundsDB'деги «Сайт» барагынан толтурат.
// Тексттер кыргызча; котормолор ар бир объекттин `i18n: { ru, en }` талаасында (utils/siteI18n.js).

const linkSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  href: { type: String, trim: true },
  i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
}, { _id: false });

const directionSchema = new mongoose.Schema({
  icon: { type: String, default: 'heart' },
  title: { type: String, trim: true },
  text: { type: String, trim: true },
  i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
}, { _id: false });

// source: manual — колго жазылган сан; калгандары FundsDB'ден автоматтык эсептелет
const STAT_SOURCES = ['manual', 'beneficiaries', 'aidCount', 'aidAmount', 'foundations'];
const statSchema = new mongoose.Schema({
  label: { type: String, trim: true },
  value: { type: String, trim: true },
  source: { type: String, enum: STAT_SOURCES, default: 'manual' },
  i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
}, { _id: false });

const donateMethodSchema = new mongoose.Schema({
  name: { type: String, trim: true },     // MBank, Элсом, банк...
  details: { type: String, trim: true },  // номер / эсеп
  note: { type: String, trim: true },     // алуучунун аты ж.б.
  i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
}, { _id: false });

const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  // Үлгү мазмун — суперадмин биринчи жолу сактаганга чейин true
  isSample: { type: Boolean, default: true },

  // Сайт кайсы фондго тиешелүү: блог жана автоматтык сандар ушул фонд боюнча.
  // Бош болсо — бүт платформа боюнча.
  foundation: { type: mongoose.Schema.Types.ObjectId, ref: 'Foundation', default: null },

  brand: {
    name: { type: String, trim: true, default: 'Караван Ихлас' },
    tagline: { type: String, trim: true, default: 'Кайрымдуулук фонду' },
    logo: { type: String, trim: true, default: '' },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  hero: {
    title: { type: String, trim: true, default: 'Муктаж үй-бүлөлөргө ак ниет менен жардам беребиз' },
    text: {
      type: String, trim: true,
      default: 'Жалгыз энелерге, карыяларга, майыптарга жана жетим балдарга азык-түлүк, дары-дармек жана башка жардам көрсөтөбүз. Ар бир жардам ихлас менен, туура адамга жетет.',
    },
    image: { type: String, trim: true, default: '' },
    primaryCta: { type: linkSchema, default: () => ({ label: 'Жардам берүү', href: '#donate' }) },
    secondaryCta: { type: linkSchema, default: () => ({ label: 'Биз жөнүндө', href: '#about' }) },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  about: {
    title: { type: String, trim: true, default: 'Биз жөнүндө' },
    text: {
      type: String, trim: true,
      default: 'Караван Ихлас — кайрымдуулук фонду. Биз муктаж үй-бүлөлөрдү аныктап, алардын абалын текшерип, жардамды түз колуна жеткиребиз.\n\nФонддун ишин ыктыярчылар жана кайрымдуу инсандар колдойт. Ар бир берилген жардам эсепке алынат.',
    },
    image: { type: String, trim: true, default: '' },
    foundedYear: { type: String, trim: true, default: '' },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  directions: {
    title: { type: String, trim: true, default: 'Эмне кылабыз' },
    items: {
      type: [directionSchema],
      default: () => [
        { icon: 'food', title: 'Азык-түлүк', text: 'Муктаж үй-бүлөлөргө азык-түлүк топтомдорун таратабыз.' },
        { icon: 'medicine', title: 'Дары-дармек', text: 'Оорулууларга дары алууга жана дарыланууга жардам беребиз.' },
        { icon: 'family', title: 'Жетим балдар жана жалгыз энелер', text: 'Жетим балдарды жана жалгыз бой энелерди колдойбуз.' },
        { icon: 'book', title: 'Билим жана мелдештер', text: 'Жаштар үчүн билим берүүчү мелдештерди уюштурабыз.' },
      ],
    },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  stats: {
    title: { type: String, trim: true, default: 'Сандар менен' },
    items: {
      type: [statSchema],
      default: () => [
        { label: 'катталган муктаж үй-бүлө', source: 'beneficiaries' },
        { label: 'жолу жардам көрсөтүлдү', source: 'aidCount' },
        { label: 'сом жардам берилди', source: 'aidAmount' },
      ],
    },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  donate: {
    title: { type: String, trim: true, default: 'Жардам берүү' },
    text: {
      type: String, trim: true,
      default: 'Садака, зекет же кайрымдуулук жардамыңызды төмөнкү реквизиттер аркылуу жөнөтсөңүз болот. Ар бир салым муктаж үй-бүлөгө жетет.',
    },
    methods: { type: [donateMethodSchema], default: () => [] },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  blog: {
    title: { type: String, trim: true, default: 'Жаңылыктар' },
    limit: { type: Number, default: 3, min: 1, max: 12 },
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  contacts: {
    title: { type: String, trim: true, default: 'Байланыш' },
    address: { type: String, trim: true, default: '' },
    phones: { type: [String], default: () => [] },
    email: { type: String, trim: true, default: '' },
    whatsapp: { type: String, trim: true, default: '' },
    telegram: { type: String, trim: true, default: '' },
    instagram: { type: String, trim: true, default: '' },
    facebook: { type: String, trim: true, default: '' },
    youtube: { type: String, trim: true, default: '' },
    tiktok: { type: String, trim: true, default: '' },
    mapUrl: { type: String, trim: true, default: '' }, // Google Maps embed шилтемеси
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },

  // Футердеги шилтемелер (ички системалар ж.б.)
  links: {
    type: [linkSchema],
    default: () => [
      { label: 'Кызматкерлер үчүн', href: 'https://funds-db.karavan-ihlas.com' },
      { label: 'Мелдеш', href: 'https://meldesh.karavan-ihlas.com' },
    ],
  },

  // Бөлүмдөрдү көрсөтүү/жашыруу
  sections: {
    about: { type: Boolean, default: true },
    directions: { type: Boolean, default: true },
    stats: { type: Boolean, default: true },
    donate: { type: Boolean, default: true },
    blog: { type: Boolean, default: true },
    contacts: { type: Boolean, default: true },
  },

  seo: {
    title: { type: String, trim: true, default: '' },       // бош болсо — brand.name
    description: { type: String, trim: true, default: '' }, // бош болсо — hero.text
    image: { type: String, trim: true, default: '' },       // бош болсо — hero.image
    i18n: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
}, { timestamps: true, minimize: false });

siteSettingsSchema.statics.getMain = async function () {
  const doc = await this.findOne({ key: 'main' });
  if (doc) return doc;
  try {
    return await this.create({ key: 'main' });
  } catch (err) {
    // Эки суроо бир убакта түзүүгө аракет кылса — экинчиси бар документти алат
    if (err.code === 11000) return this.findOne({ key: 'main' });
    throw err;
  }
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
module.exports.STAT_SOURCES = STAT_SOURCES;
