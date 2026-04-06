import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            unique: true,
        },
        ingredients: [
            {
                ingredient: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Ingredient',
                    required: true,
                },
                quantity: { type: Number, required: true, min: 0 },
            },
        ],
        notes: { type: String, default: '' },
        servings: { type: Number, default: 1 },
    },
    { timestamps: true },
);

export default mongoose.model('Recipe', recipeSchema);
