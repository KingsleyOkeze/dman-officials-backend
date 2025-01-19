const express = require("express");
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction,
    logoutFunction
} = require("../controllers/admin-controllers/authControllers");
const { 
    fetchProductsFunction,
    addProductFunction, 
    editProductFunction,
    fetchProductByIdFunction
} = require("../controllers/admin-controllers/productControllers");
const { 
    fetchOrdersFunction, 
    fetchOrderDetailsFunction, 
    updateOrderStatusFunction 
} = require("../controllers/admin-controllers/orderControllers");
const { 
    fetchCustomersFunction 
} = require("../controllers/admin-controllers/customersController");
const { 
    fetchCouponsFunction, 
    addCouponFunction, 
    editCouponFunction,
    fetchCouponByIdFunction
} = require("../controllers/admin-controllers/couponControllers");

const upload = require('../middlewares/upload'); // Import multer middleware
const { 
    fetchHomePageOrderStatusesFunction, 
    fetchHomePageProductStatusesFunction 
} = require("../controllers/admin-controllers/homePageControllers");

const router = express.Router();

router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);
router.post("/logout", logoutFunction);

// DASHBOARD ROUTER 
router.get("/fetch-home-page-product-statuses", fetchHomePageProductStatusesFunction);
router.get("/fetch-home-page-order-statuses", fetchHomePageOrderStatusesFunction);

// PRODUCT ROUTES
router.post("/add-product", upload, addProductFunction);
router.post("/edit-product/:productId", upload, editProductFunction);
router.get("/fetch-products", fetchProductsFunction);
router.get("/fetch-product-by-id/:productId", fetchProductByIdFunction);

// ORDER ROUTES
router.get("/fetch-orders", fetchOrdersFunction);
router.get("/fetch-order-details/:orderId", fetchOrderDetailsFunction);
router.post("/update-order-status", updateOrderStatusFunction);

// CUSTOMER ROUTES
router.get("/fetch-customers", fetchCustomersFunction);

// COUPON ROUTES
router.get("/fetch-coupons", fetchCouponsFunction);
router.post("/add-coupon", addCouponFunction);
router.post("/edit-coupon", editCouponFunction);
router.get("/fetch-coupon-by-id/:couponId", fetchCouponByIdFunction);

module.exports = router;