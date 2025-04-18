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
  getTransactionsByDate,
  getChartsDaily,
  getChartsMonthly,
  getChartsYearly, // ✅ Add these
} = require("../controllers/transactionController");

router.use(authMiddleware);

router.post("/", addTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.get("/budget", getBudgetStats);
router.get("/expenses/daily", getDailyExpenses);
router.get("/expenses/monthly", getMonthlyExpenses);
router.get("/expenses/yearly", getYearlyExpenses);
router.get("/date/:date", getTransactionsByDate);

// ✅ Chart endpoints for frontend pie chart
router.get("/charts/daily", getChartsDaily);
router.get("/charts/monthly", getChartsMonthly);
router.get("/charts/yearly", getChartsYearly);

module.exports = router;
