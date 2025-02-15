// CUSTOMER COUPON CONTROLLERS
const { checkCouponValidity } = require("../../helpers/couponHelper");
const cartModel = require("../../models/cartModel");
const couponModel = require("../../models/couponModel");
const customerModel = require("../../models/customerModel");

const validateCouponFunction = async (req, res) => {
    const { customerId, couponCode } = req.body;
    console.log('called validate coupon', customerId, couponCode);
    try { 
        if (!customerId) {
            return res.status(400).json({ error: "Failed to identify User!" });
        }

        const customer = await customerModel.findById(customerId); 

        if (!customer) {
            return res.status(404).json({ error: "User doesn't exist!" });
        }

        // Calculate customer order amount
        const cartItems = await cartModel.find({ customerRef: customerId }).populate('productRef');

        let orderAmount = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            orderAmount += item.productRef.productOfferPrice * item.quantity;
        }

        const couponResult = await checkCouponValidity(couponCode, customerId, orderAmount);

        if (!couponResult.isValid) {
            console.log('validated coupon is', couponResult.message );
            return res.status(400).json({ isValid: false, error: couponResult.message });
        }

        // Ensure the discount doesn't exceed the order amount
        const totalAfterDiscount = Math.max(orderAmount - couponResult.discount, 0); // Prevent negative total
  
        console.log('successfully validated coupon', couponResult.message);
     
        return res.status(200).json({ 
            isValid: true, 
            total: totalAfterDiscount,
            discount: couponResult.discount, 
            message: couponResult.message 
        });

    } catch (error) { 
        console.error("Error validating coupon:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};


module.exports = {
    validateCouponFunction
};