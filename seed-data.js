import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';
import Topping from './src/models/Topping.js';
import Product from './src/models/Product.js';
import Combo from './src/models/Combo.js';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Xóa dữ liệu cũ
        await Category.deleteMany();
        await Topping.deleteMany();
        await Product.deleteMany();
        await Combo.deleteMany();

        // Tạo categories
        const categories = await Category.create([
            {
                name: 'Pizza',
                slug: 'pizza',
                description: 'Pizza thơm ngon đế mỏng',
                image: 'pizza.jpg',
                order: 1,
            },
            {
                name: 'Mì Ý',
                slug: 'pasta',
                description: 'Mì Ý sốt bò bằm',
                image: 'pasta.jpg',
                order: 2,
            },
            {
                name: 'Khai vị',
                slug: 'appetizer',
                description: 'Món khai vị hấp dẫn',
                image: 'appetizer.jpg',
                order: 3,
            },
        ]);

        // Tạo toppings
        const toppings = await Topping.create([
            {
                name: 'Phô mai bò cười',
                price: 25000,
                category: 'cheese',
                image: 'cheese.jpg',
            },
            {
                name: 'Pepperoni',
                price: 30000,
                category: 'meat',
                image: 'pepperoni.jpg',
            },
            {
                name: 'Nấm',
                price: 15000,
                category: 'vegetable',
                image: 'mushroom.jpg',
            },
            {
                name: 'Ớt chuông',
                price: 10000,
                category: 'vegetable',
                image: 'bellpepper.jpg',
            },
        ]);

        // Tạo sản phẩm
        const pizza = await Product.create({
            name: 'Pizza Hải Sản Pesto',
            slug: 'pizza-hai-san-pesto',
            description: 'Pizza sốt pesto với tôm, mực, ngao',
            category: categories[0]._id,
            basePrice: 189000,
            sizes: [
                { size: 'small', price: 189000 },
                { size: 'medium', price: 259000 },
                { size: 'large', price: 329000 },
            ],
            crusts: [
                { type: 'traditional', name: 'Đế truyền thống', additionalPrice: 0 },
                { type: 'thin', name: 'Đế mỏng giòn', additionalPrice: 0 },
                { type: 'cheesy', name: 'Đế phô mai', additionalPrice: 30000 },
            ],
            availableToppings: [
                { topping: toppings[0]._id, additionalPrice: 25000 },
                { topping: toppings[1]._id, additionalPrice: 30000 },
                { topping: toppings[2]._id, additionalPrice: 15000 },
            ],
            images: ['pizza-hai-san.jpg'],
            isAvailable: true,
        });

        // Tạo combo
        await Combo.create({
            name: 'Combo Gia Đình',
            slug: 'combo-gia-dinh',
            description: '1 pizza lớn + 2 nước + 1 khai vị',
            image: 'combo-gia-dinh.jpg',
            items: [
                {
                    product: pizza._id,
                    quantity: 1,
                    defaultSize: 'large',
                    allowSizeChange: true,
                    includedToppings: [{ topping: toppings[0]._id, quantity: 1 }],
                },
                {
                    product: (
                        await Product.create({
                            name: 'Cánh gà chiên',
                            slug: 'canh-ga-chien',
                            category: categories[2]._id,
                            basePrice: 89000,
                            isAvailable: true,
                        })
                    )._id,
                    quantity: 1,
                },
            ],
            price: 399000,
            originalPrice: 459000,
            comboType: 'family',
            isAvailable: true,
        });

        console.log('✅ Seed data thành công!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi seed data:', error);
        process.exit(1);
    }
};

seedData();
