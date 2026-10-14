const Category = require('../models/Category');
const AppError = require('../utils/appError');

// Муктаждын талаасы -> категория тобу (азырынча аттары бирдей)
const BENEFICIARY_FIELDS = ['status', 'needType', 'guardianType', 'supportSources'];

const toList = (v) => [].concat(v ?? []).filter(Boolean);

// Берилген маанилер категориялар тизмесинде бар экенин текшерет.
// Архивделген категориялар да туура деп эсептелет — эски жазуулар сакталсын.
const assertCategories = async (group, values) => {
  const list = toList(values);
  if (!list.length) return;
  const found = await Category.distinct('name', { group, name: { $in: list } });
  const missing = list.filter((v) => !found.includes(v));
  if (missing.length) {
    throw new AppError(`Белгисиз категория: ${missing.join(', ')}`, 400);
  }
};

const assertBeneficiaryCategories = async (data) => {
  for (const field of BENEFICIARY_FIELDS) {
    if (data[field] !== undefined) await assertCategories(field, data[field]);
  }
};

// Топтогу биринчи активдүү категория (демейки маани катары)
const firstActive = async (group) => {
  const cat = await Category.findOne({ group, isActive: true }).sort({ order: 1, name: 1 }).lean();
  return cat?.name;
};

module.exports = { assertCategories, assertBeneficiaryCategories, firstActive };
