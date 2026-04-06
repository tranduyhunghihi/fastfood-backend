import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    getMyOrders,
    trackOrder,
    updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Tra cứu đơn hàng bằng SĐT/mã đơn - khách vãng lai dùng được
router.get('/track', trackOrder);

// ✅ Đặt hàng - cả khách và user đều đặt được
// optionalAuth: đăng nhập thì gắn user, không thì bỏ qua
router.post('/', optionalAuth, createOrder);

// 🔒 User đã đăng nhập xem lịch sử đơn hàng của mình
router.get('/my-orders', protect, getMyOrders);

// 🔒 Admin xem tất cả đơn hàng
router.get('/', protect, adminOnly, getOrders);

// Xem chi tiết đơn hàng (optionalAuth để phân quyền linh hoạt)
router.get('/:id', optionalAuth, getOrderById);

// 🔒 Admin cập nhật trạng thái
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
