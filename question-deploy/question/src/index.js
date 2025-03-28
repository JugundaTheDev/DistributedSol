const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { getDB } = require('./db/connection');
const { getCategories, getRandomQuestions } = require('./db/queries');

const PORT = process.env.PORT || 3002;

const app = express();
app.use(bodyParser.json());

// Serve static front-end for requesting questions (if any)
app.use(express.static(path.join(__dirname, 'public')));

// GET /categories
app.get('/categories', async (req, res) => {
  try {
    const categories = await getCategories();
    return res.json(categories);
  } catch (err) {
    console.error('[Question] Error fetching categories:', err);
    console.warn('[Question] Returning fallback categories...');
    // Fallback categories if DB call fails
    return res.json(["Math", "Science", "History", "Geography"]);
  }
});

// GET /question/:category
app.get('/question/:category', async (req, res) => {
  let category = req.params.category.trim().toLowerCase();
  const count = parseInt(req.query.count || '1', 10);

  try {
    // If user passed 'any', we fetch from all categories
    if (category === 'any') {
      category = 'any';
    }

    const questions = await getRandomQuestions(category, count);

    // If no questions returned, provide fallback question
    if (!questions || questions.length === 0) {
      console.warn('[Question] No questions found, returning fallback question...');
      return res.json([
        {
          question: "What is 2+2?",
          answers: ["4", "3", "5", "6"],
          correctIndex: 0,
          category: "Math"
        }
      ]);
    }

    return res.json(questions);
  } catch (err) {
    console.error('[Question] Error fetching question:', err);
    console.warn('[Question] Returning fallback question...');
    // Fallback single question
    return res.json([
      {
        question: "What is 2+2?",
        answers: ["4", "3", "5", "6"],
        correctIndex: 0,
        category: "Math"
      }
    ]);
  }
});

// Start server
app.listen(PORT, async () => {
  // Ensure DB is connected at startup
  await getDB(); // This does an initial connection
  console.log(`[Question] Service running on port ${PORT}`);
});