// ADMIN COUPON CONTROLLERS
const couponModel = require("../../models/couponModel");
const { convertDateToUTC } = require('../../utils/dateUtils');

const fetchCouponsFunction = async (req, res) => {

    const page = req.query.page || 0;
    const numberOfCouponsToReturn = 7;
    const discountType = req.query.discountType;
    let query = {};
    
    console.log('fetch query is', discountType );
    try {
        if (discountType && discountType !== "AllTypes") {
            query = { discountType: discountType }
        }

        // Get the portions of the pagination requested
        const allCoupons = await couponModel.find(query) 
            .sort({ createdAt: -1 })
            .skip(page * numberOfCouponsToReturn)
            .limit(numberOfCouponsToReturn)

        if (!allCoupons) {
            console.log("Failed fetching Coupons", error)
            return res.status(401).json({ error: "Failed to fetch all Coupons"})
        }

        // Get the exact document count
        const totalCouponsCountInDb = await couponModel.countDocuments(query); 
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
        minimumPurchaseAmount,
        status,
        category,
        subCategory,
        expirationDate,
        usageLimit,
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
            return res.status(400).json({ error: "Please fill in required field!"});
        }

        // Use 'end' if you want the coupon to expire at the end of the day.
        const utcExpirationDate = convertDateToUTC(expirationDate, 'end');

        const newCoupon = new couponModel({
            couponName,
            couponCode,
            discountType,
            discountAmount,
            minimumPurchaseAmount,
            status,
            category,
            subCategory,
            expirationDate: utcExpirationDate,
            usageLimit,
        });

        const saveCoupon = await newCoupon.save();

        if (!saveCoupon) {
            console.log("Coupon failed to saved!");
            return res.status(401).json({ error: "Failed to saved Coupon"});
        }
        console.log("Coupon saved successfully!");
        return res.status(200).json({ message: "Coupon saved successfully!"});

    } catch (error) {
        console.log("Internal Server Error!", error)
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
        minimumPurchaseAmount,
        status,
        category,
        subCategory,
        expirationDate,
        usageLimit,
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
            return res.status(400).json({ error: "Please fill in required field!"});
        }

        // Use 'end' if you want the coupon to expire at the end of the day.
        const utcExpirationDate = convertDateToUTC(expirationDate, 'end');

        const updatedFields = {
            couponName,
            couponCode,
            discountType,
            discountAmount,
            minimumPurchaseAmount,
            status,
            category,
            subCategory,
            expirationDate: utcExpirationDate,
            usageLimit,
        };

        const updatedCoupon = await couponModel.findByIdAndUpdate(
            couponId,                  // The ID of the document to update
            { $set: updatedFields }, // The fields to update
            { new: true }           // Return the updated document
          );
      
        if (!updatedCoupon) {
            return res.status(401).json({ error: "Coupon not found!"});
        } 
        
        console.log("Coupon updated successfully!");
        return res.status(200).json({ message: "Coupon saved successfully!"});

    } catch (error) {
        console.log("Internal Server Error!", error)
        return res.status(500).json({ error: "Internal Server Error!"});
    }


}



const fetchCouponByIdFunction = async (req, res) => {
    const { couponId } = req.params; // Extract the coupon ID from the route parameter

    try {
        if (!couponId) {
            return res.status(400).json({ error: 'Coupon ID is required!' })
        }

        const coupon = await couponModel.findById(couponId); 
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found!' });
        }

        return res.status(200).json(coupon); 
    } catch (error) {
      console.error('Error fetching coupon:', error);
      return res.status(500).json({ error: 'Internal server error!' });
    }
};




const deleteCouponFunction = async (req, res) => {
    const { couponId } = req.params; 

    try {
        // Check if the coupon ID is provided
        if (!couponId) {
            return res.status(400).json({ error: "Coupon ID is required!" });
        }

        // Find and delete the coupon from the database
        const deletedCoupon = await couponModel.findByIdAndDelete(couponId);

        // Check if the coupon was found and deleted
        if (!deletedCoupon) {
            return res.status(404).json({ error: "Coupon not found or already deleted!" });
        }
        console.log('coupon deleted successfully!')
        // Successfully deleted
        return res.status(200).json({
            message: "Coupon deleted successfully!",
            deletedCoupon,
        });
    } catch (error) {
        console.error("Error deleting coupon:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};




module.exports = {
    fetchCouponsFunction,
    addCouponFunction,
    editCouponFunction,
    fetchCouponByIdFunction,
    deleteCouponFunction
}