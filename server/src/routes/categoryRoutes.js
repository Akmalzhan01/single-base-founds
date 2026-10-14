const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoryController');
const { protect, superadminOnly } = require('../middleware/authMiddleware');

router.use(protect);

// Бардык колдонуучулар окуйт (формалар, чыпкалар үчүн)
router.get('/', ctrl.getAll);

// Башкаруу — суперадмин гана
router.use(superadminOnly);
router.post('/', ctrl.create);
router.put('/reorder', ctrl.reorder);
router.route('/:id').put(ctrl.update).delete(ctrl.remove);

module.exports = router;
