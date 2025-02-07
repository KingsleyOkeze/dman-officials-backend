const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers',
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: {
        type: String,
    },
    company: {
        type: String,
    },
    orderTotalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: '₦' //Default currency
    },
    paymentStatus: {
        type: String,
        default: 'Pending', //Default payment status
        required: true
    },
    paymentReference: {
        type: String,
    },
    paymentMethod: {
        type: String, // e.g., 'card', 'bank', 'ussd'
    },
    amountCustomerPaid: {
        type: Number,
    },
    orderStatus: {
        type: String,
        enum: [
            'Pending',
            'Processing',
            'Shipped',
            'Delivered',
            'Cancelled',
        ],
        default: 'Pending'
    },

    orderedItems: [{
        productRef: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'products' // Reference to products collection
        },
        quantity: { 
            type: Number, 
            required: true 
        },
        price: { 
            type: Number, 
            required: true // Store current price for future reference
        }
    }],

    appliedCouponCode: { // field for coupon code
        type: String,
    },
    
    discountAmountApplied: { // field for discount amount from coupon
        type: Number,
        default: 0 // Default to 0 if no discount is applied
    }

}, { timestamps: true });

const orderModel = mongoose.model("orders", orderSchema);

module.exports = orderModel;