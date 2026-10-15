const express = require('express');
const ctrl = require('../controllers/siteController');
const { protect, superadminOnly } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// /api/public — визитка сайт окуйт, кирүү талап кылынбайт
const publicRouter = express.Router();
publicRouter.get('/site', ctrl.publicSite);
publicRouter.get('/posts', ctrl.publicPosts);
publicRouter.get('/posts/:id', ctrl.publicPost);

// /api/site — мазмунду башкаруу, суперадмин гана
const adminRouter = express.Router();
adminRouter.use(protect, superadminOnly);
adminRouter.get('/', ctrl.getAdmin);
adminRouter.put('/', ctrl.update);
adminRouter.post('/upload', upload.single('image'), ctrl.upload);

module.exports = { publicRouter, adminRouter };
