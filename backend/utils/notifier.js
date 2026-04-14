const nodemailer = require('nodemailer');

const sendEmailNotification = async (recipientEmail, subject, text) => {
  console.log(`\n[EMAIL DISPATCH SYSTEM STUB]`);
  console.log(`To: ${recipientEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}\n`);

  // In production, when .env keys are added, this logic automatically activates:
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        let transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const clinicName = process.env.CLINIC_NAME || "EYE NOVA";
        let info = await transporter.sendMail({
          from: `"${clinicName}" <${process.env.SMTP_USER}>`, 
          to: recipientEmail, 
          subject: subject, 
          text: text, 
        });
        console.log("Official Email dispatched successfully: %s", info.messageId);
      } catch (err) {
        console.error("Nodemailer SMTP Connection Error: ", err);
      }
  }
};

const sendSmsNotification = async (phoneNumber, message) => {
  console.log(`\n[SMS DISPATCH SYSTEM STUB]`);
  console.log(`Phone: ${phoneNumber}`);
  console.log(`Text Payload: ${message}\n`);
  
  // Example Twilio integration template ready for future keys:
  /*
  if(process.env.TWILIO_SID && process.env.TWILIO_AUTH) {
    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    try {
      await client.messages.create({
        body: message, 
        from: process.env.TWILIO_PHONE_NUMBER, 
        to: phoneNumber
      });
      console.log('Official SMS dispatched!');
    } catch(err) {
      console.error('Twilio Error:', err)
    }
  }
  */
};

module.exports = { sendEmailNotification, sendSmsNotification };
