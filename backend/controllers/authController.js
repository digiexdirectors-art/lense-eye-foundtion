const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Helper
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            if (user.isActive === false) {
                return res.status(401).json({ message: 'User account is inactive' });
            }

            res.json({
                message: 'Login successful',
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    specialization: user.specialization,
                    qualifications: user.qualifications,
                    experienceYears: user.experienceYears,
                    consultationFee: user.consultationFee,
                    phoneNumber: user.phoneNumber,
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Register a new user (admin or doctor) - Used for initial data insertion
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, specialization, qualifications, experienceYears, consultationFee, phoneNumber } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'doctor',
            specialization,
            qualifications,
            experienceYears,
            consultationFee,
            phoneNumber
        });

        if (user) {
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    specialization: user.specialization,
                    qualifications: user.qualifications,
                    experienceYears: user.experienceYears,
                    consultationFee: user.consultationFee,
                    phoneNumber: user.phoneNumber,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { loginUser, registerUser };
