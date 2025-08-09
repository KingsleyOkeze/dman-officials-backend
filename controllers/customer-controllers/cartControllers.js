// CUSTOMER CART CONTROLLERS
const cartModel = require("../../models/cartModel");
const customerModel = require("../../models/customerModel");
const productModel = require("../../models/productModel");
const orderModel = require("../../models/orderModel");
const { checkCouponValidity } = require("../../helpers/couponHelper");

const fetchCartFunction = async (req, res) => {
    const { customerId } = req.query;
  
    try {
        // Validate input
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required!" });
        }
  
        // Fetch cart items with product details
        let cartItems = await cartModel
            .find({ customerRef: customerId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'productRef',
                match: { isDeleted: false }, // Only fetch if not deleted
                select: 'productName productSize productPrice productColor productImageUrl'
            });
  
        if (cartItems.length === 0) {
            return res.status(200).json({ message: "Cart is empty!", cart: [] });
        }

        // You need to filter out cart items without missing products reference
        // Reason being in the case where a product isDeleted
        cartItems = cartItems.filter(item => item.productRef !== null);
  
        console.log('fetch cart is', cartItems);
        return res.status(200).json({ cart: cartItems });
    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error!" });
    }
};
  


const fetchCartTotalPriceFunction = async (req, res) => {
    const { customerId } = req.query;

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
            .populate({
                path: 'productRef',
                match: { isDeleted: false } 
            });

        let totalPrice = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            if (!item.productRef) continue; // Skip deleted
            totalPrice += item.productRef.productOfferPrice * item.quantity
        }

        // console.log('cart total price is', totalPrice)

        return res.status(200).json({ message: "Cart total price calculated", totalPrice });

    } catch (error) {
        console.error("Failed to calculate cart total price", error);
        return res.status(500).json({ error: "Internal Server Error!"});
    }

};


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
        if (!product || product.isDeleted) {
            return res.status(404).json({ error: "Product not found or has been discontinued!" });
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

      console.log("Item added to cart!");
      
      return res.status(201).json({ 
          message: "Item added to cart!", 
          cart: updatedCart 
      });
  } catch (error) {
      console.log('cart 500 err', error)
      return res.status(500).json({ error: "Internal Server Error!" });
  }
};



const updateQuantityFunction = async (req, res) => {
    const { customerId, itemId, quantity } = req.body;

    console.log('cart item quantity', customerId, itemId, quantity)
    // Validate request payload
    if (!customerId || !itemId || quantity < 1) {
        return res.status(400).json({ error: "Invalid input data" });
    }

    try {
        // Find the customer by ID
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({ error: "Customer not found!" });
        }

        // Check if the item exists in the customer's cart
        // const itemIndex = customer.cart.findIndex(
        //     (cartItem) => cartItem.itemId.toString() === itemId
        // );
        const item = await cartModel.findById(itemId);

        if (!item) {
            return res.status(404).json({ error: "Item not found in cart!" });
        }

        // Update the quantity of the item in the cart
        item.quantity = quantity;

        // Save the updated item in cart
        await item.save();
        console.log("Cart updated successfully", item)

        // Fetch the full updated cart for the customer
        const updatedCart = await cartModel.find({ customerId });

        return res.status(200).json({ 
            message: "Cart updated successfully", 
            cart: updatedCart
        });
    } catch (err) {
        console.error("Error updating cart:", err);
        res.status(500).json({ error: "An error occurred while updating the cart" });
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



const placeOrderFunction = async (req, res) => {
    const {
        customerId,
        country,
        firstName,
        lastName,
        company,
        address,
        city,
        state,
        postalCode,
        phoneNumber,
        appliedCouponCode, // Field for coupon code
    } = req.body;

    console.log("log order to place", 
        customerId,country,firstName,
        lastName,company,address,city,
        state,postalCode,phoneNumber,
        appliedCouponCode)
    
    try {
        if (
            !customerId ||
            !country ||
            !firstName ||
            !lastName ||
            !address ||
            !city ||
            !state ||
            !phoneNumber
        ) {
            return res.status(404).json({ error: "Please fill up the necessay details!"});
        }

        const customer = await customerModel.findOne({ _id: customerId });

        if (!customer) {
            return res.status(404).json({ error: "User doesn't exist!"});
        }

        // FETCH CART ITEMS FOR CUSTOMER AND CALCULATE TOTAL PRICE
        const cartItems = await cartModel
            .find({ customerRef: customerId })
            .populate({
                path: 'productRef',
                match: { isDeleted: false } 
            });
           
        let cartTotalPurchase = 0;

        for (let i = 0; i < cartItems.length; i++) {
            const item = cartItems[i];
            if (!item.productRef) continue; // ⬅️ skip deleted
            cartTotalPurchase += item.productRef.productOfferPrice * item.quantity
        }

        console.log('cart total price is', cartTotalPurchase);

        // Query and validate coupon if applied
        let discount = 0;
        let couponMessage = "";

        if (appliedCouponCode) {
            const couponResult = await checkCouponValidity(appliedCouponCode, customerId, cartTotalPurchase);
            if (couponResult.isValid) {
                discount = couponResult.discount;
                couponMessage = `A discount of ₦${discount} was applied using coupon code ${appliedCouponCode}.`;
            } else {
                couponMessage = "The coupon code was invalid or expired, so no discount was applied.";
                console.log("Coupon validation error:", couponResult.message);
            }
        }
          
        // Calculate final total (including shipping, etc.)
        const shippingCost = 1000;
        const finalTotal = Math.max(cartTotalPurchase - discount + shippingCost, 0);


        // STORE A REFERENCE OF AN ITEMS IN CUSTOMER CART INTO 
        // THE ORDER MODEL BEFORE DELETING THE CUSTOMER CART
        const orderedItems = cartItems.map(item => {
            return {
                customerRef: item.customerRef, // Retain customer reference
                productRef: item.productRef._id, // Store product reference
                quantity: item.quantity, // Store quantity
                price: item.productRef.productOfferPrice // Store current price for future reference
            };
        });

        // Create a new order with ordered items from the cart
        const newOrder = new orderModel({
            customerRef: customerId,
            country,
            firstName,
            lastName,
            company,
            address,
            city,
            state,
            postalCode,
            phoneNumber,
            orderTotalAmount: finalTotal,
            orderedItems, // Save detailed ordered items with prices
            appliedCouponCode, // Save the applied coupon code
            discountAmountApplied: discount // Save the discount amount from the coupon if exist
        });

        const savedOrder = await newOrder.save();

        if (!savedOrder) {
            return res.status(401).json({ error: "Failed to place order!"});
        }

        console.log("Successfully added order!", savedOrder);

        return res.status(201).json({ 
            message: "Successfully added order!", 
            savedOrder,
            customerEmail: customer.email,
            note: couponMessage
        });

    } catch (error) {
        console.log("500 err placing order", error);
        return res.status(500).json({ error: "Internal Server Error!"});
    }

};



module.exports = {
    addToCartFunction,
    updateQuantityFunction,
    fetchCartFunction,
    removeFromCartFunction,
    fetchCartTotalPriceFunction,
    placeOrderFunction
};