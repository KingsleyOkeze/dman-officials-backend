const cron = require('node-cron');
const couponModel = require('../models/couponModel');

const couponExpirationJob = () => {
    // Run daily at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            // Find expired coupons
            const expiredCoupons = await couponModel.find({
                expirationDate: { $lt: new Date() }, // $lt: Find Coupon less than current date
                status: { $ne: 'Expired' } // $ne: Not equal to 'Expired'
            });

            // Normal for loop to update coupons
            for (let i = 0; i < expiredCoupons.length; i++) {
                expiredCoupons[i].status = 'Expired';
                await expiredCoupons[i].save();

                console.log(`Coupon ${expiredCoupons[i].couponCode} has expired`);
            }

            console.log(`Total expired coupons: ${expiredCoupons.length}`);
        } catch (error) {
            console.error('Coupon expiration failed:', error);
        }
    });
};

module.exports = couponExpirationJob;
