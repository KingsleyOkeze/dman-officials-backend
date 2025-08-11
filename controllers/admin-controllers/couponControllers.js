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
            query = { discountType: discountType, isDeleted: false }
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
            !expirationDate ||   
            usageLimit === undefined     
        ) {
            return res.status(400).json({ error: "Please fill in required field!"});
        }

        // Validate discountType
        if (!['PercentageOff', 'FlatDiscount'].includes(discountType)) {
            return res.status(400).json({ error: 'Invalid discount type' });
        }

        // Validate status
        if (!['Active', 'Inactive', 'Expired'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Validate numeric fields
        if (isNaN(discountAmount) || discountAmount <= 0) {
            return res.status(400).json({ error: 'Discount amount must be a positive number' });
        }

        if (isNaN(minimumPurchaseAmount) || minimumPurchaseAmount < 0) {
            return res.status(400).json({ error: 'Minimum purchase amount must be non-negative' });
        }

        if (isNaN(usageLimit) || usageLimit < 0) {
            return res.status(400).json({ error: 'Usage limit must be non-negative' });
        }

        // Use 'end' if you want the coupon to expire at the end of the day.
        const utcExpirationDate = convertDateToUTC(expirationDate, 'end');
        // This is a more robust check for a valid Date object.
        if (isNaN(utcExpirationDate.getTime())) {
            return res.status(400).json({ error: 'Invalid expiration date' });
        }

        // Optional: Ensure expiration date is in the future for Active status
        const currentDate = Date.now()
        if (status === 'Active' && utcExpirationDate.getTime() < currentDate) {
            return res.status(400).json({ error: 'Expiration date must be in the future for active coupons' });
        }

        // Check if couponCode is unique
        const existingCoupon = await couponModel.findOne({ couponCode });
        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const newCoupon = new couponModel({
            couponName: couponName.trim().replace(/[<>{}]/g, ''),
            couponCode: couponCode.trim().replace(/[<>{}]/g, ''),
            discountType,
            discountAmount: Number(discountAmount),
            minimumPurchaseAmount: Number(minimumPurchaseAmount),
            status,
            category,
            subCategory,
            expirationDate: utcExpirationDate,
            usageLimit: Number(usageLimit)
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


};




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
        if (!couponId) {
            return res.status(400).json({ error: "Can't identify Coupon ID!" });
        }

        if (
            !couponName ||
            !couponCode ||
            !discountType ||
            !discountAmount ||
            !status ||
            !category ||
            !expirationDate ||
            usageLimit === undefined         
        ) {
            return res.status(400).json({ error: "Please fill in required field!"});
        }

        if (!["PercentageOff", "FlatDiscount"].includes(discountType)) {
            return res.status(400).json({ error: "Invalid discount type" });
        }

        if (!["Active", "Inactive", "Expired"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        if (isNaN(discountAmount) || discountAmount <= 0) {
            return res.status(400).json({ error: "Discount amount must be a positive number" });
        }

        if (isNaN(minimumPurchaseAmount) || minimumPurchaseAmount < 0) {
            return res.status(400).json({ error: "Minimum purchase amount must be non-negative" });
        }

        if (isNaN(usageLimit) || usageLimit < 0) {
            return res.status(400).json({ error: "Usage limit must be non-negative" });
        }

        // Use 'end' if you want the coupon to expire at the end of the day.
        const utcExpirationDate = convertDateToUTC(expirationDate, 'end');
        // This is a more robust check for a valid Date object.
        if (isNaN(utcExpirationDate.getTime())) {
            return res.status(400).json({ error: 'Invalid expiration date' });
        }

        // Check if couponCode is unique
        // const existingCoupon = await couponModel.findOne({ couponCode });
        // if (existingCoupon) {
        //     return res.status(400).json({ error: 'Coupon code already exists' });
        // }

        const updatedFields = {
            couponName: couponName.trim().replace(/[<>{}]/g, ''),
            couponCode: couponCode.trim().replace(/[<>{}]/g, ''),
            discountType,
            discountAmount: Number(discountAmount),
            minimumPurchaseAmount: Number(minimumPurchaseAmount),
            status,
            category,
            subCategory,
            expirationDate: utcExpirationDate,
            usageLimit: Number(usageLimit),
        };

        const updatedCoupon = await couponModel.findByIdAndUpdate(
            couponId,                  // The ID of the document to update
            { $set: updatedFields }, // The fields to update
            { new: true }           // Return the updated document
          );
      
        if (!updatedCoupon) {
            return res.status(404).json({ error: "Coupon not found!"});
        } 
        
        console.log("Coupon updated successfully!");
        return res.status(200).json({ message: "Coupon updated successfully!"});

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
        if (!couponId) {
            return res.status(400).json({ error: "Coupon ID is required!" });
        }

        const coupon = await couponModel.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ error: "Coupon not found!" });
        }

        // Soft delete
        coupon.isDeleted = true;
        coupon.deletedAt = new Date();
        await coupon.save();

        return res.status(200).json({ message: "Coupon deleted successfully!" });
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