const Foundation = require('../models/Foundation');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const audit = require('../utils/audit');

// GET /api/foundations/mine  (fond_admin)
exports.getMine = catchAsync(async (req, res, next) => {
  const foundation = await Foundation.findById(req.foundation._id);
  if (!foundation) return next(new AppError('Фонд табылган жок', 404));
  res.status(200).json({ success: true, data: foundation });
});

// PUT /api/foundations/mine  (fond_admin)
exports.updateMine = catchAsync(async (req, res, next) => {
  const allowed = ['name', 'phone', 'email', 'address', 'telegramChatId'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const foundation = await Foundation.findByIdAndUpdate(req.foundation._id, updates, { new: true, runValidators: true });
  if (!foundation) return next(new AppError('Фонд табылган жок', 404));

  audit(req, { action: 'update', entity: 'Foundation', entityId: foundation._id, description: 'Фонд маалыматтары жаңыланды' });
  res.status(200).json({ success: true, data: foundation });
});

// GET /api/foundations
exports.getAll = catchAsync(async (req, res) => {
  const foundations = await Foundation.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: foundations });
});

// POST /api/foundations
exports.create = catchAsync(async (req, res) => {
  const foundation = await Foundation.create(req.body);
  res.status(201).json({ success: true, data: foundation });
});

// PUT /api/foundations/:id
exports.update = catchAsync(async (req, res, next) => {
  const foundation = await Foundation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!foundation) return next(new AppError('Фонд табылган жок', 404));
  res.status(200).json({ success: true, data: foundation });
});

// DELETE /api/foundations/:id
exports.remove = catchAsync(async (req, res, next) => {
  const foundation = await Foundation.findByIdAndDelete(req.params.id);
  if (!foundation) return next(new AppError('Фонд табылган жок', 404));
  res.status(200).json({ success: true });
});

// POST /api/foundations/:id/users  — fond ga xodim qo'shish
exports.addUser = catchAsync(async (req, res) => {
  const user = await User.create({
    ...req.body,
    foundation: req.params.id,
  });
  user.password = undefined;
  res.status(201).json({ success: true, data: user });
});

// GET /api/foundations/:id/users
exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.find({ foundation: req.params.id });
  res.status(200).json({ success: true, data: users });
});

// PUT /api/foundations/:foundationId/users/:userId
exports.updateUser = catchAsync(async (req, res, next) => {
  const { name, phone, role, password } = req.body;
  const user = await User.findOne({ _id: req.params.userId, foundation: req.params.id });
  if (!user) return next(new AppError('Кызматкер табылган жок', 404));

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (role) user.role = role;
  if (password) user.password = password;

  await user.save();
  user.password = undefined;
  res.status(200).json({ success: true, data: user });
});

// DELETE /api/foundations/:foundationId/users/:userId
exports.removeUser = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndDelete({ _id: req.params.userId, foundation: req.params.id });
  if (!user) return next(new AppError('Кызматкер табылган жок', 404));
  res.status(200).json({ success: true });
});
