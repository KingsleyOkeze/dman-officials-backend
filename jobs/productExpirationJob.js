const cron = require('node-cron');
const productModel = require('../models/productModel'); 

const productExpirationJob = () => {
    // Run every 20 seconds for testing
    cron.schedule('0 0 * * *', async () => {
        try {
            // Find products whose sales have ended
            const endedSaleProducts = await productModel.find({
                timerExpiryDate: { $lt: new Date() }, // Find products with expiry date less than current date
                productStatus: { $ne: 'SaleEnded' } // Not equal to 'SaleEnded'
            });

            // Update each product's status
            for (let i = 0; i < endedSaleProducts.length; i++) {
                endedSaleProducts[i].productStatus = 'SaleEnded';
                await endedSaleProducts[i].save();

                console.log(`Product ${endedSaleProducts[i].productName} sale has ended`);
            }

            console.log(`Total products with ended sales: ${endedSaleProducts.length}`);
        } catch (error) {
            console.error('Product sale expiration failed:', error);
        }
    });
};

module.exports = productExpirationJob;
