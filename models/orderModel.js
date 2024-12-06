const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerFirstName: {
        type: String
    },
    customerLastName: {
        type: String
    },
    orderAmount: {
        type: String
    },
    payment: {
        type: String
    },
    status: {
        type: String
    },
    createdAt: {
        type: Date
    },

}, { timestamps: true });

const orderModel = mongoose.model("orders", orderSchema);

module.exports = orderModel;