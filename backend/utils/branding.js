const Setting = require('../models/Setting');

/**
 * Helper to retrieve clinic branding
 * Prioritizes Database settings, falls back to .env
 */
const getBranding = async () => {
    const clean = (val) => val ? val.toString().replace(/['"]+/g, '').trim() : '';
    
    try {
        const dbSettings = await Setting.findOne();
        if (dbSettings) {
            return {
                clinicName: dbSettings.clinicName || "EYE NOVA",
                tagline: dbSettings.tagline || "PREMIUM EYE CARE & OPTICALS",
                address: dbSettings.address || "",
                phone: dbSettings.phone || "",
                email: dbSettings.email || "",
                gstin: dbSettings.gstin || "",
                logoUrl: dbSettings.logoUrl || ""
            };
        }
    } catch (err) {
        console.error("DB Error in getBranding, falling back to ENV:", err.message);
    }

    // Fallback to .env
    return {
        clinicName: clean(process.env.CLINIC_NAME) || "EYE NOVA",
        tagline: clean(process.env.CLINIC_TAGLINE) || "PREMIUM EYE CARE & OPTICALS",
        address: clean(process.env.CLINIC_ADDRESS) || "",
        phone: clean(process.env.CLINIC_PHONE) || "",
        email: clean(process.env.CLINIC_EMAIL) || "",
        gstin: clean(process.env.CLINIC_GSTIN) || "",
        logoUrl: clean(process.env.CLINIC_LOGO_URL) || ""
    };
};

module.exports = { getBranding };
