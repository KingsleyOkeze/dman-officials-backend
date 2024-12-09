require('dotenv').config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const adminRoutes = require("./routes/adminRoutes");
// const customerRoutes = require("./routes/customerRoutes");

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

mongoose.connect(process.env.MONGOB_URL).then(() => {
    console.log('DB CONNECTED!')
    app.listen(PORT, () => {
        console.log(`SERVER LISTENING ON PORT ${PORT}`)
    });
}).catch((error) => {
    console.log("Error connecting to DB:", error);
})
 









// app.post("/", populateCoupons) 





app.use("/admin", adminRoutes);
// app.use("/customer", customerRoutes);