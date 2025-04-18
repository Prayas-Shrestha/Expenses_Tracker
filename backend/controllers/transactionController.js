const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// Add Transaction
exports.addTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, note, budgetCategory } = req.body;
    if (type !== "income" && !["needs", "wants", "savings"].includes(budgetCategory)) {
      return res.status(400).json({ msg: "budgetCategory is required for expense/savings and must be one of: needs, wants, savings" });
    }
    const transaction = new Transaction({
      userId: req.user,
      type,
      category,
      amount,
      note,
      budgetCategory: type === "income" ? undefined : budgetCategory,
      date: date || new Date(),
    });
    await transaction.save();
    res.status(201).json({ msg: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("❌ Add Transaction Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Update Transaction
exports.updateTransaction = async (req, res) => {
  try {
    const { amount, category, note, date, budgetCategory } = req.body;
    const updated = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user },
      { amount, category, note, date, budgetCategory },
      { new: true }
    );
    if (!updated) return res.status(404).json({ msg: "Transaction not found" });
    res.status(200).json({ msg: "Transaction updated", transaction: updated });
  } catch (err) {
    console.error("❌ Update Transaction Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Delete Transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user });
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });
    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Transaction Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Get All Transactions
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ Get Transactions Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Budget Stats for Progress Bar
exports.getBudgetStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const incomeResult = await Transaction.aggregate([
      { $match: { userId, type: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]);
    const totalIncome = incomeResult.length ? incomeResult[0].totalIncome : 0;

    const groupedExpenses = await Transaction.aggregate([
      { $match: { userId, type: { $in: ["expense", "savings"] }, budgetCategory: { $in: ["needs", "wants", "savings"] } } },
      { $group: { _id: "$budgetCategory", totalSpent: { $sum: "$amount" } } },
    ]);

    const budgetStats = { totalIncome, needs: 0, wants: 0, savings: 0 };
    groupedExpenses.forEach((item) => {
      if (budgetStats.hasOwnProperty(item._id)) budgetStats[item._id] = item.totalSpent;
    });

    const budgetLimits = {
      needs: totalIncome * 0.5,
      wants: totalIncome * 0.3,
      savings: totalIncome * 0.2,
    };
    const budgetUsage = {
      needs: ((budgetStats.needs / budgetLimits.needs) * 100 || 0).toFixed(2),
      wants: ((budgetStats.wants / budgetLimits.wants) * 100 || 0).toFixed(2),
      savings: ((budgetStats.savings / budgetLimits.savings) * 100 || 0).toFixed(2),
    };

    res.status(200).json({ budgetStats, budgetUsage });
  } catch (err) {
    console.error("❌ Budget Stats Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// Daily Chart Data
exports.getDailyChart = async (req, res) => {
  try {
    const userId = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: today, $lte: end },
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: { $abs: "$amount" } },
        },
      },
    ]);

    const formatted = transactions.map((t) => ({
      category: t._id || "Others",
      total: t.total,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Daily Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};


// Monthly Chart Data
exports.getMonthlyChart = async (req, res) => {
  try {
    const userId = req.user;

    const monthly = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: "expense",
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          total: { $sum: { $abs: "$amount" } },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    const formatted = monthly.map((item) => ({
      month: `${item._id.month}/${item._id.year}`,
      total: item.total,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Monthly Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};


// Yearly Chart Data
exports.getYearlyChart = async (req, res) => {
  try {
    const userId = req.user;

    const yearly = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: { $in: ["expense", "savings"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            budgetCategory: "$budgetCategory",
          },
          total: { $sum: { $abs: "$amount" } },
        },
      },
    ]);

    const grouped = {};

    yearly.forEach(({ _id, total }) => {
      const { year, budgetCategory } = _id;

      if (!grouped[year]) {
        grouped[year] = { year, total: 0 };
      }

      if (["needs", "wants", "savings"].includes(budgetCategory)) {
        grouped[year].total += total;
      }
    });

    const formatted = Object.values(grouped).sort((a, b) => b.year - a.year);
    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Yearly Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};


// Transactions by date
exports.getTransactionsByDate = async (req, res) => {
  try {
    const userId = req.user;
    const { date } = req.params;
    if (!date) return res.status(400).json({ msg: "Date is required" });

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: start, $lte: end },
    }).sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ Error fetching transactions by date:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
