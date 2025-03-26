const mongoose = require("mongoose");

// Store transactions (income, expense, savings)
const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["income", "expense", "savings"],
    required: true,
  },

  category: {
    type: String,
    required: true,
  },

  // For expenses/savings only
  budgetCategory: {
    type: String,
    enum: ["needs", "wants", "savings"],
    required: function () {
      return this.type !== "income";
    },
  },

  amount: {
    type: Number,
    required: true,
    min: [0, "Amount cannot be negative"],
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
