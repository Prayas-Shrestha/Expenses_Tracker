const mongoose = require("mongoose");

// Define the schema for a transaction (income, expense, or savings)
const transactionSchema = new mongoose.Schema({
  // Reference to the User who owns the transaction
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",  // This links the Transaction to the User model
    required: true  // This field is required
  },

  // Type of transaction: income, expense, or savings
  type: {
    type: String,
    enum: ["income", "expense", "savings"],  // Allows only 'income', 'expense', or 'savings'
    required: true  // This field is required
  },

  // Category of the transaction (e.g., "Salary", "Groceries", "Emergency Fund")
  category: { 
    type: String, 
    required: true  // This field is required
  },

  // Amount of money involved in the transaction
  amount: { 
    type: Number, 
    required: true  // This field is required
  },

  // Optional note about the transaction (e.g., "Paid via bank transfer")
  note: { 
    type: String  // This field is optional
  },

  // Budget category for 'expense' or 'savings' transactions (e.g., "needs", "wants", "savings")
  budgetCategory: {
    type: String,
    enum: ["needs", "wants", "savings"],  // Allows only 'needs', 'wants', or 'savings'
    required: function () {
      return this.type !== "income";  // 'budgetCategory' is required for expense or savings, not income
    },
  },

  // Date when the transaction occurred (defaults to the current date if not provided)
  date: { 
    type: Date, 
    default: Date.now  // Defaults to the current date and time
  },
});

// Export the Transaction model based on the schema
module.exports = mongoose.model("Transaction", transactionSchema);
