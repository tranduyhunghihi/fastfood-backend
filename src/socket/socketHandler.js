import Conversation from '../models/Conversation.js';

export const initSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Socket connected:', socket.id);

        // ── USER: join phòng chat của mình ──────────────
        socket.on('user:join', async ({ sessionId, customerName, customerEmail }) => {
            socket.join(sessionId);
            socket.sessionId = sessionId;
            socket.role = 'user';

            // Tìm hoặc tạo conversation
            let conv = await Conversation.findOne({ sessionId });
            if (!conv) {
                conv = await Conversation.create({
                    sessionId,
                    customerName: customerName || 'Khách',
                    customerEmail: customerEmail || '',
                    messages: [],
                });
            }

            // Gửi lịch sử chat cho user
            socket.emit('chat:history', conv.messages);

            // Thông báo cho admin có user mới / quay lại
            io.to('admin-room').emit('admin:conversation-update', {
                sessionId: conv.sessionId,
                customerName: conv.customerName,
                lastMessage: conv.lastMessage,
                unreadByAdmin: conv.unreadByAdmin,
                status: conv.status,
                updatedAt: conv.updatedAt,
            });
        });

        // ── ADMIN: join phòng admin ──────────────────────
        socket.on('admin:join', () => {
            socket.join('admin-room');
            socket.role = 'admin';
            console.log('Admin joined');
        });

        // ── ADMIN: join theo dõi 1 conversation ─────────
        socket.on('admin:join-conversation', async (sessionId) => {
            socket.join(sessionId);
            socket.adminSessionId = sessionId;

            // Reset unread
            const conv = await Conversation.findOneAndUpdate({ sessionId }, { unreadByAdmin: 0 }, { new: true });

            // Gửi lịch sử chat cho admin
            if (conv) socket.emit('chat:history', conv.messages);

            io.to('admin-room').emit('admin:read', sessionId);
        });

        // ── ADMIN: rời conversation ──────────────────────
        socket.on('admin:leave-conversation', (sessionId) => {
            socket.leave(sessionId);
        });

        // ── USER gửi tin nhắn ────────────────────────────
        socket.on('user:message', async ({ sessionId, content, senderName }) => {
            if (!content?.trim()) return;

            const message = {
                content: content.trim(),
                sender: 'user',
                senderName: senderName || 'Khách',
                createdAt: new Date(),
            };

            const conv = await Conversation.findOneAndUpdate(
                { sessionId },
                {
                    $push: { messages: message },
                    $set: { lastMessage: content.trim(), status: 'open' },
                    $inc: { unreadByAdmin: 1 },
                },
                { new: true },
            );

            // Broadcast tin nhắn cho cả phòng (user + admin đang xem)
            io.to(sessionId).emit('chat:message', message);

            // Cập nhật danh sách cho admin
            io.to('admin-room').emit('admin:conversation-update', {
                sessionId: conv.sessionId,
                customerName: conv.customerName,
                lastMessage: conv.lastMessage,
                unreadByAdmin: conv.unreadByAdmin,
                status: conv.status,
                updatedAt: conv.updatedAt,
            });
        });

        // ── ADMIN gửi tin nhắn ───────────────────────────
        socket.on('admin:message', async ({ sessionId, content }) => {
            if (!content?.trim()) return;

            const message = {
                content: content.trim(),
                sender: 'admin',
                senderName: 'FastFoot Support',
                createdAt: new Date(),
            };

            const conv = await Conversation.findOneAndUpdate(
                { sessionId },
                {
                    $push: { messages: message },
                    $set: { lastMessage: content.trim() },
                },
                { new: true },
            );

            io.to(sessionId).emit('chat:message', message);

            io.to('admin-room').emit('admin:conversation-update', {
                sessionId: conv.sessionId,
                customerName: conv.customerName,
                lastMessage: conv.lastMessage,
                unreadByAdmin: conv.unreadByAdmin,
                status: conv.status,
                updatedAt: conv.updatedAt,
            });
        });

        // ── ADMIN lấy danh sách conversations ───────────
        socket.on('admin:get-conversations', async () => {
            const convs = await Conversation.find()
                .select('sessionId customerName customerEmail lastMessage unreadByAdmin status updatedAt')
                .sort('-updatedAt')
                .limit(50);
            socket.emit('admin:conversations', convs);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected:', socket.id);
        });
    });
};
