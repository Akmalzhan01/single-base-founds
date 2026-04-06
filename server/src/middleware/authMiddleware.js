const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/User');

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new AppError('Кириңиз', 401));

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).populate('foundation');

  if (!user || !user.isActive) return next(new AppError('Колдонуучу табылган жок', 401));

  req.user = user;
  req.foundation = user.foundation;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (req.user.isSuperadmin) return next();
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Уруксат жок', 403));
  }
  next();
};

exports.superadminOnly = (req, res, next) => {
  if (!req.user.isSuperadmin) return next(new AppError('Уруксат жок', 403));
  next();
};
