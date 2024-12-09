const path = require("path");
const fs = require('fs');
const { cloudinary } = require('../../config/config');
const productModel = require("../../models/productModel");

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

        if (
          !productName ||
          !productDescription ||
          !productCategory ||
          !productSubCategory ||
          !productSize ||
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




module.exports = {
    addProductFunction
};