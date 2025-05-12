const mongoose = require("mongoose");

//  Each category belongs to a user
const CategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  type: {
    type: String,
    enum: ["income", "expense", "savings"],
    required: true,
  },
});

module.exports = mongoose.model("Category", CategorySchema);
