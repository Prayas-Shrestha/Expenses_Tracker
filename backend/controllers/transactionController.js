const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// ✅ Add a new transaction (income, expense, or savings)
exports.addTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, note, budgetCategory } = req.body;

    // Validate budget category for non-income types
    if (type !== "income" && !["needs", "wants", "savings"].includes(budgetCategory)) {
      return res.status(400).json({
        msg: "budgetCategory is required for expense/savings and must be one of: needs, wants, savings",
      });
    }

    const transaction = new Transaction({
      userId: req.user, // From auth middleware
      type,
      category,
      amount,
      note,
      budgetCategory: type === "income" ? undefined : budgetCategory,
      date: date || new Date(),
    });

    await transaction.save();
    console.log("✅ Transaction added:", transaction);
    res.status(201).json({ msg: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("❌ Add Transaction Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

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

// ✅ Get all transactions for the logged-in user
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user }).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ Get Transactions Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Delete a transaction (only if it belongs to the user)
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user });

    if (!transaction) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Transaction deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Transaction Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getBudgetStats = async (req, res) => {
  try {
    const userId = req.user;
    const objectUserId = new mongoose.Types.ObjectId(userId); // ✅ convert to ObjectId

    // 🔍 All Transactions Debug
    const all = await Transaction.find({ userId });
    console.log("🧾 All Transactions:", all);

    const missing = all.filter((t) => t.type !== "income" && !t.budgetCategory);
    if (missing.length > 0) {
      console.warn("⚠️ Transactions missing budgetCategory:", missing);
    }

    // ✅ 1. Get total income
    const incomeResult = await Transaction.aggregate([
      { $match: { userId: objectUserId, type: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;
    console.log("💰 Total Income:", totalIncome);

    // ✅ 2. Get grouped spending for needs/wants/savings
    const groupedExpenses = await Transaction.aggregate([
      {
        $match: {
          userId: objectUserId,
          type: { $in: ["expense", "savings"] },
          budgetCategory: { $in: ["needs", "wants", "savings"] },
        },
      },
      {
        $group: {
          _id: "$budgetCategory",
          totalSpent: { $sum: "$amount" },
        },
      },
    ]);

    console.log("📊 Grouped Expense Result:", groupedExpenses);

    const budgetStats = {
      totalIncome,
      needs: 0,
      wants: 0,
      savings: 0,
    };

    groupedExpenses.forEach((item) => {
      if (budgetStats.hasOwnProperty(item._id)) {
        budgetStats[item._id] = item.totalSpent;
      }
    });

    // ✅ 3. Budget usage % (based on 50/30/20 rule)
    const budgetLimits = {
      needs: totalIncome * 0.5,
      wants: totalIncome * 0.3,
      savings: totalIncome * 0.2,
    };

    const budgetUsage = {
      needs: budgetLimits.needs ? ((budgetStats.needs / budgetLimits.needs) * 100).toFixed(2) : "0",
      wants: budgetLimits.wants ? ((budgetStats.wants / budgetLimits.wants) * 100).toFixed(2) : "0",
      savings: budgetLimits.savings ? ((budgetStats.savings / budgetLimits.savings) * 100).toFixed(2) : "0",
    };

    console.log("✅ Final Budget Stats:", budgetStats);
    console.log("📈 Budget Usage %:", budgetUsage);

    res.status(200).json({ budgetStats, budgetUsage });
  } catch (err) {
    console.error("❌ Budget Stats Server Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};



// ✅ Group daily expense totals
exports.getDailyExpenses = async (req, res) => {
  try {
    const userId = req.user;

    const dailyExpenses = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" }
          },
          total: { $sum: "$amount" },
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    res.json(dailyExpenses);
  } catch (error) {
    console.error("❌ Daily Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Group monthly expense total
// ✅ Group monthly expense totals (with abs)
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const userId = req.user;

    const monthlyExpenses = await Transaction.aggregate([
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

    res.status(200).json(monthlyExpenses);
  } catch (error) {
    console.error("❌ Monthly Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Group yearly expenses + savings + income
exports.getYearlyExpenses = async (req, res) => {
  try {
    const userId = req.user;

    const yearly = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: { $in: ["income", "expense", "savings"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            type: "$type",
            budgetCategory: "$budgetCategory",
          },
          total: { $sum: { $abs: "$amount" } },
        },
      },
    ]);

    // Format result as { year, income, needs, wants, savings }
    const result = {};

    yearly.forEach(({ _id, total }) => {
      const { year, type, budgetCategory } = _id;

      if (!result[year]) {
        result[year] = { year, income: 0, needs: 0, wants: 0, savings: 0 };
      }

      if (type === "income") {
        result[year].income += total;
      } else if (type === "expense" && budgetCategory) {
        result[year][budgetCategory] += total;
      } else if (type === "savings") {
        result[year].savings += total;
      }
    });

    const formatted = Object.values(result).sort((a, b) => b.year - a.year);
    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Yearly Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};



// ✅ Get all transactions for a specific date
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

// ✅ Daily Chart Data for PieChart
exports.getChartsDaily = async (req, res) => {
  try {
    const userId = req.user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const daily = await Transaction.aggregate([
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

    const formatted = daily.map((item) => ({
      category: item._id || "Others",
      total: item.total,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Daily Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
