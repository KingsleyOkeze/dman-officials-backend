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
        default: 'pending', //Default payment status
        required: true
    },
    paymentReference: {
        type: String,
    },
    orderStatus: {
        type: String,
        enum: [
            'Pending',
            'Payment Successful',
            'Order Confirmed',
            'Processing',
            'Shipped',
            'In Transit',
            'Out for Delivery',
            'Delivered',
            'Cancelled',
            'Refunded',
            'Return Initiated',
            'Return Completed'
        ],
        default: 'Pending'
    },
    createdAt: {
        type: Date
    },

}, { timestamps: true });

const orderModel = mongoose.model("orders", orderSchema);

module.exports = orderModel;