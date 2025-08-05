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

// cors options
const cors_options = {
	origin: process.env.CLIENT_URL || 'http://localhost:3000',
	methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

app.use(express.json());
app.use(cors(cors_options));
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
