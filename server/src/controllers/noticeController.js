const Notice = require('../models/Notice');
const Foundation = require('../models/Foundation');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { notifyFoundation } = require('../services/telegramBot');
const audit = require('../utils/audit');

// GET /api/notices
exports.getAll = catchAsync(async (req, res) => {
  const { status, region, priority, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (region) filter.region = region;
  if (priority) filter.priority = priority;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [notices, total] = await Promise.all([
    Notice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name')
      .populate('createdByFoundation', 'name')
      .populate('beneficiary', 'fullName inn'),
    Notice.countDocuments(filter),
  ]);

  res.status(200).json({ success: true, data: notices, total, page: Number(page) });
});

// GET /api/notices/:id
exports.getOne = catchAsync(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('createdByFoundation', 'name')
    .populate('beneficiary', 'fullName inn phone address')
    .populate('history.changedBy', 'name')
    .populate('history.changedByFoundation', 'name');

  if (!notice) return next(new AppError('Маалымат табылган жок', 404));
  res.status(200).json({ success: true, data: notice });
});

// POST /api/notices
exports.create = catchAsync(async (req, res) => {
  const notice = await Notice.create({
    ...req.body,
    createdBy: req.user._id,
    createdByFoundation: req.foundation?._id,
    history: [{
      status: 'open',
      comment: 'Маалымат түзүлдү',
      changedBy: req.user._id,
      changedByFoundation: req.foundation?._id,
    }],
  });

  await notice.populate('createdBy', 'name');
  await notice.populate('createdByFoundation', 'name');

  // Telegram: notify all foundations with telegramChatId
  try {
    const foundations = await Foundation.find({ isActive: true, telegramChatId: { $exists: true, $ne: '' } });
    const foundationName = notice.createdByFoundation?.name || 'Белгисиз';
    const priorityLabel = { low: '🟢 Төмөн', medium: '🟡 Орто', high: '🔴 Жогору' }[notice.priority] || '';
    let msg = `📢 Жаңы маалымат!\n\n`;
    msg += `📋 ${notice.title}\n`;
    if (notice.description) msg += `📝 ${notice.description}\n`;
    if (notice.address) msg += `📍 ${notice.address}\n`;
    if (notice.phone) msg += `📞 ${notice.phone}\n`;
    msg += `⚡ Приоритет: ${priorityLabel}\n`;
    msg += `🏢 Жазган: ${foundationName}`;
    for (const f of foundations) {
      notifyFoundation(f.telegramChatId, msg);
    }
  } catch {}

  audit(req, { action: 'create', entity: 'Notice', entityId: notice._id, description: notice.title });
  res.status(201).json({ success: true, data: notice });
});

// PUT /api/notices/:id  — faqat yaratgan fond yoki superadmin
exports.update = catchAsync(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return next(new AppError('Маалымат табылган жок', 404));

  const isOwner = notice.createdByFoundation?.toString() === req.foundation?._id?.toString();
  if (!req.user.isSuperadmin && !isOwner) {
    return next(new AppError('Уруксат жок', 403));
  }

  const { title, description, address, phone, region, district, priority, deadline } = req.body;
  if (title !== undefined) notice.title = title;
  if (description !== undefined) notice.description = description;
  if (address !== undefined) notice.address = address;
  if (phone !== undefined) notice.phone = phone;
  if (region !== undefined) notice.region = region;
  if (district !== undefined) notice.district = district;
  if (priority !== undefined) notice.priority = priority;
  if (deadline !== undefined) notice.deadline = deadline || null;

  await notice.save();
  await notice.populate('createdBy', 'name');
  await notice.populate('createdByFoundation', 'name');
  audit(req, { action: 'update', entity: 'Notice', entityId: notice._id, description: notice.title });
  res.status(200).json({ success: true, data: notice });
});

// PATCH /api/notices/:id/status
exports.updateStatus = catchAsync(async (req, res, next) => {
  const { status, comment } = req.body;
  if (!status) return next(new AppError('Статус керек', 400));

  const notice = await Notice.findById(req.params.id)
    .populate('createdByFoundation', 'name telegramChatId');
  if (!notice) return next(new AppError('Маалымат табылган жок', 404));

  notice.status = status;
  notice.history.push({
    status,
    comment: comment || '',
    changedBy: req.user._id,
    changedByFoundation: req.foundation?._id,
  });

  await notice.save();
  await notice.populate('createdBy', 'name');
  await notice.populate('history.changedBy', 'name');
  await notice.populate('history.changedByFoundation', 'name');

  // Telegram: notify the notice-creating foundation about status change
  try {
    const chatId = notice.createdByFoundation?.telegramChatId;
    if (chatId) {
      const statusLabel = { open: '🔴 Ачык', in_progress: '🟡 Иш үстүндө', resolved: '🟢 Чечилди' }[status] || status;
      const changerName = req.foundation?.name || req.user?.name || 'Белгисиз';
      let msg = `🔔 Маалыматыңыздын статусу өзгөрдү\n\n`;
      msg += `📋 ${notice.title}\n`;
      msg += `📊 Жаңы статус: ${statusLabel}\n`;
      msg += `👤 Өзгөрткөн: ${changerName}`;
      if (comment) msg += `\n💬 Изох: ${comment}`;
      notifyFoundation(chatId, msg);
    }
  } catch {}

  audit(req, { action: 'status_change', entity: 'Notice', entityId: notice._id, description: `${notice.title} → ${status}` });
  res.status(200).json({ success: true, data: notice });
});

// POST /api/notices/:id/comment  — status ozgartirmasdan comment qo'shish
exports.addComment = catchAsync(async (req, res, next) => {
  const { comment } = req.body;
  if (!comment?.trim()) return next(new AppError('Комментарий бош болбосун', 400));

  const notice = await Notice.findById(req.params.id);
  if (!notice) return next(new AppError('Маалымат табылган жок', 404));

  notice.history.push({
    status: notice.status,
    comment: comment.trim(),
    changedBy: req.user._id,
    changedByFoundation: req.foundation?._id,
  });

  await notice.save();
  await notice.populate('createdBy', 'name');
  await notice.populate('createdByFoundation', 'name');
  await notice.populate('history.changedBy', 'name');
  await notice.populate('history.changedByFoundation', 'name');

  res.status(200).json({ success: true, data: notice });
});

// DELETE /api/notices/:id  — faqat yaratgan fond yoki superadmin
exports.remove = catchAsync(async (req, res, next) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return next(new AppError('Маалымат табылган жок', 404));

  const isOwner = notice.createdByFoundation?.toString() === req.foundation?._id?.toString();
  if (!req.user.isSuperadmin && !isOwner) {
    return next(new AppError('Уруксат жок', 403));
  }

  await notice.deleteOne();
  res.status(200).json({ success: true });
});
