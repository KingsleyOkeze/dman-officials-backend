// ADMIN CUSTOMER CONTROLLERS
const cartModel = require("../../models/cartModel");
const customerModel = require("../../models/customerModel");
const orderModel = require("../../models/orderModel");
const savedProductModel = require("../../models/savedProductModel");

const fetchCustomersFunction = async (req, res) => {

    const page = req.query.page || 0;
    const numberOfCustomersToReturn = req.query.limit || 7;
    const sortBy = req.query.sortBy; 

    let sortQuery = {};
console.log('calllll')
    try {
        if (sortBy === "Oldest") {
            sortQuery = { createdAt: 1 }; // Sort by oldest first
        } else if (sortBy === "Newest") {
            sortQuery = { createdAt: -1 }; // Sort by newest first
        } else {
            sortQuery = { createdAt: -1 }; // Default sorting (newest first)
        }


        // Get the portions of the pagination requested
        const allCustomers = await customerModel.find() 
            .sort(sortQuery)
            .skip(page * numberOfCustomersToReturn)
            .limit(numberOfCustomersToReturn)

        if (!allCustomers) {
            console.log("Failed fetching Customers", error)
            return res.status(404).json({ error: "Failed to fetch all Customers"})
        }

        // Get the exact document count
        const totalCustomersCountInDb = await customerModel.countDocuments(); 
        console.log("total document in db", totalCustomersCountInDb);

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalCustomersCountInDb / numberOfCustomersToReturn); 
        console.log("total pages for customer", totalPages);

        return res.status(200).json({result: allCustomers, totalPages, message: "Successfully fetched Customers!"});

    } catch (error) {
        console.log("Server Error fetching customers", error)
        return res.status(500).json({ error: "Internal Server Error!"})
    }
}




const deleteCustomerAccountFunction = async (req, res) => {
    const { customerId } = req.params;

    try {
        // Check if customerId is provided
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required!" });
        }

        // Find the customer to ensure they exist
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found!" });
        }

        // Delete associated data
        await orderModel.deleteMany({ customerRef: customerId });
        await cartModel.deleteMany({ customerRef: customerId });
        await savedProductModel.deleteMany({ customerRef: customerId });

        // Delete the customer record
        await customerModel.findByIdAndDelete(customerId);

        // Success response
        return res.status(200).json({ message: "Customer account and all associated data deleted successfully!" });
    } catch (error) {
        console.error("Error deleting customer account:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};



module.exports = {
    fetchCustomersFunction,
    deleteCustomerAccountFunction
};
  