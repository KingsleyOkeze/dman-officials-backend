// helpers/couponUtils.js
const couponModel = require('../models/couponModel');
const { isExpired } = require('../utils/dateUtils');


const checkCouponValidity = async (couponCode, customerId, orderAmount) => {
    let result = {
        isValid: false,
        discount: 0,
        message: "",
        coupon: null,
    };

    // Find the coupon by its code
    const coupon = await couponModel.findOne({ couponCode });
    if (!coupon || coupon.status !== "Active") {
        result.message = "Invalid coupon code!";
        return result;
    }

    // Check if the coupon is expired
    if (isExpired(coupon.expirationDate)) {
        result.message = "Coupon has expired!";
        return result;
    }

    // Check if the coupon has reached its usage limit
    if (coupon.timesUsed >= coupon.usageLimit) {
        result.message = "Coupon usage limit has been reached!";
        return result;
    }

    // Check if the customer has already used the coupon
    if (coupon.usersUsed.includes(customerId)) {
        result.message = "You have already used this coupon!";
        return result;
    }

    // Validate the minimum purchase amount
    if (orderAmount < coupon.minimumPurchaseAmount) {
        result.message = `Minimum Purchase Amount of ₦${coupon.minimumPurchaseAmount} required`;
        return result;
    }

    // Calculate discount based on coupon type
    let discount = 0;
    if (coupon.discountType === "PercentageOff") {
        discount = (orderAmount * coupon.discountAmount) / 100;
    } else if (coupon.discountType === "FlatDiscount") {
        discount = coupon.discountAmount;
    }

    // --- Update coupon usage (added back) ---
    coupon.timesUsed += 1;
    coupon.usersUsed.push(customerId);
    await coupon.save();
  
    result.isValid = true;
    result.discount = discount;
    result.message = "Coupon is valid!";
    result.coupon = coupon;
    return result;
}

module.exports = { checkCouponValidity };
