import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { generateOTP, saveOTP, verifyOTP, deleteOTP } from '../utils/otpStore.js';

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });

// @desc    Bước 1 - Gửi OTP về email
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
        }

        const otp = generateOTP();
        saveOTP(email, otp, { name, email, password });
        console.log('📧 Sending OTP to:', email);
        await sendOTPEmail(email, otp);
        console.log('✅ OTP sent successfully');

        res.json({ success: true, message: `Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư.` });
    } catch (error) {
        console.error('sendOtp error:', error.message);
        res.status(500).json({ success: false, message: 'Không thể gửi email. Vui lòng thử lại.' });
    }
};

// @desc    Bước 2 - Xác nhận OTP và tạo tài khoản
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mã OTP.' });
        }

        const result = verifyOTP(email, otp);
        if (!result.valid) {
            return res.status(400).json({ success: false, message: result.message });
        }

        const { name, password } = result.userData;

        // Kiểm tra lại email chưa bị đăng ký trong lúc chờ OTP
        const userExists = await User.findOne({ email });
        if (userExists) {
            deleteOTP(email);
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
        }

        const user = await User.create({ name, email, password });
        deleteOTP(email);

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công!',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        console.log('BODY:', req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
        }

        res.json({
            success: true,
            message: 'Đăng nhập thành công!',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    res.json({ success: true, data: req.user });
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
        }

        const user = await User.findById(req.user._id);
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
