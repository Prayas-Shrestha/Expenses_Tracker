const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction,
  getBudgetStats,
  getTransactionsByDate,
  getChartDaily,
  getChartMonthly,
  getChartYearly
} = require("../controllers/transactionController");

// 🔐 All routes protected
router.use(authMiddleware);

// 📥 CRUD
router.post("/", addTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

// 📊 Budget Stats
router.get("/budget", getBudgetStats);

// 📆 Chart Data for ChartsScreen
router.get("/charts/daily", getChartDaily);
router.get("/charts/monthly", getChartMonthly);
router.get("/charts/yearly", getChartYearly);

// 📅 Filtered transactions
router.get("/date/:date", getTransactionsByDate);

module.exports = router;
