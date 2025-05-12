require("dotenv").config(); // Load env variables 

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 🔐 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Expense Tracker API is live");
});

// 🛑 Fallback for unknown routes
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// 🔁 Start server only after DB is connected
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error("❌ Failed to connect to MongoDB:", error.message);
});
