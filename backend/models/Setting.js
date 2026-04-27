const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    clinicName: { type: String, default: 'EYE NOVA' },
    tagline: { type: String, default: 'PREMIUM EYE CARE & OPTICALS' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    // SMTP Email Configuration
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpUser: { type: String, default: '' },
    smtpPass: { type: String, default: '' },
    // SMS Configuration (Fast2SMS)
    smsApiKey: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
