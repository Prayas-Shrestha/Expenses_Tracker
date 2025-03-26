const express = require("express");
const router = express.Router();

// Middleware to protect routes
const authMiddleware = require("../middleware/authMiddleware");

// Controller functions
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  getBudgetStats,
  getDailyExpenses,
  getMonthlyExpenses,
  getYearlyExpenses
} = require("../controllers/transactionController");

// 🔐 All routes below require JWT authentication
router.use(authMiddleware);

// ➕ Add a new transaction (income/expense/savings)
router.post("/", addTransaction);

// 📥 Get all transactions for the logged-in user
router.get("/", getTransactions);

// ❌ Delete a transaction by ID
router.delete("/:id", deleteTransaction);

// 📊 Get budget stats based on 50/30/20 rule
router.get("/budget", getBudgetStats);

// 📆 Daily spending breakdown
router.get("/expenses/daily", getDailyExpenses);

// 📅 Monthly spending breakdown
router.get("/expenses/monthly", getMonthlyExpenses);

// 📈 Yearly spending breakdown
router.get("/expenses/yearly", getYearlyExpenses);

module.exports = router;
