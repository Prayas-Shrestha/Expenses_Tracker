const express = require('express');
const router = express.Router();

// Controller function to fetch budget-related blogs
const { getBudgetBlogs } = require('../controllers/blogController');

// Route to get budget blogs
router.get('/blogs', getBudgetBlogs); // Fetch budget blogs

module.exports = router;
