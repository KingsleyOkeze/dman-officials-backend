// ADMIN PRODUCT CONTROLLERS
const path = require("path");
const fs = require('fs');
const { cloudinary } = require('../../config/config');
const productModel = require("../../models/productModel");

const fetchProductsFunction = async (req, res) => {
    const page = req.query.page || 0;
    const numberOfProductsToReturn = req.query.limit || 7;

    try {
      // Get the portions of the pagination requested
      const allProducts = await productModel.find()
          .sort({ createdAt: -1 })
          .skip(page * numberOfProductsToReturn)
          .limit(numberOfProductsToReturn)

      if (!allProducts) {
          console.log("Failed fetching orders", error)
          return res.status(401).json({ error: "Failed to fetch all orders"})
      }

      // Get the exact document count
      const totalProductsCountInDb = await productModel.countDocuments(); 
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
      productTimer
    } = req.body;
    console.log('req is', req.files)
    
    try {
        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            console.error('No files uploaded', req.files);
            return res.status(400).json({ error: 'Please upload at least one image' });
        }

    
        // Initialize an array to store uploaded image URLs
        const imageUrls = [];

        // Use a normal for loop for file uploads
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

   
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(file.path);
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
console.log('size ish', productSize.length, productSize)
        if (
          !productName ||
          !productDescription ||
          !productCategory ||
          !productSubCategory ||
          productSize.length === 0 ||
          productColor.length === 0 ||
          !productBrand ||
          !productPrice ||
          !productOfferPrice ||
          !productQuantity 
        ) {
          return res.status(400).json({ error: "Please ensure that all necessary field are filled!"});
        }

        // Extract and validate productTimer
        const { hrs = 0, min = 0, sec = 0 } = productTimer || {};
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
        let timerInputed = false;
        if (addedTimer) {
            const timerDurationInSeconds = (hrs * 3600) + (min * 60) + sec;
            expiryDate = new Date(Date.now() + timerDurationInSeconds * 1000);
            timerInputed = true
        }

        const newProduct = new productModel({ 
            productImageUrl: imageUrls,
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
            addedTimer: timerInputed === true ? true : false,
            timerExpiryDate: expiryDate
        });

        const savedProduct = await newProduct.save();

        if (!savedProduct) {
          console.log( "Failed to save product!")
          return res.status(401).json({ error: "Failed to save product!"})
        }

        console.log("Product uploaded successfully!", savedProduct);
        return res.status(201).json({ result: savedProduct, message: 'Product uploaded successfully!' });
  
    } catch (error) {
      console.log("Error adding product", error)
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
    productTimer
  } = req.body;
  console.log('req is', req.files)
  console.log('size and color', productSize, productColor)
  console.log('thing to edit', productName,
    productDescription,
    productCategory,
    productSubCategory,
    productSize,
    productColor.length,
    productBrand,
    productPrice,
    productOfferPrice,
    productQuantity )
  try {
    // Retrieve the existing product
    const product = await productModel.findById(productId);
    if (!product) {
        return res.status(404).json({ error: "Product not found!" });
    }
      
    // Delete old images from Cloudinary
    for (let i = 0; i < product.productImageUrl.length; i++) {
        const imageUrl = product.productImageUrl[i];
            const publicId = imageUrl.split("/").slice(-3).join("/").split(".")[0];
            await cloudinary.uploader.destroy(publicId, (err, result) => {
            if (err) {
                console.error(`Error deleting image: ${imageUrl}`, err);
            } else {
                console.log(`Deleted image: ${imageUrl}`, result);
            }
        });
      
    }
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
        console.error('No files uploaded', req.files);
        return res.status(400).json({ error: 'Please upload at least one image' });
    }


  
    // Initialize an array to store uploaded image URLs
    const imageUrls = [];

    // Use a normal for loop for file uploads
    for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];

 
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(file.path);
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
      console.log('size ish', productSize.length, productSize, typeof productSize)
      if (
        !productName ||
        !productDescription ||
        !productCategory ||
        !productSubCategory ||
        productSize.length === 0 ||
        productColor.length === 0 ||
        !productBrand ||
        !productPrice ||
        !productOfferPrice ||
        !productQuantity 
      ) {
        console.log('ensur error is 1', productName)
        console.log('ensur error is 2', productDescription)
        console.log('ensur error is 3', productCategory)
        console.log('ensur error is 4', productSubCategory)
        console.log('ensur error is 5', productSize)
        console.log('ensur error is 6', productColor)
        console.log('ensur error is 7', productBrand)
        console.log('ensur error is 8', productPrice)
        console.log('ensur error is 9', productOfferPrice)
        console.log('ensur error is 10', productQuantity)
        return res.status(400).json({ error: "Please ensure that all necessary field are filled!"});
      }

      // Extract and validate productTimer
      const { hrs = 0, min = 0, sec = 0 } = productTimer || {};
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
      let timerInputed = false;
      if (addedTimer) {
          const timerDurationInSeconds = (hrs * 3600) + (min * 60) + sec;
          expiryDate = new Date(Date.now() + timerDurationInSeconds * 1000);
          timerInputed = true
      }

      const updateData = { 
          productImageUrl: imageUrls,
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
          addedTimer: timerInputed === true ? true : false,
          timerExpiryDate: expiryDate
      };

      const updatedProduct = await productModel.findByIdAndUpdate(
        productId,                  // The ID of the document to update
        { $set: updateData }, // The fields to update
        { new: true }           // Return the updated document
      );
  
      if (!updatedProduct) {
        return res.status(400).json({ error: "Product not found!"});
      } 

      console.log("Product updated successfully!", updatedProduct);
      return res.status(200).json({ result: updatedProduct, message: 'Product updated successfully!' });

  } catch (error) {
    console.log("Error updating product", error)
    return res.status(500).json({ error: "Internal Server Error!"})
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

      // Find and delete the product
      const deletedProduct = await productModel.findByIdAndDelete(productId);

      if (!deletedProduct) {
          return res.status(404).json({ error: "Product not found or already deleted!" });
      }
      console.log('product delete')
      return res.status(200).json({
          message: "Product deleted successfully!",
          deletedProduct,
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