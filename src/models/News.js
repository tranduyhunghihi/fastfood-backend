import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true },
        summary: { type: String, default: '' },
        content: { type: String, required: true },
        image: { type: String, default: '' },
        tags: [String],
        isPublished: { type: Boolean, default: true },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        likeCount: { type: Number, default: 0 },
        author: { type: String, default: 'FastFoot' },
    },
    { timestamps: true },
);

export default mongoose.model('News', newsSchema);
