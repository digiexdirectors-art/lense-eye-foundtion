const Setting = require('../models/Setting');
const { getBranding } = require('../utils/branding');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        
        if (!settings) {
            // If no settings in DB, return values from .env (via branding helper)
            return res.json(getBranding());
        }
        
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private (Admin Only)
exports.updateSettings = async (req, res) => {
    try {
        const { 
            clinicName, tagline, phone, email, address, gstin, logoUrl,
            smtpHost, smtpPort, smtpUser, smtpPass, smsApiKey
        } = req.body;
        
        let settings = await Setting.findOne();
        
        if (settings) {
            // Update existing
            settings.clinicName = clinicName;
            settings.tagline = tagline;
            settings.phone = phone;
            settings.email = email;
            settings.address = address;
            settings.gstin = gstin;
            settings.logoUrl = logoUrl;
            // SMTP & SMS fields
            if (smtpHost !== undefined) settings.smtpHost = smtpHost;
            if (smtpPort !== undefined) settings.smtpPort = smtpPort;
            if (smtpUser !== undefined) settings.smtpUser = smtpUser;
            if (smtpPass !== undefined) settings.smtpPass = smtpPass;
            if (smsApiKey !== undefined) settings.smsApiKey = smsApiKey;
            await settings.save();
        } else {
            // Create new
            settings = await Setting.create({
                clinicName, tagline, phone, email, address, gstin, logoUrl,
                smtpHost, smtpPort, smtpUser, smtpPass, smsApiKey
            });
        }
        
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
