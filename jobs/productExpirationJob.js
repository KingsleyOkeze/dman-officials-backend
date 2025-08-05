const cron = require('node-cron');
const productModel = require('../models/productModel');

const productExpirationJob = () => {
    // Schedule the job to run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            // Find products whose sales have ended
            const endedSaleProducts = await productModel.find({
                timerExpiryDate: { $lt: new Date() }, // Expiry date is in the past
                productStatus: { $ne: 'Available' } // Status is not 'Available'
            });

            // Update each product's status and reset timer fields
            for (let i = 0; i < endedSaleProducts.length; i++) {
                endedSaleProducts[i].productStatus = 'Available';
                endedSaleProducts[i].addedTimer = false;
                endedSaleProducts[i].productAddedTimer = { hrs: 0, min: 0, sec: 0 };
                await endedSaleProducts[i].save();

                console.log(`Product ${endedSaleProducts[i].productName} is now available`);
            }

            console.log(`Total products updated: ${endedSaleProducts.length}`);
        } catch (error) {
            console.error('Product status update failed:', error);
        }
    });
};

module.exports = productExpirationJob;
