const mongoose = require('mongoose');

const savedProductSchema = new mongoose.Schema({
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
  
       
}, { timestamps: true });

const savedProductModel = mongoose.model('saved-products', savedProductSchema);

module.exports = savedProductModel;
