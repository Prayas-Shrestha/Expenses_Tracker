const express = require('express');
const router = express.Router();

// Controller function to export transactions to PDF
const { exportTransactionsToPDF } = require('../controllers/pdfController');
// Middleware to check authentication
const authMiddleware = require('../middleware/authMiddleware');

// Route to export transactions as PDF
router.get('/export', authMiddleware, exportTransactionsToPDF); // Export to PDF

module.exports = router;
