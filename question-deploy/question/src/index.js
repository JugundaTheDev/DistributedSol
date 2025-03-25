const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { getDB } = require('./db/connection');
const { getCategories, getRandomQuestions } = require('./db/queries');

const PORT = process.env.PORT || 3002;

const app = express();
app.use(bodyParser.json());

// Serve static front-end for requesting questions
app.use(express.static(path.join(__dirname, 'public')));

// GET /categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    return res.json(categories);
  } catch (err) {
    console.error('[Question] Error fetching categories:', err);
    return res.status(500).json({ error: 'Unable to fetch categories' });
  }
});

// GET /question/:category
// ?count=2 (optional)
app.get('/question/:category', async (req, res) => {
  const category = req.params.category;
  const count = parseInt(req.query.count || '1', 10);

  try {
    const questions = await getRandomQuestions(category, count);
    return res.json(questions);
  } catch (err) {
    console.error('[Question] Error fetching question:', err);
    return res.status(500).json({ error: 'Unable to fetch question' });
  }
});

// Start server
app.listen(PORT, async () => {
  // Ensure DB is connected at startup
  await getDB(); // This does an initial connection
  console.log(`[Question] Service running on port ${PORT}`);
});
