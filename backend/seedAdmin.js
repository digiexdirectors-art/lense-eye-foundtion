const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });


const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Checking for admin user...');
        const adminExists = await User.findOne({ email: 'admin@eyenova.com' });
        
        if (adminExists) {
            console.log('Admin user exists. Updating password...');
            adminExists.password = 'admin123';
            await adminExists.save();
        } else {
            console.log('Creating default admin...');
            await User.create({
                name: 'System Admin',
                email: 'admin@eyenova.com',
                password: 'admin123',
                role: 'admin',
                isActive: true
            });
        }
        
        console.log('Checking for doctor user...');
        const doctorExists = await User.findOne({ email: 'doctor@eyenova.com' });
        if (doctorExists) {
            console.log('Doctor exists. Updating password...');
            doctorExists.password = 'doctor123';
            await doctorExists.save();
        } else {
            console.log('Creating default doctor...');
            await User.create({
                name: 'Dr. Test Doctor',
                email: 'doctor@eyenova.com',
                password: 'doctor123',
                role: 'doctor',
                isActive: true,
                specialization: 'Ophthalmologist'
            });
        }

        console.log('Seed successful! Try logging in with:');
        console.log('Admin: admin@eyenova.com / admin123');
        console.log('Doctor: doctor@eyenova.com / doctor123');
        
        process.exit();
    } catch (error) {
        console.error('CRITICAL SEED ERROR:', error);
        process.exit(1);
    }
};


seedAdmin();
