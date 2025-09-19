// CUSTOMER PRODUCT CONTROLLERS
const productModel = require("../../models/productModel");

const fetchFlashSaleProductFunction = async (req, res) => {
    // Destructure and set default values for query parameters
    const { 
        page = 0, 
        limit = 6, 
        sortBy = 'latest', 
        searchInput, 
        subCategory 
    } = req.query;

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

        // Add subCategory filter if not "All"
        if (subCategory && subCategory !== "All") {
            query.productSubCategory = subCategory;
        }

        // Add text search to query if searchInput provided
        if (searchInput) {
            query.$text = { 
                $search: searchInput,
                $caseSensitive: false,
                $diacriticSensitive: false 
            };
        }

        // Fetch products with applied filters, sorting, and pagination
        const products = await productModel.find(query)
            .sort(sortOrder)
            .skip(page * limit)
            .limit(limit);

        // Count total (unchanged)
        const totalProducts = await productModel.countDocuments(query);
    
        // Return success response with products
        return res.status(200).json({
            success: true,
            result: products,
            totalPages: Math.ceil(totalProducts / limit),
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
    const { 
        page = 0, 
        limit = 3, 
        sortBy = 'latest', 
        searchInput, 
        subCategory 
    } = req.query;

    try {
        // Determine sort order based on sortBy parameter
        const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
        
        // Base query for all products (not deleted)
        const query = { isDeleted: false };

        // Add text search to query if searchInput provided
        if (searchInput) {
            query.$text = { 
                $search: searchInput,
                $caseSensitive: false,
                $diacriticSensitive: false 
            };
        }

        // Build separate queries for each category with subCategory filter
        const mensWearQuery = { ...query, productCategory: 'MensWear' };
        if (subCategory && subCategory !== "All") {
            mensWearQuery.productSubCategory = subCategory;
        }

        const footWearQuery = { ...query, productCategory: 'FootWear' };
        if (subCategory && subCategory !== "All") {
            footWearQuery.productSubCategory = subCategory;
        }

        // Fetch products
        const mensWear = await productModel.find(mensWearQuery)
            .sort(sortOrder)
            .skip(page * limit)
            .limit(limit);

        const footWear = await productModel.find(footWearQuery)
            .sort(sortOrder)
            .skip(page * limit)
            .limit(limit);

        // Combine results from both categories
        const exploreProducts = [...mensWear, ...footWear];

        const totalProducts = await productModel.countDocuments(query);

        // Return success response with combined products
        return res.status(200).json({
            result: exploreProducts,
            totalPages: Math.ceil(totalProducts / limit),
            message: 'Explore products retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching explore products:', error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};



const fetchTrendingNowProductFunction = async (req, res) => {
    // Destructure and set default values for query parameters
    const { 
        page = 0, 
        limit = 6, 
        sortBy = 'latest', 
        searchInput, 
        subCategory 
    } = req.query;

    try {
        // Determine sort order based on sortBy parameter
        const sortOrder = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
        
        // Base query for all products (not deleted)
        const query = { isDeleted: false };

        // Add text search to query if searchInput provided
        if (searchInput) {
            query.$text = { $search: searchInput };
        }

        // Fetch MensWear products with subCategory filter if not "All"
        const mensWearQuery = { ...query, productCategory: 'MensWear' };
        if (subCategory && subCategory !== "All") {
            mensWearQuery.productSubCategory = subCategory;
        }
        
        const mensWear = await productModel.find(mensWearQuery)
            .sort(sortOrder)
            .skip(page * limit)
            .limit(limit);

        // Fetch FootWear products with same subCategory filter
        const footWearQuery = { ...query, productCategory: 'FootWear' };
        if (subCategory && subCategory !== "All") {
            footWearQuery.productSubCategory = subCategory;
        }
        
        const footWear = await productModel.find(footWearQuery)
            .sort(sortOrder)
            .skip(page * limit)
            .limit(limit);

        // Combine results from both categories
        const trendingProducts = [...mensWear, ...footWear];

        const totalProducts = await productModel.countDocuments(query);

        // Return success response with combined products
        return res.status(200).json({
            result: trendingProducts,
            totalPages: Math.ceil(totalProducts / limit),
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
        .select('productImageUrl productName productDescription productBrand productCategory productColor productPrice')

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
    const { searchInput, limit = 12, page = 0, sortBy, subCategory } = req.query;

    try {
        // Pagination setup
        const itemsPerPage = parseInt(limit) || 12;
        const currentPage = parseInt(page) || 0;
        const skip = currentPage * itemsPerPage;

        // Base query
        let filterQuery = { isDeleted: false };
        let sortOptions = { score: { $meta: "textScore" } }; // Default to relevance

        // Add subCategory filter if not "All"
        if (subCategory && subCategory !== "All") {
            filterQuery.productSubCategory = subCategory;
        }

        // Require searchInput for search
        if (!searchInput) {
            console.log('No searchInput provided, returning empty');
            return res.status(200).json({
                success: true,
                result: [],
                totalProducts: 0,
                totalPages: 0,
                currentPage,
                message: 'No search term provided'
            });
        }

        // Add text search
        filterQuery.$text = {
            $search: searchInput,
            $caseSensitive: false,
            $diacriticSensitive: false
        };

        // Sorting: Combine relevance with user-specified sort
        if (sortBy === 'latest') {
            sortOptions = { ...sortOptions, createdAt: -1 };
        } else if (sortBy === 'oldest') {
            sortOptions = { ...sortOptions, createdAt: 1 };
        }

        // Execute query
        const products = await productModel
            .find(filterQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(itemsPerPage)
            .lean();

        // Log results for debugging
        console.log(`Search "${searchInput}" returned ${products.length} products`);

        // Count total
        const totalProducts = await productModel.countDocuments(filterQuery);

        // Response
        return res.status(200).json({
            success: true,
            result: products,
            totalProducts,
            totalPages: Math.ceil(totalProducts / itemsPerPage),
            currentPage,
            message: products.length ? 'Search results retrieved' : 'No matching products found'
        });
    } catch (error) {
        console.error("Error searching products:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error!" });
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

    console.log('fetch by category called', { category, subCategory, sortBy, page, limit, searchInput });

    try {
        // Validate category
        const validCategories = ['MensWear', 'Accessories', 'FootWear', 'TrendingNow', 'Explore', 'Sale', 'Search'];
        if (category && !validCategories.includes(category)) {
            console.log(`Invalid category: ${category}`);
            return res.status(400).json({
                success: false,
                result: [],
                totalPages: 0,
                error: `Invalid category: ${category}. Must be one of ${validCategories.join(', ')}`
            });
        }

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
        if (category === "Search") {
            req.query.page = page;
            req.query.limit = limit;
            req.query.sortBy = sortBy;
            req.query.searchInput = searchInput;
            return await searchProductFunction(req, res);
        }

        // Default filter
        const query = { isDeleted: false };
        if (category) query.productCategory = category;

        // Add subCategory filter if not "All"
        if (subCategory && subCategory !== "All") {
            query.productSubCategory = subCategory;
        }

        // Sorting
        let sortOptions = { createdAt: -1 };
        if (sortBy === 'latest') sortOptions = { createdAt: -1 };
        if (sortBy === 'oldest') sortOptions = { createdAt: 1 };

        // Fetch products
        const products = await productModel
            .find(query)
            .sort(sortOptions)
            .skip(parseInt(page) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        const totalProductsCountInDb = await productModel.countDocuments(query);

        // Log result count for debugging
        console.log(`Fetched ${products.length} products for category: ${category || 'none'}`);

        return res.status(200).json({
            success: true,
            result: products,
            totalPages: Math.ceil(totalProductsCountInDb / parseInt(limit)),
            message: products.length ? 'Successfully fetched products!' : `No products found for category: ${category || 'none'}`
        });

    } catch (error) {
        console.error("Server Error fetching products", error);
        return res.status(500).json({ success: false, error: "Internal Server Error!" });
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