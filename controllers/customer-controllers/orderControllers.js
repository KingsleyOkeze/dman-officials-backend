// CUSTOMER ORDER CONTROLLERS
const cartModel = require("../../models/cartModel");
const couponModel = require("../../models/couponModel");
const customerModel = require("../../models/customerModel");
const orderModel = require("../../models/orderModel");


const fetchAllCustomerOrdersFunction = async (req, res) => {
    const { customerId } = req.body;

    try {
        if (!customerId) {
            return res.status(401).json({ error: "Unauthorized access!" });
        }

        // Fetch all orders for the customer
        const orders = await orderModel
            .find({ customerRef: customerId }) // Use 'customerRef' as per your schema
            .populate("orderedItems.productRef", "productName productImageUrl productPrice") // Adjust fields to match your product schema
            .sort({ createdAt: -1 }); // Sort by most recent orders

       
        // Transform orders to match client-side requirements
        const result = orders.map((order) => ({
            orderId: order._id,
            name: order.orderedItems
                .map((item) => item?.productRef?.productName || "Unnamed product")
                .join(", "),
            image: order.orderedItems[0]?.productRef?.productImageUrl?.[0] || null, // Fallback for missing images
            status: order.orderStatus || "Unknown", // Ensure status always has a value
            deliveryDate: order.deliveryDate || "Not specified", // Add this field in your schema if required
        }));

        // Log and send response
        console.log("All customer orders fetched successfully", result);
        return res.status(200).json({ 
            message: "All customer orders fetched successfully", 
            result
        });

    } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ error: "Internal Server Error!" });
    }
};

const fetchPurchasedOrderDetailsFunction = async (req, res) => {
    const { orderId } = req.params;
    const { customerId } = req.body;
    console.log('called customer fetch order details')
    try {
        if (!customerId) {
            return res.status(400).json({ error: "Couldn't identify user!"})
        }

        if (!orderId) {
            return res.status(400).json({ error: "Couldn't identify order!"})
        }

        const order = await orderModel
            .findById(orderId)
            .populate("orderedItems.productRef"); // Populate product details for each ordered item

        if (!order) {
            return res.status(404).json({ error: "Order not found!"});
        }

        console.log("Order fetched successfully!", order);

        return res.status(200).json({
            message: "Order fetched successfully!",
            order
        });
    } catch (error) {
        console.log( "Internal Server Error!", error);
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}




const placeOrderFunction = async (req, res) => {
    const {
        customerId,
        country,
        firstName,
        lastName,
        company,
        address,
        city,
        state,
        postalCode,
        phoneNumber,
        appliedCouponCode, // Field for coupon code
    } = req.body;

    console.log("log order to place", customerId,country,firstName,lastName,company,address,city,state,postalCode,phoneNumber)
    
    try {
        if (
            !customerId,
            !country,
            !firstName,
            !lastName,
            !address,
            !city,
            !state,
            !phoneNumber
        ) {
            return res.status(404).json({ error: "Please fill up the necessay details!"});
        }

        const customer = await customerModel.findOne({ _id: customerId });

        if (!customer) {
            return res.status(404).json({ error: "User doesn't exist!"});
        }

        // FETCH CART ITEMS FOR CUSTOMER AND CALCULATE TOTAL PRICE
        const cartItems = await cartModel
            .find({ customerRef: customerId })
            .populate('productRef');
           
        let cartTotalPurchase = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            cartTotalPurchase += item.productRef.productOfferPrice * item.quantity
        }

        console.log('cart total price is', cartTotalPurchase);

        const shippingCost = 1000;

        // Query and validate coupon if applied
        let discount = 0;
        if (appliedCouponCode) {
            const coupon = await couponModel.findOne({ couponCode: appliedCouponCode });

            if (!coupon || coupon.status !== "active" || new Date(coupon.expirationDate) < new Date()) {
                return res.status(400).json({ error: "Invalid or expired coupon code!" });
            }

            if (cartTotalPurchase < coupon.minimumPurchaseAmount) {
                return res.status(403).json({
                    error: `Minimum Purchase Amount of ₦${coupon.minimumPurchaseAmount} required to apply this coupon!`,
                });
            }

            // Retrieve discount amount
            discount = coupon.discountType === "percentage off"
                ? (cartTotalPurchase * coupon.discountAmount) / 100
                : coupon.discountAmount;
        }


        // Calculate final total
        const finalTotal = Math.max(cartTotalPurchase - discount + shippingCost, 0);


        // STORE A REFERENCE OF AN ITEMS IN CUSTOMER CART INTO 
        // THE ORDER MODEL BEFORE DELETING THE CUSTOMER CART
        const orderedItems = cartItems.map(item => {
            return {
                customerRef: item.customerRef, // Retain customer reference
                productRef: item.productRef._id, // Store product reference
                quantity: item.quantity, // Store quantity
                price: item.productRef.productOfferPrice // Store current price for future reference
            };
        });

        // Create a new order with ordered items from the cart
        const newOrder = new orderModel({
            customerRef: customerId,
            country,
            firstName,
            lastName,
            company,
            address,
            city,
            state,
            postalCode,
            phoneNumber,
            orderTotalAmount: finalTotal,
            orderedItems, // Save detailed ordered items with prices
            appliedCouponCode, // Save the applied coupon code
            discountAmountApplied: discount // Save the discount amount from the coupon if exist
        });

        const savedOrder = await newOrder.save();

        if (!savedOrder) {
            return res.status(401).json({ error: "Failed to place order!"});
        }

        console.log("Successfully added order!", savedOrder);

        return res.status(201).json({ 
            message: "Successfully added order!", 
            savedOrder,
            customerEmail: customer.email
        });

    } catch (error) {
        console.log("500 err placing order", error);
        return res.status(500).json({ error: "Internal Server Error!"});
    }

};






module.exports = {
    fetchAllCustomerOrdersFunction,
    fetchPurchasedOrderDetailsFunction,
    placeOrderFunction 
}