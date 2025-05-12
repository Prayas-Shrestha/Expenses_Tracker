require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const blogRoutes = require('./routes/blogRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const bankRoutes = require("./routes/bankRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse incoming JSON requests

// API routes
app.use("/api/auth", authRoutes); // Auth routes (login, register)
app.use("/api/transactions", transactionRoutes); // Transaction routes (add, update, delete)
app.use("/api/categories", categoryRoutes); // Category routes
app.use('/api/pdf', pdfRoutes); // PDF export routes
app.use('/api', blogRoutes); // Blog routes (fetching blogs)
app.use("/api/bank", bankRoutes); // Bank account and transaction routes

// Test route to check server status
app.get("/", (req, res) => {
  res.send("✅ Expense Tracker API is live");
});

// 404 route handler for unknown endpoints
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Start server after successful DB connection
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("❌ Failed to connect to MongoDB:", error.message);
});
