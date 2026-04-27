const User = require('../models/User');
const { sendCredentialsEmail } = require('../utils/notifier');

// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
const getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).sort({ createdAt: -1 }).select('-password');
        res.json({ success: true, count: doctors.length, data: doctors });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all staff (Receptionists and Accountants)
// @route   GET /api/admin/staff
// @access  Private/Admin
const getStaff = async (req, res) => {
    try {
        const staff = await User.find({ 
            role: { $in: ['receptionist', 'accountant'] } 
        }).sort({ createdAt: -1 }).select('-password');
        res.json({ success: true, count: staff.length, data: staff });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a new user (by Admin)
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, specialization, qualifications, experienceYears, consultationFee, phoneNumber } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name, email, password, role,
            specialization, qualifications, experienceYears, consultationFee, phoneNumber
        });

        // Send login credentials to the new user's email
        // password is the plain-text value from req.body (before bcrypt hash)
        sendCredentialsEmail(email, name, role, password).catch(err => {
            console.error('[ADMIN] Failed to send credentials email:', err.message);
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully. Login credentials have been sent to their email.',
            data: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a user (by Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.specialization = req.body.specialization || user.specialization;
            user.qualifications = req.body.qualifications || user.qualifications;
            
            if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
            if (req.body.experienceYears !== undefined) user.experienceYears = req.body.experienceYears;
            if (req.body.consultationFee !== undefined) user.consultationFee = req.body.consultationFee;
            
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            res.json({ success: true, data: updatedUser });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user by ID (by Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json({ success: true, data: user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { 
    getDoctors, 
    getStaff, 
    createUser, 
    updateUser, 
    getUserById 
};
