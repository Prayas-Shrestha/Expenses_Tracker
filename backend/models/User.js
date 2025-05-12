const mongoose = require("mongoose");

// Define schema for user accounts
const UserSchema = new mongoose.Schema({
  // User's full name
  name: {
    type: String,  // String type
    required: true,  // Name is required
  },

  // User's email address
  email: {
    type: String,  // String type
    unique: true,  // Email must be unique across all users
    required: true,  // Email is required
  },

  // User's gender
  gender: {
    type: String,  // String type
    enum: ["male", "female", "other", "others"],  // Gender options
    default: "others",  // Default value is "others"
  },

  // User's password (only required for normal "local" users)
  password: {
    type: String,  // String type
    required: false,  // Not required for users logging in via Google
  },

  // Authentication type (local for normal users, google for Google login users)
  authType: {
    type: String,
    enum: ["local", "google"],  // Only "local" or "google" as valid options
    default: "local",  // Default to "local" for normal users
  },

  // Optional monthly budget for 50/30/20 budgeting insights
  budget: {
    type: Number,  // Numeric type for the budget
    default: 0,  // Default value is 0 (if not set)
  },

  // Password reset functionality fields
  resetCode: String,  // Reset code used for password reset
  resetCodeExpires: Date,  // Expiration time for the reset code

  // Date when the user account was created
  createdAt: {
    type: Date,  // Date type
    default: Date.now,  // Automatically set the current date and time when the user is created
  },
});

// Export the User model based on the schema
module.exports = mongoose.model("User", UserSchema);
