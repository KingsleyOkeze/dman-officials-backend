const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true, 
    },
    couponCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true, 
        enum: ["Active", "Inactive", "Expired"], // Restricts to these statuses
    },
    category: {
        type: String
    },
    subCategory: {
        type: String
    },
    discountType: {
        type: String,
        required: true
    },
    discountAmount: {
        type: String,
        required: true
    },
    minimumPurchaseAmount: {
        type: Number
    },
    expirationDate: {
        type: String,
        required: true
    },
    // usageLimit: {
    //     type: String
    // },
    product: {
        type: String
    },

}, { timestamps: true });

const couponModel = mongoose.model("coupons", couponSchema);

module.exports = couponModel;