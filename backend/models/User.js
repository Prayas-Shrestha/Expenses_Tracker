const mongoose = require("mongoose");

// Define schema for user accounts
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    unique: true,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  // Optional monthly budget for 50/30/20 insights
  budget: {
    type: Number,
    default: 0,
  },

  // Fields for password reset via email
  resetCode: String,
  resetCodeExpires: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
