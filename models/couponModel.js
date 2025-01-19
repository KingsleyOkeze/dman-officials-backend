const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true, 
    },
    couponCode: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        required: true, 
        enum: ["active", "inactive", "expired"], // Restricts to these statuses
    },
    category: {
        type: String
    },
    subCategory: {
        type: String
    },
    discountType: {
        type: String,
        required: true,
        enum: ["percentage off", "flat discount"]
    },
    discountAmount: {
        type: Number,
        required: true
    },
    minimumPurchaseAmount: {
        type: Number,
        default: 0,
    },
    expirationDate: {
        type: Date,
        required: true
    },
    usageLimit: { // Maximum times a coupon can be used
        type: Number,
        default: 15,
    },
    timesUsed: { // Track how many times this coupon has been used
        type: Number,
        default: 0,
    },
    usersUsed: [{ // Track which users have used this coupon
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customers',
    }],
    product: {
        type: String
    },

}, { timestamps: true });

const couponModel = mongoose.model("coupons", couponSchema);

module.exports = couponModel;