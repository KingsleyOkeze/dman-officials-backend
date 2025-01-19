// CUSTOMER COUPON CONTROLLERS
const cartModel = require("../../models/cartModel");
const couponModel = require("../../models/couponModel");
const customerModel = require("../../models/customerModel");

const validateCouponFunction = async (req, res) => {
    const { customerId, couponCode } = req.body;
console.log('called validate coupon')
    try { 
        if (!customerId) {
            return res.status(400).json({ error: "Failed to identify User!" });
        }

        const customer = await customerModel.findById(customerId); 

        if (!customer) {
            return res.status(404).json({ error: "User doesn't exist!" });
        }

        const coupon = await couponModel.findOne({ couponCode });
        
        if (!coupon || coupon.status !== "active") { // Ensure status is "Active"
            return res.status(400).json({ isValid: false, error: "Invalid coupon code!" });
        }

        // Check if the coupon has expired
        if (new Date(coupon.expirationDate) < new Date()) {
            return res.status(403).json({ isValid: false, error: "Coupon has expired!" });
        }

        // Check if the coupon has reached its usage limit
        if (coupon.timesUsed >= coupon.usageLimit) {
            return res.status(403).json({ isValid: false, error: "Coupon usage limit has been reached!" });
        }

        // Check if the customer has already used this coupon
        if (coupon.usersUsed.includes(customerId)) {
            return res.status(403).json({ isValid: false, error: "You have already used this coupon!" });
        }

        // Calculate customer order amount
        const cartItems = await cartModel.find({ customerRef: customerId }).populate('productRef');

        let orderAmount = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            orderAmount += item.productRef.productOfferPrice * item.quantity;
        }

        // Check if the order meets the minimum purchase amount
        if (orderAmount < coupon.minimumPurchaseAmount) {
            return res.status(403).json({ 
                isValid: false, 
                message: `Minimum Purchase Amount of ₦${coupon.minimumPurchaseAmount} required` 
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === "percentage off") {
            discount = (orderAmount * coupon.discountAmount) / 100;
        } else if (coupon.discountType === "flat discount") {
            discount = coupon.discountAmount;
        }

        // Ensure the discount doesn't exceed the order amount
        const totalAfterDiscount = Math.max(orderAmount - discount, 0); // Prevent negative total
  
        // Update coupon usage
        coupon.timesUsed += 1;
        coupon.usersUsed.push(customerId);
        await coupon.save();

        return res.status(200).json({ 
            isValid: true, 
            total: totalAfterDiscount,
            discount, 
            message: "Coupon is valid!"
        });
        
    } catch (error) { 
        console.error("Error validating coupon:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};


module.exports = {
    validateCouponFunction
}