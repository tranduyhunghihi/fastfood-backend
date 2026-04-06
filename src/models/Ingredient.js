import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        unit: {
            type: String,
            required: true,
            enum: ['g', 'kg', 'ml', 'l', 'cái', 'quả', 'lát', 'muỗng', 'gói'],
        },
        quantity: { type: Number, default: 0, min: 0 }, // Tồn kho hiện tại
        minQuantity: { type: Number, default: 0 }, // Mức cảnh báo sắp hết
        costPerUnit: { type: Number, default: 0 }, // Giá nhập / đơn vị
        expiryDate: { type: Date, default: null }, // Hạn sử dụng
        category: {
            type: String,
            enum: ['meat', 'vegetable', 'dairy', 'spice', 'sauce', 'dough', 'other'],
            default: 'other',
        },
        description: { type: String, default: '' },
    },
    { timestamps: true },
);

// Virtual: còn hạn không
ingredientSchema.virtual('isExpired').get(function () {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
});

// Virtual: sắp hết hạn (trong 3 ngày)
ingredientSchema.virtual('isExpiringSoon').get(function () {
    if (!this.expiryDate) return false;
    const diff = this.expiryDate - new Date();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
});

ingredientSchema.set('toJSON', { virtuals: true });

const Ingredient = mongoose.models.Ingredient || mongoose.model('Ingredient', ingredientSchema);

export default Ingredient;
