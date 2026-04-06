const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/foundationController');
const { protect, superadminOnly, authorize } = require('../middleware/authMiddleware');

// fond_admin routes (no superadmin required)
router.get('/mine', protect, authorize('fond_admin'), ctrl.getMine);
router.put('/mine', protect, authorize('fond_admin'), ctrl.updateMine);

// superadmin-only routes
router.use(protect, superadminOnly);

router.route('/').get(ctrl.getAll).post(ctrl.create);
router.route('/:id').put(ctrl.update).delete(ctrl.remove);
router.route('/:id/users').get(ctrl.getUsers).post(ctrl.addUser);
router.route('/:id/users/:userId').put(ctrl.updateUser).delete(ctrl.removeUser);

module.exports = router;
