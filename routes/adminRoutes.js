const express = require("express");
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction
} = require("../controllers/admin-controllers/authControllers");
const { addProductFunction } = require("../controllers/admin-controllers/productControllers");
const { fetchOrdersFunction } = require("../controllers/admin-controllers/orderControllers");
const { fetchCustomersFunction } = require("../controllers/admin-controllers/customersController");
const { 
        fetchCouponsFunction, 
        addCouponFunction, 
        editCouponFunction
    } = require("../controllers/admin-controllers/couponControllers");

const upload = require('../middlewares/upload'); // Import multer middleware

const router = express.Router();

router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);


router.post("/add-product", upload, addProductFunction);


router.get("/fetch-orders", fetchOrdersFunction);
router.get("/fetch-customers", fetchCustomersFunction);
router.get("/fetch-coupons", fetchCouponsFunction);
router.post("/add-coupon", addCouponFunction);
router.post("/edit-coupon", editCouponFunction);

module.exports = router;