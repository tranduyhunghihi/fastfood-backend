import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateMe,
    adminCreateUser,
    adminUpdateUser,
    adminDeleteUser,
} from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// User tự cập nhật profile
router.put('/me', protect, updateMe);

// Admin tạo user mới
router.post('/admin', protect, adminOnly, adminCreateUser);

// Admin xem danh sách tất cả users
router.get('/', protect, adminOnly, getUsers);

// Admin cập nhật / xóa user
router.put('/:id', protect, adminOnly, adminUpdateUser);
router.delete('/:id', protect, adminOnly, adminDeleteUser);

// User tự xem profile hoặc admin xem bất kỳ user
router.get('/:id', protect, getUserById);

// Đăng ký (public)
router.post('/', createUser);

export default router;
