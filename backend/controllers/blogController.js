const axios = require('axios');
const Parser = require('rss-parser'); // Import RSS parser library

/**
 * Controller function to fetch and return budget-related blogs from NerdWallet's RSS feed.
 * Parses the RSS feed and returns a list of article metadata as JSON.
 * 
 * @async
 * @function getBudgetBlogs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBudgetBlogs = async (req, res) => {
  const parser = new Parser(); // Initialize RSS parser

  try {
    // Fetch RSS feed from NerdWallet
    const response = await axios.get('https://www.nerdwallet.com/blog/feed/');

    // Parse the RSS feed
    const feed = await parser.parseString(response.data);

    // Extract and structure article details
    const articles = feed.items.map(item => ({
      title: item.title,
      description: item.contentSnippet, // Provides a cleaner summary than full description
      url: item.link,
      source: 'NerdWallet',
      publishedAt: item.pubDate,
    }));

    // Respond with the list of articles
    res.status(200).json(articles);
  } catch (error) {
    // Log error and return failure response
    console.error('❌ Error fetching blogs:', error.message);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

module.exports = { getBudgetBlogs };
