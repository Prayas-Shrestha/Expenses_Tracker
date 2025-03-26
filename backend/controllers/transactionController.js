const Transaction = require("../models/Transaction");

// ✅ Add a new transaction (income, expense, or savings)
exports.addTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, budgetCategory } = req.body;

    // Require budget category for non-income transactions
    if (type !== "income" && !budgetCategory) {
      return res.status(400).json({ msg: "Budget category (needs, wants, savings) is required" });
    }

    const transaction = new Transaction({
      userId: req.user, // From auth middleware
      type,
      category,
      amount,
      budgetCategory: type === "income" ? null : budgetCategory,
      date: date || new Date(),
    });

    await transaction.save();
    res.status(201).json({ msg: "Transaction added successfully", transaction });
  } catch (error) {
    console.error("❌ Add Transaction Error:", error.message);
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

// ✅ Get budget statistics based on the 50/30/20 rule
exports.getBudgetStats = async (req, res) => {
  try {
    const userId = req.user;

    // Calculate total income
    const incomeResult = await Transaction.aggregate([
      { $match: { userId, type: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;

    // Calculate expenses grouped by budget category
    const expensesResult = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      { $group: { _id: "$budgetCategory", totalSpent: { $sum: "$amount" } } }
    ]);

    // Build response object
    const budgetStats = { totalIncome, needs: 0, wants: 0, savings: 0 };
    expensesResult.forEach(expense => {
      budgetStats[expense._id] = expense.totalSpent;
    });

    const budgetLimits = {
      needs: totalIncome * 0.5,
      wants: totalIncome * 0.3,
      savings: totalIncome * 0.2,
    };

    const budgetUsage = {
      needs: ((budgetStats.needs / budgetLimits.needs) * 100).toFixed(2) || 0,
      wants: ((budgetStats.wants / budgetLimits.wants) * 100).toFixed(2) || 0,
      savings: ((budgetStats.savings / budgetLimits.savings) * 100).toFixed(2) || 0,
    };

    res.status(200).json({ budgetStats, budgetUsage });
  } catch (error) {
    console.error("❌ Get Budget Stats Error:", error.message);
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

// ✅ Group monthly expense totals
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const userId = req.user;

    const monthlyExpenses = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" },
        }
      },
      { $sort: { "_id": -1 } }
    ]);

    res.json(monthlyExpenses);
  } catch (error) {
    console.error("❌ Monthly Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Group yearly expense totals
exports.getYearlyExpenses = async (req, res) => {
  try {
    const userId = req.user;

    const yearlyExpenses = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      {
        $group: {
          _id: { year: { $year: "$date" } },
          total: { $sum: "$amount" },
        }
      },
      { $sort: { "_id.year": -1 } }
    ]);

    res.json(yearlyExpenses);
  } catch (error) {
    console.error("❌ Yearly Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
