const express = require("express");
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction,
    refreshTokenFunction,
    logoutFunction
} = require("../controllers/admin-controllers/authControllers");
const { 
    fetchProductsFunction,
    addProductFunction, 
    editProductFunction,
    fetchProductByIdFunction,
    deleteProductFunction
} = require("../controllers/admin-controllers/productControllers");
const { 
    fetchOrdersFunction, 
    fetchOrderDetailsFunction, 
    updateOrderStatusFunction,
    deleteOrderFunction
} = require("../controllers/admin-controllers/orderControllers");
const { 
    fetchCustomersFunction,
    deleteCustomerAccountFunction
} = require("../controllers/admin-controllers/customersController");
const { 
    fetchCouponsFunction, 
    addCouponFunction, 
    editCouponFunction,
    fetchCouponByIdFunction,
    deleteCouponFunction
} = require("../controllers/admin-controllers/couponControllers");

const upload = require('../middlewares/upload'); // Import multer middleware
const { 
    searchProductFunction,
    fetchHomePageOrderStatusesFunction, 
    fetchHomePageProductStatusesFunction 
} = require("../controllers/admin-controllers/homeControllers");

const {
    updateAdminProfileFunction,
    fetchAdminProfileFunction,
    fetchCustomersActivity
} = require("../controllers/admin-controllers/accountControllers");
const adminAuth = require("../middlewares/adminAuth");


const router = express.Router();

router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);
router.post("/refresh-token", refreshTokenFunction);
router.post("/logout", logoutFunction);

// Protected routes (authentication required)
router.use(adminAuth); // Apply adminAuth middleware to all routes below

// DASHBOARD ROUTER 
router.get("/fetch-home-page-product-statuses", fetchHomePageProductStatusesFunction);
router.get("/fetch-home-page-order-statuses", fetchHomePageOrderStatusesFunction);
router.post("/search-product", searchProductFunction);


// PRODUCT ROUTES
router.post("/add-product", upload, addProductFunction);
router.post("/edit-product/:productId", upload, editProductFunction);
router.get("/fetch-products", fetchProductsFunction);
router.get("/fetch-product-by-id/:productId", fetchProductByIdFunction);
router.delete("/delete-product/:productId", deleteProductFunction);


// ORDER ROUTES
router.get("/fetch-orders", fetchOrdersFunction);
router.get("/fetch-order-details/:orderId", fetchOrderDetailsFunction);
router.post("/update-order-status", updateOrderStatusFunction);
router.delete("/delete-order/:orderId", deleteOrderFunction);

// CUSTOMER ROUTES
router.get("/fetch-customers", fetchCustomersFunction);
router.delete("/delete-customer/:customerId", deleteCustomerAccountFunction);


// COUPON ROUTES
router.get("/fetch-coupons", fetchCouponsFunction);
router.post("/add-coupon", addCouponFunction);
router.post("/edit-coupon", editCouponFunction);
router.get("/fetch-coupon-by-id/:couponId", fetchCouponByIdFunction);
router.delete("/delete-coupon/:couponId", deleteCouponFunction);

// ADMIN ACCOUNT
router.get("/fetch-admin-profile/:accessToken", fetchAdminProfileFunction);
router.put("/update-admin-profile/:accessToken", updateAdminProfileFunction);
router.get("/fetch-customers-activity", fetchCustomersActivity);



module.exports = router;