const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
		},
		phoneNumber: {
			type: String,
		},
		password: {
			type: String,
			required: true,
		},
		
		role: {
            type: String,
            required: true,
            enum: ["Admin"], // Only these two roles
            default: "Admin", // Default to "Admin" if no role is provided
        },
		
		verificationToken: {
			type: String,
		},
		isEmailVerified: {
			type: Boolean,
			default: false,
		},
		resetPasswordOtp: {
			type: String, // Store OTP as a string for flexibility
			default: null,
		},
		otpExpiration: {
			type: Date, // To track when the OTP will expire
			default: null,
		},
	},
	{ timestamps: true }
);

const adminModel = mongoose.model('admins', adminSchema);

module.exports = adminModel;
