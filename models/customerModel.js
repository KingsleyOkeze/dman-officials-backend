const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
        unique: true, 
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Validates proper email format
    },
    phoneNumber: {
        type: String,
        // type: String,
        // required: true, 
        // match: /^\+?\d{7,15}$/, // Validates international phone number format
    },
    password: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true,
    },
    dob: {
        type: Date, // Stores the date of birth as a date
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

}, { timestamps: true });

const customerModel = mongoose.model("customers", customerSchema);

module.exports = customerModel;