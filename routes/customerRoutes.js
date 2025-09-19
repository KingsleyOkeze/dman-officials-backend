const express = require("express");
const router = express.Router();
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction,
    refreshTokenFunction,
    logoutFunction
} = require("../controllers/customer-controllers/authControllers");
const { 
    fetchProductsByCategoryFunction,
    fetchProductDetailsFunction,
    fetchFlashSaleProductFunction,
    fetchExploreProductsFunction,
    fetchTrendingNowProductFunction,
    searchProductFunction,
    fetchRecommendedProductFunction, 
} = require("../controllers/customer-controllers/productControllers");
const { 
    addToCartFunction, 
    updateQuantityFunction,
    fetchCartFunction,
    removeFromCartFunction,
    fetchCartTotalPriceFunction,
    placeOrderFunction,
    fetchOrderPurchasedTrackingStatusFunction,
    deleteCartFunction
} = require("../controllers/customer-controllers/cartControllers");
const { 
    // initializeTransactionFunction, 
    verifyTransactionFunction
} = require("../controllers/customer-controllers/paymentControllers");
const { validateCouponFunction } = require("../controllers/customer-controllers/couponControllers");
const { 
    fetchCustomerDetailsFunction, 
    updateCustomerDetailsFunction, 
    updateCustomerAccountPassword,
    fetchSavedProductFunction,
    saveProductFunction,
    removeFromSavedProductFunction,
    fetchPurchasedOrderDetailsFunction,
    fetchAllCustomerOrdersFunction 
} = require("../controllers/customer-controllers/accountControllers");
const customerAuth = require("../middlewares/customerAuth");
const { trackTabActivityFunction } = require("../controllers/customer-controllers/activityControllers");

// AUTH ROUTER
router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);
router.post("/refresh-token", refreshTokenFunction);
router.post("/logout", logoutFunction);

// ACTIVITY ROUTER
router.post("/activity", trackTabActivityFunction);


// PRODUCT ROUTER
router.get("/fetch-products", fetchProductsByCategoryFunction);
router.get("/flash-sale-products", fetchFlashSaleProductFunction);
router.get("/fetch-explore-products", fetchExploreProductsFunction);
router.get("/fetch-product-details/:productId", fetchProductDetailsFunction);
router.get("/fetch-trending-now-products", fetchTrendingNowProductFunction);
router.get("/recommended-product/:productId", fetchRecommendedProductFunction);
router.get("/search-product", searchProductFunction);

// ACCOUNT ROUTES
router.get("/fetch-customer-details", customerAuth, fetchCustomerDetailsFunction);
router.post("/update-customer-details", customerAuth, updateCustomerDetailsFunction);
router.post("/update-account-password", customerAuth, updateCustomerAccountPassword);
router.get("/fetch-all-customer-orders", customerAuth, fetchAllCustomerOrdersFunction);
router.get("/fetch-purchased-order-details/:orderId", customerAuth, fetchPurchasedOrderDetailsFunction);


// SAVED PRODUCT ROUTER
router.get("/fetch-saved-product", customerAuth, fetchSavedProductFunction);
router.post("/save-product", customerAuth, saveProductFunction);
router.post("/remove-from-saved-product", customerAuth, removeFromSavedProductFunction); 


// CART ROUTER
router.get("/fetch-cart", customerAuth, fetchCartFunction);
router.post("/add-to-cart", customerAuth, addToCartFunction);
router.post("/update-cart", customerAuth, updateQuantityFunction)
router.post("/remove-from-cart", customerAuth, removeFromCartFunction);
router.delete('/customer/clear-cart', customerAuth, deleteCartFunction);
router.get("/fetch-cart-total-price", customerAuth, fetchCartTotalPriceFunction);
router.post("/place-order", customerAuth, placeOrderFunction);


// ORDER ROUTER

// COUPON ROUTER
router.post("/validate-coupon", customerAuth, validateCouponFunction);

// PAYMENT ROUTER
router.post("/verify-transaction", customerAuth, verifyTransactionFunction);

module.exports = router;