import Review from '../models/Review.js';
import Product from '../models/Product.js';

// @desc    Lấy đánh giá của 1 sản phẩm
// @route   GET /api/reviews/:productId
// @access  Public
export const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId }).sort('-createdAt').limit(50);

        // Tính trung bình rating
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

        // Đếm theo từng sao
        const distribution = [5, 4, 3, 2, 1].map((star) => ({
            star,
            count: reviews.filter((r) => r.rating === star).length,
        }));

        res.json({ success: true, total, avg: Math.round(avg * 10) / 10, distribution, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Thêm đánh giá
// @route   POST /api/reviews/:productId
// @access  Private
export const createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || !comment?.trim()) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đánh giá và bình luận.' });
        }

        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        // Kiểm tra đã review chưa
        const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }

        const review = await Review.create({
            product: req.params.productId,
            user: req.user._id,
            userName: req.user.name,
            rating: Number(rating),
            comment: comment.trim(),
        });

        res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá!', data: review });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Xóa đánh giá của mình
// @route   DELETE /api/reviews/:reviewId
// @access  Private
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });

        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Không có quyền xóa đánh giá này.' });
        }

        await review.deleteOne();
        res.json({ success: true, message: 'Đã xóa đánh giá.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
