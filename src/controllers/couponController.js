import Coupon from '../models/Coupon.js';

// ── Hàm tính discount ────────────────────────────────────
export const calcDiscount = (coupon, subtotal) => {
    if (coupon.type === 'percent') {
        const discount = Math.floor(subtotal * (coupon.value / 100));
        return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    }
    return Math.min(coupon.value, subtotal); // fixed — không giảm quá subtotal
};

// @desc    Kiểm tra và áp dụng mã giảm giá
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;

        if (!code?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá.' });
        }

        const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
        }

        // Kiểm tra thời hạn
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá chưa có hiệu lực.' });
        }
        if (coupon.validTo && now > coupon.validTo) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn.' });
        }

        // Kiểm tra số lần dùng
        if (coupon.maxUsage !== null && coupon.usageCount >= coupon.maxUsage) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng.' });
        }

        // Kiểm tra đơn tối thiểu
        if (subtotal < coupon.minOrder) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(
                    coupon.minOrder,
                )}đ để dùng mã này.`,
            });
        }

        // Kiểm tra user đã dùng chưa (nếu đã đăng nhập)
        if (req.user && coupon.usedBy.includes(req.user._id)) {
            return res.status(400).json({ success: false, message: 'Bạn đã sử dụng mã giảm giá này rồi.' });
        }

        const discount = calcDiscount(coupon, subtotal);

        res.json({
            success: true,
            message: 'Áp dụng mã giảm giá thành công!',
            data: {
                code: coupon.code,
                description: coupon.description,
                type: coupon.type,
                value: coupon.value,
                discount,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── ADMIN CRUD ────────────────────────────────────────────

// @route   GET /api/coupons
export const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort('-createdAt');
        res.json({ success: true, data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   POST /api/coupons
export const createCoupon = async (req, res) => {
    try {
        const { code, description, type, value, maxDiscount, minOrder, maxUsage, validFrom, validTo } = req.body;

        if (!code || !type || value === undefined) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin.' });
        }
        if (type === 'percent' && (value <= 0 || value > 100)) {
            return res.status(400).json({ success: false, message: 'Phần trăm giảm phải từ 1 đến 100.' });
        }

        const coupon = await Coupon.create({
            code: code.trim().toUpperCase(),
            description,
            type,
            value,
            maxDiscount: maxDiscount || null,
            minOrder: minOrder || 0,
            maxUsage: maxUsage || null,
            validFrom: validFrom || Date.now(),
            validTo: validTo || null,
        });

        res.status(201).json({ success: true, message: 'Tạo mã giảm giá thành công!', data: coupon });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   PUT /api/coupons/:id
export const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
        res.json({ success: true, message: 'Cập nhật thành công!', data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá.' });
        res.json({ success: true, message: 'Đã xóa mã giảm giá.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
