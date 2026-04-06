import express from 'express';
import { getReviews, createReview, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:productId', getReviews);
router.post('/:productId', protect, createReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;
