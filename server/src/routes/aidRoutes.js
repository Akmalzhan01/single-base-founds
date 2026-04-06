const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aidController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.route('/').get(ctrl.getAll).post(upload.single('photo'), ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
