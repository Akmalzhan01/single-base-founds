const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const audit = require('../utils/audit');

// GET /api/users  — own foundation staff
exports.getStaff = catchAsync(async (req, res) => {
  const users = await User.find({ foundation: req.foundation._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: users });
});

// POST /api/users
exports.addStaff = catchAsync(async (req, res, next) => {
  const { name, phone, password, role } = req.body;
  if (!name || !phone || !password) return next(new AppError('Аты, телефон жана сырсөз талап кылынат', 400));

  const exists = await User.findOne({ phone });
  if (exists) return next(new AppError('Бул телефон номер буга чейин катталган', 400));

  const user = await User.create({
    name,
    phone,
    password,
    role: role || 'fond_staff',
    foundation: req.foundation._id,
  });
  user.password = undefined;

  audit(req, { action: 'create', entity: 'User', entityId: user._id, description: `Жаңы кызматкер кошулду: ${user.name}` });
  res.status(201).json({ success: true, data: user });
});

// PUT /api/users/:id
exports.updateStaff = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.params.id, foundation: req.foundation._id });
  if (!user) return next(new AppError('Кызматкер табылган жок', 404));
  if (user.isSuperadmin) return next(new AppError('Суперадминди өзгөртүүгө болбойт', 403));

  const { name, phone, role, isActive, password } = req.body;
  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (password) user.password = password;

  await user.save();
  user.password = undefined;

  audit(req, { action: 'update', entity: 'User', entityId: user._id, description: `Кызматкер жаңыланды: ${user.name}` });
  res.status(200).json({ success: true, data: user });
});

// DELETE /api/users/:id
exports.removeStaff = catchAsync(async (req, res, next) => {
  if (req.params.id === String(req.user._id)) return next(new AppError('Өзүңүздү өчүрүүгө болбойт', 400));

  const user = await User.findOneAndDelete({ _id: req.params.id, foundation: req.foundation._id, isSuperadmin: false });
  if (!user) return next(new AppError('Кызматкер табылган жок', 404));

  audit(req, { action: 'delete', entity: 'User', entityId: req.params.id, description: `Кызматкер өчүрүлдү: ${user.name}` });
  res.status(200).json({ success: true });
});
