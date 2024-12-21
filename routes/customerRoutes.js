const express = require("express");
const router = express.Router();
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction
} = require("../controllers/customer-controllers/authControllers");


router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);


module.exports = router;