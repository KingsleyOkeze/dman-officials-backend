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
const { 
    fetchProductsFunction,
    savedProductFunction,
    fetchSavedProductFunction,
    removeFromSavedProductFunction, 
} = require("../controllers/customer-controllers/productControllers");
const { 
    addToCartFunction, 
    fetchCartFunction,
    removeFromCartFunction
} = require("../controllers/customer-controllers/cartControllers");


router.post("/sign-up", signupFunction);
router.post("/login", loginFunction);
router.post("/verify-sign-up-email/:token", verifySignUpEmailFunction);
router.post("/resend-sign-up-email-verification/:userId", resendSignUpVerificationEmailFunction);
router.post("/forget-password", forgotPasswordFunction);
router.post("/reset-password", resetPasswordFunction);


router.get("/fetch-products", fetchProductsFunction);

router.post("/fetch-saved-product", fetchSavedProductFunction);
router.post("/save-product", savedProductFunction);
router.post("/remove-from-saved-product", removeFromSavedProductFunction); 

router.post("/fetch-cart", fetchCartFunction);
router.post("/add-to-cart", addToCartFunction);
router.post("/remove-from-cart", removeFromCartFunction);



module.exports = router;