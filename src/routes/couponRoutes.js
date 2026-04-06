import express from 'express';
import {
    validateCoupon,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
} from '../controllers/couponController.js';
import { protect, adminOnly, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public — kiểm tra mã (optionalAuth để biết user đã dùng chưa)
router.post('/validate', optionalAuth, validateCoupon);

// Admin CRUD
router.get('/', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

export default router;
