const express = require("express");
const router = express.Router();

// Middleware to protect routes with JWT
const authMiddleware = require("../middleware/authMiddleware");

//  Category controller functions
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

// 🔐 All routes below are protected
router.use(authMiddleware);

// ➕ Create a new category (income, expense, savings)
router.post("/", createCategory);

// 📥 Get all categories for the logged-in user
router.get("/", getCategories);

// 🛠️ Update a specific category by ID
router.put("/:id", updateCategory);

// ❌ Delete a category by ID
router.delete("/:id", deleteCategory);

module.exports = router;
