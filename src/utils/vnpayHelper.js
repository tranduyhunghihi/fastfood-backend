import crypto from 'crypto';

const VNPAY_CONFIG = {
    tmnCode: process.env.VNPAY_TMN_CODE || '8LYCGAMY',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'XZCS5QJTRUH1C1NRM2LT8TRQNNE4H0H9',
    url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/vnpay-return',
    version: '2.1.0',
    command: 'pay',
    currCode: 'VND',
    locale: 'vn',
};

// Format ngày theo múi giờ VN (UTC+7) → yyyyMMddHHmmss
function formatDateVN(date) {
    const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return (
        vn.getUTCFullYear().toString() +
        pad(vn.getUTCMonth() + 1) +
        pad(vn.getUTCDate()) +
        pad(vn.getUTCHours()) +
        pad(vn.getUTCMinutes()) +
        pad(vn.getUTCSeconds())
    );
}

/**
 * Build chuỗi ký đúng chuẩn VNPay:
 * - Sắp xếp key theo alphabet
 * - Bỏ qua các field rỗng/null/undefined
 * - Encode value bằng encodeURIComponent, sau đó thay %20 → + (VNPay dùng application/x-www-form-urlencoded)
 * - Nối lại thành key=value&key=value
 */
function buildSignData(params) {
    return Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
        .sort()
        .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
        .join('&');
}

function hmacSHA512(data, secret) {
    return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
}

export function createVNPayUrl(orderId, amount, orderInfo, ipAddr) {
    const now = new Date();
    const createDate = formatDateVN(now);
    const expireDate = formatDateVN(new Date(now.getTime() + 15 * 60 * 1000));

    // VNPay chỉ chấp nhận ASCII trong orderInfo
    const safeOrderInfo = orderInfo
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .trim()
        .substring(0, 255);

    const params = {
        vnp_Version: VNPAY_CONFIG.version,
        vnp_Command: VNPAY_CONFIG.command,
        vnp_TmnCode: VNPAY_CONFIG.tmnCode,
        vnp_Locale: VNPAY_CONFIG.locale,
        vnp_CurrCode: VNPAY_CONFIG.currCode,
        vnp_TxnRef: String(orderId),
        vnp_OrderInfo: safeOrderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: String(Math.round(amount) * 100),
        vnp_ReturnUrl: VNPAY_CONFIG.returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
    };

    // 1. Tạo chuỗi ký (không có vnp_SecureHash)
    const signData = buildSignData(params);

    // 2. Ký HMAC-SHA512
    const secureHash = hmacSHA512(signData, VNPAY_CONFIG.hashSecret);

    // 3. Build URL cuối — dùng cùng encoding như signData để đảm bảo nhất quán
    const queryString = signData + `&vnp_SecureHash=${secureHash}`;

    return `${VNPAY_CONFIG.url}?${queryString}`;
}

export function verifyVNPayReturn(params) {
    const secureHash = params['vnp_SecureHash'];
    if (!secureHash) return false;

    // Loại bỏ các field không tham gia ký
    const signed = { ...params };
    delete signed['vnp_SecureHash'];
    delete signed['vnp_SecureHashType'];

    // Tái tạo chuỗi ký theo đúng cách VNPay gửi về
    // req.query của Express đã URL-decode sẵn → phải encode lại trước khi hash
    const signData = buildSignData(signed);
    const checkHash = hmacSHA512(signData, VNPAY_CONFIG.hashSecret);

    return checkHash.toLowerCase() === secureHash.toLowerCase();
}
