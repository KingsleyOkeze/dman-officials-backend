const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productImageUrl: {
        type: Array
    },
    productName: {
        type: String
    },
    productDescription: {
        type: String
    },
    productCategory: {
        type: String
    },
    productSubCategory: {
        type: String
    },
    productSize: {
        type: String
    },
    productPrice: {
        type: String
    },
    productQuantity: {
        type: String
    },
    productTimer: {
        hour: { type: Number },
        minute: { type: Number },
        second: {type: Number}
    }

});

const productModel = mongoose.model("products", productSchema);

module.exports = productModel;