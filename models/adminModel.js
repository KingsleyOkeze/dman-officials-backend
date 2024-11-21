const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
	{
		first_name: {
			type: String,
		},
		last_name: {
			type: String,
		},
		email: {
			type: String,
		},
		password: {
			type: String,
			required: true,
		},
		
		role: {
            type: String,
            required: true,
            enum: ["admin", "customer"], // Only these two roles
            default: "customer", // Default to "customer" if no role is provided
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
