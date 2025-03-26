const { getDB } = require('./connection');

// Return categories from DB (no duplicates)
async function getCategories() {
  const db = await getDB();
  const [rows] = await db.query('SELECT DISTINCT name FROM categories');
  return rows.map(r => r.name);
}

async function getRandomQuestions(category, count) {
  const db = await getDB();
  // Remove extra whitespace and normalize case
  const catTrimmed = category.trim();
  const catLower = catTrimmed.toLowerCase();

  if (catLower === 'any') {
    // Return random questions from all categories
    const [rows] = await db.query('SELECT * FROM questions');
    if (rows.length === 0) return [];
    shuffleArray(rows);
    return rows.slice(0, count).map(formatQuestion);
  } else {
    // Use a case-insensitive and whitespace-trimmed comparison
    const [rows] = await db.query(
      'SELECT * FROM questions WHERE LOWER(TRIM(category)) = ?',
      [catLower]
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
