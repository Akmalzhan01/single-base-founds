const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');

// GET /api/audit  — superadmin only
exports.getLogs = catchAsync(async (req, res) => {
  const { entity, action, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name phone')
      .populate('foundation', 'name'),
    AuditLog.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: logs, total, page: Number(page) });
});
