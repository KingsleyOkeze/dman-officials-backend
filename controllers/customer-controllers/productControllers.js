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
            timerExpiryDate: { $gt: currentDate }, // Only products with expiry dates in the future
            isDeleted: false
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
                { 
                    $match: { 
                        productCategory: 'MenWear',
                        isDeleted: false // Exclude deleted products
                    } 
                }, // Filter category
                { $sample: { size: 3 } } // Randomly select 3 documents
            ]);

        const footwearProducts = await productModel
            .aggregate([
                { 
                    $match: { 
                        productCategory: 'FootWear',
                        isDeleted: false // Exclude deleted products
                    } 
                },
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
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch explore products.',
        });
    }
};





const fetchTrendingNowProductFunction = async (req, res) => {
    const { page = 0, limit = 6 } = req.query; // Extract page and limit from req.query, with defaults

    try {
        
        const mensWearLatestProducts = await productModel
            .find({ productCategory: 'MensWear', isDeleted: false })
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit); 

        const footwearLatestProducts = await productModel
            .find({ productCategory: 'FootWear', isDeleted: false })
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


const fetchRecommendedProductFunction = async (req, res) => {
    const { productId } = req.params;
    console.log("recommended of ", productId)
    try {
        const currentProduct = await productModel.findById(productId);

        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Build a query for similar products
        const recommendedProducts = await productModel.find({
            $or: [
                // Priority 1: Same sub-category
                { productSubCategory: currentProduct.productSubCategory, _id: { $ne: currentProduct._id } },
                // Priority 2: Same category
                { productCategory: currentProduct.productCategory, _id: { $ne: currentProduct._id } },
                // Priority 3: Same brand
                { productBrand: currentProduct.productBrand, _id: { $ne: currentProduct._id } }
            ]
        }).limit(8) // Limit to a reasonable number of recommendations
        .select('productImageUrl productName productDescription productColor productPrice')

        // Fallback to random if no similar products are found
        if (recommendedProducts.length === 0) {
            const randomProducts = await productModel.aggregate([
                { $sample: { size: 8 } },
                { $project: { productImageUrl: 1, productName: 1, productDescription: 1, productColor: 1, productPrice: 1 } }
            ]);
            return res.status(200).json({ products: randomProducts });
        }

        return res.status(200).json({ products: recommendedProducts });
    } catch (error) {
        console.error("Errror fetching recommended product", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


const searchProductFunction = async (req, res) => {
    // Extract the search input from query
    const { searchInput, limit, page, sortBy } = req.query;

    try {
    
        // Default values for pagination
        const itemsPerPage = parseInt(limit) || 12; // Default to 12 items per page
        const currentPage = parseInt(page) || 0;
        const skip = (currentPage) * itemsPerPage;

        // Default filter: exclude deleted products
        let filterQuery = { isDeleted: false };
        let sortOptions = { createdAt: -1 }; // default to newest first

        // Sorting logic
        if (sortBy === 'latest') {
            sortOptions = { createdAt: -1 }; // latest first
        } else if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 }; // oldest first
        }
    
        // Build the search filter
        if (searchInput) {
            filterQuery.$or = [
              { productName: { $regex: searchInput, $options: "i" } }, // Case-insensitive match on product name
              { productCategory: { $regex: searchInput, $options: "i" } }, // Case-insensitive match on category
              { productSubCategory: { $regex: searchInput, $options: "i" } }  // Case-insensitive match on subcategory
            ];
        } 
    
        // Query the database
        const products = await productModel.find(filterQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(itemsPerPage);
    
        // Count total products for pagination
        const totalProducts = await productModel.countDocuments(filterQuery);
    
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
    } = req.query;

    console.log('category function called', category, subCategory, sortBy, page, limit);

    try {
        // Special categories (delegate to other functions)
        if (category === "TrendingNow") {
            req.query.page = page;
            req.query.limit = limit;
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
            return await searchProductFunction(req, res);
        }

        // Default filter: exclude deleted products
        const query = { isDeleted: false };

        // Add category filter
        if (category) {
            query.productCategory = category;
        }

        // Add subCategory filter
        if (subCategory) {
            query.productSubCategory = subCategory;
        }

        // Sorting options
        let sortOptions = { createdAt: -1 }; // default newest first
        if (sortBy === 'latest') {
            sortOptions = { createdAt: -1 };
        } else if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 };
        }

        // Pagination
        const skip = parseInt(page) * parseInt(limit);

        // Fetch products
        const products = await productModel.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        // Count total
        const totalProductsCountInDb = await productModel.countDocuments(query);
        const totalPages = Math.ceil(totalProductsCountInDb / parseInt(limit));

        return res.status(200).json({
            result: products,
            totalPages,
            message: "Successfully fetched products!"
        });

    } catch (error) {
        console.log("Server Error fetching products", error);
        return res.status(500).json({ error: "Internal Server Error!" });
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
    fetchRecommendedProductFunction,
    fetchProductDetailsFunction,
    searchProductFunction
};