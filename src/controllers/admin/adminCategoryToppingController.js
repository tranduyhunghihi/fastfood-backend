import Category from '../../models/Category.js';
import Topping from '../../models/Topping.js';
import slugify from '../../utils/slugify.js';

// ─────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────

// @route   GET /api/admin/categories
export const adminGetCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort('order');
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   POST /api/admin/categories
export const createCategory = async (req, res) => {
    try {
        const { name, description, icon, image, order } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên danh mục.' });
        }

        const slug = slugify(name);
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ success: false, message: `Danh mục "${name}" đã tồn tại.` });
        }

        const category = await Category.create({ name, slug, description, icon, image, order: order ?? 0 });
        res.status(201).json({ success: true, message: 'Tạo danh mục thành công!', data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   PUT /api/admin/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
        }

        if (req.body.name && req.body.name !== category.name) {
            const newSlug = slugify(req.body.name);
            const existing = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại.' });
            }
            req.body.slug = newSlug;
        }

        const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, message: 'Cập nhật danh mục thành công!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   DELETE /api/admin/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Danh mục không tồn tại.' });
        }

        await category.deleteOne();
        res.json({ success: true, message: `Đã xoá danh mục "${category.name}".` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────
// TOPPING
// ─────────────────────────────────────────

// @route   GET /api/admin/toppings
export const adminGetToppings = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) query.category = category;

        const toppings = await Topping.find(query).sort('name');
        res.json({ success: true, count: toppings.length, data: toppings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   POST /api/admin/toppings
export const createTopping = async (req, res) => {
    try {
        const { name, price, category, image } = req.body;

        if (!name || price === undefined || !category) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên, giá và loại topping.' });
        }

        const topping = await Topping.create({ name, price, category, image, isAvailable: true });
        res.status(201).json({ success: true, message: 'Tạo topping thành công!', data: topping });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   PUT /api/admin/toppings/:id
export const updateTopping = async (req, res) => {
    try {
        const topping = await Topping.findById(req.params.id);
        if (!topping) {
            return res.status(404).json({ success: false, message: 'Topping không tồn tại.' });
        }

        const updated = await Topping.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json({ success: true, message: 'Cập nhật topping thành công!', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @route   DELETE /api/admin/toppings/:id
export const deleteTopping = async (req, res) => {
    try {
        const topping = await Topping.findById(req.params.id);
        if (!topping) {
            return res.status(404).json({ success: false, message: 'Topping không tồn tại.' });
        }

        await topping.deleteOne();
        res.json({ success: true, message: `Đã xoá topping "${topping.name}".` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
