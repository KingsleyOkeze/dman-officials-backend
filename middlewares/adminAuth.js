const jwt = require("jsonwebtoken");
const adminModel = require("../models/adminModel");
require("dotenv").config();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log('Authorization header:', authHeader);
    
    if (!authHeader) {
      console.log("No Authorization header found for Admin.");
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log('Token:', token);

    const decoded = jwt.verify(token, accessTokenSecret);

    if (!decoded) {
      console.log("Session token expired or invalid!");
      return res.status(401).json({ error: "Session token expired or invalid!" });
    }

    console.log('Decoded token:', decoded);
  
    const user = await adminModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    const allowedRoles = ["Admin"];
    if (!allowedRoles.includes(decoded.role)) {
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

module.exports = adminAuth;
