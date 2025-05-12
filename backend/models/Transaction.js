const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["income", "expense", "savings"],
    required: true,
  },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  note: String,
  budgetCategory: {
    type: String,
    enum: ["needs", "wants", "savings"],
    required: function () {
      return this.type !== "income"; // required for expense/savings
    },
  },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
