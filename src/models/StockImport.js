import mongoose from 'mongoose';

const stockImportSchema = new mongoose.Schema(
    {
        importCode: { type: String, required: true, unique: true },
        items: [
            {
                ingredient: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Ingredient',
                    required: true,
                },
                ingredientName: String, // Lưu lại tên lúc nhập
                quantity: { type: Number, required: true, min: 0 },
                unit: String,
                costPerUnit: { type: Number, required: true, min: 0 },
                subtotal: { type: Number, required: true },
                expiryDate: { type: Date, default: null },
            },
        ],
        totalCost: { type: Number, required: true },
        supplier: { type: String, default: '' },
        note: { type: String, default: '' },
        importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
);

export default mongoose.model('StockImport', stockImportSchema);
