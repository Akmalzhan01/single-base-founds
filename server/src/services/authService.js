const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  user.password = undefined;

  res.status(statusCode).json({ success: true, token, data: user });
};

exports.login = async (phone, password) => {
  if (!phone || !password) throw new AppError('Телефон жана сырсөз керек', 400);

  const user = await User.findOne({ phone })
    .select('+password')
    .populate('foundation');

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Телефон же сырсөз туура эмес', 401);
  }

  if (!user.isActive) throw new AppError('Аккаунт өчүрүлгөн', 401);

  return user;
};

exports.sendToken = sendToken;
