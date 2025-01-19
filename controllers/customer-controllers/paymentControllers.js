// CUSTOMER PAYMENT CONTROLLERS
require("dotenv").config();
const https = require('https');
const emailingFunction = require("../../helpers/emailingFunction");
const orderModel = require("../../models/orderModel");
const cartModel = require("../../models/cartModel");
const customerModel = require("../../models/customerModel");

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

const verifyTransactionFunction = async (req, res) => {
    const { reference, customerEmail, orderId } = req.body; // Extract reference from request parameters
    
    if (!reference) {
        return res.status(400).json({ error: "Transaction reference is required" });
    }

    // Retrieve user ID based on email
    const customer = await customerModel.findOne({ email: customerEmail });

    if (!customer) {
        return res.status(404).json({ error: "User not found" });
    }

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${reference}`, // Use template literal to insert reference
        method: 'GET',
        headers: {
            Authorization: `Bearer ${paystackSecretKey}`, 
            'Content-Type': 'application/json'
        }
    };

    const request = https.request(options, response => {
        let data = '';

        response.on('data', chunk => {
            data += chunk;
        });

        response.on('end', async () => {
            const parsedData = JSON.parse(data);
            console.log('response on verify transaction', parsedData);
            const amountCharged = parsedData.data.amount; // Get the amount from parsedData

            // Transaction is verified successfully do this:
            if (parsedData.status && parsedData.data.status === "success") {
                //Confirm if the money paid is same as Order total amount.
                const order = await orderModel.findById(orderId);

                if (!order) return res.status(404).json({ error: "Order not found!" });

                // Convert Order total amount which is in naira to kobo (for paystack sake)
                const orderTotalAmountInKobo = order.orderTotalAmount * 100;  //Multiply by 100

                if (orderTotalAmountInKobo !== amountCharged) {
                    // Mark payment as payment mismatch and notify
                    order.paymentStatus = "payment mismatch";
                    order.amountCustomerPaid = parseInt(amountCharged);
                    order.paymentReference = reference;
                    await order.save();

                    // Clear Customers cart
                    await cartModel.deleteMany({ customerRef: customer._id});


                    // Notify customer 
                    emailingFunction(
                        // notify customer with email
                    );

                    // Notify customer support (optional)
                    emailingFunction(
                        // notify admin with email
                    )



                    // Respond with a clear error to the user
                    return res.status(200).json({
                        status: "payment mismatch",
                        message: "Payment amount does not match the order total. Our team is reviewing this.",
                        details: { 
                            orderTotalAmount: order.orderTotalAmount, 
                            amountCharged, 
                        }
                    })
                }

                order.paymentStatus = "success"; // Update the payment status
                order.paymentReference = reference; // Update the payment reference

                const updatedOrder = await order.save();

                if (!updatedOrder) {
                    console.log('Order payment confirmation status failed to update!');
                    return res.status(404).json({ 
                        error: "Order payment confirmation status failed to update!"
                    });
                }
        
                console.log('Updated Order:', updatedOrder);

                // Clear Customers cart
                await cartModel.deleteMany({ customerRef: customer._id});

                const successPaymentTitle = 'Payment success';
                const successPaymentText = `
                    <p>Dear Customer,</p>
    
                    <p>Thank you for your payment!</p>
    
                    <p>Your payment of <strong>${amountCharged}</strong> was successful, and your order ID is <strong>${orderId}</strong>.</p>
    
                    <p>Your transaction reference is <strong>${reference}</strong>.</p>
    
                    <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
    
                    <p>Thank you for choosing us!</p>
    
                    <p>Best regards,<br>Your Company Name</p>
                `;

                // Email customer on their successful purchase
                emailingFunction(
                    customerEmail, 
                    successPaymentTitle, 
                    successPaymentText
                );

                return res.status(200).json({
                  message: "Transaction verified successfully",
                  data: parsedData.data,
                });
            } else {
                // Transaction not successful
                return res.status(400).json({
                  error: "Transaction verification failed",
                  details: parsedData.data,
                });
            }
        });
    });

    request.on('error', error => {
        console.error('Error during request:', error);
        res.status(500).send('An error occurred while verifying the transaction.');
    });

    request.end(); // Complete the request
};



module.exports = {
    verifyTransactionFunction
};