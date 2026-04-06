import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import slugify from '../../utils/slugify.js';

// @desc    Lấy tất cả sản phẩm (kể cả đã ẩn) - admin
// @route   GET /api/admin/products
export const adminGetProducts = async (req, res) => {
    try {
        const { category, isAvailable, search, page = 1, limit = 20 } = req.query;

        let query = {};
        if (category) {
            const cat = await Category.findOne({ slug: category });
            if (cat) query.category = cat._id;
        }
        if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
        if (search) query.name = { $regex: search, $options: 'i' };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category', 'name slug')
            .populate('availableToppings.topping', 'name price')
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: products,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Tạo sản phẩm mới
// @route   POST /api/admin/products
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            basePrice,
            sizes,
            crusts,
            availableToppings,
            images,
            isAvailable,
            isPromotion,
            promotionPrice,
            tags,
            stock,
        } = req.body;

        if (!name || !category || !basePrice) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền tên, danh mục và giá cơ bản.',
            });
        }

        const slug = slugify(name);

        // Kiểm tra slug trùng
        const existing = await Product.findOne({ slug });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Sản phẩm "${name}" đã tồn tại.`,
            });
        }

        const product = new Product({
            name,
            slug,
            description,
            category,
            basePrice,
            sizes: sizes || [],
            crusts: crusts || [],
            availableToppings: availableToppings || [],
            images: images || [],
            isAvailable: isAvailable ?? true,
            isPromotion: isPromotion ?? false,
            promotionPrice,
            tags: tags || [],
            stock: stock !== undefined ? Number(stock) : -1,
        });

        await product.save();

        // Populate sau khi save để đảm bảo _id có sẵn
        const populated = await Product.findById(product._id).populate('category', 'name slug');

        res.status(201).json({
            success: true,
            message: 'Tạo sản phẩm thành công!',
            data: populated,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật sản phẩm
// @route   PUT /api/admin/products/:id
export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        // Nếu đổi tên thì cập nhật slug
        if (req.body.name && req.body.name !== product.name) {
            const newSlug = slugify(req.body.name);
            const existing = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Tên sản phẩm đã tồn tại.' });
            }
            req.body.slug = newSlug;
        }

        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate('category', 'name slug')
            .populate('availableToppings.topping', 'name price');

        res.json({ success: true, message: 'Cập nhật sản phẩm thành công!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Ẩn/hiện sản phẩm (soft toggle)
// @route   PATCH /api/admin/products/:id/toggle
export const toggleProductAvailability = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        product.isAvailable = !product.isAvailable;
        await product.save();

        res.json({
            success: true,
            message: `Sản phẩm đã được ${product.isAvailable ? 'hiển thị' : 'ẩn'}.`,
            data: { _id: product._id, name: product.name, isAvailable: product.isAvailable },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Xoá sản phẩm
// @route   DELETE /api/admin/products/:id
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        await product.deleteOne();

        res.json({ success: true, message: `Đã xoá sản phẩm "${product.name}".` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
