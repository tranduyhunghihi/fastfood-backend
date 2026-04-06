import Ingredient from '../models/Ingredient.js';
import StockImport from '../models/StockImport.js';

// ── INGREDIENT CRUD ───────────────────────────────────────

export const getIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort('name');
        res.json({ success: true, data: ingredients });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createIngredient = async (req, res) => {
    try {
        const { name, unit, quantity, minQuantity, costPerUnit, expiryDate, category, description } = req.body;
        if (!name || !unit) return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và đơn vị.' });

        const ingredient = await Ingredient.create({
            name,
            unit,
            quantity: quantity || 0,
            minQuantity: minQuantity || 0,
            costPerUnit: costPerUnit || 0,
            expiryDate: expiryDate || null,
            category: category || 'other',
            description: description || '',
        });
        res.status(201).json({ success: true, message: 'Thêm nguyên liệu thành công!', data: ingredient });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const updateIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!ingredient) return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu.' });
        res.json({ success: true, message: 'Cập nhật thành công!', data: ingredient });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const deleteIngredient = async (req, res) => {
    try {
        await Ingredient.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa nguyên liệu.' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// ── STOCK IMPORT ──────────────────────────────────────────

export const getStockImports = async (req, res) => {
    try {
        const imports = await StockImport.find()
            .populate('items.ingredient', 'name unit')
            .populate('importedBy', 'name')
            .sort('-createdAt')
            .limit(50);
        res.json({ success: true, data: imports });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

export const createStockImport = async (req, res) => {
    try {
        const { items, supplier, note } = req.body;
        if (!items?.length)
            return res.status(400).json({ success: false, message: 'Vui lòng thêm ít nhất 1 nguyên liệu.' });

        // Tính tổng chi phí
        let totalCost = 0;
        const importItems = [];

        for (const item of items) {
            const ingredient = await Ingredient.findById(item.ingredient);
            if (!ingredient) continue;

            const subtotal = item.quantity * item.costPerUnit;
            totalCost += subtotal;

            importItems.push({
                ingredient: item.ingredient,
                ingredientName: ingredient.name,
                quantity: item.quantity,
                unit: ingredient.unit,
                costPerUnit: item.costPerUnit,
                subtotal,
                expiryDate: item.expiryDate || null,
            });

            // Cập nhật tồn kho và hạn sử dụng
            await Ingredient.findByIdAndUpdate(item.ingredient, {
                $inc: { quantity: item.quantity },
                costPerUnit: item.costPerUnit,
                ...(item.expiryDate ? { expiryDate: item.expiryDate } : {}),
            });
        }

        // Tạo mã phiếu nhập
        const date = new Date();
        const importCode = `IMP${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 9000 + 1000)}`;

        const stockImport = await StockImport.create({
            importCode,
            items: importItems,
            totalCost,
            supplier: supplier || '',
            note: note || '',
            importedBy: req.user._id,
        });

        res.status(201).json({ success: true, message: 'Nhập kho thành công!', data: stockImport });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Tổng chi phí nhập kho (dùng cho tính lợi nhuận)
export const getTotalImportCost = async (req, res) => {
    try {
        const { from, to } = req.query;
        const match = {};
        if (from || to) {
            match.createdAt = {};
            if (from) match.createdAt.$gte = new Date(from);
            if (to) match.createdAt.$lte = new Date(to);
        }

        const result = await StockImport.aggregate([
            { $match: match },
            { $group: { _id: null, total: { $sum: '$totalCost' } } },
        ]);

        res.json({ success: true, totalCost: result[0]?.total || 0 });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Cảnh báo nguyên liệu sắp hết / hết hạn
export const getIngredientAlerts = async (req, res) => {
    try {
        const now = new Date();
        const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        const ingredients = await Ingredient.find();

        const lowStock = ingredients.filter((i) => i.quantity <= i.minQuantity && i.minQuantity > 0);
        const expiringSoon = ingredients.filter((i) => i.expiryDate && i.expiryDate > now && i.expiryDate <= in3Days);
        const expired = ingredients.filter((i) => i.expiryDate && i.expiryDate < now);

        res.json({ success: true, data: { lowStock, expiringSoon, expired } });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
