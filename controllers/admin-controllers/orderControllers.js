// ADMIN ORDER CONTROLLERS
const orderModel = require("../../models/orderModel"); 

const fetchOrdersFunction = async (req, res) => {

    const page = req.query.page || 0;
    const numberOfItemsToReturn = 7;
    const orderStatus = req.query.orderStatus;
    let query = {};
    
    console.log('fetch query is', orderStatus );
    try {
        if (orderStatus && orderStatus !== "AllOrders") {
            query = { orderStatus: orderStatus }
        } 
        
        // Get the portions of the pagination requested
        const allOrders = await orderModel.find(query)
            .sort({ createdAt: -1, isDeleted: false })
            .populate("customerRef")
            .skip(page * numberOfItemsToReturn)
            .limit(numberOfItemsToReturn)

        if (!allOrders) {
            console.log("Failed fetching orders", error)
            return res.status(401).json({ error: "Failed to fetch all orders"})
        }

        if (allOrders.length === 0) {
            return res.status(200).json({ message: "No orders found!" });
        }


        // Get the exact document count
        const totalOrderCountInDb = await orderModel.countDocuments(query); 
        console.log("total document in db", totalOrderCountInDb);

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalOrderCountInDb / numberOfItemsToReturn); 
        console.log("total pages", totalPages);

        return res.status(200).json({result: allOrders, totalPages, message: "Successfully fetched Orders!"});

    } catch (error) {
        console.log("Server Error fetching orders", error)
        return res.status(500).json({ error: "Internal Server Error!"})
    }
}



const fetchOrderDetailsFunction = async (req, res) => {
    const { orderId } = req.params;

    try {
        if (!orderId) {
            return res.status(400).json({ error: "Couldn't identify order!"})
        }

        const order = await orderModel
            .findById(orderId)
            .populate("customerRef") // Populate customer details
            .populate("orderedItems.productRef"); // Populate product details for each ordered item

        if (!order) {
            return res.status(404).json({ error: "Order not found!"});
        }

        console.log("Order fetched successfully!", order, 'and order status is', order.orderStatus);

        return res.status(200).json({
            message: "Order fetched successfully!",
            order
        });
    } catch (error) {
        console.log( "Internal Server Error!");
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}


const updateOrderStatusFunction = async (req, res) => {
    const { orderId, orderCurrentStatus } = req.body;
    console.log("order update info receive", orderId, orderCurrentStatus)
    try {
        if (!orderId) {
            return res.status(400).json({ error: "Couldn't identify order"})
        }
        if (!orderCurrentStatus) {
            return res.status(400).json({ error: "Couldn't identify order status"})
        }

        const updatedOrderStatus = await orderModel.findByIdAndUpdate(
            orderId,
            { 
                orderStatus: orderCurrentStatus, // Update the order status
            },
            { new: true, runValidators: true } // Options: return the updated document and run validators
        );

        if (!updatedOrderStatus) {
            console.log('Order not found');
            return res.status(404).json({ error: "Order not found!"});
        }

        console.log('Updated Order status:', updatedOrderStatus.orderStatus);

        return res.status(200).json({ 
            message: "Successfully updated order status!",
            orderStatus: updatedOrderStatus.orderStatus
        })

    } catch (error) {
        console.log('err updating order status:', error);
        return res.status(500).json({ error: "Internal Server Error!"});
    }

};




const deleteOrderFunction = async (req, res) => {
    const { orderId } = req.params;

    try {
        // Validate input
        if (!orderId) {
            return res.status(400).json({ error: "Order ID is required!" });
        }

        // Soft delete: mark as deleted instead of removing permanently
        const deletedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { isDeleted: true, orderStatus: 'Deleted' },
            { new: true }
        );

        // If not found
        if (!deletedOrder) {
            return res.status(404).json({ error: "Order not found!" });
        }

        console.log("Order soft-deleted successfully!");
        return res.status(200).json({
            message: "Order deleted successfully!",
            deletedOrder,
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};



module.exports = {
    fetchOrdersFunction,
    fetchOrderDetailsFunction,
    updateOrderStatusFunction,
    deleteOrderFunction
};