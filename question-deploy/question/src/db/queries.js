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
  const catLC = category.toLowerCase(); // normalize to lowercase

  if (catLC === 'any') {
    // Return random questions from ALL categories
    const [rows] = await db.query('SELECT * FROM questions');
    if (!rows || rows.length === 0) return [];
    shuffleArray(rows);
    return rows.slice(0, count).map(formatQuestion);
  } else {
    // Case-insensitive matching: convert both stored category and parameter to lowercase
    const [rows] = await db.query(
      'SELECT * FROM questions WHERE LOWER(category) = ?',
      [catLC]
    );
    if (!rows || rows.length === 0) return [];
    shuffleArray(rows);
    return rows.slice(0, count).map(formatQuestion);
  }
}

// Helper to format a question, randomize answers
function formatQuestion(row) {
  // Parse the answers column (assumes valid JSON string stored in DB)
  const answers = JSON.parse(row.answers);
  shuffleArray(answers);
  return {
    id: row.id,
    question: row.question,
    answers,
    correctIndex: row.correctIndex, // you may want to hide this from the UI in production
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
