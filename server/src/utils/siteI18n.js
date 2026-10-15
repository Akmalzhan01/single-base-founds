// Визитка сайттын тилдери.
// Негизги тил — кыргызча (талаалардын өзүндө сакталат). Орусча жана англисче котормолор
// ар бир объекттин ичиндеги `i18n: { ru: {...}, en: {...} }` талаасында турат —
// ошондуктан тизмелердин (багыттар, реквизиттер) иретин өзгөрткөндө котормо кошо жылат.

const DEFAULT_LANG = 'ky';
const LANGS = ['ky', 'ru', 'en'];
const TRANSLATED = LANGS.filter((l) => l !== DEFAULT_LANG);

// Которула турган текст талаалары. Шилтеме, сүрөт, номер, сан — бардык тилде бирдей.
const TEXT_FIELDS = ['name', 'tagline', 'title', 'text', 'label', 'note', 'address', 'description'];
const MAX_LEN = 5000;

// Үлгү (schema default) тексттердин котормолору.
// Котормо бош болсо жана кыргызча текст али үлгү бойдон турса — ушул колдонулат.
// Админ кыргызча текстти өзгөртсө, бул котормо колдонулбай калат (эски котормо жаңы текстке туура келбейт).
const DEFAULTS = {
  'Караван Ихлас': { ru: 'Караван Ихлас', en: 'Karavan Ihlas' },
  'Кайрымдуулук фонду': { ru: 'Благотворительный фонд', en: 'Charity foundation' },
  'Муктаж үй-бүлөлөргө ак ниет менен жардам беребиз': {
    ru: 'Помогаем нуждающимся семьям с искренним намерением',
    en: 'We help families in need with sincere intention',
  },
  'Жалгыз энелерге, карыяларга, майыптарга жана жетим балдарга азык-түлүк, дары-дармек жана башка жардам көрсөтөбүз. Ар бир жардам ихлас менен, туура адамга жетет.': {
    ru: 'Помогаем одиноким матерям, пожилым людям, людям с инвалидностью и детям-сиротам продуктами, лекарствами и не только. Каждая помощь оказывается искренне и доходит до того, кому она нужна.',
    en: 'We support single mothers, the elderly, people with disabilities and orphans with food, medicine and other aid. Every contribution is given sincerely and reaches the person who needs it.',
  },
  'Жардам берүү': { ru: 'Помочь', en: 'Donate' },
  'Биз жөнүндө': { ru: 'О нас', en: 'About us' },
  'Караван Ихлас — кайрымдуулук фонду. Биз муктаж үй-бүлөлөрдү аныктап, алардын абалын текшерип, жардамды түз колуна жеткиребиз.\n\nФонддун ишин ыктыярчылар жана кайрымдуу инсандар колдойт. Ар бир берилген жардам эсепке алынат.': {
    ru: 'Караван Ихлас — благотворительный фонд. Мы находим нуждающиеся семьи, проверяем их положение и передаём помощь из рук в руки.\n\nРаботу фонда поддерживают волонтёры и благотворители. Каждая оказанная помощь учитывается.',
    en: 'Karavan Ihlas is a charity foundation. We find families in need, verify their situation and deliver aid directly into their hands.\n\nThe foundation is supported by volunteers and donors. Every act of aid is recorded.',
  },
  'Эмне кылабыз': { ru: 'Чем мы занимаемся', en: 'What we do' },
  'Азык-түлүк': { ru: 'Продукты питания', en: 'Food' },
  'Муктаж үй-бүлөлөргө азык-түлүк топтомдорун таратабыз.': {
    ru: 'Раздаём продуктовые наборы нуждающимся семьям.',
    en: 'We distribute food packages to families in need.',
  },
  'Дары-дармек': { ru: 'Лекарства', en: 'Medicine' },
  'Оорулууларга дары алууга жана дарыланууга жардам беребиз.': {
    ru: 'Помогаем больным с покупкой лекарств и лечением.',
    en: 'We help the sick pay for medicine and treatment.',
  },
  'Жетим балдар жана жалгыз энелер': { ru: 'Сироты и одинокие матери', en: 'Orphans and single mothers' },
  'Жетим балдарды жана жалгыз бой энелерди колдойбуз.': {
    ru: 'Поддерживаем детей-сирот и одиноких матерей.',
    en: 'We support orphans and single mothers.',
  },
  'Билим жана мелдештер': { ru: 'Образование и конкурсы', en: 'Education and competitions' },
  'Жаштар үчүн билим берүүчү мелдештерди уюштурабыз.': {
    ru: 'Организуем образовательные конкурсы для молодёжи.',
    en: 'We organise educational competitions for young people.',
  },
  'Сандар менен': { ru: 'В цифрах', en: 'In numbers' },
  'катталган муктаж үй-бүлө': { ru: 'нуждающихся семей в базе', en: 'families in need registered' },
  'жолу жардам көрсөтүлдү': { ru: 'раз оказана помощь', en: 'times aid was provided' },
  'сом жардам берилди': { ru: 'сомов передано в помощь', en: 'som given in aid' },
  'Садака, зекет же кайрымдуулук жардамыңызды төмөнкү реквизиттер аркылуу жөнөтсөңүз болот. Ар бир салым муктаж үй-бүлөгө жетет.': {
    ru: 'Садака, закят или благотворительную помощь можно отправить по реквизитам ниже. Каждый вклад доходит до нуждающейся семьи.',
    en: 'You can send sadaqah, zakat or other donations using the details below. Every contribution reaches a family in need.',
  },
  'Жаңылыктар': { ru: 'Новости', en: 'News' },
  'Байланыш': { ru: 'Контакты', en: 'Contact' },
  'Кызматкерлер үчүн': { ru: 'Для сотрудников', en: 'For staff' },
  'Мелдеш': { ru: 'Конкурс', en: 'Competition' },
};

const normLang = (lang) => (LANGS.includes(lang) ? lang : DEFAULT_LANG);

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  && !(v instanceof Date) && !v._bsontype && !Buffer.isBuffer(v);

// Объекттин тексттерин тандалган тилге алмаштырат жана `i18n` талааларын алып салат
function localize(value, lang) {
  if (Array.isArray(value)) return value.map((v) => localize(v, lang));
  if (!isPlainObject(value)) return value;
  const tr = (lang !== DEFAULT_LANG && value.i18n && value.i18n[lang]) || {};
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k === 'i18n') continue;
    if (lang !== DEFAULT_LANG && typeof v === 'string' && TEXT_FIELDS.includes(k)) {
      const own = typeof tr[k] === 'string' ? tr[k].trim() : '';
      out[k] = own || DEFAULTS[v.trim()]?.[lang] || v;
    } else {
      out[k] = localize(v, lang);
    }
  }
  return out;
}

// Админден келген маалыматтагы `i18n` талааларын тазалайт:
// белгилүү тилдер жана текст талаалары гана, сап түрүндө, узундугу чектелген.
function sanitizeI18n(value) {
  if (Array.isArray(value)) return value.map(sanitizeI18n);
  if (!isPlainObject(value)) return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k !== 'i18n') { out[k] = sanitizeI18n(v); continue; }
    if (!isPlainObject(v)) continue;
    const clean = {};
    for (const lang of TRANSLATED) {
      if (!isPlainObject(v[lang])) continue;
      const fields = {};
      for (const f of TEXT_FIELDS) {
        const s = v[lang][f];
        if (typeof s === 'string' && s.trim()) fields[f] = s.trim().slice(0, MAX_LEN);
      }
      if (Object.keys(fields).length) clean[lang] = fields;
    }
    if (Object.keys(clean).length) out.i18n = clean;
  }
  return out;
}

module.exports = { DEFAULT_LANG, LANGS, TEXT_FIELDS, DEFAULTS, normLang, localize, sanitizeI18n };
