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

    if (!req.user) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    const newAccount = new BankAccount({
      user: req.user,  // <- This now works
      bankName,
      accountNumber,
    });

    await newAccount.save();

    const mockData = [
      { description: "Coffee", amount: -4.5 },
      { description: "Freelance Payment", amount: 200 },
      { description: "Groceries", amount: -35.6 },
    ];

    const mockTransactions = mockData.map(tx => ({
      user: req.user,
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
  const accounts = await BankAccount.find({ user: req.user });
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
    user: req.user,
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

  try {
    // Match using plain user ID
    const mockTx = await MockTransaction.findOne({ _id: mockId, user: req.user });

    console.log("Found Mock Transaction:", mockTx);

    if (!mockTx || mockTx.isAdded) {
      return res.status(404).json({ msg: "Transaction not found or already added" });
    }

    const newTx = new Transaction({
      userId: req.user, // ✅ FIXED
      type,
      category,
      amount: Math.abs(mockTx.amount),
      note: mockTx.description,
      date: mockTx.date,
      budgetCategory: type === "income" ? undefined : "needs",
    });

    await newTx.save();

    mockTx.isAdded = true;
    await mockTx.save();

    console.log("✅ Transaction confirmed and saved");
    res.status(201).json({ msg: "✅ Transaction added", transaction: newTx });
  } catch (error) {
    console.error("❌ ERROR inside confirmTransaction:", error);
    return res.status(500).json({ msg: "❌ Failed to confirm transaction", error: error.message });
  }
};

/**
 * Delete a linked bank account and optionally its mock transactions.
 * 
 * @route DELETE /api/bank/:id
 * @access Private
 */
exports.deleteBankAccount = async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({
      _id: req.params.id,
      user: req.user,
    });

    if (!bankAccount) {
      return res.status(404).json({ msg: "❌ Bank account not found" });
    }

    // Delete related mock transactions (optional but smart)
    await MockTransaction.deleteMany({ bankAccount: bankAccount._id });

    // Delete the account
    await bankAccount.deleteOne();

    res.status(200).json({ msg: "✅ Bank account deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting bank account:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
