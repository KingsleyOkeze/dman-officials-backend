require('dotenv').config();
const nodemailer = require("nodemailer");

const emailingFunction = (sendTo, emailSubject, emailHtml) => {

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
	
	let mailDetails = {
		from: process.env.ADMIN_EMAIL,
		to: sendTo,
		subject: emailSubject,
		html: emailHtml
	};

	
	mailTransporter.sendMail(mailDetails, function(err, data) {
		if(err) {
			console.log('Error Occurs', err);
		} else {
			console.log('Email sent successfully');
		}
	});

};



module.exports = emailingFunction;