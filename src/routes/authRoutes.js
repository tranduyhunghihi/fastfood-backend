import express from 'express';
import { sendOtp, verifyOtp, login, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', sendOtp); // Bước 1: gửi OTP
router.post('/verify-otp', verifyOtp); // Bước 2: xác nhận OTP + tạo tài khoản
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
