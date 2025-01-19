const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productImageUrl: {
        type: [String], // Array of strings (URLs)
        required: true // Ensure at least one image is provided
    },
    productName: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productCategory: {
        type: String,
        required: true
    },
    productSubCategory: {
        type: String,
        required: true
    },
    productSize: {
        type: [String],
        required: true
    },
    productColor: {
        type: [String], // Array of strings (e.g., color names or hex codes)
        required: true
    },    
    productBrand: {
        type: String,
        required: true
    },
    productPrice: {
        type: Number,
        required: true
    },
    productOfferPrice: {
        type: Number,
        required: true
    },    
    productQuantity: {
        type: Number,
        required: true
    },  
    addedTimer: { 
        type: Boolean, 
        default: false 
    },
    timerExpires: {
        type: Boolean,
        default: false
    },
    timerExpiryDate: {
        type: Date,
    },

    productStatus: {
        type: String,
        enum: [
            'available', 
            'limited stock',
            'out of stock', 
            'discontinued'
        ], // Define the possible statuses
        default: 'available' // Default status when a product is created
    }

}, { timestamps: true });

const productModel = mongoose.model("products", productSchema);

module.exports = productModel;