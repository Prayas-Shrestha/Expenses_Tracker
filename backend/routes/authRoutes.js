const express = require("express");
const router = express.Router();

const { register, login, googleLogin } = require("../controllers/authController");
const {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} = require("../controllers/forgotPasswordController");

// Standard login/register
router.post("/register", register);
router.post("/login", login);

// Simpler Google Sign-In (token-based)
router.post("/google-login", googleLogin);

// OTP Email system (Mailtrap)
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyResetCode);
router.post("/reset-password", resetPassword);

module.exports = router;
