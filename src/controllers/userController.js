import User from '../models/User.js';

// @desc    User tự cập nhật profile của mình
// @route   PUT /api/users/me
// @access  Private
export const updateMe = async (req, res) => {
    try {
        const { name, phone, gender, dateOfBirth } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, gender, dateOfBirth: dateOfBirth || null },
            { new: true, runValidators: true },
        ).select('-password');

        res.json({ success: true, message: 'Cập nhật thành công!', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin tạo user mới
// @route   POST /api/users/admin
// @access  Private/Admin
export const adminCreateUser = async (req, res) => {
    try {
        const { name, email, password, phone, gender, dateOfBirth, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên, email và mật khẩu.' });
        }

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Email đã được sử dụng.' });
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            gender,
            dateOfBirth: dateOfBirth || null,
            role: role || 'user',
        });

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản thành công!',
            data: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin cập nhật thông tin user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const adminUpdateUser = async (req, res) => {
    try {
        const { name, phone, gender, dateOfBirth, role } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, phone, gender, dateOfBirth: dateOfBirth || null, role },
            { new: true, runValidators: true },
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

        res.json({ success: true, message: 'Cập nhật thành công!', data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Admin xóa user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const adminDeleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        if (user.role === 'admin')
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản admin.' });

        await user.deleteOne();
        res.json({ success: true, message: `Đã xóa tài khoản "${user.name}".` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Create user
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
        });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
