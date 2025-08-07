const { Resend } = require('resend');
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

const emailingFunction = async (sendTo, emailSubject, emailHtml) => {
    try {
        await resend.emails.send({
            from: process.env.ADMIN_EMAIL,
            to: sendTo,
            subject: emailSubject,
            html: emailHtml,
        });

        console.log('Email sent successfully');
    } catch (err) {
        console.error("Error sending email:", err);
    }
};

module.exports = emailingFunction;
