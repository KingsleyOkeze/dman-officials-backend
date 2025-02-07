const orderModel = require("../../models/orderModel");
const productModel = require("../../models/productModel");


const searchProductFunction = async (req, res) => {
    // Extract the search input from query
    const { searchInput, limit, page,  } = req.query;
  
    try {
        // Default values for pagination
        const itemsPerPage = parseInt(limit) || 12; // Default to 12 items per page
        const currentPage = parseInt(page) || 0;
        const skip = (currentPage) * itemsPerPage;
    
        // Build the search filter
        const filters = {};
        if (searchInput) {
            filters.$or = [
              { productName: { $regex: searchInput, $options: "i" } }, // Case-insensitive match on product name
              { productCategory: { $regex: searchInput, $options: "i" } }, // Case-insensitive match on category
              { productSubCategory: { $regex: searchInput, $options: "i" } }  // Case-insensitive match on subcategory
            ];
        } 
    
        // Query the database
        const products = await productModel.find(filters)
          .sort({createdAt: -1})
          .skip(skip)
          .limit(itemsPerPage);
    
        // Count total products for pagination
        const totalProducts = await productModel.countDocuments(filters);
    
        console.log('search result is', products);
        // Send the results to the client
        return res.status(200).json({
          success: true,
          result: products,
          totalProducts,
          searchTotalPages: Math.ceil(totalProducts / itemsPerPage),
          currentPage,
        });
      } catch (error) {
        console.error("Error searching products:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
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