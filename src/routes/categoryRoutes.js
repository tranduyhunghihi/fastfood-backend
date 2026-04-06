import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

// @desc    Lấy tất cả categories
// @route   GET /api/categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort('order');
        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @desc    Lấy category theo slug
// @route   GET /api/categories/:slug
router.get('/:slug', async (req, res) => {
    try {
        const category = await Category.findOne({
            slug: req.params.slug,
            isActive: true,
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
