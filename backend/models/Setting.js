const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    clinicName: { type: String, default: 'EYE NOVA' },
    tagline: { type: String, default: 'PREMIUM EYE CARE & OPTICALS' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    gstin: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
