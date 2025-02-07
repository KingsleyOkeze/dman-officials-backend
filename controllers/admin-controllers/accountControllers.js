const jwt = require('jsonwebtoken');
const { accessTokenSecret } = require("../../config/config");
const activityLogsModel = require("../../models/activityLogsModel");
const adminModel = require("../../models/adminModel");

const fetchAdminProfileFunction = async (req, res) => {
    const { accessToken } = req.params;

    try {
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token is required!' });
        }
      
        // 2. Verify and decode the token to extract admin ID
        const decoded = jwt.verify(accessToken, accessTokenSecret); 
          
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired access token!' });
        }
      
        const adminId = decoded.userId; 

        const admin = await adminModel.findById(adminId); // Ensure token is decoded to get the ID
    
        if (!admin) return res.status(404).json({ error: "Admin not found!" });
    
        return res.json({
          firstName: admin.firstName,
          lastName: admin.lastName,
          phoneNumber: admin.phoneNumber,
        });

    } catch (error) {
        console.log("error fetching admin profile", error)
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};


const updateAdminProfileFunction = async (req, res) => {
    const { accessToken } = req.params;
    const { fullName, lastName, phoneNumber } = req.body;
    try {
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token is required!' });
        }
      
          // 2. Verify and decode the token to extract admin ID
          const decoded = jwt.verify(accessToken, accessTokenSecret);
          
          if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired access token!' });
          }
      
          const adminId = decoded.userId; 
      
          const updates = { fullName, lastName, phoneNumber };
      
          // 4. Find the admin by id and update their profile
          const updatedAdmin = await adminModel.findByIdAndUpdate(
            adminId,
            { $set: updates },
            { new: true, runValidators: true }
          );
      
          if (!updatedAdmin) {
            return res.status(404).json({ error: 'Admin not found!' });
          }
      
          // 5. Return the updated admin profile
          return res.status(200).json({
            message: 'Profile updated successfully.',
            result: updatedAdmin,
          });

    } catch (error) {
        console.log("err updating admin profile", error)
        return res.status(500).json({ error: "Internal Server Error!"})
    }
};


const fetchCustomersActivity = async (req, res) => {
   const page = req.query.page || 0;
   const limit = req.query.limit || 7;

    try {
        const activities = await activityLogsModel
          .find({})
          .sort({ createdAt: -1 })
          .skip(page * limit)
          .limit(limit)
          .populate("customerRef", "firstName lastName");
  
        if (!activities) {
            return res.status(404).json({ error: "No activity found" });
        }
  
        // Get the exact document count
        const totalCouponsCountInDb = await activityLogsModel.countDocuments(); 
        console.log("total document in db", totalCouponsCountInDb);

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalCouponsCountInDb / limit); 
        console.log("total pages for customers activities is", totalPages);

        return res.status(200).json({activities, totalPages});
    } catch (error) {
        console.log("Error fetching customer activity", error)
        return res.status(500).json({ error: "Internal Server Error", error });
    }
};

  
module.exports = {
    fetchAdminProfileFunction,
    updateAdminProfileFunction,
    fetchCustomersActivity
}