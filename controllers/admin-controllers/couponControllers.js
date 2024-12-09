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
            return res.status(404).json({ error: "No record found!" });
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


const addCouponFunction = async (req, res) => {
    const {
        couponName,
        couponCode,
        discountType,
        discountAmount,
        minPurchaseAmount,
        status,
        category,
        subCategory,
        product,
        expirationDate,
        // usageLimit,
    } = req.body;

    try {
        if (
            !couponName ||
            !couponCode ||
            !discountType ||
            !discountAmount ||
            !status ||
            !category ||
            !expirationDate         
        ) {
            return res.status(404).json({ error: "Please fill in required field!"});
        }

        const newCoupon = new couponModel({
            couponName,
            couponCode,
            discountType,
            discountAmount,
            minPurchaseAmount,
            status,
            category,
            subCategory,
            product,
            expirationDate,
            // usageLimit,
        });

        const saveCoupon = await newCoupon.save();

        if (!saveCoupon) {
            console.log("Coupon failed to saved!");
            return res.status(401).json({ error: "Failed to saved Coupon"});
        }
        console.log("Coupon saved successfully!");
        return res.status(200).json({ message: "Coupon saved successfully!"});

    } catch (error) {
        console.log("Internal Server Error!")
        return res.status(500).json({ error: "Internal Server Error!"});
    }


}






const editCouponFunction = async (req, res) => {
    const {
        couponId,
        couponName,
        couponCode,
        discountType,
        discountAmount,
        minPurchaseAmount,
        status,
        category,
        subCategory,
        product,
        expirationDate,
        // usageLimit,
    } = req.body;

    try {
        if (
            !couponName ||
            !couponCode ||
            !discountType ||
            !discountAmount ||
            !status ||
            !category ||
            !expirationDate         
        ) {
            return res.status(404).json({ error: "Please fill in required field!"});
        }

        const updatedFields = {
            couponName,
            couponCode,
            discountType,
            discountAmount,
            minPurchaseAmount,
            status,
            category,
            subCategory,
            product,
            expirationDate,
            // usageLimit,
        };

        const updatedCoupon = await couponModel.findByIdAndUpdate(
            couponId,                  // The ID of the document to update
            { $set: updatedFields }, // The fields to update
            { new: true }           // Return the updated document
          );
      
        if (!updatedCoupon) {
            return res.status(400).json({ error: "Coupon not found!"});
        } 
        
        console.log("Coupon updated successfully!");
        return res.status(200).json({ message: "Coupon saved successfully!"});

    } catch (error) {
        console.log("Internal Server Error!")
        return res.status(500).json({ error: "Internal Server Error!"});
    }


}












module.exports = {
    fetchCouponsFunction,
    addCouponFunction,
    editCouponFunction
}