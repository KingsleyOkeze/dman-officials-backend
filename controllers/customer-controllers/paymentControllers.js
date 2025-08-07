// CUSTOMER PAYMENT CONTROLLERS
require("dotenv").config();
const https = require('https');
const { compileEmailTemplate } = require('../../helpers/emailTemplateHelper');
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

            const order = await orderModel.findById(orderId);
            if (!order) return res.status(404).json({ error: "Order not found!" });

            // Convert Order total amount which is in naira to kobo (for paystack sake)
            const orderTotalAmountInKobo = order.orderTotalAmount * 100;  //Multiply by 100 

            //Confirm if the charged amount doesn't match the expected order amount
            if (amountCharged && orderTotalAmountInKobo !== amountCharged) {
                // Mark payment as PaymentMismatch and notify
                order.paymentStatus = "PaymentMismatch";
                order.amountCustomerPaid = parseInt(amountCharged);
                order.paymentReference = reference;
                await order.save();

                // Compile and send payment mismatch email
                const mismatchEmailData = {
                    logoUrl: `${process.env.CUSTOMER_CLIENT_URL}/dman-logo.png`, 
                    title: 'Payment Mismatch Detected',
                    message: `
                        The amount charged does not match your order total. 
                        Our team is reviewing this issue. Please contact 
                        support if you have any questions.
                        `,
                    reference: reference,
                    expectedAmount: order.orderTotalAmount,
                    amountCharged: (amountCharged / 100).toFixed(2)
                };
                const mismatchEmailHtml = compileEmailTemplate('paymentMismatch', mismatchEmailData);

                // Send email to customer and optionally notify support/admin.
                emailingFunction(customerEmail, 'Payment Mismatch - DMAN E-commerce', mismatchEmailHtml);
                
                // Respond with a clear error to the user
                return res.status(200).json({
                    status: "PaymentMismatch",
                    message: `
                        Payment amount does not match the Order total. 
                        Our team is reviewing this.
                        `,
                    details: { 
                        orderTotalAmount: order.orderTotalAmount, 
                        amountCharged, 
                    }
                })
            }

            // Transaction is verified successfully do this:
            if (parsedData.status && parsedData.data.status === "success") {
                order.paymentStatus = "Success"; // Update the payment status
                order.paymentReference = reference; // Update the payment reference
                // Set payment method from parsedData.data.channel
                order.paymentMethod = parsedData.data.channel || "Unknown";
                
                const updatedOrder = await order.save();

                if (!updatedOrder) {
                    console.log('Order payment confirmation status failed to update!');
                    return res.status(404).json({ 
                        error: "Order payment confirmation status failed to update!"
                    });
                }
        
                console.log('Updated Order:', updatedOrder);

                // Clear Customer Cart....
                await cartModel.deleteMany({ customerRef: customer._id });
                
                const successEmailData = {
                    logoUrl: `${process.env.CUSTOMER_CLIENT_URL}/dman-logo.png`,
                    title: 'Payment Successful!',
                    message: `
                        Thank you for your payment! Your transaction of 
                        ₦${(parsedData.data.amount / 100).toFixed(2)} 
                        was successful.
                        `,
                    reference: reference,
                    orderId: orderId,
                    orderLink: `${process.env.CUSTOMER_CLIENT_URL}/account/purchase-details/${orderId}`
                };
                const successEmailHtml = compileEmailTemplate('paymentSuccess', successEmailData);
                emailingFunction(customerEmail, 'Payment Success - DMAN E-commerce', successEmailHtml);

                return res.status(200).json({
                  message: "Transaction verified successfully",
                  data: parsedData.data,
                });
            } else {
                // For payment failure, compile failure template
                const failureEmailData = {
                    logoUrl: `${process.env.CUSTOMER_CLIENT_URL}/dman-logo.png`,
                    title: 'Payment Unsuccessful',
                    message: 'Unfortunately, your payment was not successful. Please try again or contact support for assistance.',
                    reference: reference,
                    supportLink: `${process.env.CUSTOMER_CLIENT_URL}/contact` 
                };

                const failureEmailHtml = compileEmailTemplate('paymentFailure', failureEmailData);
                // Send Payment failed email
                emailingFunction(customerEmail, 'Payment Unsuccessful - DMAN E-commerce', failureEmailHtml);
  
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