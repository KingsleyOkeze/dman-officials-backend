const nodemailer = require('nodemailer');
require('dotenv').config();

let mailTransporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.ADMIN_EMAIL,
		pass: process.env.ADMIN_GMAIL_PASSCODE
	},
    tls: {
      rejectUnauthorized: false
    }
});

const emailingFunction = async (sendTo, emailSubject, emailHtml) => {
    try {
        let mailDetails = {
            from: process.env.ADMIN_EMAIL,
            to: sendTo,
            subject: emailSubject,
            html: emailHtml
        };

        const info = await mailTransporter.sendMail(mailDetails);
        console.log('Email sent successfully:', info.response);
        return { success: true, message: 'Email sent successfully' };

    } catch (error) {
        console.error('Error Occurs', error);
        return { success: false, message: 'Failed to send email', error };
    }
};



module.exports = emailingFunction;