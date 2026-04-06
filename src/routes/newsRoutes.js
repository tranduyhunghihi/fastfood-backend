import express from 'express';
import {
    getNews,
    getNewsBySlug,
    toggleLike,
    adminGetNews,
    adminCreateNews,
    adminUpdateNews,
    adminDeleteNews,
    uploadNewsImage,
} from '../controllers/newsController.js';
import { protect, adminOnly, optionalAuth } from '../middleware/authMiddleware.js';
import { uploadComboImage as multerSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public
router.get('/', getNews);
router.get('/admin/all', protect, adminOnly, adminGetNews);
router.get('/:slug', optionalAuth, getNewsBySlug);
router.post('/:id/like', protect, toggleLike);

// Admin CRUD
router.post('/admin', protect, adminOnly, adminCreateNews);
router.put('/admin/:id', protect, adminOnly, adminUpdateNews);
router.delete('/admin/:id', protect, adminOnly, adminDeleteNews);
router.post('/admin/:id/image', protect, adminOnly, multerSingle, uploadNewsImage);

export default router;
