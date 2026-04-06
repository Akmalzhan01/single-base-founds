const Beneficiary = require('../models/Beneficiary');
const AidRecord = require('../models/AidRecord');
const Foundation = require('../models/Foundation');
const catchAsync = require('../utils/catchAsync');

// Helper: last N months trend
async function getMonthlyTrend(Model, matchField, matchValue, dateField, months = 6) {
  const now = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const match = { [dateField]: { $gte: d, $lt: end } };
    if (matchField) match[matchField] = matchValue;
    const count = await Model.countDocuments(match);
    result.push({
      month: d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
      count,
    });
  }
  return result;
}

// GET /api/dashboard/stats  — fond uchun
exports.getStats = catchAsync(async (req, res) => {
  const foundationId = req.foundation._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalBeneficiaries, thisMonthBeneficiaries, totalAid, thisMonthAid, byNeedType, byStatus, byFoundation, monthlyBeneficiaries, monthlyAid] =
    await Promise.all([
      Beneficiary.countDocuments({ registeredBy: foundationId }),
      Beneficiary.countDocuments({ registeredBy: foundationId, createdAt: { $gte: startOfMonth } }),
      AidRecord.countDocuments({ foundation: foundationId }),
      AidRecord.countDocuments({ foundation: foundationId, givenAt: { $gte: startOfMonth } }),
      Beneficiary.aggregate([
        { $match: { registeredBy: foundationId } },
        { $group: { _id: '$needType', count: { $sum: 1 } } },
      ]),
      Beneficiary.aggregate([
        { $match: { registeredBy: foundationId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AidRecord.aggregate([
        { $match: { foundation: foundationId } },
        { $group: { _id: '$foundation', count: { $sum: 1 }, totalAmount: { $sum: { $ifNull: ['$amount', 0] } } } },
        { $lookup: { from: 'foundations', localField: '_id', foreignField: '_id', as: 'foundation' } },
        { $unwind: { path: '$foundation', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, name: { $ifNull: ['$foundation.name', 'Белгисиз'] }, count: 1, totalAmount: 1 } },
      ]),
      getMonthlyTrend(Beneficiary, 'registeredBy', foundationId, 'createdAt'),
      getMonthlyTrend(AidRecord, 'foundation', foundationId, 'givenAt'),
    ]);

  res.status(200).json({
    success: true,
    data: {
      totalBeneficiaries,
      thisMonthBeneficiaries,
      totalAid,
      thisMonthAid,
      byNeedType,
      byStatus,
      byFoundation,
      monthlyBeneficiaries,
      monthlyAid,
    },
  });
});

// GET /api/dashboard/map
exports.getMapData = catchAsync(async (req, res) => {
  const filter = req.user.isSuperadmin ? {} : { registeredBy: req.foundation?._id };

  const [pins, regions] = await Promise.all([
    Beneficiary.find(
      { ...filter, lat: { $exists: true, $ne: null }, lng: { $exists: true, $ne: null } },
      { lat: 1, lng: 1, fullName: 1, region: 1, district: 1, village: 1, needType: 1, status: 1 }
    ).lean(),
    Beneficiary.aggregate([
      { $match: filter },
      { $group: { _id: { region: '$region', district: '$district' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.status(200).json({ success: true, data: { pins, regions } });
});

// GET /api/dashboard/global  — superadmin uchun
exports.getGlobalStats = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBeneficiaries,
    thisMonthBeneficiaries,
    totalAid,
    totalFoundations,
    byFoundation,
    byRegion,
    byNeedType,
    monthlyBeneficiaries,
  ] = await Promise.all([
    Beneficiary.countDocuments(),
    Beneficiary.countDocuments({ createdAt: { $gte: startOfMonth } }),
    AidRecord.countDocuments(),
    Foundation.countDocuments({ isActive: true }),
    AidRecord.aggregate([
      { $group: { _id: '$foundation', count: { $sum: 1 }, totalAmount: { $sum: { $ifNull: ['$amount', 0] } } } },
      { $lookup: { from: 'foundations', localField: '_id', foreignField: '_id', as: 'foundation' } },
      { $unwind: { path: '$foundation', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, name: { $ifNull: ['$foundation.name', 'Белгисиз'] }, count: 1, totalAmount: 1 } },
      { $sort: { totalAmount: -1 } },
    ]),
    Beneficiary.aggregate([
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Beneficiary.aggregate([
      { $group: { _id: '$needType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    getMonthlyTrend(Beneficiary, null, null, 'createdAt'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalBeneficiaries,
      thisMonthBeneficiaries,
      totalAid,
      totalFoundations,
      byFoundation,
      byRegion,
      byNeedType,
      monthlyBeneficiaries,
    },
  });
});
