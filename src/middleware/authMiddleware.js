import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Bảo vệ route - yêu cầu đăng nhập
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ. Tài khoản không tồn tại.',
            });
        }

        next();
    } catch (error) {
        const message =
            error.name === 'TokenExpiredError'
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : 'Token không hợp lệ.';

        return res.status(401).json({ success: false, message });
    }
};

// Đăng nhập thì gắn user vào req, không đăng nhập thì bỏ qua - KHÔNG chặn
export const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        req.user = null; // khách vãng lai
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
    } catch {
        req.user = null; // token hỏng thì coi như khách vãng lai
    }

    next();
};

// Chỉ cho phép admin
export const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thực hiện hành động này.',
        });
    }
    next();
};
