const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate a signed JWT for authenticated users.
 * 
 * @param {string} userId - The user's ID
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

/**
 * Register a new user with name, email, and password.
 * 
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate input presence
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^])[A-Za-z\d@$!%*#?&^]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters and include a letter, number, and special character",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ msg: "✅ User registered successfully" });
  } catch (error) {
    console.error("❌ Register Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/**
 * Login with email and password.
 * 
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: "Both email and password are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

/**
 * Login using Google OAuth access token.
 * 
 * @route POST /api/auth/google
 * @access Public
 */
exports.googleLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ msg: "Access token is required" });
  }

  try {
    // Get user info from Google
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return res.status(400).json({ msg: "Failed to verify token with Google" });
    }

    const { email, name } = await googleRes.json();

    if (!email || !name) {
      return res.status(400).json({ msg: "Invalid Google user data" });
    }

    // Check if user exists, else create new
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "",
        provider: "google",
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Google Login Error:", error.message);
    res.status(400).json({ msg: "Google sign-in failed" });
  }
};

/**
 * Update user profile with name, email, or gender.
 * 
 * @route PUT /api/auth/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id; // Set by authentication middleware
  const { name, email, gender } = req.body;

  try {
    // Require at least one field
    if (!name && !email && !gender) {
      return res.status(400).json({ msg: "At least one field must be provided" });
    }

    const updateFields = {};

    if (name) updateFields.name = name;

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ msg: "Invalid email format" });
      }

      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== userId) {
        return res.status(400).json({ msg: "Email already in use" });
      }

      updateFields.email = email;
    }

    if (gender) updateFields.gender = gender;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    res.json({
      msg: "✅ Profile updated successfully",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        gender: updatedUser.gender,
      },
    });
  } catch (err) {
    console.error("❌ Update Profile Error:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
