import express from 'express';
import {
    getProducts,
    getProductBySlug,
    getFeaturedProducts,
    calculatePrice,
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getProducts); // GET /api/products?category=pizza&sort=price_asc&page=1&limit=12
router.get('/featured', getFeaturedProducts); // GET /api/products/featured
router.post('/calculate-price', calculatePrice); // POST /api/products/calculate-price
router.get('/:slug', getProductBySlug); // GET /api/products/pizza-hai-tang

export default router;
