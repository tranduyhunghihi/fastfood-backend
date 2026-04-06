import express from 'express';
import { createVNPayPayment, vnpayReturn, vnpayIPN } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/vnpay-create', createVNPayPayment);
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIPN);

export default router;
