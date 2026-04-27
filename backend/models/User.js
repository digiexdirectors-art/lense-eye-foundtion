const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'doctor', 'receptionist', 'accountant'],
            default: 'doctor',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        specialization: { type: String, default: '' },
        qualifications: { type: String, default: '' },
        experienceYears: { type: Number, default: 0 },
        consultationFee: { type: Number, default: 0 },
        phoneNumber: { type: String, default: '' },
        registrationNumber: { type: String, default: '' },
    },
    {
        // Mongoose automatically manages createdAt and updatedAt fields with this option
        timestamps: true, 
    }
);

// Method to verify if a given password matches the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash the password before saving a user
userSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});



const User = mongoose.model('User', userSchema);

module.exports = User;
