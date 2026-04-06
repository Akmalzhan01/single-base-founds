const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(ctrl.getAll).post(ctrl.create);
router.route('/:id').get(ctrl.getOne).put(ctrl.update).delete(ctrl.remove);
router.patch('/:id/status', ctrl.updateStatus);
router.post('/:id/comment', ctrl.addComment);

module.exports = router;
