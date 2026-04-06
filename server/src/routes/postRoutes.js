const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Public — no auth needed
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

// Auth required
router.use(protect);
router.post('/', upload.single('image'), ctrl.create);
router.put('/:id', upload.single('image'), ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/like', ctrl.toggleLike);
router.post('/:id/comments', ctrl.addComment);
router.delete('/:id/comments/:commentId', ctrl.removeComment);

module.exports = router;
