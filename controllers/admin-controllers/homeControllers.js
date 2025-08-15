const orderModel = require("../../models/orderModel");
const productModel = require("../../models/productModel");


const searchProductFunction = async (req, res) => {
    // 1. Extract query parameters from request
    const { searchInput, limit, page } = req.query;
  
    try {
        // Set up pagination with defaults
        const itemsPerPage = parseInt(limit) || 12;
        const currentPage = parseInt(page) || 0;     
        const skip = currentPage * itemsPerPage;    
    
        // Build the base filter - always exclude deleted items
        const filters = { isDeleted: false }; 
        
        // 4. Add text search capability if search input exists
        if (searchInput) {
            filters.$text = { 
                $search: searchInput,
                $caseSensitive: false,   // Case-insensitive matching
                $diacriticSensitive: false // Ignores accent marks
            };
        } 
    
        // Execute the database query with:
        const products = await productModel.find(filters)
          .sort({
              ...(searchInput ? { score: { $meta: "textScore" } } : {}), // Boost text matches
              createdAt: -1 // Secondary sort: newest first
          })
          .skip(skip)
          .limit(itemsPerPage);
    
        // Get total count for pagination calculation
        const totalProducts = await productModel.countDocuments(filters);
    
        // Return standardized response with:
        return res.status(200).json({
          success: true,
          result: products,
          totalProducts,
          searchTotalPages: Math.ceil(totalProducts / itemsPerPage),
          currentPage,
        });
        
    } catch (error) {
        console.error("Search Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const fetchHomePageProductStatusesFunction = async (req, res) => {
    
    console.log('called home product statuses');
    try {
        const allProducts = await productModel.find({})

        if (!allProducts) {
            return res.status(401).json({ error: "Couldn't fetch product record!"})
        }

        const availableStock = allProducts.filter((product) => product.productStatus === "available");
        const outOfStock = allProducts.filter((product) => product.productStatus === "out of stock");
        const limitedStock = allProducts.filter((product) => product.productStatus === "limited stock");
        
        return res.status(200).json({
            message: "Successfully fetched home page product statuses!",
            allProducts: allProducts.length,
            outOfStock: outOfStock.length,
            limitedStock: limitedStock.length,
            availableStock: availableStock.length
        });

    } catch (error) {            
        console.log("err fetching home page product statuses", error)
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}


const fetchHomePageOrderStatusesFunction = async (req, res) => {

    console.log('called home order statuses')
    try {
        const allOrders = await orderModel.find({});

        if (!allOrders) {
            return res.status(401).json({ error: "Couldn't fetch home page order status!"})
        }

        const pendingOrders = allOrders.filter((order) => order.orderStatus === "Pending");
        const processingOrders = allOrders.filter((order) => order.orderStatus === "Processing");
        const cancelledOrders = allOrders.filter((order) => order.orderStatus === "Cancelled");
        const shippedOrders = allOrders.filter((order) => order.orderStatus === "Shipped");
        const deliveredOrders = allOrders.filter((order) => order.orderStatus === "Delivered");
       
        return res.status(200).json({
            message: "Successfully fetched dashboard order statuses!",
            allOrders: allOrders.length,
            pendingOrders: pendingOrders.length,
            processingOrders: processingOrders.length,
            cancelledOrders: cancelledOrders.length,
            shippedOrders: shippedOrders.length,
            deliveredOrders: deliveredOrders.length
        });

    } catch (error) {            
        console.log("err fetching home page order statuses", error)
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}





module.exports = {
    searchProductFunction,
    fetchHomePageProductStatusesFunction,
    fetchHomePageOrderStatusesFunction
}