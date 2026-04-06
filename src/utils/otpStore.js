// Lưu OTP tạm thời: { email -> { otp, expiry, userData } }
const otpStore = new Map();

const OTP_TTL = 5 * 60 * 1000; // 5 phút

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const saveOTP = (email, otp, userData) => {
    otpStore.set(email.toLowerCase(), {
        otp,
        expiry: Date.now() + OTP_TTL,
        userData,
    });
};

export const verifyOTP = (email, otp) => {
    const record = otpStore.get(email.toLowerCase());
    if (!record) return { valid: false, message: 'Mã OTP không tồn tại hoặc đã hết hạn.' };
    if (Date.now() > record.expiry) {
        otpStore.delete(email.toLowerCase());
        return { valid: false, message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.' };
    }
    if (record.otp !== otp) return { valid: false, message: 'Mã OTP không chính xác.' };
    return { valid: true, userData: record.userData };
};

export const deleteOTP = (email) => otpStore.delete(email.toLowerCase());
