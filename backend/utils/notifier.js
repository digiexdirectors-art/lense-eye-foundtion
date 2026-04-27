const nodemailer = require('nodemailer');
const axios = require('axios');
const Setting = require('../models/Setting');

/**
 * Get notification configuration (SMTP + SMS)
 * Priority: Database settings > .env variables
 */
const getNotificationConfig = async () => {
    try {
        const dbSettings = await Setting.findOne();
        if (dbSettings) {
            return {
                smtpHost: dbSettings.smtpHost || process.env.SMTP_HOST || '',
                smtpPort: dbSettings.smtpPort || process.env.SMTP_PORT || 587,
                smtpUser: dbSettings.smtpUser || process.env.SMTP_USER || '',
                smtpPass: dbSettings.smtpPass || process.env.SMTP_PASS || '',
                smsApiKey: dbSettings.smsApiKey || process.env.FAST2SMS_API_KEY || '',
                clinicName: dbSettings.clinicName || process.env.CLINIC_NAME || 'EYE NOVA',
                clinicPhone: dbSettings.phone || process.env.CLINIC_PHONE || '',
                clinicEmail: dbSettings.email || process.env.CLINIC_EMAIL || ''
            };
        }
    } catch (err) {
        console.error("[NOTIFIER] DB config fetch error, falling back to ENV:", err.message);
    }

    return {
        smtpHost: process.env.SMTP_HOST || '',
        smtpPort: process.env.SMTP_PORT || 587,
        smtpUser: process.env.SMTP_USER || '',
        smtpPass: process.env.SMTP_PASS || '',
        smsApiKey: process.env.FAST2SMS_API_KEY || '',
        clinicName: process.env.CLINIC_NAME || 'EYE NOVA',
        clinicPhone: process.env.CLINIC_PHONE || '',
        clinicEmail: process.env.CLINIC_EMAIL || ''
    };
};

/**
 * Send a general email notification
 */
const sendEmailNotification = async (recipientEmail, subject, text) => {
    console.log(`\n[EMAIL DISPATCH SYSTEM]`);
    console.log(`To: ${recipientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}\n`);

    const config = await getNotificationConfig();

    if (config.smtpHost && config.smtpUser && config.smtpPass) {
        try {
            let transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: parseInt(config.smtpPort) === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            });

            let info = await transporter.sendMail({
                from: `"${config.clinicName}" <${config.smtpUser}>`,
                to: recipientEmail,
                subject: subject,
                text: text,
            });
            console.log("[EMAIL] Dispatched successfully: %s", info.messageId);
            return true;
        } catch (err) {
            console.error("[EMAIL] SMTP Connection Error:", err.message);
            return false;
        }
    } else {
        console.log("[EMAIL] SMTP not configured — email logged to console only.");
        return false;
    }
};

/**
 * Send login credentials email to new doctor/staff
 * Sends a branded HTML email with their login ID and password
 */
const sendCredentialsEmail = async (recipientEmail, recipientName, role, password) => {
    console.log(`\n[CREDENTIALS EMAIL DISPATCH]`);
    console.log(`To: ${recipientEmail} (${recipientName})`);
    console.log(`Role: ${role}`);
    console.log(`Password: [REDACTED IN LOGS]\n`);

    const config = await getNotificationConfig();

    const subject = `Welcome to ${config.clinicName} — Your Login Credentials`;

    const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${config.clinicName}</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Staff Account Created</p>
        </div>
        
        <div style="padding: 30px;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0;">
                Hello <strong>${recipientName}</strong>,
            </p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Your account has been created on the <strong>${config.clinicName}</strong> clinic management system. 
                You can now log in using the credentials below:
            </p>
            
            <div style="background: white; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; width: 120px;">Role</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; text-transform: capitalize;">${role}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">Login Email</td>
                        <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${recipientEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">Password</td>
                        <td style="padding: 8px 0; color: #1e40af; font-size: 16px; font-weight: 700; letter-spacing: 1px;">${password}</td>
                    </tr>
                </table>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                    <strong>⚠ Security Notice:</strong> Please change your password after your first login. 
                    Do not share your credentials with anyone.
                </p>
            </div>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions, please contact the admin team.
            </p>
        </div>
        
        <div style="background: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                ${config.clinicName} ${config.clinicPhone ? '| ' + config.clinicPhone : ''} ${config.clinicEmail ? '| ' + config.clinicEmail : ''}
            </p>
            <p style="color: #cbd5e1; font-size: 11px; margin: 8px 0 0 0;">
                This is an automated email. Please do not reply.
            </p>
        </div>
    </div>`;

    const textBody = `Welcome to ${config.clinicName}!\n\nHello ${recipientName},\n\nYour ${role} account has been created.\n\nLogin Email: ${recipientEmail}\nPassword: ${password}\n\nPlease change your password after your first login.\n\nRegards,\n${config.clinicName} Admin`;

    if (config.smtpHost && config.smtpUser && config.smtpPass) {
        try {
            let transporter = nodemailer.createTransport({
                host: config.smtpHost,
                port: config.smtpPort,
                secure: parseInt(config.smtpPort) === 465,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPass,
                },
            });

            let info = await transporter.sendMail({
                from: `"${config.clinicName}" <${config.smtpUser}>`,
                to: recipientEmail,
                subject: subject,
                text: textBody,
                html: htmlBody,
            });
            console.log("[CREDENTIALS EMAIL] Dispatched successfully: %s", info.messageId);
            return true;
        } catch (err) {
            console.error("[CREDENTIALS EMAIL] SMTP Error:", err.message);
            return false;
        }
    } else {
        console.log("[CREDENTIALS EMAIL] SMTP not configured — credentials logged to console only.");
        console.log(`  Login: ${recipientEmail} | Password: ${password}`);
        return false;
    }
};

/**
 * Send SMS notification via Fast2SMS (India) 
 * Falls back to console logging when API key is not configured
 */
const sendSmsNotification = async (phoneNumber, message) => {
    console.log(`\n[SMS DISPATCH SYSTEM]`);
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Text Payload: ${message}\n`);

    // Clean phone number - remove country code prefix and spaces for Fast2SMS
    let cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    if (cleanPhone.startsWith('+91')) cleanPhone = cleanPhone.slice(3);
    if (cleanPhone.startsWith('91') && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(2);

    const config = await getNotificationConfig();

    if (config.smsApiKey) {
        try {
            const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                route: 'q',
                message: message,
                language: 'english',
                flash: 0,
                numbers: cleanPhone
            }, {
                headers: {
                    'authorization': config.smsApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.return) {
                console.log("[SMS] Fast2SMS dispatched successfully!");
                return true;
            } else {
                console.error("[SMS] Fast2SMS response error:", response.data?.message || 'Unknown error');
                return false;
            }
        } catch (err) {
            console.error("[SMS] Fast2SMS API Error:", err.response?.data?.message || err.message);
            return false;
        }
    } else {
        console.log("[SMS] Fast2SMS API key not configured — SMS logged to console only.");
        return false;
    }

    // Twilio fallback (uncomment if using Twilio instead of Fast2SMS):
    /*
    if (process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
        const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
        try {
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber
            });
            console.log('[SMS] Twilio dispatched!');
        } catch(err) {
            console.error('[SMS] Twilio Error:', err);
        }
    }
    */
};

module.exports = { sendEmailNotification, sendSmsNotification, sendCredentialsEmail };
