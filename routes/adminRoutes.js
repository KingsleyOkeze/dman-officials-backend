const express = require("express");
const { 
    signupFunction, 
    loginFunction, 
    resendSignUpVerificationEmailFunction,
    verifySignUpEmailFunction,
    forgotPasswordFunction,
    resetPasswordFunction
} = require("../controllers/admin-controllers/authControllers");

const router = express.Router();

router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);

module.exports = router;