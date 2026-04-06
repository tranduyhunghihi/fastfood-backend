import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        content: { type: String, required: true },
        sender: { type: String, enum: ['user', 'admin'], required: true },
        senderName: { type: String, default: 'Khách' },
    },
    { timestamps: true },
);

const conversationSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true },
        customerName: { type: String, default: 'Khách' },
        customerEmail: { type: String, default: '' },
        messages: [messageSchema],
        status: { type: String, enum: ['open', 'closed'], default: 'open' },
        lastMessage: { type: String, default: '' },
        unreadByAdmin: { type: Number, default: 0 },
    },
    { timestamps: true },
);

export default mongoose.model('Conversation', conversationSchema);
