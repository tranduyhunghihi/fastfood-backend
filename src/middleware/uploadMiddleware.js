import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp).'));
    }
};

const limits = { fileSize: 5 * 1024 * 1024 };
const storage = multer.memoryStorage();

const wrapMulter = (upload) => (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

export const uploadProductImages = wrapMulter(multer({ storage, fileFilter, limits }).array('images', 5));

export const uploadComboImage = wrapMulter(multer({ storage, fileFilter, limits }).single('image'));

export const uploadCategoryImage = wrapMulter(multer({ storage, fileFilter, limits }).single('image'));

// Config cloudinary lazy — gọi khi cần để đảm bảo dotenv đã load
const getCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
};

export const uploadBufferToCloudinary = (buffer, folder, options = {}) => {
    const cld = getCloudinary();
    return new Promise((resolve, reject) => {
        const stream = cld.uploader.upload_stream(
            {
                folder: `fastfoot/${folder}`,
                transformation: options.transformation || [
                    { width: 800, height: 800, crop: 'limit', quality: 'auto:good' },
                ],
            },
            (error, result) => {
                if (error) {
                    const errMsg = typeof error === 'string' ? error : error.message || JSON.stringify(error);
                    reject(new Error(errMsg));
                } else {
                    resolve(result);
                }
            },
        );
        stream.end(buffer);
    });
};

export const deleteImageFromCloudinary = async (imageUrl) => {
    try {
        const cld = getCloudinary();
        const parts = imageUrl.split('/');
        const fileWithExt = parts[parts.length - 1];
        const fileName = fileWithExt.split('.')[0];
        const folder = parts[parts.length - 2];
        const publicId = `${folder}/${fileName}`;
        await cld.uploader.destroy(publicId);
    } catch (error) {
        console.error('Lỗi xoá ảnh Cloudinary:', error.message);
    }
};
