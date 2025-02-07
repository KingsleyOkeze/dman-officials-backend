const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
    customerRef: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "customers", 
        required: true 
    },
    activityType: { 
        type: String, 
        required: true 
    }, // "login", "logout", "page_view"
    sessionDuration: { 
        type: Number, 
        default: 0 
    }, // Duration in seconds
    ipAddress: { 
        type: String 
    }, // Optional: Store IP address
    userAgent: { 
        type: String 
    }, // Optional: Store browser info
}, { timestamps: true });

const activityLogsModel = mongoose.model("activityLogs", activityLogSchema);

module.exports = activityLogsModel;
