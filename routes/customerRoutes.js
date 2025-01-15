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
    fetchProductsFunction,
    savedProductFunction,
    fetchSavedProductFunction,
    removeFromSavedProductFunction,
    fetchProductDetailsFunction, 
} = require("../controllers/customer-controllers/productControllers");
const { 
    addToCartFunction, 
    fetchCartFunction,
    removeFromCartFunction,
    fetchCartTotalPrice
} = require("../controllers/customer-controllers/cartControllers");
const { 
    initializeTransactionFunction, 
    verifyTransactionFunction
} = require("../controllers/customer-controllers/paymentControllers");
const { validateCouponFunction } = require("../controllers/customer-controllers/couponControllers");
const { placeOrderFunction } = require("../controllers/customer-controllers/orderControllers");


// AUTH ROUTER
router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);


router.get("/fetch-products", fetchProductsFunction);

router.get("/fetch-product-details/:productId", fetchProductDetailsFunction);

// SAVED PRODUCT ROUTER
router.post("/fetch-saved-product", fetchSavedProductFunction);
router.post("/save-product", savedProductFunction);
router.post("/remove-from-saved-product", removeFromSavedProductFunction); 

// CART ROUTER
router.post("/fetch-cart", fetchCartFunction);
router.post("/add-to-cart", addToCartFunction);
router.post("/remove-from-cart", removeFromCartFunction);
router.post("/fetch-cart-total-price", fetchCartTotalPrice);
router.post("/place-order", placeOrderFunction);

// COUPON ROUTER
router.post("/validate-coupon", validateCouponFunction);

// PAYMENT ROUTER
// router.post("/initialize-transaction", initializeTransactionFunction);
router.post("/verify-transaction", verifyTransactionFunction);
router.post("/logout", logoutFunction);

module.exports = router;