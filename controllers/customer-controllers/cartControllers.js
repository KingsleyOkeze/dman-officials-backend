// CUSTOMER CART CONTROLLERS
const cartModel = require("../../models/cartModel");
const customerModel = require("../../models/customerModel");
const productModel = require("../../models/productModel");

const addToCartFunction = async (req, res) => {
  const { customerId, productId, quantity } = req.body;
  console.log('cart stuff', customerId, productId, quantity )
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

      // Check if the product is already in the cart
      const existingCartItem = await cartModel.findOne({ customerRef: customerId, productRef: productId });
      if (existingCartItem) {
          // Update quantity if product already exists in cart
          existingCartItem.quantity += quantity;
          await existingCartItem.save();
      } else {
          // Add new product to cart
          const newCartItem = new cartModel({ customerRef: customerId, productRef: productId, quantity });
          await newCartItem.save();
      }

      // Fetch updated cart
      const updatedCart = await cartModel
          .find({ customerRef: customerId })
          .populate('productRef');

      return res.status(201).json({ 
          message: "Product added to cart successfully!", 
          cart: updatedCart 
      });
  } catch (error) {
      console.log('cart 500 err', error)
      return res.status(500).json({ error: "Internal Server Error!" });
  }
};


const fetchCartFunction = async (req, res) => {
  const { customerId } = req.body;

  try {
      // Validate input
      if (!customerId) {
          return res.status(400).json({ error: "Customer ID is required!" });
      }

      // Fetch cart items with product details
      const cartItems = await cartModel
          .find({ customerRef: customerId })
          .populate('productRef');

      if (cartItems.length === 0) {
          return res.status(200).json({ message: "Cart is empty!", cart: [] });
      }
console.log('fetch cart is', cartItems)
      return res.status(200).json({ cart: cartItems });
  } catch (error) {
      return res.status(500).json({ error: "Internal Server Error!" });
  }
};



const removeFromCartFunction = async (req, res) => {
  const { customerId, itemId } = req.body;
  console.log("remove stuff", customerId, itemId)
  try {
      // Validate input
      if (!customerId) {
          return res.status(400).json({ error: "Customer ID are required!" });
      }

      // Validate input
      if (!itemId) {
        return res.status(400).json({ error: "Product ID are required!" });
      }

      // Remove the product from the cart
      const removedItem = await cartModel.findOneAndDelete({ 
        _id: itemId,
        customerRef: customerId, 
         
      });

      if (!removedItem) {
        console.log("remove stuff err", removedItem)
          return res.status(404).json({ error: "Product not found in cart!" });
      }

      // Fetch updated cart
      const updatedCart = await cartModel
          .find({ customerRef: customerId })
          .populate('productRef');

      return res.status(200).json({ 
          message: "Product removed from cart successfully!", 
          cart: updatedCart 
      });
  } catch (error) {
      console.error("Error removing from cart:", error);
      return res.status(500).json({ error: "Internal Server Error!" });
  }
};


const fetchCartTotalPrice = async (req, res) => {
    const { customerId } = req.body;

    try {
        if (!customerId) {
            return res.status(400).json({ error: "Failed to identify User!"});
        }

        const customer = await customerModel.findById(customerId);

        if (!customer) {
            return res.status(404).json({ error: "User doesn't exist!"})
        }

        const cartItems = await cartModel
            .find({ customerRef: customerId })
            .populate('productRef');

        let totalPrice = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            totalPrice += item.productRef.productOfferPrice * item.quantity
        }

        console.log('cart total price is', totalPrice)

        return res.status(200).json({ message: "Cart total price calculated", totalPrice });

    } catch (error) {
        console.error("Failed to calculate cart total price", error);
        return res.status(500).json({ error: "Internal Server Error!"});
    }

};


module.exports = {
    addToCartFunction,
    fetchCartFunction,
    removeFromCartFunction,
    fetchCartTotalPrice
};