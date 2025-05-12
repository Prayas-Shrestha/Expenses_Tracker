const BankAccount = require("../models/BankAccount");
const MockTransaction = require("../models/mockTransaction");
const Transaction = require("../models/Transaction");

/**
 * Link a new bank account for the authenticated user and generate mock transactions.
 * 
 * @route POST /api/bank/link
 * @access Private
 */
exports.linkBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber } = req.body;

    // Ensure user ID is available
    if (!req.user._id) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    // Create and save new bank account
    const newAccount = new BankAccount({
      user: req.user._id,
      bankName,
      accountNumber,
    });

    await newAccount.save();

    // Generate mock transactions for the newly linked bank account
    const mockData = [
      { description: "Coffee", amount: -4.5 },
      { description: "Freelance Payment", amount: 200 },
      { description: "Groceries", amount: -35.6 },
    ];

    const mockTransactions = mockData.map(tx => ({
      user: req.user._id,
      bankAccount: newAccount._id,
      ...tx,
    }));

    await MockTransaction.insertMany(mockTransactions);

    res.status(201).json({ msg: "✅ Bank linked", bankAccount: newAccount });
  } catch (err) {
    console.error("❌ Error linking bank account:", err);
    res.status(500).json({ msg: "Failed to link account", error: err.message });
  }
};

/**
 * Get all bank accounts associated with the authenticated user.
 * 
 * @route GET /api/bank/accounts
 * @access Private
 */
exports.getBankAccounts = async (req, res) => {
  const accounts = await BankAccount.find({ user: req.user._id });
  res.json(accounts);
};

/**
 * Get all mock transactions for the user that have not yet been confirmed.
 * 
 * @route GET /api/bank/mock-transactions
 * @access Private
 */
exports.getMockTransactions = async (req, res) => {
  const transactions = await MockTransaction.find({
    user: req.user._id,
    isAdded: false,
  });

  res.json(transactions);
};

/**
 * Confirm a mock transaction and add it to the user's real transaction history.
 * 
 * @route POST /api/bank/confirm
 * @access Private
 */
exports.confirmTransaction = async (req, res) => {
  const { mockId, category, type } = req.body;

  // Find the mock transaction to confirm
  const mockTx = await MockTransaction.findOne({ _id: mockId, user: req.user._id });

  if (!mockTx || mockTx.isAdded) {
    return res.status(404).json({ msg: "Transaction not found or already added" });
  }

  // Create a real transaction from the mock transaction
  const newTx = new Transaction({
    userId: req.user._id,
    type,
    category,
    amount: Math.abs(mockTx.amount),
    note: mockTx.description,
    date: mockTx.date,
    budgetCategory: type === "income" ? undefined : "needs",
  });

  await newTx.save();

  // Mark the mock transaction as added
  mockTx.isAdded = true;
  await mockTx.save();

  res.status(201).json({ msg: "✅ Transaction added", transaction: newTx });
};
