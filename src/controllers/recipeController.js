import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';
import Ingredient from '../models/Ingredient.js';
import Product from '../models/Product.js';

export const getRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find()
            .populate({ path: 'product', select: 'name slug images basePrice', strictPopulate: false })
            .populate({
                path: 'ingredients.ingredient',
                select: 'name unit quantity expiryDate costPerUnit',
                strictPopulate: false,
            });
        res.json({ success: true, data: recipes });
    } catch (e) {
        console.error('getRecipes error:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
};

export const getRecipeByProduct = async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ product: req.params.productId })
            .populate({ path: 'product', select: 'name slug images', strictPopulate: false })
            .populate({
                path: 'ingredients.ingredient',
                select: 'name unit quantity expiryDate costPerUnit',
                strictPopulate: false,
            });
        if (!recipe) return res.status(404).json({ success: false, message: 'Chưa có công thức cho sản phẩm này.' });
        res.json({ success: true, data: recipe });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createOrUpdateRecipe = async (req, res) => {
    try {
        const { productId } = req.params;
        const { ingredients, notes, servings } = req.body;

        if (!ingredients?.length)
            return res.status(400).json({ success: false, message: 'Vui lòng thêm ít nhất 1 nguyên liệu.' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại.' });

        // Chỉ lưu ObjectId string
        const cleanIngredients = ingredients.map((ri) => ({
            ingredient: new mongoose.Types.ObjectId(ri.ingredient?._id || ri.ingredient),
            quantity: Number(ri.quantity),
        }));

        let recipe = await Recipe.findOne({ product: productId });
        if (recipe) {
            // Dùng collection.updateOne để bypass Mongoose validation hoàn toàn
            await Recipe.collection.updateOne(
                { _id: recipe._id },
                {
                    $set: {
                        ingredients: cleanIngredients,
                        notes: notes || '',
                        servings: servings || 1,
                        updatedAt: new Date(),
                    },
                },
            );
        } else {
            // Dùng collection.insertOne để bypass validation hoàn toàn
            const result = await Recipe.collection.insertOne({
                product: new mongoose.Types.ObjectId(productId),
                ingredients: cleanIngredients,
                notes: notes || '',
                servings: servings || 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            recipe = { _id: result.insertedId };
        }

        // Query lại với populate đầy đủ
        const populated = await Recipe.findById(recipe._id)
            .populate({ path: 'product', select: 'name slug images basePrice', strictPopulate: false })
            .populate({
                path: 'ingredients.ingredient',
                select: 'name unit quantity costPerUnit',
                strictPopulate: false,
            });

        res.json({ success: true, message: 'Lưu công thức thành công!', data: populated });
    } catch (e) {
        console.error('createOrUpdateRecipe error:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteRecipe = async (req, res) => {
    try {
        console.log('DELETE RECIPE id:', req.params.id);
        await Recipe.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa công thức.' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Kiểm tra có đủ nguyên liệu không (dùng trong orderController)
export const checkIngredients = async (productId, quantity = 1) => {
    const recipe = await Recipe.findOne({ product: productId }).populate('ingredients.ingredient');

    if (!recipe) return { ok: true }; // Không có công thức → không kiểm tra

    const now = new Date();
    const errors = [];

    for (const ri of recipe.ingredients) {
        const ing = ri.ingredient;
        const needed = ri.quantity * quantity;

        // Kiểm tra hết hạn
        if (ing.expiryDate && ing.expiryDate < now) {
            errors.push(ing.name);
            continue;
        }

        // Kiểm tra số lượng
        if (ing.quantity < needed) {
            errors.push(ing.name);
        }
    }

    return errors.length ? { ok: false, errors: ['Rất tiếc, sản phẩm này tạm thời hết hàng.'] } : { ok: true };
};

// Trừ nguyên liệu sau khi đặt hàng thành công
export const deductIngredients = async (productId, quantity = 1) => {
    const recipe = await Recipe.findOne({ product: productId });
    if (!recipe) return;

    for (const ri of recipe.ingredients) {
        const needed = ri.quantity * quantity;
        await Ingredient.findByIdAndUpdate(ri.ingredient, {
            $inc: { quantity: -needed },
        });
    }
};
