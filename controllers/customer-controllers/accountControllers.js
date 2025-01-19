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








module.exports = {
    fetchCustomerDetailsFunction,
    updateCustomerDetailsFunction,
    updateCustomerAccountPassword,
    fetchSavedProductFunction,
};
