const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generatePDF = (transactions, userId) => {
  const doc = new PDFDocument({ margin: 50 });
  const outputDir = path.join(__dirname, "exports");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const filePath = path.join(outputDir, `${userId}_transactions.pdf`);
  doc.pipe(fs.createWriteStream(filePath));

  const columnPositions = {
    date: 50,
    type: 130,
    category: 200,
    amount: 320,
    note: 400
  };

  const addTableHeaders = () => {
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Date", columnPositions.date, doc.y)
      .text("Type", columnPositions.type, doc.y)
      .text("Category", columnPositions.category, doc.y)
      .text("Amount", columnPositions.amount, doc.y)
      .text("Note", columnPositions.note, doc.y);

    doc.moveDown(0.3);
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke();
    doc.moveDown(0.5);
  };

  // Header
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Expense Tracker Report", { align: "center" })
    .moveDown(2);

  addTableHeaders();

  // Table Rows
  transactions.forEach((txn, index) => {
    const formattedDate = new Date(txn.date).toLocaleDateString("en-IN");

    // Page break handling
    if (doc.y > 700) {
      doc.addPage();
      addTableHeaders();
    }

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(formattedDate, columnPositions.date, doc.y)
      .text(txn.type.toUpperCase(), columnPositions.type, doc.y)
      .text(txn.category, columnPositions.category, doc.y)
      .text(`₹${txn.amount.toFixed(2)}`, columnPositions.amount, doc.y)
      .text(txn.note || "-", columnPositions.note, doc.y);

    doc.moveDown(0.5);
  });

  doc.end();
  return filePath;
};

module.exports = generatePDF;
