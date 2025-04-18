const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Controller imports
const {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getBudgetStats,
  getDailyExpenses,
  getMonthlyExpenses,
  getYearlyExpenses,
  getTransactionsByDate,
} = require("../controllers/transactionController");

// 🔐 Apply JWT Auth Middleware to all routes
router.use(authMiddleware);

// ➕ Add a new transaction
router.post("/", addTransaction);

// 📥 Get all transactions for the logged-in user
router.get("/", getTransactions);

// ✏️ Update a transaction
router.put("/:id", updateTransaction);

// ❌ Delete a transaction by ID
router.delete("/:id", deleteTransaction);

// 📊 Budget usage for progress bar (50/30/20 logic)
router.get("/budget", getBudgetStats);

// 📅 Get transactions for a specific date (YYYY-MM-DD)
router.get("/date/:date", getTransactionsByDate);

// 📈 Expense summaries
router.get("/expenses/daily", getDailyExpenses);     // Grouped by day
router.get("/expenses/monthly", getMonthlyExpenses); // Grouped by month
router.get("/expenses/yearly", getYearlyExpenses);   // Grouped by year

module.exports = router;
