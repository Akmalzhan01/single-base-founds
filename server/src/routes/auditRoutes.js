const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', ctrl.getLogs);

module.exports = router;
