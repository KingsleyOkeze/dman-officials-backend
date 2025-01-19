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
		password: {
			type: String,
			required: true,
		},
		
		role: {
            type: String,
            required: true,
            enum: ["admin"], // Only these two roles
            default: "admin", // Default to "admin" if no role is provided
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

const adminModel = mongoose.model('admin', adminSchema);

module.exports = adminModel;
