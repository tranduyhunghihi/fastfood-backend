import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Combo from '../models/Combo.js';
import Coupon from '../models/Coupon.js';
import { calcDiscount } from './couponController.js';
import { checkIngredients, deductIngredients } from './recipeController.js';

// @desc    Tạo đơn hàng mới (khách vãng lai hoặc user đã đăng nhập)
// @route   POST /api/orders
// @access  Public (optionalAuth)
export const createOrder = async (req, res) => {
    try {
        const { items, customerInfo, paymentMethod, orderType, notes, couponCode } = req.body;

        if (!customerInfo?.name || !customerInfo?.phone) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên và số điện thoại.' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống. Vui lòng thêm sản phẩm.' });
        }

        // ── Fetch tất cả product/combo song song thay vì tuần tự ──
        const productIds = items.filter((i) => i.itemType === 'product').map((i) => i.itemId);
        const comboIds = items.filter((i) => i.itemType === 'combo').map((i) => i.itemId);

        const [products, combos] = await Promise.all([
            productIds.length ? Product.find({ _id: { $in: productIds } }) : Promise.resolve([]),
            comboIds.length ? Combo.find({ _id: { $in: comboIds } }) : Promise.resolve([]),
        ]);

        const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));
        const comboMap = Object.fromEntries(combos.map((c) => [c._id.toString(), c]));

        // ── Kiểm tra nguyên liệu song song ──
        const ingredientChecks = await Promise.all(
            items
                .filter((i) => i.itemType === 'product')
                .map((i) => checkIngredients(i.itemId, i.quantity).then((r) => ({ itemId: i.itemId, ...r }))),
        );
        const failedIngredient = ingredientChecks.find((r) => !r.ok);
        if (failedIngredient) {
            const p = productMap[failedIngredient.itemId.toString()];
            return res.status(400).json({
                success: false,
                message: `"${p?.name || 'Sản phẩm'}" tạm thời hết hàng. Vui lòng chọn sản phẩm khác.`,
            });
        }

        // ── Tính tiền ──
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            let itemPrice = 0;
            let itemName = '';

            if (item.itemType === 'product') {
                const product = productMap[item.itemId.toString()];
                if (!product || !product.isAvailable) {
                    return res
                        .status(404)
                        .json({ success: false, message: `Sản phẩm không tồn tại hoặc đã ngừng bán: ${item.itemId}` });
                }
                itemPrice = product.basePrice;
                itemName = product.name;
                if (item.productDetails?.size) {
                    const sizeOption = product.sizes?.find((s) => s.size === item.productDetails.size);
                    if (sizeOption) itemPrice = sizeOption.price || itemPrice;
                }
                if (item.productDetails?.toppings?.length) {
                    for (const t of item.productDetails.toppings) {
                        itemPrice += t.price * (t.quantity || 1);
                    }
                }
            } else if (item.itemType === 'combo') {
                const combo = comboMap[item.itemId.toString()];
                if (!combo || !combo.isAvailable) {
                    return res
                        .status(404)
                        .json({ success: false, message: `Combo không tồn tại hoặc đã ngừng bán: ${item.itemId}` });
                }
                itemPrice = combo.price;
                itemName = combo.name;
            } else {
                return res.status(400).json({ success: false, message: `itemType không hợp lệ: ${item.itemType}.` });
            }

            const subtotalItem = itemPrice * item.quantity;
            subtotal += subtotalItem;
            orderItems.push({
                ...item,
                name: itemName,
                unitPrice: itemPrice,
                subtotal: subtotalItem,
                itemModel: item.itemType === 'product' ? 'Product' : 'Combo',
            });
        }

        const deliveryFee = orderType === 'delivery' ? 15000 : 0;
        const tax = subtotal * 0.1;

        // Áp dụng coupon + tạo orderNumber song song
        const date = new Date();
        const y = date.getFullYear().toString().slice(-2);
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        const rand = Math.floor(Math.random() * 90000 + 10000);
        const orderNumber = `ORD${y}${m}${d}${rand}`;

        let discount = 0;
        let appliedCoupon = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
            if (coupon) {
                discount = calcDiscount(coupon, subtotal);
                appliedCoupon = coupon;
            }
        }

        const total = Math.max(0, subtotal + tax + deliveryFee - discount);

        const orderData = {
            orderNumber,
            items: orderItems,
            customerInfo,
            subtotal,
            tax,
            deliveryFee,
            discount,
            total,
            paymentMethod: paymentMethod || 'cash',
            orderType: orderType || 'delivery',
            notes,
            status: 'pending',
        };
        if (req.user) orderData.user = req.user._id;

        const order = await Order.create(orderData);

        // Trừ nguyên liệu + cập nhật coupon song song
        await Promise.all([
            ...orderItems.filter((i) => i.itemType === 'product').map((i) => deductIngredients(i.itemId, i.quantity)),
            appliedCoupon
                ? Coupon.findByIdAndUpdate(appliedCoupon._id, {
                      $inc: { usageCount: 1 },
                      ...(req.user ? { $addToSet: { usedBy: req.user._id } } : {}),
                  })
                : Promise.resolve(),
        ]);

        res.status(201).json({ success: true, message: 'Đặt hàng thành công!', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lấy đơn hàng của user đang đăng nhập
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort('-createdAt');

        res.json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Tra cứu đơn hàng bằng SĐT + orderNumber (cho khách vãng lai)
// @route   GET /api/orders/track
// @access  Public
export const trackOrder = async (req, res) => {
    try {
        const { phone, orderNumber } = req.query;

        if (!phone && !orderNumber) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp số điện thoại hoặc mã đơn hàng.',
            });
        }

        let query = {};
        if (orderNumber) query.orderNumber = orderNumber;
        if (phone) query['customerInfo.phone'] = phone;

        const orders = await Order.find(query)
            .sort('-createdAt')
            .select(
                'orderNumber status customerInfo total subtotal tax deliveryFee createdAt orderType paymentMethod items notes',
            );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng.',
            });
        }

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lấy chi tiết đơn hàng theo ID
// @route   GET /api/orders/:id
// @access  Public (user xem của mình, admin xem tất cả)
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });
        }

        // Nếu đã đăng nhập và không phải admin thì chỉ xem được đơn của mình
        if (req.user && req.user.role !== 'admin') {
            if (order.user && order.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền xem đơn hàng này.',
                });
            }
        }

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lấy tất cả đơn hàng (admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res) => {
    try {
        const { status, phone } = req.query;
        let query = {};

        if (status) query.status = status;
        if (phone) query['customerInfo.phone'] = phone;

        const orders = await Order.find(query).sort('-createdAt');

        res.json({ success: true, count: orders.length, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật trạng thái đơn hàng (admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ: ${status}` });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại.' });
        }

        order.status = status;
        await order.save();

        res.json({ success: true, message: 'Cập nhật trạng thái thành công!', data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
