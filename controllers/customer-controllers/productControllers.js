const customerModel = require("../../models/customerModel");
const productModel = require("../../models/productModel");
const savedProductModel = require("../../models/savedProductModel");

const fetchProductsFunction = async (req, res) => {
    // const page = req.query.page || 0;
    // const numberOfProductsToReturn = 7;

    try {
      // Get the portions of the pagination requested
      const allProducts = await productModel.find({})
          // .skip(page * numberOfProductsToReturn)
          // .limit(numberOfProductsToReturn)

      if (!allProducts) {
          console.log("Failed fetching orders", error)
          return res.status(401).json({ error: "Failed to fetch all orders"})
      }

      // if (allProducts.length === 0) {
      //     return res.status(404).json({ error: "No orders found" });
      // }

      return res.status(200).json(allProducts)
      // Get the exact document count
      // const totalProductsCountInDb = await productModel.countDocuments(); 
      // console.log("total document in db", totalProductsCountInDb);

      // // Calculate the total number of pages
      // const totalPages = Math.ceil(totalProductsCountInDb / numberOfProductsToReturn); 
      // console.log("total pages", totalPages);

      // return res.status(200).json({result: allProducts, totalPages, message: "Successfully fetched Orders!"});

    } catch (error) {
      console.log("Server Error fetching orders", error)
      return res.status(500).json({ error: "Internal Server Error!"})
    }
};


// --------------------------------------------------------- //
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


const savedProductFunction = async (req, res) => {
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
    fetchProductsFunction,
    savedProductFunction,
    fetchSavedProductFunction,
    removeFromSavedProductFunction
};