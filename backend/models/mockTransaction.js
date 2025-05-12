const mongoose = require("mongoose");

// Define the schema for mock transaction
const mockTransactionSchema = new mongoose.Schema({
  // Reference to the User who initiated the transaction (relationship between MockTransaction and User models)
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",  // This links the MockTransaction to the User model
    required: true  // This field is required
  },

  // Reference to the BankAccount associated with this transaction
  bankAccount: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "BankAccount",  // This links the MockTransaction to the BankAccount model
    required: true  // This field is required
  },

  // The amount of money involved in this transaction
  amount: { 
    type: Number, 
    required: true  // This field is required
  },

  // A short description of the transaction (e.g., "Payment for groceries")
  description: { 
    type: String, 
    required: true  // This field is required
  },

  // The date when the transaction took place (defaults to the current date and time)
  date: { 
    type: Date, 
    default: Date.now  // Default value is the current date and time
  },

  // A flag to indicate if the user has added this transaction to their history
  isAdded: { 
    type: Boolean, 
    default: false  // Defaults to false, meaning the transaction is not yet added
  }
});

// Export the MockTransaction model based on the schema
module.exports = mongoose.model("MockTransaction", mockTransactionSchema);
