// CUSTOMER PRODUCT CONTROLLERS
const productModel = require("../../models/productModel");

const fetchFlashSaleProductFunction = async (req, res) => {
    const { page = 0, limit = 6 } = req.query; // Extract page and limit from req.query, with defaults

    try {
        // Get the current date and time
        const currentDate = new Date();

        // Fetch products with `addedTimer` set to true and check if `timerExpiryDate` has not expired
        const flashSaleProducts = await productModel.find({
            addedTimer: true,
            timerExpiryDate: { $gt: currentDate } // Only products with expiry dates in the future
        })
        .sort({ createdAt: -1 }) // Sort by creation date (newest first)
        .skip(page * limit)
        .limit(limit); // Limit to the limit value

        console.log("stuff on sale", flashSaleProducts);

        // Check if any products were found
        if (flashSaleProducts.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active flash sale products available right now.',
                flashSaleProducts: []
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Flash sale products fetched successfully.',
            result: flashSaleProducts
        });
    } catch (error) {
        console.error('Error fetching flash sale products:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch flash sale products.',
        });
    }
};





const fetchExploreProductsFunction = async (req, res) => {
    const { page = 0, limit = 6 } = req.query; // Extract page and limit from req.query, with defaults

    try {
        // Fetch 3 random products from each category
        const menWearProducts = await productModel
            .aggregate([
                { $match: { productCategory: 'MenWear' } }, // Filter category
                { $sample: { size: 3 } } // Randomly select 3 documents
            ]);

        const footwearProducts = await productModel
            .aggregate([
                { $match: { productCategory: 'FootWear' } },
                { $sample: { size: 3 } }
            ]);
        
        // Combine all results into a single array
        const exploreProducts = [
            ...menWearProducts,
            ...footwearProducts
        ];

        return res.status(200).json({
            success: true,
            message: 'Explore products fetched successfully.',
            result: exploreProducts,
        });
    } catch (error) {
        console.error('Error fetching explore products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch explore products.',
        });
    }
};





const fetchTrendingNowProductFunction = async (req, res) => {
    const { page = 0, limit = 6 } = req.query; // Extract page and limit from req.query, with defaults

    try {
        
        const mensWearLatestProducts = await productModel
            .find({ productCategory: 'MensWear' })
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit); 

        const footwearLatestProducts = await productModel
            .find({ productCategory: 'FootWear' })
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit); 

        let combinedProductCategories = [
            ...mensWearLatestProducts, 
            ...footwearLatestProducts
        ];    

        // console.log("trending now products", combinedProductCategories)
        return res.status(200).json({
            result: combinedProductCategories, 
            message: "Successfully fetched trending now products!"
        });

    } catch (error) {
        console.log("Server Error fetching orders", error)
        return res.status(500).json({ error: "Internal Server Error!"})
    }
}



const searchProductFunction = async (req, res) => {
    // Extract the search input from query
    const { searchInput, limit, page, sortBy } = req.query;

    try {
    
        // Default values for pagination
        const itemsPerPage = parseInt(limit) || 12; // Default to 12 items per page
        const currentPage = parseInt(page) || 0;
        const skip = (currentPage) * itemsPerPage;

        let sortOptions = {};  // Set default sorting options
        
        if (sortBy === 'latest') {
            sortOptions = { createdAt: -1 };  // Sort by latest (descending)
        } else if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 };  // Sort by oldest (ascending)
        }
    
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
          .sort(sortOptions)
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
          totalPages: Math.ceil(totalProducts / itemsPerPage),
          currentPage,
        });
      } catch (error) {
        console.error("Error searching products:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


const fetchProductsByCategoryFunction = async (req, res) => {
    const { 
        category, 
        subCategory, 
        sortBy,
        page = 0,
        limit = 12,
        searchInput
    } = req.query;  // Destructure the query parameters
    console.log('category function called', category,  subCategory, sortBy, page, limit)
    try {
        // Let check if category is other category not defined in the
        // enum of productCategory in our productModel e.g "TrendingNow"
        // "NewArrival", "Explore" "FlashSale" "search" etc...
        if (category === "TrendingNow") {
             // Pass page and limit directly to fetchTrendingNowProductFunction
             req.query.page = page; // Ensure the page value is in req.query
             req.query.limit = limit; // Ensure the limit value is in req.query
 
             // Call the function with req and res
             return await fetchTrendingNowProductFunction(req, res);
        }

        if (category === "Explore") {
            req.query.page = page; 
            req.query.limit = limit;

            return await fetchExploreProductsFunction(req, res);
        }

        if (category === "Sale") {
            req.query.page = page; 
            req.query.limit = limit;

            return await fetchFlashSaleProductFunction(req, res);
        }

        if (category === "search") {
            req.query.page = page; 
            req.query.limit = limit;
            req.query.sortBy = sortBy;
            req.query.searchInput = searchInput;

            // Call the function with req and res
            return await searchProductFunction(req, res);
       }

        const query = {};  // Initialize the query filter
        
        // If a category is selected, add it to the filter
        if (category) {
            query.productCategory = category;
        }

        // Add subCategory filter if it exists
        if (subCategory) {
            query.productSubCategory = subCategory;
        }


        let sortOptions = {};  // Set default sorting options
        
        if (sortBy === 'latest') {
            sortOptions = { createdAt: -1 };  // Sort by latest (descending)
        } else if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 };  // Sort by oldest (ascending)
        }


        // Fetch the products from MongoDB with the applied filters and sorting
        const products = await productModel.find(query).sort(sortOptions);

        // Get the exact document count
        const totalProductsCountInDb = await productModel.countDocuments(); 
        console.log("total document in db", totalProductsCountInDb);
        const numberOfProductsToReturn = limit;

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalProductsCountInDb / numberOfProductsToReturn); 
        console.log("total pages for this product category", totalPages);

        return res.status(200).json({
            result: products, 
            totalPages,
            message: "Successfully fetched Orders!"
        });

    } catch (error) {
        console.log("Server Error fetching orders", error)
        return res.status(500).json({ error: "Internal Server Error!"})
    }

};




const fetchProductDetailsFunction = async (req, res) => {
    const { productId } = req.params;

    try {
        if (!productId) {
            return res.status(400).json({ error: "Failed to identify product Id"});
        }

        // Check if the product exists
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({ error: "Product not found!" });
        }
// console.log('successfully fetch product details!', product)
        return res.status(200).json({
            message: 'Successfully fetched product details!',
            result: product
        });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error!"});
    }
}




module.exports = {
    fetchProductsByCategoryFunction,
    fetchFlashSaleProductFunction,
    fetchExploreProductsFunction,
    fetchTrendingNowProductFunction,
    fetchProductDetailsFunction,
    searchProductFunction
};