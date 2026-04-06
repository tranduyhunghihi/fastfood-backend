import Product from '../models/Product.js';
import Category from '../models/Category.js';

// @desc    Lấy danh sách sản phẩm (public) - có pagination, filter, sort
// @route   GET /api/products
// @query   category, size, minPrice, maxPrice, search, isPromotion
//          sort: price_asc | price_desc | newest | popular
//          page, limit
export const getProducts = async (req, res) => {
    try {
        const {
            category,
            size,
            minPrice,
            maxPrice,
            search,
            isPromotion,
            sort = 'newest',
            page = 1,
            limit = 12,
        } = req.query;

        // ── Build query ──────────────────────────────────────
        let query = { isAvailable: true };

        // Filter theo category slug
        if (category) {
            const categoryDoc = await Category.findOne({ slug: category, isActive: true });
            if (!categoryDoc) {
                return res.json({ success: true, total: 0, page: 1, totalPages: 0, data: [] });
            }
            query.category = categoryDoc._id;
        }

        // Filter theo size (pizza có size đó)
        if (size) {
            query['sizes.size'] = size;
        }

        // Filter giá - dùng basePrice hoặc promotionPrice nếu đang khuyến mãi
        if (minPrice || maxPrice) {
            query.basePrice = {};
            if (minPrice) query.basePrice.$gte = Number(minPrice);
            if (maxPrice) query.basePrice.$lte = Number(maxPrice);
        }

        // Filter sản phẩm đang khuyến mãi
        if (isPromotion === 'true') {
            query.isPromotion = true;
        }

        // Tìm kiếm theo tên hoặc tags
        if (search?.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { tags: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } },
            ];
        }

        // ── Sort ─────────────────────────────────────────────
        const sortMap = {
            price_asc: { basePrice: 1 },
            price_desc: { basePrice: -1 },
            newest: { createdAt: -1 },
            popular: { createdAt: -1 }, // sau này có thể đổi thành orderCount
        };
        const sortOption = sortMap[sort] || { createdAt: -1 };

        // ── Pagination ────────────────────────────────────────
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit))); // tối đa 50/trang
        const skip = (pageNum - 1) * limitNum;

        // ── Execute ───────────────────────────────────────────
        const [total, products] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
                .populate('category', 'name slug')
                .populate('availableToppings.topping', 'name price category')
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .lean(), // lean() nhanh hơn cho danh sách
        ]);

        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            total,
            page: pageNum,
            totalPages,
            limit: limitNum,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
            data: products,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lấy chi tiết sản phẩm theo slug
// @route   GET /api/products/:slug
export const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug, isAvailable: true })
            .populate('category', 'name slug description')
            .populate('availableToppings.topping', 'name price category image');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        // Lấy thêm sản phẩm liên quan cùng category
        const related = await Product.find({
            category: product.category._id,
            _id: { $ne: product._id },
            isAvailable: true,
        })
            .select('name slug basePrice images isPromotion promotionPrice sizes')
            .limit(4)
            .lean();

        res.json({
            success: true,
            data: product,
            related,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lấy sản phẩm nổi bật / khuyến mãi
// @route   GET /api/products/featured
export const getFeaturedProducts = async (req, res) => {
    try {
        const [promotions, newest] = await Promise.all([
            // Sản phẩm đang khuyến mãi
            Product.find({ isAvailable: true, isPromotion: true })
                .populate('category', 'name slug')
                .select('name slug basePrice promotionPrice images category isPromotion tags')
                .limit(8)
                .lean(),

            // Sản phẩm mới nhất
            Product.find({ isAvailable: true })
                .populate('category', 'name slug')
                .select('name slug basePrice images category isPromotion tags')
                .sort('-createdAt')
                .limit(8)
                .lean(),
        ]);

        res.json({
            success: true,
            data: { promotions, newest },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Tính giá theo size + toppings đã chọn
// @route   POST /api/products/calculate-price
export const calculatePrice = async (req, res) => {
    try {
        const { productId, size, crust, toppings } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Thiếu productId.' });
        }

        const product = await Product.findById(productId).populate('availableToppings.topping');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        // Giá gốc (ưu tiên promotionPrice nếu đang KM)
        let price = product.isPromotion && product.promotionPrice ? product.promotionPrice : product.basePrice;

        // Tính theo size
        if (size) {
            const sizeOption = product.sizes.find((s) => s.size === size);
            if (sizeOption) {
                price = sizeOption.price ?? price + (sizeOption.additionalPrice || 0);
            }
        }

        // Tính theo crust
        let crustPrice = 0;
        if (crust) {
            const crustOption = product.crusts.find((c) => c.type === crust);
            if (crustOption) crustPrice = crustOption.additionalPrice || 0;
        }

        // Tính toppings thêm
        let toppingsTotal = 0;
        const toppingBreakdown = [];
        if (toppings?.length) {
            for (const t of toppings) {
                const config = product.availableToppings.find((at) => at.topping._id.toString() === t.toppingId);
                if (config) {
                    const toppingCost = config.additionalPrice * (t.quantity || 1);
                    toppingsTotal += toppingCost;
                    toppingBreakdown.push({
                        name: config.topping.name,
                        quantity: t.quantity || 1,
                        unitPrice: config.additionalPrice,
                        subtotal: toppingCost,
                    });
                }
            }
        }

        const totalPrice = price + crustPrice + toppingsTotal;

        res.json({
            success: true,
            data: {
                basePrice: price,
                crustPrice,
                toppingsPrice: toppingsTotal,
                toppingBreakdown,
                totalPrice,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
