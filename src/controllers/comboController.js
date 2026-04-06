import Combo from '../models/Combo.js';
import Product from '../models/Product.js';

// @desc    Lấy tất cả combo
// @route   GET /api/combos
export const getCombos = async (req, res) => {
    try {
        const { type } = req.query;

        let query = { isAvailable: true };
        if (type) query.comboType = type;

        const combos = await Combo.find(query)
            .populate({
                path: 'items.product',
                populate: {
                    path: 'category',
                },
            })
            .populate('items.includedToppings.topping');

        res.json({
            success: true,
            count: combos.length,
            data: combos,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Lấy chi tiết combo
// @route   GET /api/combos/:slug
export const getComboBySlug = async (req, res) => {
    try {
        const combo = await Combo.findOne({ slug: req.params.slug })
            .populate({
                path: 'items.product',
                populate: {
                    path: 'category availableToppings.topping',
                },
            })
            .populate('items.includedToppings.topping');

        if (!combo) {
            return res.status(404).json({
                success: false,
                message: 'Combo not found',
            });
        }

        res.json({
            success: true,
            data: combo,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Tùy chỉnh combo
// @route   POST /api/combos/:id/customize
export const customizeCombo = async (req, res) => {
    try {
        const { items } = req.body; // User có thể thay đổi size, toppings của từng item

        const combo = await Combo.findById(req.params.id).populate('items.product');

        if (!combo) {
            return res.status(404).json({
                success: false,
                message: 'Combo not found',
            });
        }

        // Tính giá sau khi tùy chỉnh
        let totalPrice = 0;
        const customizedItems = [];

        for (const item of items) {
            const originalItem = combo.items.find((i) => i.product._id.toString() === item.productId);

            if (originalItem) {
                let itemPrice = 0;
                const product = originalItem.product;

                // Tính giá theo size (nếu user chọn)
                if (item.size && originalItem.allowSizeChange) {
                    const sizeOption = product.sizes.find((s) => s.size === item.size);
                    itemPrice = sizeOption ? sizeOption.price : product.basePrice;
                } else {
                    // Dùng size mặc định
                    const defaultSize = originalItem.defaultSize;
                    const sizeOption = product.sizes.find((s) => s.size === defaultSize);
                    itemPrice = sizeOption ? sizeOption.price : product.basePrice;
                }

                // Tính giá toppings thêm
                if (item.toppings && item.toppings.length > 0) {
                    for (const t of item.toppings) {
                        // Kiểm tra topping có trong combo không
                        const included = originalItem.includedToppings.find(
                            (it) => it.topping.toString() === t.toppingId,
                        );

                        if (!included) {
                            // Nếu là topping thêm, tính phí
                            const toppingConfig = product.availableToppings.find(
                                (at) => at.topping.toString() === t.toppingId,
                            );
                            if (toppingConfig) {
                                itemPrice += toppingConfig.additionalPrice * (t.quantity || 1);
                            }
                        }
                    }
                }

                totalPrice += itemPrice * (item.quantity || 1);

                customizedItems.push({
                    product: product._id,
                    name: product.name,
                    quantity: item.quantity || 1,
                    size: item.size || originalItem.defaultSize,
                    toppings: item.toppings || [],
                });
            }
        }

        res.json({
            success: true,
            data: {
                originalPrice: combo.price,
                customizedPrice: totalPrice,
                savings: combo.price - totalPrice,
                items: customizedItems,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
