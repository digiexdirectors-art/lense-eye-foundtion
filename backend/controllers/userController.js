const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (Needs to be logged in with Token)
const updateUserProfile = async (req, res) => {
    try {
        // req.user is populated by the 'protect' middleware!
        const user = await User.findById(req.user._id);

        if (user) {
            // Update basic fields if they are provided
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            
            // If they provided a new password, the User Schema will automatically hash it
            if (req.body.password) {
                user.password = req.body.password;
            }

            // Doctor specific updates (Only update these if the user is a doctor)
            if (user.role === 'doctor') {
                user.specialization = req.body.specialization || user.specialization;
                user.qualifications = req.body.qualifications || user.qualifications;
                
                // We use !== undefined because values could be 0, which is falsy
                if (req.body.experienceYears !== undefined) {
                    user.experienceYears = req.body.experienceYears;
                }
                if (req.body.consultationFee !== undefined) {
                    user.consultationFee = req.body.consultationFee;
                }
            }

            const updatedUser = await user.save();

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    _id: updatedUser._id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    phoneNumber: updatedUser.phoneNumber,
                    specialization: updatedUser.specialization,
                    qualifications: updatedUser.qualifications,
                    experienceYears: updatedUser.experienceYears,
                    consultationFee: updatedUser.consultationFee
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user profile (Admin or Doctor)
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    specialization: user.specialization,
                    qualifications: user.qualifications,
                    experienceYears: user.experienceYears,
                    consultationFee: user.consultationFee,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getUserProfile, updateUserProfile };
