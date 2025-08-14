// ADMIN PRODUCT CONTROLLERS
const path = require("path");
const fs = require('fs');
const { cloudinary } = require('../../config/config');
const productModel = require("../../models/productModel");
const cartModel = require("../../models/cartModel");

const fetchProductsFunction = async (req, res) => {
    const page = req.query.page || 0;
    const numberOfProductsToReturn = req.query.limit || 7;

    try {
      // Get the portions of the pagination requested
      const allProducts = await productModel.find({ isDeleted: false })
          .sort({ createdAt: -1 })
          .skip(page * numberOfProductsToReturn)
          .limit(numberOfProductsToReturn)

      if (!allProducts) {
          console.log("Failed fetching orders", error)
          return res.status(401).json({ error: "Failed to fetch all orders"})
      }

      // Get the exact document count
      const totalProductsCountInDb = await productModel.countDocuments({ isDeleted: false }); 
      console.log("total document in db", totalProductsCountInDb);

      // Calculate the total number of pages
      const totalPages = Math.ceil(totalProductsCountInDb / numberOfProductsToReturn); 
      console.log("total pages", totalPages);

      return res.status(200).json({
        result: allProducts, 
        totalPages, 
        message: "Successfully fetched Orders!"
      });

    } catch (error) {
      console.log("Server Error fetching orders", error)
      return res.status(500).json({ error: "Internal Server Error!"})
    }
};

const addProductFunction = async (req, res) => {
    const { 
        productName,
        productDescription,
        productCategory,
        productSubCategory,
        productSize,
        productColor,
        productBrand,
        productPrice,
        productOfferPrice,
        productQuantity,
        productAddedTimer
    } = req.body;
    
    console.log('req is', req.files);
    
    let imageUrls = []; // Initialize imageUrls at the top

    try {
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            console.error('No files uploaded', req.files);
            return res.status(400).json({ error: 'Please upload at least one image' });
        }

        // Use a normal for loop for file uploads
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

   
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(file.path, {
                transformation: [
                    { width: 1200, crop: "limit" }, // Resize (max width: 1200px)
                    { fetch_format: 'auto' }, // = f_auto (WebP/AVIF if supported)
                    { quality: 'auto' }, // = q_auto (smart quality adjustment)
                ],
            });

            // Validate the result
            if (!result || !result.secure_url) {
                console.error('Cloudinary upload failed for file:', file.path);
                return res.status(500).json({ error: 'Failed to upload image(s)' });
            }
            
            // Add URL to the array
            imageUrls.push(result.secure_url);
            console.log('Uploaded image URL:', result.secure_url);


            // Delete the file from local storage
            fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
                else console.log(`File ${file.path} deleted successfully`);
            });
            
        }

        let finalProductSize = req.body.productSize;
        if (finalProductSize === undefined) {
            finalProductSize = [];
        } else if (!Array.isArray(finalProductSize)) {
            finalProductSize = [finalProductSize];
        }

        let finalProductColor = req.body.productColor;
        if (finalProductColor === undefined) {
            finalProductColor = [];
        } else if (!Array.isArray(finalProductColor)) {
            finalProductColor = [finalProductColor];
        }

        console.log('size ish', finalProductSize.length, finalProductSize)
        if (
            !productName ||
            !productDescription ||
            !productCategory ||
            !productSubCategory ||
            finalProductSize.length === 0 ||
            finalProductColor.length === 0 ||
            !productBrand ||
            !productPrice ||
            !productOfferPrice ||
            !productQuantity 
        ) {
            return res.status(400).json({ error: "Please ensure that all necessary field are filled!"});
        }

        // When appending an object to FormData, use JSON.stringify() to convert it into a JSON string. 
        // This ensures the object is correctly transmitted and can be parsed on the server side.
        const timer = typeof productAddedTimer === 'string' ? JSON.parse(productAddedTimer) : productAddedTimer;

        // Extract and validate productTimer
        const { hrs = 0, min = 0, sec = 0 } = timer || {};
        if (
            isNaN(hrs) || isNaN(min) || isNaN(sec) ||
            hrs < 0 || min < 0 || sec < 0
        ) {
            return res.status(400).json({ error: "Timer values must be non-negative numbers. Please check your input." });
        }

        // Determine if the timer has been added
        const addedTimer = hrs > 0 || min > 0 || sec > 0;

        // Calculate expiry date only if timer is set
        let expiryDate = null;
        let setProductStatus = "Available"
        if (addedTimer) {
            const timerDurationInSeconds = (hrs * 3600) + (min * 60) + sec;
            expiryDate = new Date(Date.now() + timerDurationInSeconds * 1000);
            setProductStatus = "LimitedStock"
        }

        const newProduct = new productModel({ 
            productImageUrl: imageUrls,
            productName,
            productDescription,
            productCategory,
            productSubCategory,
            productSize: finalProductSize,
            productColor: finalProductColor,
            productBrand,
            productPrice,
            productOfferPrice,
            productQuantity,
            addedTimer,
            productAddedTimer: timer,
            timerExpiryDate: expiryDate,
            productStatus: setProductStatus
        });

        const savedProduct = await newProduct.save();

        if (!savedProduct) {
            console.log( "Failed to save product!")
            return res.status(401).json({ error: "Failed to save product!"})
        }

        console.log("Product uploaded successfully!", savedProduct);
        return res.status(201).json({ result: savedProduct, message: 'Product uploaded successfully!' });
  
    } catch (error) {
        console.log("Error adding product", error);
        // Delete uploaded images from Cloudinary on error
        if (imageUrls.length > 0) {
            for (const imageUrl of imageUrls) {
                const publicId = imageUrl.split('/').slice(-3).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId, (err, result) => {
                    if (err) console.error(`Error deleting image: ${imageUrl}`, err);
                    else console.log(`Deleted image: ${imageUrl}`, result);
                });
            }
        }

        return res.status(500).json({ error: "Internal Server Error!"})
    }

};



const editProductFunction = async (req, res) => {
    const { productId } = req.params;
    const {
        productName,
        productDescription,
        productCategory,
        productSubCategory,
        productSize,
        productColor,
        productBrand,
        productPrice,
        productOfferPrice,
        productQuantity,
        productAddedTimer,
        existingImages
    } = req.body;

    let imageUrls = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]).filter(url => url) : [];

    try {
        // Retrieve the existing product
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found!" });
        }

        // If new files are uploaded, process them
        if (req.files && req.files.length > 0) {
            // Delete old images from Cloudinary if new images are provided
            if (product.productImageUrl && product.productImageUrl.length > 0) {
                for (const imageUrl of product.productImageUrl) {
                    const publicId = imageUrl.split("/").slice(-3).join("/").split(".")[0];
                    await cloudinary.uploader.destroy(publicId, (err, result) => {
                        if (err) {
                            console.error(`Error deleting image: ${imageUrl}`, err);
                        } else {
                            console.log(`Deleted image: ${imageUrl}`, result);
                        }
                    });
                }
            }

            // Upload new images
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    transformation: [
                        { width: 1200, crop: "limit" },
                        { fetch_format: 'auto' },
                        { quality: 'auto' },
                    ],
                });

                if (!result || !result.secure_url) {
                    console.error('Cloudinary upload failed for file:', file.path);
                    return res.status(500).json({ error: 'Failed to upload image(s)' });
                }

                imageUrls.push(result.secure_url);
                console.log('Uploaded image URL:', result.secure_url);

                // Delete the file from local storage
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                    else console.log(`File ${file.path} deleted successfully`);
                });
            }
        }

        // Validate image requirement
        if (imageUrls.length === 0) {
            return res.status(400).json({ error: 'At least one image is required.' });
        }

        let finalProductSize = req.body.productSize;
        if (finalProductSize === undefined) {
            finalProductSize = [];
        } else if (!Array.isArray(finalProductSize)) {
            finalProductSize = [finalProductSize];
        }

        let finalProductColor = req.body.productColor;
        if (finalProductColor === undefined) {
            finalProductColor = [];
        } else if (!Array.isArray(finalProductColor)) {
            finalProductColor = [finalProductColor];
        }

        if (
            !productName ||
            !productDescription ||
            !productCategory ||
            !productSubCategory ||
            finalProductSize.length === 0 ||
            finalProductColor.length === 0 ||
            !productBrand ||
            !productPrice ||
            !productOfferPrice ||
            !productQuantity
        ) {
            return res.status(400).json({ error: "Please ensure that all necessary fields are filled!" });
        }

        const timer = typeof productAddedTimer === 'string' ? JSON.parse(productAddedTimer) : productAddedTimer;
        const { hrs = 0, min = 0, sec = 0 } = timer || {};
        if (
            isNaN(hrs) || isNaN(min) || isNaN(sec) ||
            hrs < 0 || min < 0 || sec < 0
        ) {
            return res.status(400).json({
                error: "Timer values must be non-negative numbers. Please check your input."
            });
        }

        const addedTimer = hrs > 0 || min > 0 || sec > 0;
        let expiryDate = null;
        let setProductStatus = "Available";
        if (addedTimer) {
            const timerDurationInSeconds = (hrs * 3600) + (min * 60) + sec;
            expiryDate = new Date(Date.now() + timerDurationInSeconds * 1000);
            setProductStatus = "LimitedStock";
        }

        const updateData = {
            productImageUrl: imageUrls,
            productName,
            productDescription,
            productCategory,
            productSubCategory,
            productSize: finalProductSize,
            productColor: finalProductColor,
            productBrand,
            productPrice,
            productOfferPrice,
            productQuantity,
            addedTimer,
            productAddedTimer: timer,
            timerExpiryDate: expiryDate,
            productStatus: setProductStatus
        };

        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(400).json({ error: "Product not found!" });
        }

        console.log("Product updated successfully!", updatedProduct);
        return res.status(200).json({ result: updatedProduct, message: 'Product updated successfully!' });

    } catch (error) {
        console.log("Error updating product", error);
        // Delete uploaded images from Cloudinary on error (only if new images were uploaded)
        if (imageUrls.length > 0 && req.files && req.files.length > 0) {
            for (const imageUrl of imageUrls) {
                const publicId = imageUrl.split('/').slice(-3).join('/').split('.')[0];
                await cloudinary.uploader.destroy(publicId, (err, result) => {
                    if (err) console.error(`Error deleting image: ${imageUrl}`, err);
                    else console.log(`Deleted image: ${imageUrl}`, result);
                });
            }
        }
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};


const fetchProductByIdFunction = async (req, res) => {
    const { productId } = req.params; // Extract the product ID from the route parameter

    try {
        const product = await productModel.findById(productId) // Fetch the product using Mongoose
            
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        return res.status(200).json(product); // Return the product data
    } catch (error) {
      console.error('Error fetching product:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
}


const deleteProductFunction = async (req, res) => {
    const { productId } = req.params;

    try {
        // Validate productId
        if (!productId) {
            return res.status(400).json({ error: "Product ID is required!" });
        }

        // Find the product
        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({ error: "Product not found!" });
        }

        // If already marked as deleted
        if (product.isDeleted) {
            return res.status(410).json({ error: "Product is already deleted!" });
        }

        // Mark as deleted
        product.isDeleted = true;
        product.productStatus = 'Discontinued';

        await product.save();

        console.log('Product soft-deleted', product._id);

        // When an admin deletes a product, also run:
        await cartModel.deleteMany({ productRef: productId });
        // That way, the carts never even holds orphaned items.

        return res.status(200).json({
            message: "Product deleted successfully (soft delete).",
            product,
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};



module.exports = {
    fetchProductsFunction,
    fetchProductByIdFunction,
    addProductFunction,
    editProductFunction,
    deleteProductFunction,
};