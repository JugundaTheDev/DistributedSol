const { getDB } = require('./connection');

// Return categories from DB (no duplicates)
async function getCategories() {
  const db = await getDB();
  const [rows] = await db.query('SELECT DISTINCT name FROM categories');
  return rows.map(r => r.name);
}

// Return random question(s) from a given category
async function getRandomQuestions(category, count) {
  const db = await getDB();
  // If category is "any," ignore category filter
  if (category.toLowerCase() === 'any') {
    // get total count
    const [rows] = await db.query('SELECT * FROM questions');
    if (rows.length === 0) return [];
    // Return random subset
    shuffleArray(rows);
    return rows.slice(0, count).map(formatQuestion);
  } else {
    const [rows] = await db.query('SELECT * FROM questions WHERE category=?', [category]);
    shuffleArray(rows);
    return rows.slice(0, count).map(formatQuestion);
  }
}

// Helper to format a question, randomize answers
function formatQuestion(row) {
  const answers = JSON.parse(row.answers);
  shuffleArray(answers);
  return {
    id: row.id,
    question: row.question,
    answers,
    correctIndex: row.correctIndex, // you might hide this in final output
    category: row.category
  };
}

// Simple in-place array shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

module.exports = {
  getCategories,
  getRandomQuestions
};
