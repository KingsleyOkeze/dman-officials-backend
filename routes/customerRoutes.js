const express = require("express");
const router = express.Router();
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction,
    logoutFunction
} = require("../controllers/customer-controllers/authControllers");
const { 
    fetchProductsByCategoryFunction,
    fetchProductDetailsFunction,
    fetchFlashSaleProductFunction,
    fetchExploreProductsFunction,
    fetchTrendingNowProductFunction,
    searchProductFunction, 
} = require("../controllers/customer-controllers/productControllers");
const { 
    addToCartFunction, 
    updateQuantityFunction,
    fetchCartFunction,
    removeFromCartFunction,
    fetchCartTotalPrice
} = require("../controllers/customer-controllers/cartControllers");
const { 
    // initializeTransactionFunction, 
    verifyTransactionFunction
} = require("../controllers/customer-controllers/paymentControllers");
const { validateCouponFunction } = require("../controllers/customer-controllers/couponControllers");
const { 
    placeOrderFunction, 
    fetchPurchasedOrderDetailsFunction,
    fetchAllCustomerOrdersFunction 
} = require("../controllers/customer-controllers/orderControllers");
const { 
    fetchCustomerDetailsFunction, 
    updateCustomerDetailsFunction, 
    updateCustomerAccountPassword,
    fetchSavedProductFunction,
    saveProductFunction,
    removeFromSavedProductFunction,
} = require("../controllers/customer-controllers/accountControllers");


// AUTH ROUTER
router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);
router.post("/logout", logoutFunction);

// PRODUCT ROUTER
router.get("/fetch-products", fetchProductsByCategoryFunction);
router.get("/flash-sale-products", fetchFlashSaleProductFunction);
router.get("/fetch-explore-products", fetchExploreProductsFunction);
router.get("/fetch-product-details/:productId", fetchProductDetailsFunction);
router.get("/fetch-trending-now-products", fetchTrendingNowProductFunction);

router.get("/search-product", searchProductFunction);

// ACCOUNT ROUTES
router.post("/fetch-all-customer-orders", fetchAllCustomerOrdersFunction)
router.post("/fetch-customer-details", fetchCustomerDetailsFunction);
router.post("/update-customer-details", updateCustomerDetailsFunction);
router.post("/update-account-password", updateCustomerAccountPassword);


// SAVED PRODUCT ROUTER
router.post("/fetch-saved-product", fetchSavedProductFunction);
router.post("/save-product", saveProductFunction);
router.post("/remove-from-saved-product", removeFromSavedProductFunction); 

// CART ROUTER
router.post("/fetch-cart", fetchCartFunction);
router.post("/add-to-cart", addToCartFunction);
router.post("/update-cart", updateQuantityFunction)
router.post("/remove-from-cart", removeFromCartFunction);
router.post("/fetch-cart-total-price", fetchCartTotalPrice);
router.post("/place-order", placeOrderFunction);

// ORDER ROUTER
router.post("/fetch-all-customer-orders", fetchAllCustomerOrdersFunction);
router.post("/fetch-purchased-order-details/:orderId", fetchPurchasedOrderDetailsFunction);

// COUPON ROUTER
router.post("/validate-coupon", validateCouponFunction);

// PAYMENT ROUTER
router.post("/verify-transaction", verifyTransactionFunction);

module.exports = router;