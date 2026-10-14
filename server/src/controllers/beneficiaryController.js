const Beneficiary = require('../models/Beneficiary');
const AidRecord = require('../models/AidRecord');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { generateBeneficiaryPDF } = require('../services/pdfService');
const audit = require('../utils/audit');
const { parsePaging, pageMeta } = require('../utils/pagination');
const { assertBeneficiaryCategories, firstActive } = require('../services/categoryService');

const TRACKED_FIELDS = [
  'verificationStatus', 'status', 'needType', 'fullName', 'address', 'phone', 'birthDate',
  'childrenCount', 'guardianType', 'employed', 'supportSources', 'monthlyIncome',
  'region', 'district', 'village', 'comments',
];

// FormData аркылуу boolean '' | 'true' | 'false' болуп келет.
// '' — тандалган эмес дегени, аны null кылып тазалайбыз.
const parseTriBool = (raw) => {
  if (raw === undefined) return undefined;
  if (typeof raw === 'boolean') return raw;
  if (raw === '' || raw === null) return null;
  return raw === 'true';
};

// Сан талаалар: бош сап — маани жок дегени (null менен тазаланат)
const parseNumber = (raw) => {
  if (raw === undefined) return undefined;
  if (raw === '' || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

// Массив талаалар (needType, supportSources) FormData аркылуу JSON string болуп келет,
// эски клиенттерден жөнөкөй string болуп келиши мүмкүн.
const parseStringArray = (raw) => {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw !== 'string') return [];
  const val = raw.trim();
  if (!val) return [];
  if (val.startsWith('[')) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [val];
};

const fmtValue = (v) => {
  if (Array.isArray(v)) return v.join(', ');
  return v != null ? String(v) : '';
};

// Тарыхта 'true'/'false' эмес, окулуучу текст чыгышы үчүн
const FIELD_FORMATTERS = {
  employed: (v) => (v == null || v === '' ? '' : (v === true || v === 'true' ? 'Иштейт' : 'Иштебейт')),
  monthlyIncome: (v) => (v == null || v === '' ? '' : `${Number(v).toLocaleString('ru-RU')} сом`),
  // Эски жазууларда талаа жок — демейки маани менен көрсөтөбүз
  verificationStatus: (v) => v || 'Текшерилбеген',
};

// Эски жазууларда verificationStatus жок, алар «Текшерилбеген» катары саналат
const verificationFilter = (v) =>
  v === 'Текшерилбеген' ? { $in: [null, 'Текшерилбеген'] } : v;

// FormData/JSON аркылуу келген талааларды моделге ылайыктайт
const normalizeBody = (data) => {
  if (typeof data.children === 'string') {
    try { data.children = JSON.parse(data.children); } catch { data.children = []; }
  }
  if (typeof data.spouse === 'string') {
    try { data.spouse = JSON.parse(data.spouse); } catch { data.spouse = undefined; }
  }
  if (data.needType !== undefined) data.needType = parseStringArray(data.needType);
  if (data.supportSources !== undefined) data.supportSources = parseStringArray(data.supportSources);
  if (data.employed !== undefined) data.employed = parseTriBool(data.employed);
  if (data.monthlyIncome !== undefined) data.monthlyIncome = parseNumber(data.monthlyIncome);
  return data;
};

const fmtField = (field, v) =>
  FIELD_FORMATTERS[field] ? FIELD_FORMATTERS[field](v) : fmtValue(v);

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Жардам боюнча чыпка:
//   received     — жок дегенде бир жолу жардам алгандар
//   never        — эч качан жардам албагандар
//   within:N     — акыркы N күндө жардам алгандар
//   notWithin:N  — акыркы N күндө жардам албагандар (эч албагандар да кирет)
const aidFilter = async (aid) => {
  if (!aid) return null;
  const [mode, rawDays] = String(aid).split(':');
  if (mode === 'received') return { $in: await AidRecord.distinct('beneficiary') };
  if (mode === 'never') return { $nin: await AidRecord.distinct('beneficiary') };

  // Күн саны туура эмес болсо — чыпка колдонулбайт
  const days = /^\d+$/.test(rawDays || '') ? Math.min(3650, Number(rawDays)) : 0;
  if (!days) return null;
  const recent = await AidRecord.distinct('beneficiary', {
    givenAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
  });

  if (mode === 'within') return { $in: recent };
  if (mode === 'notWithin') return { $nin: recent };
  return null;
};

// Тизме жана экспорт үчүн жалпы чыпка
const buildFilter = async (query) => {
  const { search, status, verificationStatus, needType, region, district, aid } = query;
  const filter = {};

  if (search) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
    filter.$or = [
      { fullName: rx }, { inn: rx }, { phone: rx },
      { 'spouse.inn': rx }, { 'spouse.fullName': rx },
      { 'children.inn': rx }, { 'children.fullName': rx },
    ];
  }

  if (status) filter.status = status;
  if (verificationStatus) filter.verificationStatus = verificationFilter(verificationStatus);
  if (needType) filter.needType = needType;
  if (region) filter.region = region;
  if (district) filter.district = district;

  const byAid = await aidFilter(aid);
  if (byAid) filter._id = byAid;

  return filter;
};

// Ар бир муктаждын акыркы жардам күнү жана жардамдар саны
const aidSummary = async (ids) => {
  const rows = await AidRecord.aggregate([
    { $match: { beneficiary: { $in: ids } } },
    { $group: { _id: '$beneficiary', lastAidAt: { $max: '$givenAt' }, aidCount: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
};

// GET /api/beneficiaries
exports.getAll = catchAsync(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = await buildFilter(req.query);

  const [total, beneficiaries] = await Promise.all([
    Beneficiary.countDocuments(filter),
    Beneficiary.find(filter)
      .populate('registeredBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const summary = await aidSummary(beneficiaries.map((b) => b._id));
  const data = beneficiaries.map((b) => {
    const s = summary.get(String(b._id));
    return { ...b.toJSON(), lastAidAt: s?.lastAidAt || null, aidCount: s?.aidCount || 0 };
  });

  res.status(200).json({ success: true, ...pageMeta(total, page, limit), data });
});

// POST /api/beneficiaries/check-inn  — DUPLICATE CHECK
exports.checkInn = catchAsync(async (req, res) => {
  const { inn, phone } = req.body;

  if (!inn && !phone) return next(new AppError('ИНН же телефон керек', 400));

  const filter = inn
    ? { $or: [{ inn }, { 'spouse.inn': inn }, { 'children.inn': inn }] }
    : { $or: [{ phone }, { 'spouse.phone': phone }] };

  const beneficiary = await Beneficiary.findOne(filter)
    .populate('registeredBy', 'name logo');

  if (!beneficiary) {
    return res.status(200).json({ success: true, found: false });
  }

  const aidRecords = await AidRecord.find({ beneficiary: beneficiary._id })
    .populate('foundation', 'name')
    .sort({ givenAt: -1 });

  res.status(200).json({
    success: true,
    found: true,
    data: beneficiary,
    aidRecords,
  });
});

// POST /api/beneficiaries
exports.create = catchAsync(async (req, res) => {
  const data = { ...req.body, registeredBy: req.foundation?._id, registeredByUser: req.user._id };

  if (req.file) data.photo = req.file.path;

  normalizeBody(data);
  if (!data.status) data.status = await firstActive('status');
  await assertBeneficiaryCategories(data);

  const beneficiary = await Beneficiary.create(data);
  await beneficiary.populate('registeredBy', 'name');

  audit(req, { action: 'create', entity: 'Beneficiary', entityId: beneficiary._id, description: beneficiary.fullName });
  res.status(201).json({ success: true, data: beneficiary });
});

// GET /api/beneficiaries/:id
exports.getOne = catchAsync(async (req, res, next) => {
  const beneficiary = await Beneficiary.findById(req.params.id)
    .populate('registeredBy', 'name logo')
    .populate('registeredByUser', 'name');

  if (!beneficiary) return next(new AppError('Муктаж табылган жок', 404));

  const aidRecords = await AidRecord.find({ beneficiary: beneficiary._id })
    .populate('foundation', 'name')
    .populate('givenBy', 'name')
    .sort({ givenAt: -1 });

  res.status(200).json({ success: true, data: beneficiary, aidRecords });
});

// PUT /api/beneficiaries/:id
exports.update = catchAsync(async (req, res, next) => {
  const old = await Beneficiary.findById(req.params.id).lean();
  if (!old) return next(new AppError('Муктаж табылган жок', 404));

  if (!req.user.isSuperadmin && String(old.registeredBy) !== String(req.foundation?._id)) {
    return next(new AppError('Бул муктажды өзгөртүүгө уруксатыңыз жок', 403));
  }

  const data = { ...req.body };

  if (req.file) data.photo = req.file.path;

  normalizeBody(data);
  await assertBeneficiaryCategories(data);

  // Compute field-level diff for tracked fields
  const changes = [];
  for (const field of TRACKED_FIELDS) {
    if (data[field] !== undefined) {
      const from = fmtField(field, old[field]);
      const to = fmtField(field, data[field]);
      if (from !== to) changes.push({ field, from, to });
    }
  }
  if (data.photo && data.photo !== old.photo) {
    changes.push({ field: 'photo', from: old.photo || '', to: data.photo });
  }

  const beneficiary = await Beneficiary.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  }).populate('registeredBy', 'name');

  if (!beneficiary) return next(new AppError('Муктаж табылган жок', 404));

  audit(req, {
    action: 'update',
    entity: 'Beneficiary',
    entityId: beneficiary._id,
    description: beneficiary.fullName,
    changes: changes.length ? changes : undefined,
  });
  res.status(200).json({ success: true, data: beneficiary });
});

// GET /api/beneficiaries/:id/history
exports.getHistory = catchAsync(async (req, res, next) => {
  const logs = await AuditLog.find({ entity: 'Beneficiary', entityId: req.params.id })
    .populate('user', 'name role')
    .populate('foundation', 'name')
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ success: true, data: logs });
});

// DELETE /api/beneficiaries/:id
exports.remove = catchAsync(async (req, res, next) => {
  const beneficiary = await Beneficiary.findById(req.params.id);
  if (!beneficiary) return next(new AppError('Муктаж табылган жок', 404));

  if (!req.user.isSuperadmin && String(beneficiary.registeredBy) !== String(req.foundation?._id)) {
    return next(new AppError('Бул муктажды өчүрүүгө уруксатыңыз жок', 403));
  }

  await beneficiary.deleteOne();
  await AidRecord.deleteMany({ beneficiary: req.params.id });
  res.status(200).json({ success: true });
});

// GET /api/beneficiaries/export  — JSON export (client generates XLSX)
exports.exportCsv = catchAsync(async (req, res) => {
  const filter = await buildFilter(req.query);

  const beneficiaries = await Beneficiary.find(filter)
    .populate('registeredBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const summary = await aidSummary(beneficiaries.map((b) => b._id));
  const rows = beneficiaries.map(b => ({
    inn:           b.inn || '',
    fullName:      b.fullName || '',
    birthDate:     b.birthDate ? new Date(b.birthDate).toLocaleDateString('ru-RU') : '',
    phone:         b.phone || '',
    address:       b.address || '',
    region:        b.region || '',
    district:      b.district || '',
    village:       b.village || '',
    status:        b.status || '',
    verificationStatus: fmtField('verificationStatus', b.verificationStatus),
    needType:      fmtValue(b.needType),
    employed:      fmtField('employed', b.employed),
    supportSources: fmtValue(b.supportSources),
    monthlyIncome: b.monthlyIncome ?? '',
    childrenCount: b.childrenCount ?? '',
    aidCount:      summary.get(String(b._id))?.aidCount || 0,
    lastAidAt:     summary.get(String(b._id))?.lastAidAt ? new Date(summary.get(String(b._id)).lastAidAt).toLocaleDateString('ru-RU') : '',
    foundation:    b.registeredBy?.name || '',
    createdAt:     new Date(b.createdAt).toLocaleDateString('ru-RU'),
  }));

  res.status(200).json({ success: true, data: rows });
});

// GET /api/beneficiaries/:id/pdf
exports.getPdf = catchAsync(async (req, res, next) => {
  const beneficiary = await Beneficiary.findById(req.params.id)
    .populate('registeredBy', 'name logo');

  if (!beneficiary) return next(new AppError('Муктаж табылган жок', 404));

  const aidRecords = await AidRecord.find({ beneficiary: beneficiary._id })
    .populate('foundation', 'name')
    .sort({ givenAt: -1 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="muktaj-${beneficiary.inn}.pdf"`
  );

  generateBeneficiaryPDF(beneficiary, aidRecords, res);
});
