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
const { fetchCouponsFunction } = require("../controllers/admin-controllers/couponControllers");

const router = express.Router();

router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);


router.post("/add-product", addProductFunction);


router.get("/fetch-orders", fetchOrdersFunction);
router.get("/fetch-customers", fetchCustomersFunction);
router.get("/fetch-coupons", fetchCouponsFunction);


module.exports = router;