import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: { type: String, default: '' },
        // Loại giảm giá: percent (%) hoặc fixed (số tiền cố định)
        type: {
            type: String,
            enum: ['percent', 'fixed'],
            required: true,
        },
        value: {
            type: Number,
            required: true,
            min: 0,
        },
        // Giảm tối đa (chỉ áp dụng khi type = percent)
        maxDiscount: {
            type: Number,
            default: null,
        },
        // Đơn tối thiểu để áp dụng
        minOrder: {
            type: Number,
            default: 0,
        },
        // Số lần dùng tối đa (null = không giới hạn)
        maxUsage: {
            type: Number,
            default: null,
        },
        usageCount: {
            type: Number,
            default: 0,
        },
        // Mỗi user chỉ dùng 1 lần
        usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
        validFrom: { type: Date, default: Date.now },
        validTo: { type: Date, default: null },
    },
    { timestamps: true },
);

export default mongoose.model('Coupon', couponSchema);
