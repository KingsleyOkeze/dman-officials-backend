const orderModel = require("../../models/orderModel");
const productModel = require("../../models/productModel");

const fetchHomePageProductStatusesFunction = async (req, res) => {
    
    console.log('called home product statuses');
    try {
        const allProducts = await productModel.find({})

        if (!allProducts) {
            return res.status(401).json({ error: "Couldn't fetch product record!"})
        }

        const availableStock = allProducts.filter((product) => product.productStatus === "available");
        const outOfStock = allProducts.filter((product) => product.productStatus === "out of stock");
        const limitedStock = allProducts.filter((product) => product.productStatus === "limited stock");
        
        return res.status(200).json({
            message: "Successfully fetched home page product statuses!",
            allProducts: allProducts.length,
            outOfStock: outOfStock.length,
            limitedStock: limitedStock.length,
            availableStock: availableStock.length
        });

    } catch (error) {            
        console.log("err fetching home page product statuses", error)
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}


const fetchHomePageOrderStatusesFunction = async (req, res) => {

    console.log('called home order statuses')
    try {
        const allOrders = await orderModel.find({});

        if (!allOrders) {
            return res.status(401).json({ error: "Couldn't fetch home page order status!"})
        }

        const pendingOrders = allOrders.filter((order) => order.orderStatus === "pending");
        const processingOrders = allOrders.filter((order) => order.orderStatus === "processing");
        const cancelledOrders = allOrders.filter((order) => order.orderStatus === "cancelled");
        const shippedOrders = allOrders.filter((order) => order.orderStatus === "shipped");
        const deliveredOrders = allOrders.filter((order) => order.orderStatus === "delivered");
       
        return res.status(200).json({
            message: "Successfully fetched dashboard order statuses!",
            allOrders: allOrders.length,
            pendingOrders: pendingOrders.length,
            processingOrders: processingOrders.length,
            cancelledOrders: cancelledOrders.length,
            shippedOrders: shippedOrders.length,
            deliveredOrders: deliveredOrders.length
        });

    } catch (error) {            
        console.log("err fetching home page order statuses", error)
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}





module.exports = {
    fetchHomePageProductStatusesFunction,
    fetchHomePageOrderStatusesFunction
}