const jwt = require("jsonwebtoken");
const customerModel = require("../models/customerModel");
require("dotenv").config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const customerAuth = async (req, res, next) => {

    try {
        const authHeader = req.header("Authorization");
        console.log('Authorization header:', authHeader);
    
        if (!authHeader) {
            console.log("No Authorization header found for Customer!");
            return res.status(401).json({ error: "No token provided!" });
        }

        const token = authHeader.replace("Bearer ", "");
        console.log('Token:', token);

        const decoded = jwt.verify(token, accessTokenSecret);

        if (!decoded) {
            return res.status(401).json({ error: "Session token expired or invalid!" });
        }

        console.log('decoded is', decoded)

        const user = await customerModel.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        const allowedRoles = ["Customer"];
        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: "Access forbidden: Insufficient permissions!" });
        }
      
        next(); // Continue to the next middleware or route handler
    } catch (error) {
        console.error("Unexpected error during authentication:", error);
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Invalid or expired token!" });
        }

        return res.status(500).json({ error: "Internal server error during authentication!" });
        
    }
};

module.exports = customerAuth;
