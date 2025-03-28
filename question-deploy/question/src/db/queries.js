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
  const catLC = category.toLowerCase(); // handle case-insensitivity

  // If category is "any," ignore category filter
  if (catLC === 'any') {
    // get all questions
    const [rows] = await db.query('SELECT * FROM questions');
    if (rows.length === 0) return [];
    // randomize
    shuffleArray(rows);
    // slice based on requested count
    return rows.slice(0, count).map(formatQuestion);

  } else {
    // case-insensitive match: LOWER(category)=?
    const [rows] = await db.query(
      'SELECT * FROM questions WHERE LOWER(category) = ?',
      [catLC]
    );
    if (rows.length === 0) return [];
    // randomize
    shuffleArray(rows);
    return rows.slice(0, count).map(formatQuestion);
  }
}

// Helper to format a question, randomize answers
function formatQuestion(row) {
  let answers;
  if (typeof row.answers === 'string') {
    // If it's a string, parse it
    try {
      answers = JSON.parse(row.answers);
    } catch (e) {
      console.error('Error parsing answers JSON:', e);
      answers = [];
    }
  } else {
    answers = row.answers;
  }
  shuffleArray(answers);
  return {
    id: row.id,
    question: row.question,
    answers,
    correctIndex: row.correctIndex,
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
