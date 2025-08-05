require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require('cookie-parser');
const mongoose = require("mongoose");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const couponExpirationJob = require("./jobs/couponExpirationJob");
const productExpirationJob = require("./jobs/productExpirationJob");
const PORT = process.env.PORT || 5000;

// Define the list of allowed origins
// Use environment variables with sensible defaults for development
const allowedOrigins = [
    // Use the value from .env or default to localhost:3000
    process.env.CUSTOMER_CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_CLIENT_URL || 'http://localhost:3000',
    // Add any other specific origins you need to allow permanently
    // e.g., 'https://your-production-domain.com'
];

// Configure CORS options using a function for robust origin checking
const corsOptions = {
    origin: function (origin, callback) {
        // The 'origin' argument is the value of the Origin header sent by the browser.
        // It will be 'undefined' for same-origin requests or requests from tools like curl/Postman (sometimes).

        // Allow requests with no origin (like mobile apps or server-to-server requests)
        // OR allow requests if the origin is in our list of allowed origins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            // Origin is allowed
            callback(null, true);
        } else {
            // Origin is not allowed
            console.warn(`CORS blocked origin: ${origin}`); // Optional: Log blocked origins
            callback(new Error('Not allowed by CORS'));
        }
    },
    // Specify allowed HTTP methods for cross-origin requests
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    // Specify allowed headers for cross-origin requests
    // Ensure this includes any custom headers your frontend might send
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Allow cookies and authorization headers to be sent cross-origin
    // IMPORTANT: When true, the 'origin' function MUST return a specific origin, not '*'
    credentials: true,
    // Optional: Set success status for preflight OPTIONS requests (some legacy browsers need 204)
    optionsSuccessStatus: 204
};


app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
  

mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log('DB CONNECTED!')
    app.listen(PORT, () => {
        console.log(`SERVER LISTENING ON PORT ${PORT}`)
    });
    // Initialize Coupon Expiration Cron Job
    couponExpirationJob();
    // Initialize Product Expiration Cron Job
    productExpirationJob();
}).catch((error) => {
    console.log("Error connecting to DB:", error);
})
 


app.use("/admin", adminRoutes);
app.use("/customer", customerRoutes);
