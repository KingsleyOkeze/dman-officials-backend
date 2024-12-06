const customerModel = require("../../models/customerModel");

const fetchCustomersFunction = async (req, res) => {

    const page = req.query.page || 0;
    const numberOfCustomersToReturn = 7;

    try {
        // Get the portions of the pagination requested
        const allCustomers = await customerModel.find() 
            .skip(page * numberOfCustomersToReturn)
            .limit(numberOfCustomersToReturn)

        if (!allCustomers) {
            console.log("Failed fetching Customers", error)
            return res.status(401).json({ error: "Failed to fetch all Customers"})
        }

        if (allCustomers.length === 0) {
            return res.status(404).json({ error: "No customers found" });
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







module.exports = {
    fetchCustomersFunction
};
  