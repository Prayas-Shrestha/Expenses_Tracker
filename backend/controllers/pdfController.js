const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const generatePDF = require('../utils/pdfGenerator');
const fs = require('fs');

exports.exportTransactionsToPDF = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month) - 1 : new Date().getMonth();

    if (month < 0 || month > 11) {
      return res.status(400).json({ msg: "Invalid month provided" });
    }

    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0));
    endOfMonth.setUTCHours(23, 59, 59, 999);

    const userId = req.user._id; // ✅ This works now that authMiddleware sets req.user = { _id: ... }

    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    if (!transactions || transactions.length === 0) {
      return res.status(404).json({ msg: "No transactions to export for this month/year" });
    }

    const filePath = generatePDF(transactions, userId);
    const stream = fs.createReadStream(filePath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
    stream.pipe(res);

  } catch (error) {
    console.error("❌ PDF Export Error:", error.message);
    res.status(500).json({ msg: "Server error" });
  }
};
