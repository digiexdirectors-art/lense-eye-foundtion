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
                mobile: dbSettings.mobile || "+91 9733035399",
                logoUrl: dbSettings.logoUrl || "",
                appointmentHours: dbSettings.appointmentHours || "Mon-Sat: 9:00AM - 6:00 PM"
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
        mobile: clean(process.env.CLINIC_MOBILE) || "+91 9733035399",
        logoUrl: clean(process.env.CLINIC_LOGO_URL) || "",
        appointmentHours: clean(process.env.CLINIC_APPOINTMENT_HOURS) || "Mon-Sat: 9:00AM - 6:00 PM"
    };
};

module.exports = { getBranding };
