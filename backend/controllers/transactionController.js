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
    console.log("🔐 User ID from token:", userId);

    // DEBUG: See all transactions
    const all = await Transaction.find({ userId });
    console.log("🧾 All Transactions:", all);

    const missing = all.filter(
      (t) => t.type !== "income" && !t.budgetCategory
    );
    if (missing.length > 0) {
      console.warn("⚠️ Transactions missing budgetCategory:", missing);
    }

    // ✅ 1. Total Income
    const incomeResult = await Transaction.aggregate([
      { $match: { userId, type: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].totalIncome : 0;
    console.log("💰 Total Income:", totalIncome);

    // ✅ 2. Total expenses grouped by budget category
    const groupedExpenses = await Transaction.aggregate([
      {
        $match: {
          userId,
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

    const budgetStats = { totalIncome, needs: 0, wants: 0, savings: 0 };
    groupedExpenses.forEach((item) => {
      if (budgetStats.hasOwnProperty(item._id)) {
        budgetStats[item._id] = item.totalSpent;
      }
    });

    // ✅ 3. Usage percentage based on 50-30-20 rule
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
