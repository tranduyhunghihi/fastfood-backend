import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import comboRoutes from './src/routes/comboRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import toppingRoutes from './src/routes/toppingRoutes.js';
import reviewRoutes from './src/routes/reviewRoutes.js';
import couponRoutes from './src/routes/couponRoutes.js';
import newsRoutes from './src/routes/newsRoutes.js';
import inventoryRoutes from './src/routes/inventoryRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import { initSocket } from './src/socket/socketHandler.js';

dotenv.config();
mongoose.set('strictPopulate', false); // cho phép populate các path không khai báo trong schema
connectDB();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://fastfood-website-rho.vercel.app',
    'https://fastfood-admin-sepia.vercel.app',
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

initSocket(io);

app.use(express.json());
app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
);
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/toppings', toppingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date().toISOString(), status: 'success' });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {},
    });
});

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
    console.log('🟢 MongoDB connection is open');
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
        console.log(`💬 Socket.io enabled`);
    });
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 MongoDB connection error:', err);
});
