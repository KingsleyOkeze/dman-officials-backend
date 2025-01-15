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
            
            if (parsedData.status && parsedData.data.status === "success") {
                // Transaction is verified successfully
                const updatedOrder = await orderModel.findByIdAndUpdate(
                    orderId,
                    { 
                        paymentStatus: "success", // Update the payment status
                        paymentReference: reference, // Update the payment reference
                        orderTotalAmount: 0 // Update Order Total Amount
                    },
                    { new: true, runValidators: true } // Options: return the updated document and run validators
                );

                if (!updatedOrder) {
                    console.log('Order not found');
                    return res.status(404).json({ error: "Order not found!"});
                }
        
                console.log('Updated Order:', updatedOrder);

                // Clear Customers cart
                await cartModel.deleteMany({ customerRef: customer._id});

                const successPaymentTitle = 'Payment success';
                const successPaymentText = `
                    <p>Dear Customer,</p>
    
                    <p>Thank you for your payment!</p>
    
                    <p>Your payment of <strong>${updatedOrder.orderTotalAmount}</strong> was successful, and your order ID is <strong>${orderId}</strong>.</p>
    
                    <p>Your transaction reference is <strong>${reference}</strong>.</p>
    
                    <p>If you have any questions or need further assistance, feel free to contact our support team.</p>
    
                    <p>Thank you for choosing us!</p>
    
                    <p>Best regards,<br>Your Company Name</p>
                `;
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