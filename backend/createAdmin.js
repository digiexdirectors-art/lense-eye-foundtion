const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });


const createAdmin = async () => {
    try {
        await connectDB();

        const email = 'admin@eyenova.com';
        const password = 'password123';


        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists, updating password...');
            user.password = password;
            await user.save();
        } else {
            console.log('Creating new admin user...');
            user = await User.create({
                name: 'Administrator',
                email: email,
                password: password,
                role: 'admin',
                isActive: true
            });
        }

        const docEmail = 'doctor@eyenova.com';
        const docPassword = 'doctor123';

        let doctor = await User.findOne({ email: docEmail });

        if (doctor) {
            console.log('Doctor already exists, updating password...');
            doctor.password = docPassword;
            await doctor.save();
        } else {
            console.log('Creating new doctor user...');
            doctor = await User.create({
                name: 'Dr. Test Doctor',
                email: docEmail,
                password: docPassword,
                role: 'doctor',
                isActive: true,
                specialization: 'Ophthalmologist'
            });
        }

        console.log('Admin user ready: admin@eyenova.com / admin123');
        console.log('Doctor user ready: doctor@eyenova.com / doctor123');
        process.exit();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

createAdmin();

