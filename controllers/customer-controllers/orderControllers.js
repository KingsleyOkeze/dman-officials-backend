// CUSTOMER ORDER CONTROLLERS
const cartModel = require("../../models/cartModel");
const customerModel = require("../../models/customerModel");
const orderModel = require("../../models/orderModel");

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
        phoneNumber
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

        // CALCULATE TOTAL PRICE
        const cartItems = await cartModel
            .find({ customerRef: customerId })
            .populate('productRef');
           
        let totalPrice = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            totalPrice += item.productRef.productOfferPrice * item.quantity
        }

        console.log('cart total price is', totalPrice);

        const shippingCost = 1000;

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
            orderTotalAmount: totalPrice += shippingCost
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
    placeOrderFunction 
}