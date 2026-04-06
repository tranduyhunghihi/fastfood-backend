import Combo from '../../models/Combo.js';
import slugify from '../../utils/slugify.js';

// @desc    Lấy tất cả combo - admin
// @route   GET /api/admin/combos
export const adminGetCombos = async (req, res) => {
    try {
        const { isAvailable, type, page = 1, limit = 20 } = req.query;

        let query = {};
        if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
        if (type) query.comboType = type;

        const total = await Combo.countDocuments(query);
        const combos = await Combo.find(query)
            .populate({ path: 'items.product', select: 'name basePrice images' })
            .populate('items.includedToppings.topping', 'name price')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: combos,
        });
    } catch (error) {
        console.error('adminGetCombos error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Tạo combo mới
// @route   POST /api/admin/combos
export const createCombo = async (req, res) => {
    try {
        const { name, description, image, items, price, originalPrice, comboType, validFrom, validTo, isAvailable } =
            req.body;

        const priceNum = Number(price);
        const originalPriceNum = Number(originalPrice);

        if (!name?.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên combo.' });
        if (!items?.length)
            return res.status(400).json({ success: false, message: 'Vui lòng thêm ít nhất 1 sản phẩm.' });
        if (!priceNum || !originalPriceNum)
            return res.status(400).json({ success: false, message: 'Vui lòng nhập giá combo và giá gốc.' });
        if (priceNum >= originalPriceNum)
            return res.status(400).json({ success: false, message: 'Giá combo phải nhỏ hơn giá gốc.' });

        for (let i = 0; i < items.length; i++) {
            if (!items[i].product)
                return res.status(400).json({ success: false, message: `Sản phẩm thứ ${i + 1} chưa được chọn.` });
        }

        const slug = slugify(name.trim());
        const existing = await Combo.findOne({ slug });
        if (existing) return res.status(400).json({ success: false, message: `Combo "${name}" đã tồn tại.` });

        // Tạo combo
        const combo = new Combo({
            name: name.trim(),
            slug,
            description,
            image,
            items: items.map((it) => ({
                product: it.product,
                quantity: Number(it.quantity) || 1,
                defaultSize: it.defaultSize || 'medium',
                allowSizeChange: it.allowSizeChange ?? true,
                includedToppings: it.includedToppings || [],
            })),
            price: priceNum,
            originalPrice: originalPriceNum,
            savings: originalPriceNum - priceNum,
            discountPercent: Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100),
            comboType: comboType || 'meal',
            isAvailable: isAvailable ?? true,
            validFrom: validFrom || undefined,
            validTo: validTo || undefined,
        });

        await combo.save();

        // Populate sau khi save
        const populated = await Combo.findById(combo._id).populate({
            path: 'items.product',
            select: 'name basePrice images',
        });

        res.status(201).json({ success: true, message: 'Tạo combo thành công!', data: populated });
    } catch (error) {
        console.error('createCombo error:', error.message, error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật combo
// @route   PUT /api/admin/combos/:id
export const updateCombo = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) return res.status(404).json({ success: false, message: 'Combo không tồn tại.' });

        // Đổi tên → cập nhật slug
        if (req.body.name && req.body.name !== combo.name) {
            const newSlug = slugify(req.body.name);
            const existing = await Combo.findOne({ slug: newSlug, _id: { $ne: combo._id } });
            if (existing) return res.status(400).json({ success: false, message: 'Tên combo đã tồn tại.' });
            req.body.slug = newSlug;
        }

        // Convert giá sang number
        if (req.body.price) req.body.price = Number(req.body.price);
        if (req.body.originalPrice) req.body.originalPrice = Number(req.body.originalPrice);

        // Tính lại savings / discountPercent
        const newPrice = req.body.price ?? combo.price;
        const newOriginal = req.body.originalPrice ?? combo.originalPrice;
        if (req.body.price || req.body.originalPrice) {
            if (newPrice >= newOriginal)
                return res.status(400).json({ success: false, message: 'Giá combo phải nhỏ hơn giá gốc.' });
            req.body.savings = newOriginal - newPrice;
            req.body.discountPercent = Math.round(((newOriginal - newPrice) / newOriginal) * 100);
        }

        // Normalize items
        if (req.body.items) {
            req.body.items = req.body.items.map((it) => ({
                product: it.product,
                quantity: Number(it.quantity) || 1,
                defaultSize: it.defaultSize || 'medium',
                allowSizeChange: it.allowSizeChange ?? true,
                includedToppings: it.includedToppings || [],
            }));
        }

        // Dùng returnDocument thay new: true để tránh deprecation warning
        const updated = await Combo.findByIdAndUpdate(req.params.id, req.body, {
            returnDocument: 'after',
            runValidators: true,
        }).populate({ path: 'items.product', select: 'name basePrice images' });

        res.json({ success: true, message: 'Cập nhật combo thành công!', data: updated });
    } catch (error) {
        console.error('updateCombo error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Ẩn/hiện combo
// @route   PATCH /api/admin/combos/:id/toggle
export const toggleComboAvailability = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) return res.status(404).json({ success: false, message: 'Combo không tồn tại.' });

        combo.isAvailable = !combo.isAvailable;
        await combo.save();

        res.json({
            success: true,
            message: `Combo đã được ${combo.isAvailable ? 'hiển thị' : 'ẩn'}.`,
            data: { _id: combo._id, name: combo.name, isAvailable: combo.isAvailable },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Xoá combo
// @route   DELETE /api/admin/combos/:id
export const deleteCombo = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) return res.status(404).json({ success: false, message: 'Combo không tồn tại.' });

        await combo.deleteOne();
        res.json({ success: true, message: `Đã xoá combo "${combo.name}".` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
