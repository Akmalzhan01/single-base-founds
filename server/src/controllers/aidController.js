const AidRecord = require('../models/AidRecord');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// GET /api/aid-records
exports.getAll = catchAsync(async (req, res) => {
  const { beneficiaryId, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (!req.user.isSuperadmin) filter.foundation = req.foundation._id;
  if (beneficiaryId) filter.beneficiary = beneficiaryId;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await AidRecord.countDocuments(filter);
  const records = await AidRecord.find(filter)
    .populate('beneficiary', 'fullName inn')
    .populate('foundation', 'name')
    .populate('givenBy', 'name')
    .sort({ givenAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, data: records });
});

// POST /api/aid-records
exports.create = catchAsync(async (req, res) => {
  const data = { ...req.body, foundation: req.foundation?._id, givenBy: req.user._id };
  if (req.file) data.photo = req.file.path;

  const record = await AidRecord.create(data);

  await record.populate('beneficiary', 'fullName inn');
  await record.populate('foundation', 'name');
  await record.populate('givenBy', 'name');

  res.status(201).json({ success: true, data: record });
});

// DELETE /api/aid-records/:id
exports.remove = catchAsync(async (req, res, next) => {
  const record = await AidRecord.findById(req.params.id);
  if (!record) return next(new AppError('Жазуу табылган жок', 404));

  if (
    !req.user.isSuperadmin &&
    record.foundation.toString() !== req.foundation._id.toString()
  ) {
    return next(new AppError('Уруксат жок', 403));
  }

  await record.deleteOne();
  res.status(204).json({ success: true });
});
