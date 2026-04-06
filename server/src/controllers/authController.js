const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const authService = require('../services/authService');
const User = require('../models/User');

exports.login = catchAsync(async (req, res) => {
  const { phone, password } = req.body;
  const user = await authService.login(phone, password);
  authService.sendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ success: true, message: 'Чыгуу ийгиликтүү' });
};

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

// PUT /api/auth/profile  — update own name / password
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { name, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) return next(new AppError('Колдонуучу табылган жок', 404));

  if (name) user.name = name.trim();

  if (newPassword) {
    if (!currentPassword) return next(new AppError('Азыркы сырсөз керек', 400));
    const bcrypt = require('bcryptjs');
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return next(new AppError('Азыркы сырсөз туура эмес', 401));
    user.password = newPassword;
  }

  await user.save();
  user.password = undefined;
  res.status(200).json({ success: true, data: user });
});
