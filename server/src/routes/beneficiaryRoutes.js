const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/beneficiaryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.post('/check-inn', ctrl.checkInn);
router.get('/export', ctrl.exportCsv);

router.route('/')
  .get(ctrl.getAll)
  .post(upload.single('photo'), ctrl.create);

router.get('/:id/pdf', ctrl.getPdf);
router.get('/:id/history', ctrl.getHistory);

router.route('/:id')
  .get(ctrl.getOne)
  .put(upload.single('photo'), ctrl.update)
  .delete(ctrl.remove);

module.exports = router;
