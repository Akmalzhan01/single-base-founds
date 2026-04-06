const Beneficiary = require('../models/Beneficiary');
const AidRecord = require('../models/AidRecord');
const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { generateBeneficiaryPDF } = require('../services/pdfService');
const audit = require('../utils/audit');

const TRACKED_FIELDS = [
  'status', 'needType', 'fullName', 'address', 'phone', 'birthDate',
  'childrenCount', 'guardianType', 'region', 'district', 'village', 'comments',
];

// GET /api/beneficiaries
exports.getAll = catchAsync(async (req, res) => {
  const { search, status, needType, region, district, page = 1, limit = 20 } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { inn: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { 'spouse.inn': { $regex: search, $options: 'i' } },
      { 'spouse.fullName': { $regex: search, $options: 'i' } },
      { 'children.inn': { $regex: search, $options: 'i' } },
      { 'children.fullName': { $regex: search, $options: 'i' } },
    ];
  }

  if (status) filter.status = status;
  if (needType) filter.needType = needType;
  if (region) filter.region = region;
  if (district) filter.district = district;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Beneficiary.countDocuments(filter);
  const beneficiaries = await Beneficiary.find(filter)
    .populate('registeredBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: beneficiaries,
  });
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

  // children JSON parse (FormData orqali kelsa string bo'ladi)
  if (typeof data.children === 'string') {
    try { data.children = JSON.parse(data.children); } catch { data.children = []; }
  }
  if (typeof data.spouse === 'string') {
    try { data.spouse = JSON.parse(data.spouse); } catch { data.spouse = undefined; }
  }

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

  if (typeof data.children === 'string') {
    try { data.children = JSON.parse(data.children); } catch { data.children = []; }
  }
  if (typeof data.spouse === 'string') {
    try { data.spouse = JSON.parse(data.spouse); } catch { data.spouse = undefined; }
  }

  // Compute field-level diff for tracked fields
  const changes = [];
  for (const field of TRACKED_FIELDS) {
    if (data[field] !== undefined) {
      const from = old[field] != null ? String(old[field]) : '';
      const to = data[field] != null ? String(data[field]) : '';
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
  const { search, status, needType, region, district } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { inn: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) filter.status = status;
  if (needType) filter.needType = needType;
  if (region) filter.region = region;
  if (district) filter.district = district;

  const beneficiaries = await Beneficiary.find(filter)
    .populate('registeredBy', 'name')
    .sort({ createdAt: -1 })
    .lean();

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
    needType:      b.needType || '',
    childrenCount: b.childrenCount ?? '',
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
