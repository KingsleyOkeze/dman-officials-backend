// CUSTOMER COUPON CONTROLLERS
const couponModel = require("../../models/couponModel");
const customerModel = require("../../models/customerModel");

const validateCouponFunction = async (req, res) => {
    const { customerId, couponCode } = req.body;

    try { 
        if (!customerId) {
            return res.status(400).json({ error: "Failed to identify User!"});
        }

        const customer = await customerModel.findById(customerId); 

        if (!customer) {
            return res.status(404).json({ error: "User doesn't exist!"})
        }

        const coupon = await couponModel.findOne({ couponCode });
  
        if (!coupon || !coupon.status) {
            return res.staus(400).json({ isValid: false, error: "Invalid coupon code" });
        }
    
        if (new Date(coupon.expirationDate) < new Date()) {
            return res.status(403).json({ isValid: false, error: "Coupon has expired" });
        }

        // Calculate customer order amount
        const cartItems = await cartModel
            .find({ customerRef: customerId })
            .populate('productRef');

        let orderAmount = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            orderAmount += item.productRef.productOfferPrice * item.quantity
        }
  
        if (orderAmount < coupon.minimumPurchaseAmount) {
            return res.status(403).json({ 
                isValid: false, 
                message: `Minimum Purchase Amount of ${coupon.minimumPurchaseAmount} required` 
            });
        }


        // Calculate discount
        let discount = 0;
        if (coupon.discountType === "percentage") {
            discount = (orderAmount * coupon.discountAmount) / 100;
        } else if (coupon.discountType === "amount") {
            discount = coupon.discountAmount;
        }

        const total = Math.max(orderAmount - discount, 0); // Prevent negative total
  
        return res.status(200).json({ isValid: true, total, message: "Coupon is valid!"});
        
    } catch (error) { 
        return res.status(500).json({ error: "Internal Server Error!"});
    }
};

module.exports = {
    validateCouponFunction
}