const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('fond_admin'));

router.route('/').get(ctrl.getStaff).post(ctrl.addStaff);
router.route('/:id').put(ctrl.updateStaff).delete(ctrl.removeStaff);

module.exports = router;
