import mongoose from 'mongoose';

const toppingSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        category: {
            type: String,
            enum: ['meat', 'vegetable', 'cheese', 'sauce'],
            required: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        image: String,
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Topping', toppingSchema);
