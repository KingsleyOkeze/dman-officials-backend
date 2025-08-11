// CUSTOMER PRODUCT CONTROLLERS
const productModel = require("../../models/productModel");

const fetchFlashSaleProductFunction = async (req, res) => {
    // Destructure and set default values for query parameters
    const { page = 0, limit = 6, sortBy = 'latest', searchInput } = req.query;

    try {
        // Get current date to check for active flash sales
        const currentDate = new Date();
        
        // Determine sort order based on sortBy parameter
        const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

        // Base query for flash sale products:
        // - Must have timer enabled
        // - Timer must not be expired
        // - Not deleted
        const query = {
            addedTimer: true,
            timerExpiryDate: { $gt: currentDate },
            isDeleted: false
        };

        // Add text search to query if searchInput provided
        if (searchInput) {
            query.$text = { $search: searchInput };
        }

        // Fetch products with applied filters, sorting, and pagination
        const products = await productModel.find(query)
            .sort(sortOrder)
            .skip(page * limit)
            .limit(limit);

        // Return success response with products
        return res.status(200).json({
            success: true,
            result: products,
            message: products.length 
                ? 'Flash sale products found' 
                : 'No active flash sales currently available'
        });

    } catch (error) {
        console.error('Error fetching flash sales:', error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};


const fetchExploreProductsFunction = async (req, res) => {
    // Destructure and set default values for query parameters
    const { page = 0, limit = 3, sortBy = 'latest', searchInput } = req.query;

    try {
        // Determine sort order based on sortBy parameter
        const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
        
        // Base query for all products (not deleted)
        const query = { isDeleted: false };

        // Add text search to query if searchInput provided
        if (searchInput) {
            query.$text = { $search: searchInput };
        }

        // Fetch MensWear products with applied filters
        const mensWear = await productModel.find({ 
            ...query, 
            productCategory: 'MensWear' 
        })
        .sort(sortOrder)
        .skip(page * limit)
        .limit(limit);

        // Fetch FootWear products with same filters
        const footWear = await productModel.find({ 
            ...query, 
            productCategory: 'FootWear' 
        })
        .sort(sortOrder)
        .skip(page * limit)
        .limit(limit);

        // Combine results from both categories
        const exploreProducts = [...mensWear, ...footWear];

        // Return success response with combined products
        return res.status(200).json({
            result: exploreProducts,
            message: 'Explore products retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching explore products:', error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};



const fetchTrendingNowProductFunction = async (req, res) => {
    // Destructure and set default values for query parameters
    const { page = 0, limit = 6, sortBy = 'latest', searchInput } = req.query;

    try {
        // Determine sort order based on sortBy parameter
        const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
        
        // Base query for all products (not deleted)
        const query = { isDeleted: false };

        // Add text search to query if searchInput provided
        if (searchInput) {
            query.$text = { $search: searchInput };
        }

        // Fetch MensWear products with applied filters
        const mensWear = await productModel.find({ 
            ...query, 
            productCategory: 'MensWear' 
        })
        .sort(sortOrder)
        .skip(page * limit)
        .limit(limit);

        // Fetch FootWear products with same filters
        const footWear = await productModel.find({ 
            ...query, 
            productCategory: 'FootWear' 
        })
        .sort(sortOrder)
        .skip(page * limit)
        .limit(limit);

        // Combine results from both categories
        const trendingProducts = [...mensWear, ...footWear];

        // Return success response with combined products
        return res.status(200).json({
            result: trendingProducts,
            message: 'Trending products retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching trending products:', error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};

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
    const { searchInput, limit, page, sortBy } = req.query;

    try {
        // Pagination setup (unchanged from your original)
        const itemsPerPage = parseInt(limit) || 12;
        const currentPage = parseInt(page) || 0;
        const skip = currentPage * itemsPerPage;

        // Default filter (unchanged)
        let filterQuery = { isDeleted: false };
        let sortOptions = { createdAt: -1 }; // default newest first

        // Sorting logic (unchanged)
        if (sortBy === 'latest') {
            sortOptions = { createdAt: -1 };
        } else if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 };
        }
    
        // Improved search using MongoDB text index
        if (searchInput) {
            filterQuery.$text = { 
                $search: searchInput,
                $caseSensitive: false,
                $diacriticSensitive: false 
            };
            // Sort by relevance score if no sort specified
            if (!sortBy) {
                sortOptions = { score: { $meta: "textScore" } };
            }
        }
    
        // Query execution (same as original but more efficient)
        const products = await productModel.find(filterQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(itemsPerPage);
    
        // Count total (unchanged)
        const totalProducts = await productModel.countDocuments(filterQuery);

        // Response format (unchanged)
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
};


const fetchProductsByCategoryFunction = async (req, res) => {
    const { 
        category, 
        subCategory, 
        sortBy,
        page = 0,
        limit = 12,
        searchInput
    } = req.query;
console.log('fetch by category called', category, 
        subCategory, 
        sortBy,
        page,
        limit,
        searchInput)
    try {
        // Handle special categories
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

        // Default filter 
        const query = { isDeleted: false };
        if (category) query.productCategory = category;
        if (subCategory) query.productSubCategory = subCategory;

        // Sorting
        let sortOptions = { createdAt: -1 };
        if (sortBy === 'latest') sortOptions = { createdAt: -1 };
        if (sortBy === 'oldest') sortOptions = { createdAt: 1 };

        // Added .lean() for better performance
        const products = await productModel.find(query)
            .sort(sortOptions)
            .skip(parseInt(page) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        const totalProductsCountInDb = await productModel.countDocuments(query);

        return res.status(200).json({
            result: products,
            totalPages: Math.ceil(totalProductsCountInDb / parseInt(limit)),
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