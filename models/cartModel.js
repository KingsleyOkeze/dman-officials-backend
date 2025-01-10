const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    customerRef: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'customers', // Reference the customers collection
        required: true 
    },
    productRef: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'products', // Reference the products collection
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true, 
        default: 1 
    }, 
       
}, { timestamps: true });

const cartModel = mongoose.model('carts', cartSchema);

module.exports = cartModel;
