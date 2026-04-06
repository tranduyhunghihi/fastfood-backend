import express from 'express';
import {
    getIngredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    getStockImports,
    createStockImport,
    getTotalImportCost,
    getIngredientAlerts,
} from '../controllers/ingredientController.js';
import { getRecipes, getRecipeByProduct, createOrUpdateRecipe, deleteRecipe } from '../controllers/recipeController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Nguyên vật liệu ──────────────────────────────────────
router.get('/ingredients/alerts', protect, adminOnly, getIngredientAlerts);
router.get('/ingredients', protect, adminOnly, getIngredients);
router.post('/ingredients', protect, adminOnly, createIngredient);
router.put('/ingredients/:id', protect, adminOnly, updateIngredient);
router.delete('/ingredients/:id', protect, adminOnly, deleteIngredient);

// ── Nhập kho ─────────────────────────────────────────────
router.get('/stock-imports/cost', protect, adminOnly, getTotalImportCost);
router.get('/stock-imports', protect, adminOnly, getStockImports);
router.post('/stock-imports', protect, adminOnly, createStockImport);

// ── Công thức ─── prefix rõ ràng, không overlap ───────────
router.get('/recipes/list', protect, adminOnly, getRecipes);
router.get('/recipes/by-product/:productId', protect, adminOnly, getRecipeByProduct);
router.put('/recipes/by-product/:productId', protect, adminOnly, createOrUpdateRecipe);
router.delete('/recipes/remove/:id', protect, adminOnly, deleteRecipe);

export default router;
