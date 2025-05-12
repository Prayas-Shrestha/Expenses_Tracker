const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// Controller imports
const {
  addTransaction,          // Add a new transaction
  getTransactions,         // Get all transactions
  updateTransaction,       // Update a transaction
  deleteTransaction,       // Delete a transaction
  getBudgetStats,          // Get budget stats (50/30/20)
  getDailyExpenses,        // Get daily expense totals
  getMonthlyExpenses,      // Get monthly expense totals
  getYearlyExpenses,       // Get yearly expense totals
  getTransactionsByDate,   // Get transactions for a specific date
} = require("../controllers/transactionController");

// Apply JWT Auth Middleware to all routes
router.use(authMiddleware);
// Log the authenticated user ID before processing any transaction route
router.use((req, res, next) => {
  console.log("🧾 Verified req.user._id:", req.user?._id);
  next();
});

// Add a new transaction
router.post("/", addTransaction);

// Get all transactions for the logged-in user
router.get("/", getTransactions);

// Update a transaction
router.put("/:id", updateTransaction);

// Delete a transaction by ID
router.delete("/:id", deleteTransaction);

// Budget usage for progress bar (50/30/20 logic)
router.get("/budget", getBudgetStats);

// Get transactions for a specific date (YYYY-MM-DD)
router.get("/date/:date", getTransactionsByDate);

// Expense summaries
router.get("/expenses/daily", getDailyExpenses);     // Grouped by day
router.get("/expenses/monthly", getMonthlyExpenses); // Grouped by month
router.get("/expenses/yearly", getYearlyExpenses);   // Grouped by year

module.exports = router;
