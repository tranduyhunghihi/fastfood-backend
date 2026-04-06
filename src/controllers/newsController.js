import News from '../models/News.js';

const slugify = (str) =>
    str
        .toLowerCase()
        .trim()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

// ── PUBLIC ────────────────────────────────────────────────

// GET /api/news
export const getNews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const total = await News.countDocuments({ isPublished: true });
        const news = await News.find({ isPublished: true })
            .select('-content')
            .sort('-createdAt')
            .skip(skip)
            .limit(Number(limit));

        res.json({ success: true, total, totalPages: Math.ceil(total / limit), page: Number(page), data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/news/:slug
export const getNewsBySlug = async (req, res) => {
    try {
        const news = await News.findOne({ slug: req.params.slug, isPublished: true });
        if (!news) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });

        const isLiked = req.user ? news.likes.includes(req.user._id) : false;
        res.json({ success: true, data: news, isLiked });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/news/:id/like
export const toggleLike = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });

        const userId = req.user._id;
        const liked = news.likes.includes(userId);

        if (liked) {
            news.likes.pull(userId);
            news.likeCount = Math.max(0, news.likeCount - 1);
        } else {
            news.likes.push(userId);
            news.likeCount += 1;
        }
        await news.save();

        res.json({ success: true, liked: !liked, likeCount: news.likeCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── ADMIN ─────────────────────────────────────────────────

// GET /api/news/admin/all
export const adminGetNews = async (req, res) => {
    try {
        const news = await News.find().sort('-createdAt').select('-content -likes');
        res.json({ success: true, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/news/admin
export const adminCreateNews = async (req, res) => {
    try {
        const { title, summary, content, image, tags, isPublished, author } = req.body;
        if (!title || !content)
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung.' });

        let slug = slugify(title) + '-' + Date.now().toString().slice(-5);
        const news = await News.create({
            title,
            slug,
            summary,
            content,
            image,
            tags: tags || [],
            isPublished: isPublished ?? true,
            author: author || 'FastFoot',
        });
        res.status(201).json({ success: true, message: 'Tạo tin tức thành công!', data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/news/admin/:id
export const adminUpdateNews = async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!news) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        res.json({ success: true, message: 'Cập nhật thành công!', data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/news/admin/:id
export const adminDeleteNews = async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        res.json({ success: true, message: 'Đã xóa tin tức.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload ảnh cho tin tức
// @route   POST /api/news/admin/:id/image
// @access  Admin
export const uploadNewsImage = async (req, res) => {
    try {
        const { uploadBufferToCloudinary } = await import('../middleware/uploadMiddleware.js');
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });

        if (!req.file) return res.status(400).json({ success: false, message: 'Không có file ảnh.' });

        const result = await uploadBufferToCloudinary(req.file.buffer, 'news', {
            transformation: [{ width: 1200, height: 630, crop: 'limit', quality: 'auto:good' }],
        });

        news.image = result.secure_url;
        await news.save();

        res.json({ success: true, image: result.secure_url });
    } catch (error) {
        console.error('uploadNewsImage error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
