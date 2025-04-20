// controllers/authController.js

const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

// Optional: You can initialize OAuth2Client if needed
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register user (email + password)
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Login with email + password
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        _id: user._id,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Login with Google access token
exports.googleLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ msg: "Access token is required" });
  }

  try {
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      return res.status(400).json({ msg: "Failed to verify token with Google" });
    }

    const googleData = await googleRes.json();
    const { email, name } = googleData;

    if (!email || !name) {
      return res.status(400).json({ msg: "Invalid Google user data" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: "",
        provider: "google", // Optional flag
      });
    }

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        _id: user._id,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error.message);
    res.status(400).json({ msg: "Google sign-in failed" });
  }
};
