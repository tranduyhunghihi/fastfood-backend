import mongoose from 'mongoose';

const comboSchema = new mongoose.Schema(
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
        image: String,
        // Sản phẩm trong combo
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true,
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
                // Cho phép chọn size mặc định hoặc tùy chọn
                defaultSize: {
                    type: String,
                    enum: ['small', 'medium', 'large', 'family'],
                },
                // Cho phép thay đổi size không
                allowSizeChange: {
                    type: Boolean,
                    default: true,
                },
                // Các toppings đi kèm
                includedToppings: [
                    {
                        topping: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: 'Topping',
                        },
                        quantity: {
                            type: Number,
                            default: 1,
                        },
                    },
                ],
            },
        ],
        // Giá combo
        price: {
            type: Number,
            required: true,
        },
        // Giá gốc (tổng giá lẻ)
        originalPrice: {
            type: Number,
            required: true,
        },
        // Tiết kiệm
        savings: {
            type: Number,
            required: true,
        },
        // Phần trăm giảm
        discountPercent: {
            type: Number,
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        validFrom: Date,
        validTo: Date,
        // Loại combo
        comboType: {
            type: String,
            enum: ['meal', 'family', 'deal', 'custom'],
            default: 'meal',
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Combo', comboSchema);
