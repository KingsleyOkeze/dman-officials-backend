const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponName: {
        type: String,
        required: true, 
    },
    status: {
        type: String,
        required: true, 
        enum: ["Active", "Inactive", "Expired"], // Restricts to these statuses
    },
    type: {
        type: String,
        enum: ["Fixed", "Percentage"], // Restricts to these coupon types
    },
    amount: {
        type: String,
        type: Number,
        required: true,
        min: 0, // Ensures no negative amounts
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically sets the creation date
    }

}, { timestamps: true });

const couponModel = mongoose.model("coupons", couponSchema);

module.exports = couponModel;