const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Setting = require('./models/Setting');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });


const seedAdmin = async () => {
    try {
        console.log('Connecting to MongoDB at:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Checking for admin user...');
        const adminExists = await User.findOne({ email: 'admin@eyenova.com' });
        
        if (adminExists) {
            console.log('Admin user exists. Updating password...');
            adminExists.password = 'password123';
            await adminExists.save();
        } else {
            console.log('Creating default admin...');
            await User.create({
                name: 'System Admin',
                email: 'admin@eyenova.com',
                password: 'password123',
                role: 'admin',
                isActive: true
            });
        }
        
        console.log('Checking for doctor user...');
        const doctorExists = await User.findOne({ email: 'doctor@eyenova.com' });
        if (doctorExists) {
            console.log('Doctor exists. Updating password...');
            doctorExists.password = 'password123';
            await doctorExists.save();
        } else {
            console.log('Creating default doctor...');
            await User.create({
                name: 'Dr. Test Doctor',
                email: 'doctor@eyenova.com',
                password: 'password123',
                role: 'doctor',
                isActive: true,
                specialization: 'Ophthalmologist'
            });
        }
        
        console.log('Checking for clinic settings...');
        const settingsExists = await Setting.findOne();
        if (!settingsExists) {
            console.log('Creating default clinic settings...');
            await Setting.create({
                clinicName: process.env.CLINIC_NAME || 'THE LENS EYE FOUNDATION',
                tagline: process.env.CLINIC_TAGLINE || 'PREMIUM EYE CARE & OPTICALS',
                phone: process.env.CLINIC_PHONE || '+91 98765 43210',
                email: process.env.CLINIC_EMAIL || 'billing@eyenova.com',
                address: process.env.CLINIC_ADDRESS || '123 Visionary Way, Medical Village, New Delhi',
                gstin: process.env.CLINIC_GSTIN || '07AAAAA0000A1Z5',
                mobile: process.env.CLINIC_MOBILE || '+91 9733035399',
                logoUrl: process.env.CLINIC_LOGO_URL || '',
                appointmentHours: 'Mon-Sat: 9:00AM - 6:00 PM'
            });
        } else {
            console.log('Clinic settings exist. Updating from .env...');
            settingsExists.clinicName = process.env.CLINIC_NAME || settingsExists.clinicName;
            settingsExists.tagline = process.env.CLINIC_TAGLINE || settingsExists.tagline;
            settingsExists.phone = process.env.CLINIC_PHONE || settingsExists.phone;
            settingsExists.email = process.env.CLINIC_EMAIL || settingsExists.email;
            settingsExists.address = process.env.CLINIC_ADDRESS || settingsExists.address;
            settingsExists.gstin = process.env.CLINIC_GSTIN || settingsExists.gstin;
            settingsExists.mobile = process.env.CLINIC_MOBILE || settingsExists.mobile || '+91 9733035399';
            await settingsExists.save();
        }

        console.log('Seed successful! Try logging in with:');
        console.log('Admin: admin@eyenova.com / password123');
        console.log('Doctor: doctor@eyenova.com / password123');
        
        process.exit();
    } catch (error) {
        console.error('CRITICAL SEED ERROR:', error);
        process.exit(1);
    }
};


seedAdmin();
