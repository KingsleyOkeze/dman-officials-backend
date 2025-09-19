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
        required: true,
        enum: ['MensWear', 'Accessories', 'FootWear'] 
    },
    productSubCategory: {
        type: String,
        required: true,
        enum: ['TShirt', 'Hoodie', 'SweatShirt', 'Bullup500'] 
    },
    productSize: {
        type: [String],
        required: true,
        enum: ['S', 'M', 'L', 'XL']
    },
    productColor: {
        type: [String], // Array of strings (e.g., color names or hex codes)
        required: true,
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
    productAddedTimer: {
        hrs: { type: Number, default: 0 },
        min: { type: Number, default: 0 },
        sec: { type: Number, default: 0 }
    },
    timerExpired: {
        type: Boolean,
        default: false
    },
    timerExpiryDate: {
        type: Date,
    },
    productStatus: {
        type: String,
        enum: [
            'Available', 
            'LimitedStock',
            'OutOfStock', 
            'Discontinued',
            'SaleEnded'
        ], // Define the possible statuses
        default: 'Available' // Default status when a product is created
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },

}, { timestamps: true });


// Indexing Strategy:
// Text Search Index (for productName, category, subCategory)
productSchema.index({
    productName: 'text',
    productCategory: 'text',
    productSubCategory: 'text'
}, {
    weights: {
        productName: 3,
        productCategory: 2,
        productSubCategory: 2,
        productDescription: 1
    },
    name: 'product_search_index'
});

// Indexes for category browsing
productSchema.index({ 
    productCategory: 1,
    productSubCategory: 1,
    createdAt: -1 
});

// Index for filter by status
productSchema.index({ 
  isDeleted: 1,
  productStatus: 1 
});

// Index for general queries
productSchema.index({ 
    isDeleted: 1,
    createdAt: -1 
});

const productModel = mongoose.model("products", productSchema);

module.exports = productModel;

