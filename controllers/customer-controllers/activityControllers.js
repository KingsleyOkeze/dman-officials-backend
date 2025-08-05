const customerActivityModel = require("../../models/activityLogsModel");

const trackTabActivityFunction = async (req, res) => {
    const { customerId, activity, duration } = req.body;
    console.log("received activity log", customerId, activity, duration)
    try {
        await customerActivityModel.create({
            customerRef: customerId, 
            activityType: activity,
            sessionDuration: duration || 0,
        });
        console.log("saved received activity log")
        return res.status(200).json({ message: "Activity recorded successfully" });
    } catch (error) {
        console.error("Error tracking tab activity:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    trackTabActivityFunction
};