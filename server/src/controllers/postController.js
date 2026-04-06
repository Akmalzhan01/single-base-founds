const Post = require('../models/Post');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// GET /api/posts  — all foundations see all posts
exports.getAll = catchAsync(async (req, res) => {
  const { type, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Post.countDocuments(filter);
  const posts = await Post.find(filter)
    .populate('foundation', 'name')
    .populate('author', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({ success: true, total, data: posts });
});

// GET /api/posts/:id  — full detail + increment view
exports.getOne = catchAsync(async (req, res, next) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('foundation', 'name')
    .populate('author', 'name')
    .populate('comments.user', 'name')
    .populate('comments.foundation', 'name');

  if (!post) return next(new AppError('Пост табылган жок', 404));
  res.status(200).json({ success: true, data: post });
});

// POST /api/posts
exports.create = catchAsync(async (req, res, next) => {
  const { title, body, type } = req.body;
  if (!title || !body) return res.status(400).json({ success: false, message: 'Аталыш жана мазмун зарыл' });

  const foundationId = req.foundation?._id || req.user?.foundation || req.body.foundationId;
  if (!foundationId) return next(new AppError('Фонд табылган жок', 400));

  const post = await Post.create({
    title,
    body,
    type: type || 'elon',
    image: req.file?.path,
    foundation: foundationId,
    author: req.user._id,
  });

  await post.populate('foundation', 'name');
  await post.populate('author', 'name');

  res.status(201).json({ success: true, data: post });
});

// PUT /api/posts/:id
exports.update = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Пост табылган жок', 404));

  if (!req.user.isSuperadmin && String(post.foundation) !== String(req.foundation?._id)) {
    return next(new AppError('Бул постту өзгөртүүгө уруксатыңыз жок', 403));
  }

  const { title, body, type } = req.body;
  if (title) post.title = title;
  if (body) post.body = body;
  if (type) post.type = type;
  if (req.file?.path) post.image = req.file.path;

  await post.save();
  await post.populate('foundation', 'name');
  await post.populate('author', 'name');

  res.status(200).json({ success: true, data: post });
});

// DELETE /api/posts/:id
exports.remove = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Пост табылган жок', 404));

  if (!req.user.isSuperadmin && String(post.foundation) !== String(req.foundation?._id)) {
    return next(new AppError('Бул постту өчүрүүгө уруксатыңыз жок', 403));
  }

  await post.deleteOne();
  res.status(200).json({ success: true });
});

// POST /api/posts/:id/like  — toggle
exports.toggleLike = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Пост табылган жок', 404));

  const uid = String(req.user._id);
  const idx = post.likes.findIndex(id => String(id) === uid);
  if (idx === -1) {
    post.likes.push(req.user._id);
  } else {
    post.likes.splice(idx, 1);
  }
  await post.save();
  res.status(200).json({ success: true, likes: post.likes.length, liked: idx === -1 });
});

// POST /api/posts/:id/comments
exports.addComment = catchAsync(async (req, res, next) => {
  const { text } = req.body;
  if (!text?.trim()) return next(new AppError('Комментарий бош болбосун', 400));

  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Пост табылган жок', 404));

  post.comments.push({ user: req.user._id, foundation: req.foundation?._id, text: text.trim() });
  await post.save();

  const added = post.comments[post.comments.length - 1];
  await post.populate({ path: 'comments.user', select: 'name' });
  await post.populate({ path: 'comments.foundation', select: 'name' });

  const populated = post.comments.id(added._id);
  res.status(201).json({ success: true, data: populated });
});

// DELETE /api/posts/:id/comments/:commentId
exports.removeComment = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) return next(new AppError('Пост табылган жок', 404));

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return next(new AppError('Комментарий табылган жок', 404));

  const isOwner = String(comment.user) === String(req.user._id);
  const isAdmin = req.user.isSuperadmin || String(comment.foundation) === String(req.foundation?._id);
  if (!isOwner && !isAdmin) return next(new AppError('Уруксат жок', 403));

  comment.deleteOne();
  await post.save();
  res.status(200).json({ success: true });
});
