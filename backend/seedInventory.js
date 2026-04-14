const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Inventory = require('./models/Inventory');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedInventory = async () => {
    try {
        await connectDB();

        const items = [
            {
                name: 'Ray-Ban Classic Aviator',
                sku: 'RB-AV-001',
                category: 'Frame',
                quantity: 10,
                unitPrice: 5500,
                purchasePrice: 3500,
                gstPercent: 18,
                description: 'Classic gold aviator frames'
            },
            {
                name: 'Crizal Blue Cut Lens',
                sku: 'CRZ-BC-01',
                category: 'Lens',
                quantity: 20,
                unitPrice: 2500,
                purchasePrice: 1200,
                gstPercent: 12,
                description: 'Premium blue light protection lenses'
            },
            {
                name: 'Johnson & Johnson Contact Lens',
                sku: 'JJ-MOIST-01',
                category: 'Contact Lens',
                quantity: 15,
                unitPrice: 1500,
                purchasePrice: 800,
                gstPercent: 12,
                description: 'Daily disposable contact lenses'
            }
        ];

        for (const item of items) {
            await Inventory.findOneAndUpdate(
                { sku: item.sku },
                item,
                { upsert: true, new: true }
            );
        }

        console.log('Sample inventory seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding inventory:', error.message);
        process.exit(1);
    }
};

seedInventory();
