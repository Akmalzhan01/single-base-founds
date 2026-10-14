const mongoose = require('mongoose');

// Муктаждын кайсы талаасына тиешелүү категория
const GROUPS = ['status', 'needType', 'guardianType', 'supportSources'];

// Түстөр — клиент ушул ачкычтар боюнча бейдж/диаграмма түсүн тандайт
const COLORS = ['gray', 'green', 'blue', 'yellow', 'purple', 'red', 'orange', 'cyan', 'pink'];

// Мурда кодго катуу жазылган тизмелер — база бош болсо ушулар менен толтурулат
const DEFAULTS = {
  status: [
    ['Карыя', 'blue'], ['Жесир', 'purple'], ['Майып', 'yellow'],
    ['Зейнеткер', 'green'], ['Жалгыз эне', 'pink'], ['Башка', 'gray'],
  ],
  needType: [
    ['Азык-түүлүк', 'green'], ['Дары-дармек', 'blue'], ['Акча', 'yellow'],
    ['Кийим', 'purple'], ['Мэбел', 'orange'], ['Башка', 'gray'],
  ],
  guardianType: [
    ['Жалгыз', 'gray'], ['Эри', 'blue'], ['Аялы', 'purple'], ['Балдары', 'green'], ['Башка', 'gray'],
  ],
  supportSources: [
    ['Пенсия алат', 'blue'], ['Пособия алат', 'blue'], ['Туугандары жардам берет', 'green'],
    ['Кошуналар жардам берет', 'green'], ['Фонддор жардам берет', 'purple'],
    ['Өзү иштейт', 'cyan'], ['Жардам жок', 'red'],
  ],
};

const categorySchema = new mongoose.Schema({
  group: { type: String, enum: GROUPS, required: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, enum: COLORS, default: 'gray' },
  order: { type: Number, default: 0 },
  // Өчүрүлгөн (архивделген) категория формаларда чыкпайт, бирок эски жазууларда калат
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ group: 1, name: 1 }, { unique: true });
categorySchema.index({ group: 1, order: 1 });

// Ар бир топ үчүн категория жок болсо — демейки тизмени жазат
categorySchema.statics.ensureDefaults = async function () {
  for (const group of GROUPS) {
    const count = await this.countDocuments({ group });
    if (count) continue;
    await this.insertMany(
      DEFAULTS[group].map(([name, color], order) => ({ group, name, color, order }))
    );
  }
};

module.exports = mongoose.model('Category', categorySchema);
module.exports.GROUPS = GROUPS;
module.exports.COLORS = COLORS;
