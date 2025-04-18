const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// ➕ Add a new transaction
exports.addTransaction = async (req, res) => {
  try {
    const { type, category, amount, date, note, budgetCategory } = req.body;

    if (type !== "income" && !["needs", "wants", "savings"].includes(budgetCategory)) {
      return res.status(400).json({
        msg: "budgetCategory is required for expense/savings and must be one of: needs, wants, savings",
      });
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

// ✏️ Update a transaction
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

// ❌ Delete a transaction
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

// 📊 Budget stats for progress bar (50/30/20)
exports.getBudgetStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    const incomeResult = await Transaction.aggregate([
      { $match: { userId, type: "income" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]);

    const totalIncome = incomeResult[0]?.totalIncome || 0;

    const expenses = await Transaction.aggregate([
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
          total: { $sum: { $abs: "$amount" } },
        },
      },
    ]);

    const stats = { totalIncome, needs: 0, wants: 0, savings: 0 };

    for (const e of expenses) {
      stats[e._id] = e.total;
    }

    res.status(200).json({ budgetStats: stats });
  } catch (err) {
    console.error("❌ Budget Stats Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📆 Daily expense summary
exports.getDailyExpenses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const daily = await Transaction.aggregate([
      {
        $match: {
          userId,
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

    res.status(200).json(daily.map((item) => ({ category: item._id || "Others", total: item.total })));
  } catch (error) {
    console.error("❌ Daily Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📅 Monthly expenses
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    const monthly = await Transaction.aggregate([
      {
        $match: {
          userId,
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

    res.status(200).json(monthly);
  } catch (error) {
    console.error("❌ Monthly Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📈 Yearly breakdown by budget category
exports.getYearlyExpenses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    const yearly = await Transaction.aggregate([
      {
        $match: {
          userId,
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

    const result = {};

    for (const { _id, total } of yearly) {
      const { year, budgetCategory } = _id;
      if (!result[year]) result[year] = { year, needs: 0, wants: 0, savings: 0 };
      if (budgetCategory) result[year][budgetCategory] += total;
    }

    res.status(200).json(Object.values(result).sort((a, b) => b.year - a.year));
  } catch (error) {
    console.error("❌ Yearly Chart Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// 📅 Transactions for specific date
exports.getTransactionsByDate = async (req, res) => {
  try {
    const userId = req.user;
    const { date } = req.params;
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
    console.error("❌ Date Filter Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
