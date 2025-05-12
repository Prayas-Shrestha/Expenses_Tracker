const express = require('express');
const router = express.Router();

// Controller functions for bank account-related actions
const { linkBankAccount, getBankAccounts, getMockTransactions, confirmTransaction } = require('../controllers/bankController');

// Authentication middleware
const authMiddleware = require('../middleware/authMiddleware');

// Route to link a bank account
router.post('/link', authMiddleware, linkBankAccount); // Link bank account

// Route to get all linked bank accounts
router.get('/accounts', authMiddleware, getBankAccounts); // Get user bank accounts

// Route to get pending mock transactions
router.get('/mock-transactions', authMiddleware, getMockTransactions); // Get mock transactions

// Route to confirm a mock transaction
router.post('/confirm-transaction', authMiddleware, confirmTransaction); // Confirm mock transaction

module.exports = router;
