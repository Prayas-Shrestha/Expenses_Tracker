const express = require("express");
const router = express.Router();

// Importing the controller functions for various routes
const { register, login, googleLogin, updateProfile } = require("../controllers/authController");
const {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require("../controllers/forgotPasswordController");

// Standard login and register routes
// Register a new user
router.post("/register", register);

// Log in an existing user
router.post("/login", login);

// Google login route (used for signing in with Google account)
router.post("/google-login", googleLogin);

// Password recovery routes
// Request a password reset (via email with OTP)
router.post("/forgot-password", forgotPassword);

// Verify the reset code sent to the user's email
router.post("/verify-code", verifyResetCode);

// Reset the user's password after validating the reset code
router.post("/reset-password", resetPassword);

// Update user profile (requires authentication middleware)
router.put("/profile",updateProfile);

// Export the router to be used in other parts of the application
module.exports = router;
