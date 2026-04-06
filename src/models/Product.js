import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        description: String,
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        // Giá cơ bản
        basePrice: {
            type: Number,
            required: true,
        },
        // Các tùy chọn size
        sizes: [
            {
                size: {
                    type: String,
                    enum: ['small', 'medium', 'large', 'family'],
                },
                price: Number,
                additionalPrice: Number, // Giá thêm so với basePrice
            },
        ],
        // Tùy chọn crust (đế bánh)
        crusts: [
            {
                type: {
                    type: String,
                    enum: ['traditional', 'thin', 'cheesy', 'stuffed'],
                },
                name: String,
                additionalPrice: Number,
            },
        ],
        // Toppings có thể thêm
        availableToppings: [
            {
                topping: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Topping',
                },
                additionalPrice: Number,
            },
        ],
        images: [String],
        isAvailable: {
            type: Boolean,
            default: true,
        },
        // Số lượng trong kho (-1 = không giới hạn)
        stock: {
            type: Number,
            default: -1,
        },
        isPromotion: {
            type: Boolean,
            default: false,
        },
        promotionPrice: Number,
        tags: [String],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Product', productSchema);
