import Order from '../models/Order.js';
import { createVNPayUrl, verifyVNPayReturn } from '../utils/vnpayHelper.js';

// @desc    Tạo URL thanh toán VNPay
// @route   POST /api/payment/vnpay-create
// @access  Public
export const createVNPayPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
        }

        const ipAddr =
            req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

        const payUrl = createVNPayUrl(
            order.orderNumber,
            order.total,
            `Thanh toan don hang ${order.orderNumber}`,
            ipAddr,
        );

        res.json({ success: true, payUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    VNPay IPN (Instant Payment Notification) - server-to-server confirmation
// @route   GET /api/payment/vnpay-ipn
// @access  Public
export const vnpayIPN = async (req, res) => {
    try {
        const params = req.query;
        const isValid = verifyVNPayReturn(params);

        if (!isValid) {
            return res.json({ RspCode: '97', Message: 'Invalid Checksum' });
        }

        const orderNumber = params['vnp_TxnRef'];
        const responseCode = params['vnp_ResponseCode'];
        const vnpAmount = parseInt(params['vnp_Amount']) / 100;

        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return res.json({ RspCode: '01', Message: 'Order not Found' });
        }

        if (Math.round(order.total) !== Math.round(vnpAmount)) {
            return res.json({ RspCode: '04', Message: 'Invalid Amount' });
        }

        if (order.paymentStatus === 'paid') {
            return res.json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (responseCode === '00') {
            await Order.findByIdAndUpdate(order._id, {
                paymentStatus: 'paid',
                status: 'confirmed',
            });
        } else {
            await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' });
        }

        return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error) {
        console.error('VNPay IPN error:', error);
        res.json({ RspCode: '99', Message: 'Unknown error' });
    }
};

// @desc    VNPay Return URL - redirect user về frontend sau thanh toán
// @route   GET /api/payment/vnpay-return
// @access  Public
export const vnpayReturn = async (req, res) => {
    const params = req.query;
    const orderNumber = params['vnp_TxnRef'];
    const responseCode = params['vnp_ResponseCode'];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Redirect ngay lập tức về frontend, không chờ DB
    // IPN sẽ xử lý cập nhật DB riêng
    const isValid = verifyVNPayReturn(params);

    if (!isValid) {
        return res.redirect(
            `${frontendUrl}/payment/vnpay-return?status=invalid&orderNumber=${encodeURIComponent(orderNumber || '')}`,
        );
    }

    if (responseCode === '00') {
        // Cập nhật DB bất đồng bộ - không chờ
        Order.findOne({ orderNumber })
            .then((order) => {
                if (order && order.paymentStatus !== 'paid') {
                    Order.findByIdAndUpdate(order._id, {
                        paymentStatus: 'paid',
                        status: 'confirmed',
                    }).catch(console.error);
                }
            })
            .catch(console.error);

        return res.redirect(
            `${frontendUrl}/payment/vnpay-return?status=success&orderNumber=${encodeURIComponent(
                orderNumber,
            )}&vnp_ResponseCode=${responseCode}`,
        );
    } else {
        // Cập nhật DB bất đồng bộ - không chờ
        Order.findOne({ orderNumber })
            .then((order) => {
                if (order) {
                    Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' }).catch(console.error);
                }
            })
            .catch(console.error);

        return res.redirect(
            `${frontendUrl}/payment/vnpay-return?status=failed&orderNumber=${encodeURIComponent(
                orderNumber,
            )}&vnp_ResponseCode=${responseCode}`,
        );
    }
};
