const Category = require('../models/Category');
const Beneficiary = require('../models/Beneficiary');
const AidRecord = require('../models/AidRecord');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const audit = require('../utils/audit');

const ARRAY_GROUPS = ['needType', 'supportSources'];

// Ар бир категория канча муктажда (жана жардам жазууларында) колдонулганын эсептейт
const getUsage = async () => {
  const usage = {};
  const add = (group, rows) => {
    for (const { _id, count } of rows) {
      if (_id == null) continue;
      const key = `${group}:${_id}`;
      usage[key] = (usage[key] || 0) + count;
    }
  };

  for (const group of Category.GROUPS) {
    const pipeline = ARRAY_GROUPS.includes(group)
      ? [{ $unwind: `$${group}` }, { $group: { _id: `$${group}`, count: { $sum: 1 } } }]
      : [{ $group: { _id: `$${group}`, count: { $sum: 1 } } }];
    add(group, await Beneficiary.aggregate(pipeline));
  }
  // Жардамдын түрү муктаждык категорияларын колдонот
  add('needType', await AidRecord.aggregate([{ $group: { _id: '$aidType', count: { $sum: 1 } } }]));

  return usage;
};

const countUsage = async (group, name) => {
  let count = await Beneficiary.countDocuments({ [group]: name });
  if (group === 'needType') count += await AidRecord.countDocuments({ aidType: name });
  return count;
};

// Категориянын аты өзгөргөндө — мурунку аты жазылган бардык жазууларды жаңылайт
const renameEverywhere = async (group, from, to) => {
  if (ARRAY_GROUPS.includes(group)) {
    await Beneficiary.updateMany(
      { [group]: from },
      { $set: { [`${group}.$[el]`]: to } },
      { arrayFilters: [{ el: from }] }
    );
  } else {
    await Beneficiary.updateMany({ [group]: from }, { $set: { [group]: to } });
  }
  if (group === 'needType') {
    await AidRecord.updateMany({ aidType: from }, { $set: { aidType: to } });
  }
};

const duplicateError = (err) =>
  err?.code === 11000 ? new AppError('Бул топто мындай аталыштагы категория бар', 400) : err;

// GET /api/categories  (?usage=1 — суперадмин үчүн колдонулушу менен)
exports.getAll = catchAsync(async (req, res) => {
  const categories = await Category.find().sort({ group: 1, order: 1, name: 1 }).lean();

  if (req.query.usage && req.user.isSuperadmin) {
    const usage = await getUsage();
    categories.forEach((c) => { c.usage = usage[`${c.group}:${c.name}`] || 0; });
  }

  res.status(200).json({ success: true, data: categories });
});

// POST /api/categories
exports.create = catchAsync(async (req, res, next) => {
  const { group, name, color } = req.body;
  if (!Category.GROUPS.includes(group)) return next(new AppError('Туура эмес топ', 400));
  if (!name?.trim()) return next(new AppError('Аталышын жазыңыз', 400));

  const last = await Category.findOne({ group }).sort({ order: -1 }).lean();
  let category;
  try {
    category = await Category.create({ group, name, color, order: (last?.order ?? -1) + 1 });
  } catch (err) {
    return next(duplicateError(err));
  }

  audit(req, { action: 'create', entity: 'Category', entityId: category._id, description: `${group}: ${category.name}` });
  res.status(201).json({ success: true, data: category });
});

// PUT /api/categories/:id
exports.update = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Категория табылган жок', 404));

  const { name, color, isActive } = req.body;
  const oldName = category.name;
  const changes = [];

  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) return next(new AppError('Аталышын жазыңыз', 400));
    if (trimmed !== oldName) {
      category.name = trimmed;
      changes.push({ field: 'name', from: oldName, to: trimmed });
    }
  }
  if (color !== undefined && color !== category.color) {
    changes.push({ field: 'color', from: category.color, to: color });
    category.color = color;
  }
  if (isActive !== undefined && Boolean(isActive) !== category.isActive) {
    changes.push({ field: 'isActive', from: String(category.isActive), to: String(Boolean(isActive)) });
    category.isActive = Boolean(isActive);
  }

  try {
    await category.save();
  } catch (err) {
    return next(duplicateError(err));
  }

  if (category.name !== oldName) await renameEverywhere(category.group, oldName, category.name);

  audit(req, {
    action: 'update', entity: 'Category', entityId: category._id,
    description: `${category.group}: ${category.name}`, changes,
  });
  res.status(200).json({ success: true, data: category });
});

// PUT /api/categories/reorder  { group, ids: [...] }
exports.reorder = catchAsync(async (req, res, next) => {
  const { group, ids } = req.body;
  if (!Category.GROUPS.includes(group) || !Array.isArray(ids)) {
    return next(new AppError('Туура эмес маалымат', 400));
  }
  await Category.bulkWrite(
    ids.map((id, order) => ({ updateOne: { filter: { _id: id, group }, update: { $set: { order } } } }))
  );
  res.status(200).json({ success: true });
});

// DELETE /api/categories/:id — колдонулбаган категорияны гана өчүрүүгө болот
exports.remove = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Категория табылган жок', 404));

  const used = await countUsage(category.group, category.name);
  if (used) {
    return next(new AppError(
      `Бул категория ${used} жазууда колдонулат. Өчүрүүнүн ордуна архивге жылдырыңыз.`, 400
    ));
  }

  await category.deleteOne();
  audit(req, { action: 'delete', entity: 'Category', entityId: category._id, description: `${category.group}: ${category.name}` });
  res.status(200).json({ success: true });
});
