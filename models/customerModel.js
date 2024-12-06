const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerFirstName: {
        type: String,
        required: true, 
    },
    customerLastName: {
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
        required: true, 
        match: /^\+?\d{7,15}$/, // Validates international phone number format
    },
    country: {
        type: String,
        required: true,
    },
    dob: {
        type: Date, // Stores the date of birth as a date
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically sets the creation date
    }

}, { timestamps: true });

const customerModel = mongoose.model("customers", customerSchema);

module.exports = customerModel;