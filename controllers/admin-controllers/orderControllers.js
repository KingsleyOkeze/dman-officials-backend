// ADMIN ORDER CONTROLLERS
const orderModel = require("../../models/orderModel"); 


const fetchOrdersFunction = async (req, res) => {

    const page = req.query.page || 0;
    const numberOfItemsToReturn = 7;

    try {
        // Get the portions of the pagination requested
        const allOrders = await orderModel.find()
            .skip(page * numberOfItemsToReturn)
            .limit(numberOfItemsToReturn)

        if (!allOrders) {
            console.log("Failed fetching orders", error)
            return res.status(401).json({ error: "Failed to fetch all orders"})
        }

        if (allOrders.length === 0) {
            return res.status(404).json({ error: "No orders found" });
        }


        // Get the exact document count
        const totalOrderCountInDb = await orderModel.countDocuments(); 
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






module.exports = {
    fetchOrdersFunction,
};