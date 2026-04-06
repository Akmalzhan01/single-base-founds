const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');
const { protect, superadminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', ctrl.getStats);
router.get('/global', superadminOnly, ctrl.getGlobalStats);
router.get('/map', ctrl.getMapData);

module.exports = router;
