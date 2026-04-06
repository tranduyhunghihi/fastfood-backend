import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    // Có thể là product hoặc combo
    itemType: {
        type: String,
        enum: ['product', 'combo'],
        required: true,
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'itemModel',
    },
    itemModel: {
        type: String,
        required: true,
        enum: ['Product', 'Combo'],
    },
    name: String,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    // Chi tiết cho product
    productDetails: {
        size: {
            type: String,
            enum: ['small', 'medium', 'large', 'family'],
        },
        crust: String,
        toppings: [
            {
                topping: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Topping',
                },
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
        instructions: String,
    },
    // Chi tiết cho combo
    comboDetails: {
        selectedItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                name: String,
                quantity: Number,
                size: String,
                toppings: [
                    {
                        topping: mongoose.Schema.Types.ObjectId,
                        name: String,
                        price: Number,
                    },
                ],
            },
        ],
    },
    // Giá
    unitPrice: {
        type: Number,
        required: true,
    },
    subtotal: {
        type: Number,
        required: true,
    },
});

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        customerInfo: {
            name: {
                type: String,
                required: true,
            },
            phone: {
                type: String,
                required: true,
            },
            email: String,
            address: {
                street: String,
                city: String,
                notes: String,
            },
        },
        items: [orderItemSchema],
        // Tổng tiền
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        deliveryFee: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            required: true,
        },
        // Trạng thái
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'momo', 'zalopay', 'vnpay'],
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending',
        },
        orderType: {
            type: String,
            enum: ['delivery', 'takeaway', 'dinein'],
            default: 'delivery',
        },
        notes: String,
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Order', orderSchema);
