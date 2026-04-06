import express from 'express';
import Topping from '../models/Topping.js';

const router = express.Router();

// @desc    Lấy tất cả toppings
// @route   GET /api/toppings
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = { isAvailable: true };

        if (category) {
            query.category = category;
        }

        const toppings = await Topping.find(query);

        res.json({
            success: true,
            count: toppings.length,
            data: toppings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// @desc    Lấy topping theo id
// @route   GET /api/toppings/:id
router.get('/:id', async (req, res) => {
    try {
        const topping = await Topping.findById(req.params.id);

        if (!topping) {
            return res.status(404).json({
                success: false,
                message: 'Topping not found',
            });
        }

        res.json({
            success: true,
            data: topping,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
