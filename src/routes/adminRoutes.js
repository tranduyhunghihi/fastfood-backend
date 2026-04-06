import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import {
    adminGetProducts,
    createProduct,
    updateProduct,
    toggleProductAvailability,
    deleteProduct,
} from '../controllers/admin/adminProductController.js';

import {
    adminGetCombos,
    createCombo,
    updateCombo,
    toggleComboAvailability,
    deleteCombo,
} from '../controllers/admin/adminComboController.js';

import {
    adminGetCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    adminGetToppings,
    createTopping,
    updateTopping,
    deleteTopping,
} from '../controllers/admin/adminCategoryToppingController.js';

import {
    uploadProductImages as multerProducts,
    uploadComboImage as multerCombo,
    uploadCategoryImage as multerCategory,
} from '../middleware/uploadMiddleware.js';

import {
    uploadProductImages,
    deleteProductImage,
    setPrimaryProductImage,
    uploadComboImage,
    uploadCategoryImage,
} from '../controllers/admin/adminUploadController.js';

const router = express.Router();

// Tất cả routes trong đây đều yêu cầu đăng nhập + role admin
router.use(protect, adminOnly);

// ─── PRODUCTS ─────────────────────────────
router.get('/products', adminGetProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.patch('/products/:id/toggle', toggleProductAvailability);
router.delete('/products/:id', deleteProduct);

// Upload ảnh sản phẩm
router.post('/products/:id/images', multerProducts, uploadProductImages);
router.delete('/products/:id/images', deleteProductImage);
router.patch('/products/:id/images/set-primary', setPrimaryProductImage);

// ─── COMBOS ───────────────────────────────
router.get('/combos', adminGetCombos);
router.post('/combos', createCombo);
router.put('/combos/:id', updateCombo);
router.patch('/combos/:id/toggle', toggleComboAvailability);
router.delete('/combos/:id', deleteCombo);

// Upload ảnh combo
router.post('/combos/:id/image', multerCombo, uploadComboImage);

// ─── CATEGORIES ───────────────────────────
router.get('/categories', adminGetCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Upload ảnh category
router.post('/categories/:id/image', multerCategory, uploadCategoryImage);

// ─── TOPPINGS ─────────────────────────────
router.get('/toppings', adminGetToppings);
router.post('/toppings', createTopping);
router.put('/toppings/:id', updateTopping);
router.delete('/toppings/:id', deleteTopping);

export default router;
