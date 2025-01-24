const customerModel = require("../../models/customerModel");
const bcrypt = require('bcrypt');
const savedProductModel = require("../../models/savedProductModel");

const fetchCustomerDetailsFunction = async (req, res) => {
    const { customerId } = req.body; 

    try {
        // Find the customer by ID and exclude the password field
        const customer = await customerModel
            .findById(customerId)
            .select('country dob email firstName lastName gender phoneNumber role'); // Use .select() to select field you want to send

        if (!customer) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Return user details without the password
        return res.status(200).json({ message: "Customer details fetched successfully", customer });
        
    } catch (error) {
        console.error("Error fetching customer details:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};





const updateCustomerDetailsFunction = async (req, res) => {
    const { 
        customerId,
        dob, 
        email, 
        firstName, 
        lastName, 
        gender, 
        phoneNumber, 
    } = req.body;

    console.log('things update for customer',
        customerId,
        dob, 
        email, 
        firstName, 
        lastName, 
        gender, 
        phoneNumber,  
    );

    try {
        // Find the customer by ID and update the specified fields
        const updatedCustomer = await customerModel.findByIdAndUpdate(
            customerId,
            { dob, email, firstName, lastName, gender, phoneNumber },
            { new: true, runValidators: true } // Options to return the updated document and run validators
        );

        if (!updatedCustomer) {
            return res.status(404).json({ error: "User not found" });
        }

        const responseData = {
            firstName: updatedCustomer.firstName,
            lastName: updatedCustomer.lastName,
            email: updatedCustomer.email,
            dob: updatedCustomer.dob,
            gender: updatedCustomer.gender,
            phoneNumber: updatedCustomer.phoneNumber
        };

        // Return updated customer details
        return res.status(200).json({ 
            message: "Customer information updated successfully", 
            customer: responseData
        });
        
    } catch (error) {
        console.error("Error updating customer information:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

 


const updateCustomerAccountPassword = async (req, res) => {
    const { customerId, currentPassword, newPassword, confirmPassword } = req.body;

    try {
        if (!customerId) {
            return res.status(400).json({ error: 'Unauthorized user!' });
        }
        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'New passwords do not match.' });
        }

        // Fetch the customer from the database
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ error: 'User not found!' });
        }

        // Verify the current password
        const isMatch = await bcrypt.compare(currentPassword, customer.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect!' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the password in the database
        customer.password = hashedPassword;
        const updatedPassword = await customer.save();

        if (!updatedPassword) {
            return res.status(401).json({ error: "Password failed to update!"})
        }

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal Server Error!' });
    }
};





const fetchSavedProductFunction = async (req, res) => {
    const { customerId } = req.body;
  
    try {
        // Validate input
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required!" });
        }
  
        // Fetch cart items with product details
        const savedProducts = await savedProductModel
            .find({ customerRef: customerId })
            .sort({ createdAt: -1 })
            .populate('productRef');
  
        if (savedProducts.length === 0) {
            return res.status(200).json({ message: "Saved products is empty!", savedProducts });
        }
  
  console.log('fetch savedProducts is', savedProducts);
  
        return res.status(200).json({savedProducts: savedProducts});
  
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error!" });
    }
  };






  const saveProductFunction = async (req, res) => {
    const { customerId, productId } = req.body;
    console.log('save product stuff', customerId, productId )
    try {
        // Validate input
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID are required!" });
        }

        // Validate input
        if (!productId) {
            return res.status(400).json({ error: " Product ID are required!" });
        }

        // Check if the customer exists
        const customer = await customerModel.findById(customerId); 
        if (!customer) {
            return res.status(404).json({ error: "Customer not found!" });
        }

        // Check if the product exists
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found!" });
        }

        // Check if the product is already saved by the user
        const productExist = await savedProductModel.findOne({ customerRef: customerId, productRef: productId });
        if (productExist) {
            return res.status(401).json({ error: "Product already saved!" });
        } 

        // Add new product to save
        const newProductToSave = new savedProductModel({ customerRef: customerId, productRef: productId });
        const savedProduct = await newProductToSave.save();
        
        if (!savedProduct) {
          return res.status(401).json({ error: "Failed to save product!"})
        }

        // Fetch updated saved product
        const updatedSavedProduct = await savedProductModel
          .find({ customerRef: customerId })
          .populate('productRef');
        console.log("success save product!", updatedSavedProduct)
        return res.status(201).json({ 
          message: "Product saved successfully!", 
          savedProducts: updatedSavedProduct
        });
    } catch (error) {
      console.log('save product 500 err', error)
      return res.status(500).json({ error: "Internal Server Error!" });
    }
};



const removeFromSavedProductFunction = async (req, res) => {
    const { customerId, itemId } = req.body;
    console.log("remove saved product stuff", customerId, itemId)
    try {
        // Validate input
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID are required!" });
        }
  
        // Validate input
        if (!itemId) {
          return res.status(400).json({ error: "Product ID are required!" });
        }
  
        // Remove the product from the Saved Products
        const removedSavedItem = await savedProductModel.findOneAndDelete({ 
          productRef: itemId,
          customerRef: customerId, 
        });
  
        if (!removedSavedItem) {
          console.log("remove save stuff err", removedSavedItem)
            return res.status(404).json({ error: "Product not found in cart!" });
        }
  
        // Fetch updated cart
        const updatedSavedProducts = await savedProductModel
            .find({ customerRef: customerId })
            .populate('productRef');
  
        return res.status(200).json({ 
            message: "Product removed from Saved Product successfully!", 
            savedProducts: updatedSavedProducts
        });

    } catch (error) {
        console.error("Error removing from Saved Product:", error);
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};
  
  


module.exports = {
    fetchCustomerDetailsFunction,
    updateCustomerDetailsFunction,
    updateCustomerAccountPassword,
    fetchSavedProductFunction,
    saveProductFunction,
    removeFromSavedProductFunction
};
