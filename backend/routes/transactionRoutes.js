const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  getBudgetStats,
  getDailyExpenses,
  getMonthlyExpenses,
  getYearlyExpenses,
  getTransactionsByDate
} = require("../controllers/transactionController");

// 🔐 Protect all routes
router.use(authMiddleware);

// ➕ Add transaction
router.post("/", addTransaction);

// 📥 Get all
router.get("/", getTransactions);

// ✏️ Update
router.put("/:id", updateTransaction);

// ❌ Delete
router.delete("/:id", deleteTransaction);

// 📊 Budget (progress bar)
router.get("/budget", getBudgetStats);

// 📆 Daily expenses
router.get("/expenses/daily", getDailyExpenses);

// 📅 Monthly expenses
router.get("/expenses/monthly", getMonthlyExpenses);

// 📈 Yearly summary
router.get("/expenses/yearly", getYearlyExpenses);

// 📅 Specific day transactions
router.get("/date/:date", getTransactionsByDate);

module.exports = router;
