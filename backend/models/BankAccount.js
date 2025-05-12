const mongoose = require("mongoose");

// Define the schema for bank account
const bankAccountSchema = new mongoose.Schema({
  // Reference to the User who owns this bank account (relationship between BankAccount and User models)
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",   // This links the BankAccount to the User model
    required: true  // This field is required
  },

  // The name of the bank (e.g., "Chase", "Bank of America")
  bankName: { 
    type: String, 
    required: true  // This field is required
  },

  // The account number associated with the bank account
  accountNumber: { 
    type: String, 
    required: true  // This field is required
  },

  // The current balance of the bank account (defaults to 0 if not specified)
  balance: { 
    type: Number, 
    default: 0  // Default balance is 0
  },

  // Date when the account was linked (defaults to the current date and time)
  linkedAt: { 
    type: Date, 
    default: Date.now  // Default value is the current date and time
  }
});

// Export the BankAccount model based on the schema
module.exports = mongoose.model("BankAccount", bankAccountSchema);
