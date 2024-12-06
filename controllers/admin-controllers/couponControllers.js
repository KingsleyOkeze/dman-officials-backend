const couponModel = require("../../models/couponModel");

const fetchCouponsFunction = async (req, res) => {

    const page = req.query.page || 0;
    const numberOfCouponsToReturn = 7;

    try {
        // Get the portions of the pagination requested
        const allCoupons = await couponModel.find() 
            .skip(page * numberOfCouponsToReturn)
            .limit(numberOfCouponsToReturn)

        if (!allCoupons) {
            console.log("Failed fetching Coupons", error)
            return res.status(401).json({ error: "Failed to fetch all Coupons"})
        }

        if (allCoupons.length === 0) {
            return res.status(404).json({ error: "No coupons found" });
        }


        // Get the exact document count
        const totalCouponsCountInDb = await couponModel.countDocuments(); 
        console.log("total document in db", totalCouponsCountInDb);

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalCouponsCountInDb / numberOfCouponsToReturn); 
        console.log("total pages for coupon", totalPages);

        return res.status(200).json({result: allCoupons, totalPages, message: "Successfully fetched Coupons!"});

    } catch (error) {
        console.log("Server Error fetching coupons", error)
        return res.status(500).json({ error: "Internal Server Error!"})
    }
}








module.exports = {
    fetchCouponsFunction
}