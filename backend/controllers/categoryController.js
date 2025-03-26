const Category = require("../models/Category");

// ✅ Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const userId = req.user; // From auth middleware

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const category = new Category({ userId, name, type });
    await category.save();

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all categories created by the logged-in user
exports.getCategories = async (req, res) => {
  try {
    const userId = req.user;
    const categories = await Category.find({ userId });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Update a specific category
exports.updateCategory = async (req, res) => {
  try {
    const { name, type } = req.body;
    const categoryId = req.params.id;
    const userId = req.user;

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, userId },
      { name, type },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category updated", category });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Delete a specific category
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const userId = req.user;

    const category = await Category.findOneAndDelete({ _id: categoryId, userId });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
