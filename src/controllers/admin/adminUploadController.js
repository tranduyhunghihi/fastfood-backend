import Product from '../../models/Product.js';
import Combo from '../../models/Combo.js';
import Category from '../../models/Category.js';
import { uploadBufferToCloudinary, deleteImageFromCloudinary } from '../../middleware/uploadMiddleware.js';

// ── PRODUCT IMAGES ───────────────────────────────────────

// @route   POST /api/admin/products/:id/images
export const uploadProductImages = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        if (!req.files?.length) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ít nhất 1 ảnh.' });
        }

        // Upload từng file buffer lên Cloudinary
        console.log(
            'Files received:',
            req.files?.length,
            req.files?.map((f) => ({ name: f.originalname, size: f.size, hasBuffer: !!f.buffer })),
        );
        const uploadedUrls = [];
        for (const file of req.files) {
            console.log('Uploading file:', file.originalname, 'buffer size:', file.buffer?.length);
            const result = await uploadBufferToCloudinary(file.buffer, 'products', {
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto:good' }],
            });
            console.log('Upload result:', result?.secure_url);
            uploadedUrls.push(result.secure_url);
        }

        product.images = [...product.images, ...uploadedUrls];
        await product.save();

        res.json({
            success: true,
            message: `Đã upload ${uploadedUrls.length} ảnh thành công!`,
            data: { images: product.images },
        });
    } catch (error) {
        console.error('uploadProductImages error full:', error);
        console.error('uploadProductImages error message:', error?.message);
        console.error('uploadProductImages error type:', typeof error);
        res.status(500).json({ success: false, message: error?.message || JSON.stringify(error) || 'Lỗi upload ảnh' });
    }
};

// @route   DELETE /api/admin/products/:id/images
export const deleteProductImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'Thiếu imageUrl.' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        await deleteImageFromCloudinary(imageUrl);
        product.images = product.images.filter((img) => img !== imageUrl);
        await product.save();

        res.json({ success: true, message: 'Đã xoá ảnh.', data: { images: product.images } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   PATCH /api/admin/products/:id/images/set-primary
export const setPrimaryProductImage = async (req, res) => {
    try {
        const { imageUrl } = req.body;
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });
        }

        product.images = [imageUrl, ...product.images.filter((img) => img !== imageUrl)];
        await product.save();

        res.json({ success: true, message: 'Đã đặt ảnh đại diện.', data: { images: product.images } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── COMBO IMAGE ──────────────────────────────────────────

// @route   POST /api/admin/combos/:id/image
export const uploadComboImage = async (req, res) => {
    try {
        const combo = await Combo.findById(req.params.id);
        if (!combo) {
            return res.status(404).json({ success: false, message: 'Combo không tồn tại.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn 1 ảnh.' });
        }

        if (combo.image) await deleteImageFromCloudinary(combo.image);

        const result = await uploadBufferToCloudinary(req.file.buffer, 'combos', {
            transformation: [{ width: 1200, height: 600, crop: 'limit', quality: 'auto:good' }],
        });

        combo.image = result.secure_url;
        await combo.save();

        res.json({ success: true, message: 'Upload ảnh combo thành công!', data: { image: combo.image } });
    } catch (error) {
        console.error('uploadComboImage error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── CATEGORY IMAGE ───────────────────────────────────────

// @route   POST /api/admin/categories/:id/image
export const uploadCategoryImage = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn 1 ảnh.' });
        }

        if (category.image) await deleteImageFromCloudinary(category.image);

        const result = await uploadBufferToCloudinary(req.file.buffer, 'categories', {
            transformation: [{ width: 400, height: 400, crop: 'limit', quality: 'auto:good' }],
        });

        category.image = result.secure_url;
        await category.save();

        res.json({ success: true, message: 'Upload ảnh danh mục thành công!', data: { image: category.image } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
