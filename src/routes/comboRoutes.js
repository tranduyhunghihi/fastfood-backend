import express from 'express';
import { getCombos, getComboBySlug, customizeCombo } from '../controllers/comboController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getCombos);
router.get('/:slug', getComboBySlug);

// User phải đăng nhập để customize combo
router.post('/:id/customize', protect, customizeCombo);

// Admin routes (sẽ dùng sau khi thêm adminController)
// router.post('/', protect, adminOnly, createCombo);
// router.put('/:id', protect, adminOnly, updateCombo);
// router.delete('/:id', protect, adminOnly, deleteCombo);

export default router;
