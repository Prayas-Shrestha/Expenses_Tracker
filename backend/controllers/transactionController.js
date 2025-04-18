const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");

// ✅ Add a new transaction
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

// ✅ Update a transaction
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

// ✅ Delete a transaction
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

// ✅ Get daily expenses for chart
exports.getDailyExpenses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    const result = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$date" },
            month: { $month: "$date" },
            year: { $year: "$date" },
            category: "$category"
          },
          total: { $sum: { $abs: "$amount" } },
          latestDate: { $max: "$date" }
        }
      },
      { $sort: { "latestDate": -1 } }
    ]);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Daily Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Get monthly expenses for chart
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    const result = await Transaction.aggregate([
      { $match: { userId, type: "expense" } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" }
          },
          total: { $sum: { $abs: "$amount" } }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Monthly Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Get yearly breakdown (needs/wants/savings/income)
exports.getYearlyExpenses = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: { $in: ["income", "expense", "savings"] },
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            type: "$type",
            budgetCategory: "$budgetCategory"
          },
          total: { $sum: { $abs: "$amount" } }
        }
      }
    ]);

    const yearly = {};

    result.forEach(({ _id, total }) => {
      const { year, type, budgetCategory } = _id;

      if (!yearly[year]) {
        yearly[year] = { year, income: 0, needs: 0, wants: 0, savings: 0 };
      }

      if (type === "income") {
        yearly[year].income += total;
      } else if (type === "expense" && budgetCategory) {
        yearly[year][budgetCategory] += total;
      } else if (type === "savings") {
        yearly[year].savings += total;
      }
    });

    const formatted = Object.values(yearly).sort((a, b) => b.year - a.year);
    res.status(200).json(formatted);
  } catch (error) {
    console.error("❌ Yearly Expenses Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};

// ✅ Get transactions for a specific date
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
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("❌ Date Filter Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
